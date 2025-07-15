import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';
import { messageService } from '../services/messageService';
import { notificationService } from '../services/notificationService';

interface UnreadMessagesContextType {
  unreadMessages: number;
  unreadNotifications: number;
  unreadAdminMessages: number;
  totalUnread: number;
  refreshCounts: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  unreadMessages: 0,
  unreadNotifications: 0,
  unreadAdminMessages: 0,
  totalUnread: 0,
  refreshCounts: async () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider = ({ children }: { children: ReactNode }) => {
  const { user, token, loading } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadAdminMessages, setUnreadAdminMessages] = useState(0);

  const refreshCounts = async () => {
    // Sprawdź czy użytkownik jest zalogowany i ma token, oraz czy nie jest w trakcie ładowania
    if (!user || !token || loading) {
      console.log('User not authenticated or loading, skipping refresh counts');
      setUnreadMessages(0);
      setUnreadAdminMessages(0);
      setUnreadNotifications(0);
      return;
    }

    try {
      // Pobierz dane równolegle, ale obsłuż błędy indywidualnie
      const promises = [
        messageService.getUnreadCount().catch(error => {
          console.error('Error fetching unread messages count:', error);
          return { total: 0 };
        }),
        messageService.getAdminUnreadCount().catch(error => {
          console.error('Error fetching admin unread count:', error);
          // Jeśli to błąd 400, prawdopodobnie użytkownik nie ma uprawnień do admin messages
          if (error.response?.status === 400) {
            console.log('User does not have access to admin messages');
            return 0;
          }
          return 0;
        }),
        notificationService.getUnreadCount().catch(error => {
          console.error('Error fetching notifications count:', error);
          return 0;
        })
      ];

      const [msgCount, adminMsgCount, notifCount] = await Promise.all(promises);

      // Bezpieczne wyciąganie wartości z różnych typów odpowiedzi
      const messagesCount = typeof msgCount === 'object' && msgCount?.total ? msgCount.total : 0;
      const adminCount = typeof adminMsgCount === 'number' ? adminMsgCount : 0;
      const notificationsCount = typeof notifCount === 'number' ? notifCount : 0;

      setUnreadMessages(messagesCount);
      setUnreadAdminMessages(adminCount);
      setUnreadNotifications(notificationsCount);
      
      console.log('Counts refreshed:', {
        messages: messagesCount,
        adminMessages: adminCount,
        notifications: notificationsCount,
        total: messagesCount + adminCount + notificationsCount
      });
    } catch (error: any) {
      console.error('Error refreshing counts:', error);
      
      // Sprawdź typ błędu i odpowiednio obsłuż
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Błąd autoryzacji - nie resetuj liczników, tylko zaloguj błąd
        console.log('Authentication error during count refresh, keeping current counts');
        return;
      }
      
      if (error.response?.status === 400) {
        // Błąd 400 - prawdopodobnie problem z danymi, nie resetuj liczników
        console.log('Bad request error during count refresh, keeping current counts');
        return;
      }
      
      // Dla innych błędów (500, network errors) nie resetuj liczników
      console.log('Other error during count refresh, keeping current counts');
    }
  };

  // Initial load - tylko gdy użytkownik jest zalogowany i nie jest w trakcie ładowania
  useEffect(() => {
    if (user && token && !loading) {
      refreshCounts();
    } else if (!user || !token) {
      // Resetuj liczniki gdy użytkownik nie jest zalogowany
      setUnreadMessages(0);
      setUnreadAdminMessages(0);
      setUnreadNotifications(0);
    }
  }, [user, token, loading]);

  // Listen for new messages from socket
  useEffect(() => {
    const handleNewMessage = () => {
      if (user && token && !loading) {
        refreshCounts();
      }
    };

    const handleNewAdminMessage = () => {
      if (user && token && !loading) {
        refreshCounts();
      }
    };

    const handleMarkedAsRead = () => {
      if (user && token && !loading) {
        refreshCounts();
      }
    };

    window.addEventListener('new_message', handleNewMessage);
    window.addEventListener('new_admin_message', handleNewAdminMessage);
    window.addEventListener('notifications_marked_read', handleMarkedAsRead);

    return () => {
      window.removeEventListener('new_message', handleNewMessage);
      window.removeEventListener('new_admin_message', handleNewAdminMessage);
      window.removeEventListener('notifications_marked_read', handleMarkedAsRead);
    };
  }, [user, token, loading]);

  // Usunięto useEffect który nadpisywał unreadMessages wartością z socket
  // Teraz wszystkie liczniki są zarządzane przez refreshCounts

  // Liczenie totalUnread - powiadomienia o wiadomościach (MESSAGE_RECEIVED) nie są liczone osobno
  // bo już są liczone jako wiadomości w unreadMessages
  const totalUnread = unreadMessages + unreadAdminMessages + unreadNotifications;

  return (
    <UnreadMessagesContext.Provider value={{ 
      unreadMessages, 
      unreadNotifications, 
      unreadAdminMessages, 
      totalUnread,
      refreshCounts 
    }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}; 
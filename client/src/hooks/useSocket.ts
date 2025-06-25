import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Notification } from '../types/notification';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const connect = () => {
    const token = localStorage.getItem('token');
    if (!token || socketRef.current?.connected) return;

    console.log('Connecting to Socket.io server...');
    
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
      
      // Pobierz nieprzeczytane powiadomienia po połączeniu
      socketRef.current?.emit('get_unread_notifications');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Obsługa nowych powiadomień
    socketRef.current.on('new_notification', (notification: Notification) => {
      console.log('New notification received:', notification);
      
      // Zwiększ licznik nieprzeczytanych
      setUnreadCount(prev => prev + 1);
      
      // Pokaż toast notification
      toast.success(notification.title, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: 'white',
        },
      });
    });

    // Obsługa nieprzeczytanych powiadomień
    socketRef.current.on('unread_notifications', (notifications: Notification[]) => {
      setUnreadCount(notifications.length);
    });

    // Obsługa oznaczenia jako przeczytane
    socketRef.current.on('notifications_marked_read', (notificationIds: string[]) => {
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    });

    // Obsługa błędów
    socketRef.current.on('error', (error: string) => {
      console.error('Socket error:', error);
      toast.error('Błąd połączenia z serwerem powiadomień');
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      console.log('Disconnecting from Socket.io server...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setUnreadCount(0);
    }
  };

  const markNotificationsAsRead = (notificationIds: string[]) => {
    if (socketRef.current && notificationIds.length > 0) {
      socketRef.current.emit('mark_notifications_read', notificationIds);
    }
  };

  const getUnreadNotifications = () => {
    if (socketRef.current) {
      socketRef.current.emit('get_unread_notifications');
    }
  };

  // Auto-connect when token is available
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socketRef.current) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Listen for token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // Token added - connect
          connect();
        } else {
          // Token removed - disconnect
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    isConnected,
    unreadCount,
    connect,
    disconnect,
    markNotificationsAsRead,
    getUnreadNotifications,
    setUnreadCount
  };
}; 
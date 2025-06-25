import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useSocket } from '../../hooks/useSocket';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../types/notification';
import { 
  getNotificationIcon, 
  getNotificationColor, 
  getNotificationBgColor, 
  formatNotificationTime 
} from '../../types/notification';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount, markNotificationsAsRead, setUnreadCount } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pobierz powiadomienia po otwarciu dropdown
  const handleToggleDropdown = async () => {
    if (!isOpen) {
      setLoading(true);
      try {
        const response = await notificationService.getNotifications(1, 10, false);
        setNotifications(response.notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  // Oznacz powiadomienie jako przeczytane
  const handleMarkAsRead = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (notification.isRead) return;

    try {
      await notificationService.markAsRead(notification.id);
      
      // Aktualizuj lokalny stan
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      
      // Aktualizuj licznik przez Socket.io
      markNotificationsAsRead([notification.id]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Oznacz wszystkie jako przeczytane
  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    try {
      await notificationService.markAllAsRead();
      
      // Aktualizuj lokalny stan
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      // Aktualizuj licznik
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Obsługa kliknięcia w powiadomienie
  const handleNotificationClick = (notification: Notification) => {
    // Oznacz jako przeczytane jeśli nie jest
    if (!notification.isRead) {
      handleMarkAsRead(notification, { stopPropagation: () => {} } as React.MouseEvent);
    }

    // Nawigacja na podstawie typu powiadomienia
    if (notification.data) {
      const { taskId, projectId, messageId, materialId } = notification.data;
      
      if (taskId && projectId) {
        window.location.href = `/projects/${projectId}`;
      } else if (messageId) {
        window.location.href = '/messages';
      } else if (materialId) {
        window.location.href = '/materials';
      }
    }

    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        title="Powiadomienia"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Badge z liczbą nieprzeczytanych */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Powiadomienia</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Oznacz wszystkie
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Ładowanie...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Brak powiadomień</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        getNotificationBgColor(notification.type)
                      }`}>
                        <span className={getNotificationColor(notification.type)}>
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification, e)}
                              className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"
                              title="Oznacz jako przeczytane"
                            />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  window.location.href = '/notifications';
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Zobacz wszystkie powiadomienia
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 
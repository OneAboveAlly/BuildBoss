import React, { useState, useEffect } from 'react';
import { BellIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { notificationService } from '../services/notificationService';
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';
import type { Notification } from '../types/notification';
import { 
  getNotificationIcon, 
  getNotificationColor, 
  getNotificationBgColor, 
  formatNotificationTime,
  NotificationType 
} from '../types/notification';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshCounts } = useUnreadMessages();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pobierz powiadomienia
  const fetchNotifications = async (currentPage = 1, unreadOnly = false) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(currentPage, 20, unreadOnly);
      setNotifications(response.notifications);
      setTotalPages(response.pagination.pages);
      setPage(currentPage);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Błąd podczas pobierania powiadomień');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, filter === 'unread');
  }, [filter]);

  // Oznacz jako przeczytane
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // Emituj event dla globalnych liczników
      window.dispatchEvent(new Event('notifications_marked_read'));
      
      // Odśwież globalne liczniki
      await refreshCounts();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Błąd podczas oznaczania jako przeczytane');
    }
  };

  // Oznacz wszystkie jako przeczytane
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      // Emituj event dla globalnych liczników
      window.dispatchEvent(new Event('notifications_marked_read'));
      
      // Odśwież globalne liczniki
      await refreshCounts();
      
      toast.success('Wszystkie powiadomienia oznaczono jako przeczytane');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Błąd podczas oznaczania wszystkich jako przeczytane');
    }
  };

  // Usuń powiadomienie
  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Powiadomienie zostało usunięte');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Błąd podczas usuwania powiadomienia');
    }
  };

  // Usuń wybrane powiadomienia
  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await Promise.all(
        selectedNotifications.map(id => notificationService.deleteNotification(id))
      );
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
      toast.success(`Usunięto ${selectedNotifications.length} powiadomień`);
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
      toast.error('Błąd podczas usuwania powiadomień');
    }
  };

  // Wyczyść wszystkie powiadomienia
  const handleClearAll = async () => {
    if (!confirm('Czy na pewno chcesz usunąć wszystkie powiadomienia?')) return;

    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      
      // Emituj event dla globalnych liczników
      window.dispatchEvent(new Event('notifications_marked_read'));
      
      // Odśwież globalne liczniki
      await refreshCounts();
      
      toast.success('Wszystkie powiadomienia zostały usunięte');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast.error('Błąd podczas usuwania wszystkich powiadomień');
    }
  };

  // Obsługa zaznaczania powiadomień
  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  // Obsługa kliknięcia w powiadomienie
  const handleNotificationClick = (notification: Notification) => {
    // Oznacz jako przeczytane jeśli nie jest
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Nawigacja na podstawie typu powiadomienia
    if (notification.data) {
      const { taskId, projectId, messageId, materialId } = notification.data;
      
      if (taskId && projectId) {
        navigate(`/projects/${projectId}`);
      } else if (messageId) {
        navigate('/messages');
      } else if (materialId) {
        navigate('/materials');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BellIcon className="h-8 w-8 mr-3 text-blue-600" />
                Powiadomienia
              </h1>
              <p className="mt-2 text-gray-600">
                Zarządzaj swoimi powiadomieniami i bądź na bieżąco z aktualnościami
              </p>
            </div>
          </div>
        </div>

        {/* Filtry i akcje */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Filtry */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Wszystkie ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filter === 'unread'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Nieprzeczytane ({unreadCount})
                  </button>
                </div>

                {/* Zaznacz wszystkie */}
                {notifications.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedNotifications.length === notifications.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                  </button>
                )}
              </div>

              {/* Akcje */}
              <div className="flex items-center space-x-2">
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Usuń wybrane ({selectedNotifications.length})
                  </button>
                )}

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Oznacz wszystkie jako przeczytane
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Wyczyść wszystkie
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista powiadomień */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Ładowanie powiadomień...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? 'Brak nieprzeczytanych powiadomień' : 'Brak powiadomień'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'Wszystkie powiadomienia zostały przeczytane.'
                  : 'Gdy pojawią się nowe powiadomienia, zobaczysz je tutaj.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      getNotificationBgColor(notification.type)
                    }`}>
                      <span className={getNotificationColor(notification.type)}>
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 
                          className={`text-lg font-medium cursor-pointer hover:text-blue-600 ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <span className="text-sm text-gray-500">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-1 mb-3">
                        {notification.message}
                      </p>
                      
                      {/* Akcje */}
                      <div className="flex items-center space-x-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Oznacz jako przeczytane
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => fetchNotifications(page - 1, filter === 'unread')}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Poprzednia
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              Strona {page} z {totalPages}
            </span>
            
            <button
              onClick={() => fetchNotifications(page + 1, filter === 'unread')}
              disabled={page === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Następna
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 
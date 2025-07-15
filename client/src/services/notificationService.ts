import axios from 'axios';
import type { 
  Notification, 
  NotificationsResponse, 
  UnreadCountResponse 
} from '../types/notification';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Konfiguracja axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor do dodawania tokenu
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const notificationService = {
  // Pobierz powiadomienia użytkownika
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsResponse> {
    try {
      const response = await api.get('/notifications', {
        params: { page, limit, unreadOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Pobierz liczbę nieprzeczytanych powiadomień
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<number>('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Oznacz powiadomienie jako przeczytane
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Oznacz wszystkie powiadomienia jako przeczytane
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Usuń powiadomienie
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Usuń wszystkie powiadomienia
  async clearAllNotifications(): Promise<{ message: string; count: number }> {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response.data;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  },

  // Wyślij testowe powiadomienie (tylko development)
  async sendTestNotification(title?: string, message?: string): Promise<{ message: string; notification: Notification }> {
    try {
      const response = await api.post('/notifications/test', {
        title,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }
}; 
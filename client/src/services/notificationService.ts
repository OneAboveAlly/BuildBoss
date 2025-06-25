import axios from 'axios';
import type { 
  Notification, 
  NotificationsResponse, 
  UnreadCountResponse 
} from '../types/notification';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Konfiguracja axios z tokenem
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const notificationService = {
  // Pobierz powiadomienia użytkownika
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: getAuthHeaders(),
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
      const response = await axios.get<UnreadCountResponse>(`${API_BASE_URL}/notifications/unread-count`, {
        headers: getAuthHeaders()
      });
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Oznacz powiadomienie jako przeczytane
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Oznacz wszystkie powiadomienia jako przeczytane
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/mark-all-read`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Usuń powiadomienie
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Usuń wszystkie powiadomienia
  async clearAllNotifications(): Promise<{ message: string; count: number }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/notifications/clear-all`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  },

  // Wyślij testowe powiadomienie (tylko development)
  async sendTestNotification(title?: string, message?: string): Promise<{ message: string; notification: Notification }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/notifications/test`, {
        title,
        message
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }
}; 
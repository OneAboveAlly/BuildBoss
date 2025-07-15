import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // Sprawdź czy jesteśmy w kontekście admina
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else {
    // Fallback do zwykłego tokenu użytkownika
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface AdminMessage {
  id: string;
  subject: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  status: 'UNREAD' | 'READ' | 'SENT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  recipient: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  replies?: AdminMessageReply[];
}

export interface AdminMessageReply {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface CreateAdminMessageData {
  recipientId: string;
  subject: string;
  content: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface AdminMessageStats {
  totalMessages: number;
  unreadMessages: number;
  highPriorityMessages: number;
  todayMessages: number;
}

export interface AdminMessagesResponse {
  messages: AdminMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminMessageService {
  private baseUrl = '/admin/messages';

  async getMessages(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
  }): Promise<AdminMessagesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    const response = await api.get(url);
    return response.data;
  }

  async getMessage(id: string): Promise<AdminMessage> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createMessage(data: CreateAdminMessageData): Promise<AdminMessage> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  async replyToMessage(messageId: string, content: string): Promise<AdminMessageReply> {
    const response = await api.post(`${this.baseUrl}/${messageId}/reply`, { content });
    return response.data;
  }

  async getStats(): Promise<AdminMessageStats> {
    const response = await api.get(`${this.baseUrl}/stats/overview`);
    return response.data;
  }

  async searchUsers(query: string): Promise<{ users: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdCompanies: Array<{ id: string; name: string }>;
  }> }> {
    const response = await api.get(`${this.baseUrl}/search-users?query=${encodeURIComponent(query)}`);
    return response.data;
  }

  async deleteAdminMessage(id: string): Promise<void> {
    await api.delete(`/messages/admin/${id}`);
  }
}

export const adminMessageService = new AdminMessageService(); 
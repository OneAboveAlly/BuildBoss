import axios from 'axios';
import type {
  Message,
  Conversation,
  CreateMessageData,
  MessageThread,
  UnreadCount
} from '../types/message';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Konfiguracja axios
const api = axios.create({
  baseURL: API_URL,
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

export interface AdminMessagesResponse {
  messages: AdminMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class MessageService {
  private baseUrl = '/messages';

  // ===== KONWERSACJE =====

  // Pobieranie listy konwersacji użytkownika
  async getConversations() {
    const response = await api.get('/messages');
    return response.data as Conversation[];
  }

  // Pobieranie wiadomości w konkretnej konwersacji
  async getMessageThread(thread: MessageThread) {
    const params = new URLSearchParams();
    params.append('otherUserId', thread.otherUserId.toString());
    
    if (thread.jobOfferId) {
      params.append('jobOfferId', thread.jobOfferId.toString());
    }
    if (thread.workRequestId) {
      params.append('workRequestId', thread.workRequestId.toString());
    }

    const response = await api.get(`/messages/thread?${params.toString()}`);
    return response.data as Message[];
  }

  // ===== WYSYŁANIE WIADOMOŚCI =====

  // Wysyłanie nowej wiadomości
  async sendMessage(data: CreateMessageData, file?: File) {
    if (file) {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('receiverId', data.receiverId.toString());
      if (data.jobOfferId) formData.append('jobOfferId', data.jobOfferId.toString());
      if (data.workRequestId) formData.append('workRequestId', data.workRequestId.toString());
      formData.append('cv', file);
      const response = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data as Message;
    } else {
      const response = await api.post('/messages', data);
      return response.data as Message;
    }
  }

  // Wiadomości od admina
  async getAdminMessages(params?: {
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

    const url = `${this.baseUrl}/admin?${queryParams.toString()}`;
    const response = await api.get(url);
    return response.data;
  }

  async getAdminMessage(id: string): Promise<AdminMessage> {
    const response = await api.get(`${this.baseUrl}/admin/${id}`);
    return response.data;
  }

  async getAdminUnreadCount(): Promise<number> {
    const response = await api.get(`${this.baseUrl}/admin/unread-count`);
    return response.data.total;
  }

  // ===== OZNACZANIE JAKO PRZECZYTANE =====

  // Oznaczanie pojedynczej wiadomości jako przeczytanej
  async markAsRead(messageId: number) {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data as Message;
  }

  // Oznaczanie całej konwersacji jako przeczytanej
  async markThreadAsRead(thread: MessageThread) {
    const data = {
      otherUserId: thread.otherUserId,
      ...(thread.jobOfferId && { jobOfferId: thread.jobOfferId }),
      ...(thread.workRequestId && { workRequestId: thread.workRequestId })
    };

    const response = await api.put('/messages/thread/read', data);
    return response.data;
  }

  // ===== STATYSTYKI =====

  // Pobieranie liczby nieprzeczytanych wiadomości
  async getUnreadCount() {
    const response = await api.get('/messages/unread-count');
    return response.data as UnreadCount;
  }

  // ===== USUWANIE =====

  // Usuwanie wiadomości (tylko dla nadawcy)
  async deleteMessage(messageId: number) {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  }

  // ===== POMOCNICZE FUNKCJE =====

  // Formatowanie czasu wiadomości
  formatMessageTime(createdAt: string) {
    const messageDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - messageDate.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Teraz';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min temu`;
    } else if (diffHours < 24) {
      return `${diffHours} godz. temu`;
    } else if (diffDays === 1) {
      return 'Wczoraj';
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else {
      return new Intl.DateTimeFormat('pl-PL', {
        day: 'numeric',
        month: 'short'
      }).format(messageDate);
    }
  }

  // Formatowanie pełnej daty i czasu
  formatFullDateTime(createdAt: string) {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(createdAt));
  }

  // Generowanie nazwy konwersacji
  getConversationTitle(conversation: Conversation) {
    const partnerName = conversation.otherUser.firstName && conversation.otherUser.lastName
      ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
      : conversation.otherUser.firstName || 'Użytkownik';

    if (conversation.jobOffer) {
      return `${partnerName} - ${conversation.jobOffer.title}`;
    } else if (conversation.workRequest) {
      return `${partnerName} - ${conversation.workRequest.title}`;
    } else {
      return partnerName;
    }
  }

  // Generowanie opisu kontekstu
  getContextDescription(conversation: Conversation) {
    if (conversation.jobOffer) {
      return 'Ogłoszenie o pracę';
    } else if (conversation.workRequest) {
      return 'Zlecenie pracy';
    } else {
      return 'Wiadomość bezpośrednia';
    }
  }

  // Sprawdzanie czy użytkownik jest nadawcą wiadomości
  isMessageFromUser(message: Message, userId: string) {
    return message.sender.id === userId;
  }

  // Generowanie inicjałów użytkownika (dla awatara)
  getUserInitials(firstName?: string, lastName?: string) {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else {
      return 'U';
    }
  }
};

export const messageService = new MessageService(); 
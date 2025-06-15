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
});

// Interceptor do dodawania tokenu
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const messageService = {
  // ===== KONWERSACJE =====

  // Pobieranie listy konwersacji użytkownika
  async getConversations() {
    const response = await api.get('/messages');
    return response.data as Conversation[];
  },

  // Pobieranie wiadomości w konkretnej konwersacji
  async getThread(thread: MessageThread) {
    const params = new URLSearchParams();
    params.append('partnerId', thread.partnerId);
    
    if (thread.jobOfferId) {
      params.append('jobOfferId', thread.jobOfferId);
    }
    if (thread.workRequestId) {
      params.append('workRequestId', thread.workRequestId);
    }

    const response = await api.get(`/messages/thread?${params.toString()}`);
    return response.data as Message[];
  },

  // ===== WYSYŁANIE WIADOMOŚCI =====

  // Wysyłanie nowej wiadomości
  async sendMessage(data: CreateMessageData) {
    const response = await api.post('/messages', data);
    return response.data as Message;
  },

  // ===== OZNACZANIE JAKO PRZECZYTANE =====

  // Oznaczanie pojedynczej wiadomości jako przeczytanej
  async markAsRead(messageId: string) {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data as Message;
  },

  // Oznaczanie całej konwersacji jako przeczytanej
  async markThreadAsRead(thread: MessageThread) {
    const data = {
      partnerId: thread.partnerId,
      ...(thread.jobOfferId && { jobOfferId: thread.jobOfferId }),
      ...(thread.workRequestId && { workRequestId: thread.workRequestId })
    };

    const response = await api.put('/messages/thread/read', data);
    return response.data;
  },

  // ===== STATYSTYKI =====

  // Pobieranie liczby nieprzeczytanych wiadomości
  async getUnreadCount() {
    const response = await api.get('/messages/unread-count');
    return response.data as UnreadCount;
  },

  // ===== USUWANIE =====

  // Usuwanie wiadomości (tylko dla nadawcy)
  async deleteMessage(messageId: string) {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

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
  },

  // Formatowanie pełnej daty i czasu
  formatFullDateTime(createdAt: string) {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(createdAt));
  },

  // Generowanie nazwy konwersacji
  getConversationTitle(conversation: Conversation) {
    const partnerName = conversation.partner.firstName && conversation.partner.lastName
      ? `${conversation.partner.firstName} ${conversation.partner.lastName}`
      : conversation.partner.firstName || 'Użytkownik';

    if (conversation.context.type === 'job' && conversation.context.data) {
      return `${partnerName} - ${conversation.context.data.title}`;
    } else if (conversation.context.type === 'request' && conversation.context.data) {
      return `${partnerName} - ${conversation.context.data.title}`;
    } else {
      return partnerName;
    }
  },

  // Generowanie opisu kontekstu
  getContextDescription(conversation: Conversation) {
    if (conversation.context.type === 'job') {
      return 'Ogłoszenie o pracę';
    } else if (conversation.context.type === 'request') {
      return 'Zlecenie pracy';
    } else {
      return 'Wiadomość bezpośrednia';
    }
  },

  // Sprawdzanie czy użytkownik jest nadawcą wiadomości
  isMessageFromUser(message: Message, userId: string) {
    return message.sender.id === userId;
  },

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
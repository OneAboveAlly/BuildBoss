// Typy dla systemu wiadomości

export interface Message {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;

  // Relations
  sender: {
    id: number;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  receiver: {
    id: number;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  
  // Context - wiadomość może być związana z ogłoszeniem lub zleceniem
  jobOffer?: {
    id: string;
    title: string;
  };
  workRequest?: {
    id: string;
    title: string;
  };
}

export interface Conversation {
  otherUser: {
    id: number;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  jobOffer?: {
    id: number;
    title: string;
  };
  workRequest?: {
    id: number;
    title: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export interface CreateMessageData {
  receiverId: number;
  content: string;
  jobOfferId?: number;
  workRequestId?: number;
}

export interface MessageThread {
  otherUserId: number;
  jobOfferId?: number;
  workRequestId?: number;
}

export interface UnreadCount {
  total: number;
} 
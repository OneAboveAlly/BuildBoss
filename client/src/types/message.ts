// Typy dla systemu wiadomości

export interface Message {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;

  // Relations
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  receiver: {
    id: string;
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
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    email?: string;
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
  isAdminConversation?: boolean;
}

export interface CreateMessageData {
  receiverId: string;
  content: string;
  jobOfferId?: number;
  workRequestId?: number;
}

export interface MessageThread {
  otherUserId: string;
  jobOfferId?: number;
  workRequestId?: number;
}

export interface UnreadCount {
  total: number;
} 
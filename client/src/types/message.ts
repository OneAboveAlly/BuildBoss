// Typy dla systemu wiadomości

export interface Message {
  id: string;
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
  partnerId: string;
  partner: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  context: {
    type: 'job' | 'request' | 'direct';
    data?: {
      id: string;
      title: string;
    };
  };
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export interface CreateMessageData {
  receiverId: string;
  content: string;
  jobOfferId?: string;
  workRequestId?: string;
}

export interface MessageThread {
  partnerId: string;
  jobOfferId?: string;
  workRequestId?: string;
}

export interface UnreadCount {
  unreadCount: number;
} 
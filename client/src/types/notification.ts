// ETAP 11 - Notification Types

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data?: any; // dodatkowe dane (np. ID zadania, projektu)
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  WORKER_INVITED = 'WORKER_INVITED',
  WORKER_JOINED = 'WORKER_JOINED',
  JOB_APPLICATION = 'JOB_APPLICATION',
  MATERIAL_LOW = 'MATERIAL_LOW',
  SUBSCRIPTION_TRIAL_ENDING = 'SUBSCRIPTION_TRIAL_ENDING',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: NotificationPagination;
}

export interface UnreadCountResponse {
  count: number;
}

// Funkcje pomocnicze

export const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return '📋';
    case NotificationType.TASK_COMPLETED:
      return '✅';
    case NotificationType.TASK_OVERDUE:
      return '⏰';
    case NotificationType.PROJECT_CREATED:
      return '🏗️';
    case NotificationType.PROJECT_UPDATED:
      return '📝';
    case NotificationType.MESSAGE_RECEIVED:
      return '💬';
    case NotificationType.WORKER_INVITED:
      return '👥';
    case NotificationType.WORKER_JOINED:
      return '🎉';
    case NotificationType.JOB_APPLICATION:
      return '📄';
    case NotificationType.MATERIAL_LOW:
      return '📦';
    case NotificationType.SUBSCRIPTION_TRIAL_ENDING:
      return '⏳';
    case NotificationType.SUBSCRIPTION_EXPIRED:
      return '❌';
    case NotificationType.PAYMENT_SUCCESS:
      return '💳';
    case NotificationType.PAYMENT_FAILED:
      return '⚠️';
    case NotificationType.SYSTEM_UPDATE:
      return '🔄';
    default:
      return '🔔';
  }
};

export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return 'text-blue-600';
    case NotificationType.TASK_COMPLETED:
      return 'text-green-600';
    case NotificationType.TASK_OVERDUE:
      return 'text-red-600';
    case NotificationType.PROJECT_CREATED:
    case NotificationType.PROJECT_UPDATED:
      return 'text-purple-600';
    case NotificationType.MESSAGE_RECEIVED:
      return 'text-indigo-600';
    case NotificationType.WORKER_INVITED:
    case NotificationType.WORKER_JOINED:
      return 'text-teal-600';
    case NotificationType.JOB_APPLICATION:
      return 'text-orange-600';
    case NotificationType.MATERIAL_LOW:
      return 'text-yellow-600';
    case NotificationType.SUBSCRIPTION_TRIAL_ENDING:
    case NotificationType.SUBSCRIPTION_EXPIRED:
      return 'text-red-600';
    case NotificationType.PAYMENT_SUCCESS:
      return 'text-green-600';
    case NotificationType.PAYMENT_FAILED:
      return 'text-red-600';
    case NotificationType.SYSTEM_UPDATE:
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

export const getNotificationBgColor = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return 'bg-blue-50';
    case NotificationType.TASK_COMPLETED:
      return 'bg-green-50';
    case NotificationType.TASK_OVERDUE:
      return 'bg-red-50';
    case NotificationType.PROJECT_CREATED:
    case NotificationType.PROJECT_UPDATED:
      return 'bg-purple-50';
    case NotificationType.MESSAGE_RECEIVED:
      return 'bg-indigo-50';
    case NotificationType.WORKER_INVITED:
    case NotificationType.WORKER_JOINED:
      return 'bg-teal-50';
    case NotificationType.JOB_APPLICATION:
      return 'bg-orange-50';
    case NotificationType.MATERIAL_LOW:
      return 'bg-yellow-50';
    case NotificationType.SUBSCRIPTION_TRIAL_ENDING:
    case NotificationType.SUBSCRIPTION_EXPIRED:
      return 'bg-red-50';
    case NotificationType.PAYMENT_SUCCESS:
      return 'bg-green-50';
    case NotificationType.PAYMENT_FAILED:
      return 'bg-red-50';
    case NotificationType.SYSTEM_UPDATE:
      return 'bg-gray-50';
    default:
      return 'bg-gray-50';
  }
};

export const formatNotificationTime = (createdAt: string): string => {
  const now = new Date();
  const notificationTime = new Date(createdAt);
  const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Teraz';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min temu`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} godz. temu`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} dni temu`;
  }
}; 
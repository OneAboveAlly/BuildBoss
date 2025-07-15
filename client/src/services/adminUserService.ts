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

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isEmailConfirmed: boolean;
  createdAt: string;
  lastLoginAt?: string;
  companies: Array<{
    id: string;
    name: string;
  }>;
  subscription?: {
    planName: string;
    status: string;
    endDate?: string;
    plan: {
      id: string;
      name: string;
      displayName: string;
      price: number;
    };
  };
  stats: {
    projectsCount: number;
    tasksCount: number;
    totalSpent: number;
  };
}

export interface AdminUserDetails extends AdminUser {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      createdAt: string;
    }>;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  stats: {
    projectsCount: number;
    tasksCount: number;
    companiesCount: number;
    totalSpent: number;
    activeProjects: number;
    completedTasks: number;
  };
}

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  premiumUsers: number;
  usersByRole: Record<string, number>;
  usersByPlan: Record<string, number>;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  isEmailConfirmed?: boolean;
}

export interface UpdateSubscriptionData {
  planId?: string;
  trialEndDate?: string;
  endDate?: string;
  status?: string;
}

class AdminUserService {
  private baseUrl = '/admin/users';

  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    subscription?: string;
    search?: string;
  }): Promise<AdminUsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.subscription) queryParams.append('subscription', params.subscription);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    const response = await api.get(url);
    return response.data;
  }

  async getUser(id: string): Promise<{ user: AdminUserDetails }> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<{ user: AdminUser }> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async updateUserSubscription(id: string, data: UpdateSubscriptionData): Promise<{ subscription: any }> {
    const response = await api.patch(`${this.baseUrl}/${id}/subscription`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getStats(): Promise<AdminUserStats> {
    const response = await api.get(`${this.baseUrl}/stats/overview`);
    return response.data;
  }
}

export const adminUserService = new AdminUserService(); 
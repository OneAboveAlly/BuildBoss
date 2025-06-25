import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data;
  },

  async getMe(token?: string): Promise<User> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<ApiResponse<User>>('/auth/me', { headers });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to get user data');
    }
    return response.data.data;
  },

  async confirmEmail(token: string): Promise<void> {
    const response = await api.get<ApiResponse>(`/auth/confirm/${token}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Email confirmation failed');
    }
  },

  async googleAuth(): Promise<string> {
    // This will redirect to Google OAuth
    window.location.href = `${API_URL}/auth/google`;
    return 'redirecting';
  },

  async verifyPassword(password: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/verify-password', { password });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Password verification failed');
    }
  },
}; 
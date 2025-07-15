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
    // Sprawdź, czy to 401 i nie dotyczy logowania
    const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
    const isOnLoginPage = window.location.pathname === '/login';
    if (error.response?.status === 401 && !isLoginRequest && !isOnLoginPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('Attempting login with email:', data.email); // Debug log
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Login failed');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Login error details:', error.response?.data || error); // Debug log
      
      // Handle axios errors with response
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationMessages = errorData.errors.map((err: any) => err.message).join(', ');
          throw new Error(validationMessages);
        }
        
        // Handle general error messages
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        
        // Handle rate limiting
        if (error.response.status === 429) {
          throw new Error('Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.');
        }
        
        // Handle unauthorized
        if (error.response.status === 401) {
          throw new Error('Nieprawidłowy email lub hasło.');
        }
        
        // Handle server errors
        if (error.response.status >= 500) {
          throw new Error('Błąd serwera. Spróbuj ponownie później.');
        }
      }
      
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Błąd połączenia z serwerem. Sprawdź połączenie internetowe.');
      }
      
      // Fallback error message
      throw new Error(error.message || 'Błąd podczas logowania');
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('Sending registration data:', data); // Debug log
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Registration failed');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Registration error details:', error.response?.data || error); // Debug log
      
      // Handle axios errors with response
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationMessages = errorData.errors.map((err: any) => err.message).join(', ');
          throw new Error(validationMessages);
        }
        
        // Handle general error messages
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        
        // Handle rate limiting
        if (error.response.status === 429) {
          throw new Error('Zbyt wiele prób rejestracji. Spróbuj ponownie za kilka minut.');
        }
        
        // Handle server errors
        if (error.response.status >= 500) {
          throw new Error('Błąd serwera. Spróbuj ponownie później.');
        }
      }
      
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Błąd połączenia z serwerem. Sprawdź połączenie internetowe.');
      }
      
      // Fallback error message
      throw new Error(error.message || 'Błąd podczas rejestracji');
    }
  },

  async getMe(token?: string): Promise<{ user: User; ownedCompaniesCount: number }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await api.get<ApiResponse<{ user: User; ownedCompaniesCount: number }>>('/auth/me', { headers });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to get user data');
    }
    // Backend returns { user: UserData, ownedCompaniesCount: number }
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
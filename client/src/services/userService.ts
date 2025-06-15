import axios from 'axios';
import type {
  UserSearchResult,
  UserProfile,
  UpdateProfileRequest
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const createAuthAxios = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

export const userService = {
  // Search users by email
  async searchUsers(email: string, companyId?: string): Promise<UserSearchResult[]> {
    const api = createAuthAxios();
    const params = new URLSearchParams({ email });
    if (companyId) {
      params.append('companyId', companyId);
    }
    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  },

  // Get user profile
  async getProfile(): Promise<UserProfile> {
    const api = createAuthAxios();
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const api = createAuthAxios();
    const response = await api.put('/users/profile', data);
    return response.data;
  }
}; 
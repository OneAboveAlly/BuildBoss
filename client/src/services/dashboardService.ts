import axios from 'axios';
import type {
  DashboardStats,
  RecentActivity,
  WorkerInvitation,
  CompanyStats
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

export const dashboardService = {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    const api = createAuthAxios();
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get recent activity
  async getRecentActivity(): Promise<RecentActivity> {
    const api = createAuthAxios();
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },

  // Get user invitations
  async getInvitations(): Promise<WorkerInvitation[]> {
    const api = createAuthAxios();
    const response = await api.get('/dashboard/invitations');
    return response.data;
  },

  // Get company statistics
  async getCompanyStats(companyId: string): Promise<CompanyStats> {
    const api = createAuthAxios();
    const response = await api.get(`/dashboard/company-stats/${companyId}`);
    return response.data;
  }
}; 
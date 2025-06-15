import axios from 'axios';
import type {
  CompanyWithDetails,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  InviteWorkerRequest,
  UpdateWorkerRequest,
  WorkerWithUser,
  BulkInviteRequest,
  BulkInviteResponse
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

export const companyService = {
  // Get all companies for current user
  async getCompanies(): Promise<CompanyWithDetails[]> {
    const api = createAuthAxios();
    const response = await api.get('/companies');
    return response.data;
  },

  // Alias for getCompanies
  async getUserCompanies(): Promise<CompanyWithDetails[]> {
    return this.getCompanies();
  },

  // Get company by ID
  async getCompany(id: string): Promise<CompanyWithDetails> {
    const api = createAuthAxios();
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Create new company
  async createCompany(data: CreateCompanyRequest): Promise<CompanyWithDetails> {
    const api = createAuthAxios();
    const response = await api.post('/companies', data);
    return response.data;
  },

  // Update company
  async updateCompany(id: string, data: UpdateCompanyRequest): Promise<CompanyWithDetails> {
    const api = createAuthAxios();
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  // Delete company
  async deleteCompany(id: string): Promise<void> {
    const api = createAuthAxios();
    await api.delete(`/companies/${id}`);
  },

  // Invite worker to company
  async inviteWorker(companyId: string, data: InviteWorkerRequest): Promise<WorkerWithUser> {
    const api = createAuthAxios();
    const response = await api.post(`/companies/${companyId}/invite`, data);
    return response.data;
  },

  // Update worker permissions
  async updateWorker(companyId: string, workerId: string, data: UpdateWorkerRequest): Promise<WorkerWithUser> {
    const api = createAuthAxios();
    const response = await api.put(`/companies/${companyId}/workers/${workerId}`, data);
    return response.data;
  },

  // Remove worker from company
  async removeWorker(companyId: string, workerId: string): Promise<void> {
    const api = createAuthAxios();
    await api.delete(`/companies/${companyId}/workers/${workerId}`);
  },

  // Accept invitation to company
  async acceptInvitation(companyId: string): Promise<WorkerWithUser> {
    const api = createAuthAxios();
    const response = await api.post(`/companies/${companyId}/accept-invitation`);
    return response.data;
  },

  // Reject invitation to company
  async rejectInvitation(companyId: string): Promise<void> {
    const api = createAuthAxios();
    await api.post(`/companies/${companyId}/reject-invitation`);
  },

  // Get workers for company
  async getWorkers(companyId: string): Promise<WorkerWithUser[]> {
    const api = createAuthAxios();
    const response = await api.get(`/companies/${companyId}/workers`);
    return response.data;
  },

  // Bulk invite workers to company
  async bulkInviteWorkers(companyId: string, data: BulkInviteRequest): Promise<BulkInviteResponse> {
    const api = createAuthAxios();
    const response = await api.post(`/companies/${companyId}/workers/bulk-invite`, data);
    return response.data;
  }
}; 
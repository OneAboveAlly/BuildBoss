import axios from 'axios';
import type { ApiResponse } from '../types';

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

export interface LegalDocument {
  content: string;
  language: string;
  type: string;
  lastModified: string;
}

export interface GdprRights {
  access: string;
  rectification: string;
  erasure: string;
  restriction: string;
  portability: string;
  objection: string;
  withdrawConsent: string;
}

export interface DataSummary {
  profile: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    createdAt: string;
    lastLoginAt: string;
  };
  projects: {
    count: number;
    totalSize: string;
    lastActivity: string;
  };
  tasks: {
    count: number;
    completed: number;
    pending: number;
  };
  messages: {
    count: number;
    lastMessage: string;
  };
  files: {
    count: number;
    totalSize: string;
  };
}

export interface ExportRequest {
  requestId: string;
  status: 'pending' | 'processing' | 'ready' | 'expired' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  format: 'json' | 'csv';
  size?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  include: {
    profile: boolean;
    projects: boolean;
    tasks: boolean;
    messages: boolean;
    files: boolean;
    analytics: boolean;
  };
}

export const legalService = {
  // Legal Documents
  async getLegalDocument(type: 'terms' | 'privacy' | 'gdpr', language: string): Promise<LegalDocument> {
    const response = await api.get<ApiResponse<LegalDocument>>(`/legal/${type}/${language}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch document');
    }
    return response.data.data;
  },

  async getAllDocuments(language: string): Promise<Record<string, LegalDocument>> {
    const response = await api.get<ApiResponse<Record<string, LegalDocument>>>(`/legal/all/${language}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch documents');
    }
    return response.data.data;
  },

  async getDocumentStatus(): Promise<Record<string, boolean>> {
    const response = await api.get<ApiResponse<Record<string, boolean>>>('/legal/status');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch document status');
    }
    return response.data.data;
  },

  async getSupportedLanguages(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/legal/languages');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch supported languages');
    }
    return response.data.data;
  },

  // GDPR Rights
  async getGdprRights(): Promise<GdprRights> {
    const response = await api.get<ApiResponse<GdprRights>>('/gdpr/rights');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch GDPR rights');
    }
    return response.data.data;
  },

  async getDataSummary(): Promise<DataSummary> {
    const response = await api.get<ApiResponse<DataSummary>>('/gdpr/data-summary');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch data summary');
    }
    return response.data.data;
  },

  // Data Export
  async requestDataExport(options: ExportOptions): Promise<ExportRequest> {
    const response = await api.post<ApiResponse<ExportRequest>>('/gdpr/export-data', options);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to request data export');
    }
    return response.data.data;
  },

  async getExportStatus(requestId: string): Promise<ExportRequest> {
    const response = await api.get<ApiResponse<ExportRequest>>(`/gdpr/export-data/${requestId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to get export status');
    }
    return response.data.data;
  },

  async downloadExportData(requestId: string): Promise<Blob> {
    const response = await api.get(`/gdpr/export-data/${requestId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Account Deletion
  async requestAccountDeletion(confirmation: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<ApiResponse<any>>('/gdpr/delete-account', { confirmation });
    return {
      success: response.data.success,
      message: response.data.message || 'Account deletion request processed'
    };
  },

  // Privacy Settings
  async getPrivacySettings(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/users/privacy-settings');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch privacy settings');
    }
    return response.data.data;
  },

  async updatePrivacySettings(settings: any): Promise<{ success: boolean }> {
    const response = await api.put<ApiResponse<any>>('/users/privacy-settings', settings);
    return { success: response.data.success };
  },

  // Cookie Consent
  async getCookieConsent(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/users/cookie-consent');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch cookie consent');
    }
    return response.data.data;
  },

  async updateCookieConsent(consent: any): Promise<{ success: boolean }> {
    const response = await api.put<ApiResponse<any>>('/users/cookie-consent', consent);
    return { success: response.data.success };
  },

  // Terms Acceptance
  async acceptTerms(version: string): Promise<{ success: boolean }> {
    const response = await api.post<ApiResponse<any>>('/users/accept-terms', {
      version,
      acceptedAt: new Date().toISOString()
    });
    return { success: response.data.success };
  },

  async getTermsAcceptance(): Promise<{ version?: string; acceptedAt?: string }> {
    const response = await api.get<ApiResponse<{ version?: string; acceptedAt?: string }>>('/users/terms-acceptance');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch terms acceptance');
    }
    return response.data.data || {};
  },

  // Contact for Legal Issues
  async submitLegalInquiry(inquiry: {
    type: 'privacy' | 'gdpr' | 'terms' | 'other';
    subject: string;
    message: string;
    email?: string;
  }): Promise<{ success: boolean; ticketId: string }> {
    const response = await api.post<ApiResponse<{ ticketId: string }>>('/legal/contact', inquiry);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to submit legal inquiry');
    }
    return {
      success: response.data.success,
      ticketId: response.data.data.ticketId
    };
  }
}; 
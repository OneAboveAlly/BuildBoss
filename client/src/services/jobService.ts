import axios from 'axios';
import type {
  JobOffer,
  JobApplication,
  CreateJobOfferData,
  UpdateJobOfferData,
  JobFilters,
  JobApplicationData,
  UpdateApplicationData,
  JobCategory,
  JobType,
  ExperienceLevel
} from '../types/job';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Konfiguracja axios
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor do dodawania tokenu
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const jobService = {
  // ===== PUBLICZNE ENDPOINTY =====

  // Pobieranie listy ogłoszeń (publiczne)
  async getJobs(filters: JobFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/jobs?${params.toString()}`);
    return response.data;
  },

  // Pobieranie szczegółów ogłoszenia (publiczne)
  async getJob(id: string) {
    const response = await api.get(`/jobs/${id}`);
    return response.data as JobOffer;
  },

  // Aplikowanie na stanowisko
  async applyForJob(jobId: string, data: JobApplicationData) {
    const response = await api.post(`/jobs/${jobId}/apply`, data);
    return response.data as JobApplication;
  },

  // Pobieranie kategorii
  async getCategories() {
    const response = await api.get('/jobs/categories');
    return response.data as Record<JobCategory, string>;
  },

  // Pobieranie województw
  async getVoivodeships() {
    const response = await api.get('/jobs/voivodeships');
    return response.data as string[];
  },

  // ===== PRYWATNE ENDPOINTY (dla firm) =====

  // Pobieranie moich ogłoszeń
  async getMyJobs(companyId?: string, status: 'all' | 'active' | 'inactive' = 'all') {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (status !== 'all') params.append('status', status);

    const response = await api.get(`/jobs/my/offers?${params.toString()}`);
    return response.data as JobOffer[];
  },

  // Tworzenie nowego ogłoszenia
  async createJob(data: CreateJobOfferData) {
    const response = await api.post('/jobs', data);
    return response.data as JobOffer;
  },

  // Aktualizacja ogłoszenia
  async updateJob(id: string, data: UpdateJobOfferData) {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data as JobOffer;
  },

  // Usuwanie ogłoszenia
  async deleteJob(id: string) {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  // ===== ZARZĄDZANIE APLIKACJAMI =====

  // Pobieranie aplikacji do ogłoszenia
  async getJobApplications(
    jobId: string, 
    status?: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  ) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await api.get(`/jobs/${jobId}/applications?${params.toString()}`);
    return response.data as JobApplication[];
  },

  // Aktualizacja statusu aplikacji
  async updateApplication(jobId: string, applicationId: string, data: UpdateApplicationData) {
    const response = await api.put(`/jobs/${jobId}/applications/${applicationId}`, data);
    return response.data as JobApplication;
  },

  // ===== POMOCNICZE FUNKCJE =====

  // Formatowanie wynagrodzenia
  formatSalary(salaryMin?: number, salaryMax?: number, currency = 'PLN') {
    if (!salaryMin && !salaryMax) return 'Do uzgodnienia';
    
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('pl-PL').format(amount);
    };

    if (salaryMin && salaryMax) {
      return `${formatAmount(salaryMin)} - ${formatAmount(salaryMax)} ${currency}`;
    } else if (salaryMin) {
      return `od ${formatAmount(salaryMin)} ${currency}`;
    } else if (salaryMax) {
      return `do ${formatAmount(salaryMax)} ${currency}`;
    }
    
    return 'Do uzgodnienia';
  },

  // Formatowanie daty
  formatDate(dateString: string) {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  },

  // Sprawdzanie czy ogłoszenie wygasło
  isExpired(expiresAt?: string) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  },

  // Generowanie URL do mapy
  getMapUrl(latitude?: number, longitude?: number, city?: string, address?: string) {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    } else if (city && address) {
      return `https://www.google.com/maps/search/${encodeURIComponent(`${address}, ${city}`)}`;
    } else if (city) {
      return `https://www.google.com/maps/search/${encodeURIComponent(city)}`;
    }
    return null;
  }
}; 
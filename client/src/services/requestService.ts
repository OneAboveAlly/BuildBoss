import axios from 'axios';
import type {
  WorkRequest,
  CreateWorkRequestData,
  UpdateWorkRequestData,
  RequestFilters,
  WorkCategory,
  RequestType
} from '../types/request';

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

export const requestService = {
  // ===== PUBLICZNE ENDPOINTY =====

  // Pobieranie listy zleceń (publiczne)
  async getRequests(filters: RequestFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/requests?${params.toString()}`);
    return response.data;
  },

  // Pobieranie szczegółów zlecenia (publiczne)
  async getRequest(id: string) {
    const response = await api.get(`/requests/${id}`);
    return response.data as WorkRequest;
  },

  // Pobieranie kategorii
  async getCategories() {
    const response = await api.get('/requests/categories');
    return response.data as Record<WorkCategory, string>;
  },

  // Pobieranie województw
  async getVoivodeships() {
    const response = await api.get('/requests/voivodeships');
    return response.data as string[];
  },

  // ===== PRYWATNE ENDPOINTY (dla użytkowników) =====

  // Pobieranie moich zleceń
  async getMyRequests(companyId?: string, status: 'all' | 'active' | 'inactive' = 'all') {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (status !== 'all') params.append('status', status);

    const response = await api.get(`/requests/my/requests?${params.toString()}`);
    return response.data as WorkRequest[];
  },

  // Tworzenie nowego zlecenia
  async createRequest(data: CreateWorkRequestData) {
    const response = await api.post('/requests', data);
    return response.data as WorkRequest;
  },

  // Aktualizacja zlecenia
  async updateRequest(id: string, data: UpdateWorkRequestData) {
    const response = await api.put(`/requests/${id}`, data);
    return response.data as WorkRequest;
  },

  // Usuwanie zlecenia
  async deleteRequest(id: string) {
    const response = await api.delete(`/requests/${id}`);
    return response.data;
  },

  // ===== POMOCNICZE FUNKCJE =====

  // Formatowanie budżetu
  formatBudget(budgetMin?: number, budgetMax?: number, currency = 'PLN') {
    if (!budgetMin && !budgetMax) return 'Do uzgodnienia';
    
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('pl-PL').format(amount);
    };

    if (budgetMin && budgetMax) {
      return `${formatAmount(budgetMin)} - ${formatAmount(budgetMax)} ${currency}`;
    } else if (budgetMin) {
      return `od ${formatAmount(budgetMin)} ${currency}`;
    } else if (budgetMax) {
      return `do ${formatAmount(budgetMax)} ${currency}`;
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

  // Formatowanie terminu
  formatDeadline(deadline?: string) {
    if (!deadline) return 'Brak terminu';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Termin minął ${Math.abs(diffDays)} dni temu`;
    } else if (diffDays === 0) {
      return 'Termin dzisiaj';
    } else if (diffDays === 1) {
      return 'Termin jutro';
    } else if (diffDays <= 7) {
      return `Termin za ${diffDays} dni`;
    } else {
      return this.formatDate(deadline);
    }
  },

  // Sprawdzanie czy zlecenie wygasło
  isExpired(expiresAt?: string) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  },

  // Sprawdzanie czy termin jest pilny (mniej niż 7 dni)
  isUrgent(deadline?: string) {
    if (!deadline) return false;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 7;
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
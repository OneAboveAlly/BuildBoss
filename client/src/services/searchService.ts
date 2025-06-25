import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to create auth headers
const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Types
export interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'material' | 'user' | 'company';
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  company?: string;
  project?: string;
  assignedTo?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  tags?: Array<{ name: string; color: string }>;
  url: string;
}

export interface SearchResults {
  projects: SearchResult[];
  tasks: SearchResult[];
  materials: SearchResult[];
  users: SearchResult[];
  companies: SearchResult[];
  total: number;
}

export interface GlobalSearchResponse {
  query: string;
  results: SearchResults;
  pagination: {
    limit: number;
    total: number;
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'project' | 'task' | 'material' | 'tag';
  id: string;
  category: string;
  color?: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  category?: string;
  results: number;
  filters?: Record<string, any>;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  category?: string;
  filters?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingQuery {
  query: string;
  count: number;
}

export interface SearchFilters {
  category?: 'projects' | 'tasks' | 'materials' | 'users' | 'companies' | 'all';
  companyId?: string;
  limit?: number;
  includeArchived?: boolean;
}

export const searchService = {
  // Globalne wyszukiwanie
  async globalSearch(query: string, filters?: SearchFilters): Promise<GlobalSearchResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.companyId) params.append('companyId', filters.companyId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.includeArchived) params.append('includeArchived', 'true');

    const response = await axios.get(
      `${API_BASE_URL}/search/global?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Sugestie wyszukiwania
  async getSuggestions(query: string, limit = 10): Promise<SearchSuggestion[]> {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());

    const response = await axios.get(
      `${API_BASE_URL}/search/suggestions?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data.suggestions;
  },

  // Historia wyszukiwań
  async getSearchHistory(limit = 20): Promise<SearchHistoryItem[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await axios.get(
      `${API_BASE_URL}/search/history?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data.history;
  },

  // Usuń wpis z historii
  async deleteHistoryItem(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/search/history/${id}`,
      { headers: createAuthHeaders() }
    );
  },

  // Popularne wyszukiwania
  async getTrendingQueries(limit = 10): Promise<TrendingQuery[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await axios.get(
      `${API_BASE_URL}/search/trending?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data.trending;
  },

  // Zapisz wyszukiwanie
  async saveSearch(data: {
    name: string;
    query: string;
    filters?: Record<string, any>;
    category?: string;
  }): Promise<SavedSearch> {
    const response = await axios.post(
      `${API_BASE_URL}/search/save`,
      data,
      { headers: createAuthHeaders() }
    );
    return response.data.savedSearch;
  },

  // Pobierz zapisane wyszukiwania
  async getSavedSearches(): Promise<SavedSearch[]> {
    const response = await axios.get(
      `${API_BASE_URL}/search/saved`,
      { headers: createAuthHeaders() }
    );
    return response.data.savedSearches;
  },

  // Aktualizuj zapisane wyszukiwanie
  async updateSavedSearch(id: string, data: {
    name?: string;
    query?: string;
    filters?: Record<string, any>;
    category?: string;
  }): Promise<void> {
    await axios.put(
      `${API_BASE_URL}/search/saved/${id}`,
      data,
      { headers: createAuthHeaders() }
    );
  },

  // Usuń zapisane wyszukiwanie
  async deleteSavedSearch(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/search/saved/${id}`,
      { headers: createAuthHeaders() }
    );
  },

  // Wykonaj zapisane wyszukiwanie
  async executeSavedSearch(savedSearch: SavedSearch): Promise<GlobalSearchResponse> {
    return this.globalSearch(savedSearch.query, {
      category: savedSearch.category as any,
      ...savedSearch.filters
    });
  }
}; 
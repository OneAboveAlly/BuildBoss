import axios from 'axios';
import type { Material, CreateMaterialData, UpdateMaterialData, MaterialFilters, MaterialQuantityUpdate } from '../types/material';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const createAuthenticatedRequest = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

export const materialService = {
  // Pobierz listę materiałów z filtrami
  async getMaterials(filters: MaterialFilters = {}): Promise<Material[]> {
    const api = createAuthenticatedRequest();
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/materials?${params.toString()}`);
    return response.data;
  },

  // Pobierz materiały z niskim stanem
  async getLowStockMaterials(companyId: string): Promise<Material[]> {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/materials/alerts?companyId=${companyId}`);
    return response.data;
  },

  // Pobierz kategorie materiałów
  async getCategories(companyId: string): Promise<string[]> {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/materials/categories?companyId=${companyId}`);
    return response.data;
  },

  // Pobierz szczegóły materiału
  async getMaterial(id: string): Promise<Material> {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  // Tworzenie nowego materiału
  async createMaterial(data: CreateMaterialData) {
    console.log('=== createMaterial DEBUG ===');
    console.log('Sending data:', JSON.stringify(data, null, 2));
    console.log('=== END createMaterial DEBUG ===');
    
    const api = createAuthenticatedRequest();
    const response = await api.post('/materials', data);
    return response.data as Material;
  },

  // Aktualizuj materiał
  async updateMaterial(id: string, data: UpdateMaterialData): Promise<Material> {
    const api = createAuthenticatedRequest();
    const response = await api.put(`/materials/${id}`, data);
    return response.data;
  },

  // Aktualizuj ilość materiału
  async updateQuantity(id: string, data: MaterialQuantityUpdate): Promise<Material> {
    const api = createAuthenticatedRequest();
    const response = await api.patch(`/materials/${id}/quantity`, data);
    return response.data;
  },

  // Usuń materiał
  async deleteMaterial(id: string): Promise<void> {
    const api = createAuthenticatedRequest();
    await api.delete(`/materials/${id}`);
  }
}; 
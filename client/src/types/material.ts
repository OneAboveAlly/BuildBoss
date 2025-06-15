export interface Material {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  quantity: number;
  minQuantity?: number;
  price?: number;
  supplier?: string;
  location?: string;
  barcode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  projectId?: string;
  createdById: string;
  
  // Relations
  company: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  
  // Computed fields
  isLowStock?: boolean;
}

export interface CreateMaterialData {
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  price?: number;
  supplier?: string;
  location?: string;
  barcode?: string;
  notes?: string;
  companyId: string;
  projectId?: string;
}

export interface UpdateMaterialData {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  price?: number;
  supplier?: string;
  location?: string;
  barcode?: string;
  notes?: string;
  projectId?: string;
}

export interface MaterialFilters {
  companyId?: string;
  projectId?: string;
  category?: string;
  lowStock?: boolean;
  search?: string;
  sortBy?: 'name' | 'quantity' | 'category' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MaterialQuantityUpdate {
  quantity: number;
  operation?: 'set' | 'add' | 'subtract';
}

export const MATERIAL_UNITS = [
  'szt',
  'kg',
  'm',
  'm2',
  'm3',
  'l',
  't',
  'op',
  'pkt',
  'mb'
] as const;

export const MATERIAL_CATEGORIES = [
  'Cement i betony',
  'Drewno i materiały drewnopodobne',
  'Stal i metale',
  'Izolacje',
  'Pokrycia dachowe',
  'Materiały wykończeniowe',
  'Instalacje elektryczne',
  'Instalacje sanitarne',
  'Narzędzia',
  'Sprzęt budowlany',
  'Inne'
] as const; 
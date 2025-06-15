// Typy dla zleceń pracy

export interface WorkRequest {
  id: string;
  title: string;
  description: string;
  category: WorkCategory;
  type: RequestType;
  
  // Location
  country: string;
  voivodeship: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  
  // Budget & Timeline
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  deadline?: string;
  
  // Requirements
  requirements?: string;
  materials?: string;
  
  // Contact & Status
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  isPublic: boolean;
  expiresAt?: string;
  
  createdAt: string;
  updatedAt: string;

  // Relations
  company?: {
    id: string;
    name: string;
    logo?: string;
    description?: string;
    website?: string;
  };
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  
  // Computed fields
  messageCount?: number;
  canContact?: boolean;
}

export interface CreateWorkRequestData {
  title: string;
  description: string;
  category: WorkCategory;
  type: RequestType;
  voivodeship: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  deadline?: string;
  requirements?: string;
  materials?: string;
  contactEmail?: string;
  contactPhone?: string;
  isPublic?: boolean;
  expiresAt?: string;
  companyId?: string;
}

export interface UpdateWorkRequestData extends Partial<CreateWorkRequestData> {
  isActive?: boolean;
}

export interface RequestFilters {
  category?: WorkCategory;
  voivodeship?: string;
  city?: string;
  type?: RequestType;
  budgetMin?: number;
  budgetMax?: number;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'budgetMin' | 'budgetMax' | 'deadline';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Enums
export enum WorkCategory {
  CONSTRUCTION = 'CONSTRUCTION',
  RENOVATION = 'RENOVATION',
  REPAIR = 'REPAIR',
  INSTALLATION = 'INSTALLATION',
  MAINTENANCE = 'MAINTENANCE',
  DEMOLITION = 'DEMOLITION',
  LANDSCAPING = 'LANDSCAPING',
  CLEANING = 'CLEANING',
  PAINTING = 'PAINTING',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  ROOFING = 'ROOFING',
  FLOORING = 'FLOORING',
  WINDOWS_DOORS = 'WINDOWS_DOORS',
  OTHER = 'OTHER'
}

export enum RequestType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
  PROJECT = 'PROJECT',
  URGENT = 'URGENT'
}

// Stałe dla UI
export const WORK_CATEGORIES = {
  [WorkCategory.CONSTRUCTION]: 'Budowa',
  [WorkCategory.RENOVATION]: 'Remont',
  [WorkCategory.REPAIR]: 'Naprawa',
  [WorkCategory.INSTALLATION]: 'Instalacja',
  [WorkCategory.MAINTENANCE]: 'Konserwacja',
  [WorkCategory.DEMOLITION]: 'Rozbiórka',
  [WorkCategory.LANDSCAPING]: 'Ogrodnictwo',
  [WorkCategory.CLEANING]: 'Sprzątanie',
  [WorkCategory.PAINTING]: 'Malowanie',
  [WorkCategory.ELECTRICAL]: 'Elektryka',
  [WorkCategory.PLUMBING]: 'Hydraulika',
  [WorkCategory.ROOFING]: 'Dekarstwo',
  [WorkCategory.FLOORING]: 'Podłogi',
  [WorkCategory.WINDOWS_DOORS]: 'Okna i drzwi',
  [WorkCategory.OTHER]: 'Inne'
};

export const REQUEST_TYPES = {
  [RequestType.ONE_TIME]: 'Jednorazowe',
  [RequestType.RECURRING]: 'Cykliczne',
  [RequestType.PROJECT]: 'Projekt',
  [RequestType.URGENT]: 'Pilne'
};

export const VOIVODESHIPS = [
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie'
]; 
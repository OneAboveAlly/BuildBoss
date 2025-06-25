// Typy dla ogłoszeń o pracę i aplikacji

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  type: JobType;
  
  // Location
  country: string;
  voivodeship: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  
  // Job details
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  experience: ExperienceLevel;
  
  // Requirements
  requirements?: string;
  benefits?: string;
  
  // Contact & Status
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  isPublic: boolean;
  expiresAt?: string;
  
  // Analytics
  viewCount?: number;
  
  createdAt: string;
  updatedAt: string;

  // Relations
  company: {
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
  applicationCount?: number;
  hasApplied?: boolean;
  userApplication?: JobApplication;
}

export interface JobApplication {
  id: string;
  message?: string;
  cvUrl?: string;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt?: string;
  notes?: string;

  // Relations
  jobOffer?: {
    id: string;
    title: string;
  };
  applicant: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
}

export interface CreateJobOfferData {
  title: string;
  description: string;
  category: JobCategory;
  type: JobType;
  voivodeship: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  experience: ExperienceLevel;
  requirements?: string;
  benefits?: string;
  contactEmail?: string;
  contactPhone?: string;
  isPublic?: boolean;
  expiresAt?: string;
  companyId: string;
}

export interface UpdateJobOfferData extends Partial<CreateJobOfferData> {
  isActive?: boolean;
}

export interface JobFilters {
  category?: JobCategory;
  voivodeship?: string;
  city?: string;
  type?: JobType;
  experience?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'salaryMin' | 'salaryMax';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface JobApplicationData {
  message?: string;
  cvUrl?: string;
}

export interface UpdateApplicationData {
  status?: ApplicationStatus;
  notes?: string;
}

// Enums
export enum JobCategory {
  CONSTRUCTION_WORKER = 'CONSTRUCTION_WORKER',
  ELECTRICIAN = 'ELECTRICIAN',
  PLUMBER = 'PLUMBER',
  PAINTER = 'PAINTER',
  CARPENTER = 'CARPENTER',
  MASON = 'MASON',
  ROOFER = 'ROOFER',
  TILER = 'TILER',
  FOREMAN = 'FOREMAN',
  ARCHITECT = 'ARCHITECT',
  ENGINEER = 'ENGINEER',
  HEAVY_EQUIPMENT = 'HEAVY_EQUIPMENT',
  LANDSCAPING = 'LANDSCAPING',
  DEMOLITION = 'DEMOLITION',
  OTHER = 'OTHER'
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERNSHIP = 'INTERNSHIP',
  FREELANCE = 'FREELANCE'
}

export enum ExperienceLevel {
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  EXPERT = 'EXPERT'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

// Stałe dla UI
export const JOB_CATEGORIES = {
  [JobCategory.CONSTRUCTION_WORKER]: 'Robotnik budowlany',
  [JobCategory.ELECTRICIAN]: 'Elektryk',
  [JobCategory.PLUMBER]: 'Hydraulik',
  [JobCategory.PAINTER]: 'Malarz',
  [JobCategory.CARPENTER]: 'Stolarz',
  [JobCategory.MASON]: 'Murarz',
  [JobCategory.ROOFER]: 'Dekarz',
  [JobCategory.TILER]: 'Glazurnik',
  [JobCategory.FOREMAN]: 'Kierownik budowy',
  [JobCategory.ARCHITECT]: 'Architekt',
  [JobCategory.ENGINEER]: 'Inżynier',
  [JobCategory.HEAVY_EQUIPMENT]: 'Operator sprzętu',
  [JobCategory.LANDSCAPING]: 'Ogrodnictwo',
  [JobCategory.DEMOLITION]: 'Rozbiórki',
  [JobCategory.OTHER]: 'Inne'
};

export const JOB_TYPES = {
  [JobType.FULL_TIME]: 'Pełny etat',
  [JobType.PART_TIME]: 'Część etatu',
  [JobType.CONTRACT]: 'Kontrakt',
  [JobType.TEMPORARY]: 'Tymczasowa',
  [JobType.INTERNSHIP]: 'Staż',
  [JobType.FREELANCE]: 'Freelance'
};

export const EXPERIENCE_LEVELS = {
  [ExperienceLevel.JUNIOR]: 'Początkujący (0-2 lata)',
  [ExperienceLevel.MID]: 'Średniozaawansowany (2-5 lat)',
  [ExperienceLevel.SENIOR]: 'Doświadczony (5+ lat)',
  [ExperienceLevel.EXPERT]: 'Ekspert (10+ lat)'
};

export const APPLICATION_STATUSES = {
  [ApplicationStatus.PENDING]: 'Oczekująca',
  [ApplicationStatus.REVIEWED]: 'Przejrzana',
  [ApplicationStatus.ACCEPTED]: 'Zaakceptowana',
  [ApplicationStatus.REJECTED]: 'Odrzucona',
  [ApplicationStatus.WITHDRAWN]: 'Wycofana'
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
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'SUPERADMIN' | 'BOSS' | 'WORKER';
  isEmailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  nip?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LEFT';
  invitedAt: string;
  joinedAt?: string;
  leftAt?: string;
  position?: string;
  canEdit: boolean;
  canView: boolean;
  canManageFinance: boolean;
  user: User;
  company: Company;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User>;
  loading: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Extended Company interface with relations and permissions
export interface CompanyWithDetails extends Company {
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  workers: WorkerWithUser[];
  _count: {
    workers: number;
  };
  userRole: 'OWNER' | 'WORKER';
  userPermissions: {
    canEdit: boolean;
    canView: boolean;
    canManageFinance: boolean;
  };
}

export interface WorkerWithUser extends Omit<Worker, 'user' | 'company'> {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
}

// Company forms
export interface CreateCompanyRequest {
  name: string;
  nip?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
}

export type UpdateCompanyRequest = CreateCompanyRequest;

export interface InviteWorkerRequest {
  email: string;
  position?: string;
  canEdit?: boolean;
  canView?: boolean;
  canManageFinance?: boolean;
}

export interface UpdateWorkerRequest {
  position?: string;
  canEdit?: boolean;
  canView?: boolean;
  canManageFinance?: boolean;
  status?: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LEFT';
}

// Dashboard types
export interface DashboardStats {
  companies: {
    total: number;
    asOwner: number;
    asWorker: number;
  };
  pendingInvitations: number;
}

export interface RecentActivity {
  recentCompanies: CompanyWithDetails[];
  recentInvitations: WorkerInvitation[];
}

export interface WorkerInvitation {
  id: string;
  status: 'INVITED';
  invitedAt: string;
  position?: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    description?: string;
    createdBy: {
      firstName?: string;
      lastName?: string;
      email: string;
    };
  };
}

export interface CompanyStats {
  workers: {
    total: number;
    active: number;
    invited: number;
    inactive: number;
  };
}

// User search types
export interface UserSearchResult {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isInCompany?: boolean;
  companyStatus?: 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LEFT' | null;
}

// Bulk invite types
export interface BulkInviteRequest {
  invitations: InviteWorkerRequest[];
}

export interface BulkInviteResponse {
  success: WorkerWithUser[];
  errors: Array<{
    email: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'SUPERADMIN' | 'BOSS' | 'WORKER';
  isEmailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// Project and Task types - ETAP 5
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  budget?: number;
  location?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  createdById: string;
}

export interface ProjectWithDetails extends Project {
  company: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
  tasks: TaskWithDetails[];
  stats: {
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    reviewTasks: number;
    doneTasks: number;
    totalEstimatedHours: number;
    totalActualHours: number;
  };
}

export interface ProjectWithStats extends Project {
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
  tasks: Array<{
    id: string;
    status: TaskStatus;
    priority: Priority;
  }>;
  stats: {
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    doneTasks: number;
    highPriorityTasks: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  assignedToId?: string;
  createdById: string;
}

export interface TaskWithDetails extends Task {
  project: {
    id: string;
    name: string;
    company: {
      id: string;
      name: string;
    };
  };
  assignedTo?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatar?: string;
  };
}

// Project forms
export interface CreateProjectRequest {
  name: string;
  description?: string;
  companyId: string;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  budget?: number;
  location?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  budget?: number;
  location?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

// Task forms
export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  priority?: Priority;
  assignedToId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignedToId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

// Project stats
export interface ProjectStats {
  totalTasks: number;
  tasksByStatus: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
    CANCELLED: number;
  };
  tasksByPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  hours: {
    totalEstimated: number;
    totalActual: number;
  };
  overdueTasks: number;
  completionRate: number;
}

// Kanban board types
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskWithDetails[];
  color: string;
}

// Filter types
export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: Priority;
  search?: string;
}

export interface TaskFilters {
  projectId?: string;
  companyId?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignedToId?: string;
  search?: string;
} 
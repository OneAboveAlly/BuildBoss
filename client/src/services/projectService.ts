import axios from 'axios';
import type {
  Project,
  ProjectWithDetails,
  ProjectWithStats,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStats,
  ProjectFilters
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const projectService = {
  // Get projects list with filters
  async getProjects(filters?: ProjectFilters & { companyId?: string }): Promise<ProjectWithStats[]> {
    const params = new URLSearchParams();
    
    if (filters?.companyId) params.append('companyId', filters.companyId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(
      `${API_BASE_URL}/projects?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Get project details
  async getProject(projectId: string): Promise<ProjectWithDetails> {
    const response = await axios.get(
      `${API_BASE_URL}/projects/${projectId}`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Create new project
  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const response = await axios.post(
      `${API_BASE_URL}/projects`,
      projectData,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Update project
  async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<Project> {
    const response = await axios.put(
      `${API_BASE_URL}/projects/${projectId}`,
      projectData,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Delete project
  async deleteProject(projectId: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/projects/${projectId}`,
      { headers: createAuthHeaders() }
    );
  },

  // Get project statistics
  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const response = await axios.get(
      `${API_BASE_URL}/projects/${projectId}/stats`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  }
}; 
import axios from 'axios';
import type {
  Task,
  TaskWithDetails,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskStatus
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const taskService = {
  // Get tasks list with filters
  async getTasks(filters?: TaskFilters): Promise<TaskWithDetails[]> {
    const params = new URLSearchParams();
    
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.companyId) params.append('companyId', filters.companyId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(
      `${API_BASE_URL}/tasks?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Get task details
  async getTask(taskId: string): Promise<TaskWithDetails> {
    const response = await axios.get(
      `${API_BASE_URL}/tasks/${taskId}`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Create new task
  async createTask(taskData: CreateTaskRequest): Promise<TaskWithDetails> {
    const response = await axios.post(
      `${API_BASE_URL}/tasks`,
      taskData,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Update task
  async updateTask(taskId: string, taskData: UpdateTaskRequest): Promise<TaskWithDetails> {
    const response = await axios.put(
      `${API_BASE_URL}/tasks/${taskId}`,
      taskData,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/tasks/${taskId}`,
      { headers: createAuthHeaders() }
    );
  },

  // Update task status (quick action)
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<TaskWithDetails> {
    const response = await axios.patch(
      `${API_BASE_URL}/tasks/${taskId}/status`,
      { status },
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Get my tasks (assigned to current user)
  async getMyTasks(filters?: { status?: TaskStatus; priority?: string }): Promise<TaskWithDetails[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await axios.get(
      `${API_BASE_URL}/tasks/my?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  }
}; 
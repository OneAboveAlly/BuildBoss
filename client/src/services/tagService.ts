import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to create auth headers
const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Types
export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  usage?: number;
  usageDetails?: {
    projects: number;
    tasks: number;
    materials: number;
  };
}

export interface TaggedObject {
  id: string;
  type: 'project' | 'task' | 'material';
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
  url: string;
}

export interface TagObjectsResponse {
  tag: Tag;
  objects: {
    projects: TaggedObject[];
    tasks: TaggedObject[];
    materials: TaggedObject[];
  };
  total: number;
}

export interface CreateTagData {
  name: string;
  color?: string;
  description?: string;
  companyId: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
  description?: string;
}

export interface AssignTagsData {
  tagIds: string[];
  objectType: 'project' | 'task' | 'material';
  objectId: string;
  companyId: string;
}

export const tagService = {
  // Pobierz tagi firmy
  async getTags(companyId: string): Promise<Tag[]> {
    const params = new URLSearchParams();
    params.append('companyId', companyId);

    const response = await axios.get(
      `${API_BASE_URL}/tags?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data.tags;
  },

  // Utwórz nowy tag
  async createTag(data: CreateTagData): Promise<Tag> {
    const response = await axios.post(
      `${API_BASE_URL}/tags`,
      data,
      { headers: createAuthHeaders() }
    );
    return response.data.tag;
  },

  // Aktualizuj tag
  async updateTag(id: string, data: UpdateTagData): Promise<Tag> {
    const response = await axios.put(
      `${API_BASE_URL}/tags/${id}`,
      data,
      { headers: createAuthHeaders() }
    );
    return response.data.tag;
  },

  // Usuń tag
  async deleteTag(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/tags/${id}`,
      { headers: createAuthHeaders() }
    );
  },

  // Przypisz tagi do obiektu
  async assignTags(data: AssignTagsData): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/tags/assign`,
      data,
      { headers: createAuthHeaders() }
    );
    return response.data.object;
  },

  // Usuń tagi z obiektu
  async removeTags(data: AssignTagsData): Promise<any> {
    const response = await axios.delete(
      `${API_BASE_URL}/tags/assign`,
      {
        headers: createAuthHeaders(),
        data
      }
    );
    return response.data.object;
  },

  // Pobierz obiekty przypisane do tagu
  async getTagObjects(id: string, limit = 50): Promise<TagObjectsResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await axios.get(
      `${API_BASE_URL}/tags/${id}/objects?${params.toString()}`,
      { headers: createAuthHeaders() }
    );
    return response.data;
  },

  // Pomocnicze funkcje
  getTagColor(color: string): string {
    // Mapowanie kolorów na klasy Tailwind
    const colorMap: Record<string, string> = {
      '#3B82F6': 'bg-blue-500',
      '#EF4444': 'bg-red-500',
      '#10B981': 'bg-green-500',
      '#F59E0B': 'bg-yellow-500',
      '#8B5CF6': 'bg-purple-500',
      '#EC4899': 'bg-pink-500',
      '#6B7280': 'bg-gray-500',
      '#F97316': 'bg-orange-500',
      '#06B6D4': 'bg-cyan-500',
      '#84CC16': 'bg-lime-500'
    };
    return colorMap[color] || 'bg-blue-500';
  },

  getTagTextColor(color: string): string {
    // Wszystkie kolory mają białe teksty
    return 'text-white';
  },

  // Predefined colors for tag creation
  getAvailableColors(): Array<{ value: string; name: string; class: string }> {
    return [
      { value: '#3B82F6', name: 'Niebieski', class: 'bg-blue-500' },
      { value: '#EF4444', name: 'Czerwony', class: 'bg-red-500' },
      { value: '#10B981', name: 'Zielony', class: 'bg-green-500' },
      { value: '#F59E0B', name: 'Żółty', class: 'bg-yellow-500' },
      { value: '#8B5CF6', name: 'Fioletowy', class: 'bg-purple-500' },
      { value: '#EC4899', name: 'Różowy', class: 'bg-pink-500' },
      { value: '#6B7280', name: 'Szary', class: 'bg-gray-500' },
      { value: '#F97316', name: 'Pomarańczowy', class: 'bg-orange-500' },
      { value: '#06B6D4', name: 'Cyjan', class: 'bg-cyan-500' },
      { value: '#84CC16', name: 'Limonkowy', class: 'bg-lime-500' }
    ];
  },

  // Format tag for display
  formatTag(tag: Tag): string {
    return tag.name;
  },

  // Get tag usage summary
  getUsageSummary(tag: Tag): string {
    if (!tag.usageDetails) return 'Nieużywany';
    
    const { projects, tasks, materials } = tag.usageDetails;
    const parts = [];
    
    if (projects > 0) parts.push(`${projects} projekt${projects === 1 ? '' : projects < 5 ? 'y' : 'ów'}`);
    if (tasks > 0) parts.push(`${tasks} zadani${tasks === 1 ? 'e' : tasks < 5 ? 'a' : ''}`);
    if (materials > 0) parts.push(`${materials} materiał${materials === 1 ? '' : materials < 5 ? 'y' : 'ów'}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Nieużywany';
  }
}; 
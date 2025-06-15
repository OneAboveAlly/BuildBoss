import React, { useState, useEffect } from 'react';
import type { ProjectWithDetails, CreateProjectRequest, UpdateProjectRequest, ProjectStatus, Priority } from '../../types';
import { Button } from '../ui/Button';
import { projectService } from '../../services/projectService';

interface ProjectFormProps {
  project?: ProjectWithDetails;
  onSubmit: (project: ProjectWithDetails) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING' as ProjectStatus,
    priority: 'MEDIUM' as Priority,
    startDate: '',
    endDate: '',
    deadline: '',
    budget: '',
    location: '',
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
        budget: project.budget?.toString() || '',
        location: project.location || '',
        clientName: project.clientName || '',
        clientEmail: project.clientEmail || '',
        clientPhone: project.clientPhone || ''
      });
    }
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        deadline: formData.deadline || undefined
      };

      let result: ProjectWithDetails;
      
      if (project) {
        // Update existing project
        result = await projectService.updateProject(project.id, submitData as UpdateProjectRequest);
      } else {
        // Create new project - this would need companyId from context
        result = await projectService.createProject({
          ...submitData,
          companyId: 'current-company-id' // This should come from context
        } as CreateProjectRequest);
      }

      onSubmit(result);
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Nie udało się zapisać projektu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-secondary-900">Podstawowe informacje</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
            Nazwa projektu *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Wprowadź nazwę projektu"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-1">
            Opis projektu
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Opisz projekt..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-secondary-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="PLANNING">Planowanie</option>
              <option value="ACTIVE">Aktywny</option>
              <option value="ON_HOLD">Wstrzymany</option>
              <option value="COMPLETED">Ukończony</option>
              <option value="CANCELLED">Anulowany</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-secondary-700 mb-1">
              Priorytet
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="LOW">Niski</option>
              <option value="MEDIUM">Średni</option>
              <option value="HIGH">Wysoki</option>
              <option value="URGENT">Pilny</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dates and Budget */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-secondary-900">Terminy i budżet</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-secondary-700 mb-1">
              Data rozpoczęcia
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-secondary-700 mb-1">
              Data zakończenia
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-secondary-700 mb-1">
              Termin ostateczny
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-secondary-700 mb-1">
              Budżet (zł)
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-secondary-700 mb-1">
              Lokalizacja
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Adres lub lokalizacja projektu"
            />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-secondary-900">Informacje o kliencie</h3>
        
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-secondary-700 mb-1">
            Nazwa klienta
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Nazwa firmy lub imię i nazwisko"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clientEmail" className="block text-sm font-medium text-secondary-700 mb-1">
              Email klienta
            </label>
            <input
              type="email"
              id="clientEmail"
              name="clientEmail"
              value={formData.clientEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="clientPhone" className="block text-sm font-medium text-secondary-700 mb-1">
              Telefon klienta
            </label>
            <input
              type="tel"
              id="clientPhone"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+48 123 456 789"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-secondary-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? 'Zapisywanie...' : project ? 'Zaktualizuj projekt' : 'Utwórz projekt'}
        </Button>
      </div>
    </form>
  );
}; 
import React, { useState, useEffect } from 'react';
import type { TaskWithDetails, CreateTaskRequest, UpdateTaskRequest, TaskStatus, Priority } from '../../types';
import { Button } from '../ui/Button';
import { taskService } from '../../services/taskService';

interface TaskFormProps {
  task?: TaskWithDetails;
  projectId: string;
  onSubmit: (task: TaskWithDetails) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  projectId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as Priority,
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    assignedToId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours?.toString() || '',
        actualHours: task.actualHours?.toString() || '',
        assignedToId: task.assignedToId || ''
      });
    }
  }, [task]);

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
        projectId,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        actualHours: formData.actualHours ? parseFloat(formData.actualHours) : undefined,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
        assignedToId: formData.assignedToId || undefined
      };

      let result: TaskWithDetails;
      
      if (task) {
        // Update existing task
        result = await taskService.updateTask(task.id, submitData as UpdateTaskRequest);
      } else {
        // Create new task
        result = await taskService.createTask(submitData as CreateTaskRequest);
      }

      onSubmit(result);
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Nie udało się zapisać zadania');
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
          <label htmlFor="title" className="block text-sm font-medium text-secondary-700 mb-1">
            Tytuł zadania *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Wprowadź tytuł zadania"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-1">
            Opis zadania
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Opisz zadanie..."
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
              <option value="TODO">Do zrobienia</option>
              <option value="IN_PROGRESS">W trakcie</option>
              <option value="REVIEW">Do sprawdzenia</option>
              <option value="DONE">Ukończone</option>
              <option value="CANCELLED">Anulowane</option>
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

      {/* Dates and Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-secondary-900">Terminy i czas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label htmlFor="dueDate" className="block text-sm font-medium text-secondary-700 mb-1">
              Termin wykonania
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-secondary-700 mb-1">
              Szacowany czas (godziny)
            </label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="actualHours" className="block text-sm font-medium text-secondary-700 mb-1">
              Rzeczywisty czas (godziny)
            </label>
            <input
              type="number"
              id="actualHours"
              name="actualHours"
              value={formData.actualHours}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-secondary-900">Przypisanie</h3>
        
        <div>
          <label htmlFor="assignedToId" className="block text-sm font-medium text-secondary-700 mb-1">
            Przypisz do użytkownika
          </label>
          <select
            id="assignedToId"
            name="assignedToId"
            value={formData.assignedToId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Nie przypisane</option>
            {/* TODO: Load company workers here */}
            <option value="current-user">Ja</option>
          </select>
          <p className="text-xs text-secondary-500 mt-1">
            Lista pracowników zostanie załadowana z API
          </p>
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
          disabled={loading || !formData.title.trim()}
        >
          {loading ? 'Zapisywanie...' : task ? 'Zaktualizuj zadanie' : 'Utwórz zadanie'}
        </Button>
      </div>
    </form>
  );
}; 
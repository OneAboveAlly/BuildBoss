import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { companyService } from '../services/companyService';
import { TasksList } from '../components/tasks/TasksList';
import { TaskForm } from '../components/tasks/TaskForm';
import { KanbanBoard } from '../components/projects/KanbanBoard';
import { Button } from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import type { TaskWithDetails, CompanyWithDetails, TaskFilters, TaskStatus, Priority } from '../types';
import { toast } from 'react-hot-toast';
import {
  ViewColumnsIcon,
  ListBulletIcon,
  PlusIcon,
  FunnelIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View settings
  const [viewType, setViewType] = useState<'list' | 'kanban'>('list');
  
  // Filters
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  
  // Modals
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedCompany, statusFilter, priorityFilter, searchQuery, assignedToMe]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData] = await Promise.all([
        companyService.getCompanies()
      ]);
      
      setCompanies(companiesData);
      
      // Load tasks after companies are loaded
      await loadTasks();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setError(null);
      
      const filters: TaskFilters = {};
      
      if (selectedCompany) filters.companyId = selectedCompany;
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (searchQuery) filters.search = searchQuery;
      if (assignedToMe && user) filters.assignedToId = user.id;
      
      const data = await taskService.getTasks(filters);
      setTasks(data);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      if (err.response?.status === 403) {
        setError('Brak dostępu do zadań. Sprawdź swoje uprawnienia.');
      } else {
        setError('Błąd podczas ładowania zadań');
      }
      setTasks([]);
    }
  };

  const handleTaskCreate = async (newTask: TaskWithDetails) => {
    setTasks(prev => [newTask, ...prev]);
    setShowTaskForm(false);
    toast.success('Zadanie zostało utworzone');
  };

  const handleTaskUpdate = async (updatedTask: TaskWithDetails) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    setEditingTask(null);
    toast.success('Zadanie zostało zaktualizowane');
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Zadanie zostało usunięte');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Błąd podczas usuwania zadania');
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updatedTask = await taskService.updateTaskStatus(taskId, newStatus as TaskStatus);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      toast.success('Status zadania został zmieniony');
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Błąd podczas zmiany statusu zadania');
    }
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);
  const canCreateTasks = selectedCompanyData?.userPermissions?.canEdit || false;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Zadania', href: '/tasks' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Ładowanie zadań...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Zadania</h1>
              <p className="text-secondary-600 mt-1">
                Zarządzaj wszystkimi zadaniami w projektach
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewType('list')}
                  className={`p-2 rounded-lg ${
                    viewType === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-secondary-400 hover:text-secondary-600'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewType('kanban')}
                  className={`p-2 rounded-lg ${
                    viewType === 'kanban'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-secondary-400 hover:text-secondary-600'
                  }`}
                >
                  <ViewColumnsIcon className="h-5 w-5" />
                </button>
              </div>
              
              {canCreateTasks && selectedCompany && (
                <Button onClick={() => setShowTaskForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nowe zadanie
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Firma
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Wszystkie firmy</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Wszystkie</option>
                <option value="TODO">Do zrobienia</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="REVIEW">Do sprawdzenia</option>
                <option value="DONE">Ukończone</option>
                <option value="CANCELLED">Anulowane</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Priorytet
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Wszystkie</option>
                <option value="URGENT">Pilne</option>
                <option value="HIGH">Wysokie</option>
                <option value="MEDIUM">Średnie</option>
                <option value="LOW">Niskie</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Wyszukaj
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nazwa lub opis zadania..."
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Assigned to me */}
            <div className="flex items-end">
              <label className="flex items-center h-10">
                <input
                  type="checkbox"
                  checked={assignedToMe}
                  onChange={(e) => setAssignedToMe(e.target.checked)}
                  className="mr-2 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Przypisane do mnie</span>
              </label>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tasks Content */}
        {viewType === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onStatusChange={handleTaskStatusChange}
            canEdit={true}
          />
        ) : (
          <TasksList
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onEditTask={setEditingTask}
            canEdit={true}
          />
        )}

        {/* Empty State */}
        {!loading && tasks.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-12 text-center">
            <ClipboardDocumentListIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">Brak zadań</h3>
            <p className="text-secondary-600 mb-4">
              {selectedCompany 
                ? 'Nie znaleziono zadań spełniających kryteria filtrowania'
                : 'Wybierz firmę aby zobaczyć zadania lub utwórz nowe zadanie'
              }
            </p>
            {canCreateTasks && selectedCompany && (
              <Button onClick={() => setShowTaskForm(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Utwórz pierwsze zadanie
              </Button>
            )}
          </div>
        )}

        {/* Modals */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">Nowe zadanie</h2>
                <TaskForm
                  companyId={selectedCompany}
                  onSubmit={handleTaskCreate}
                  onCancel={() => setShowTaskForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-secondary-900 mb-6">Edytuj zadanie</h2>
                <TaskForm
                  task={editingTask}
                  projectId={editingTask.project?.id}
                  companyId={selectedCompany}
                  onSubmit={handleTaskUpdate}
                  onCancel={() => setEditingTask(null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
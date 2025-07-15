import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import type { ProjectWithDetails, TaskWithDetails, TaskStatus } from '../types';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { KanbanBoard } from '../components/projects/KanbanBoard';
import { TasksList } from '../components/tasks/TasksList';
import { ProjectForm } from '../components/projects/ProjectForm';
import { TaskForm } from '../components/tasks/TaskForm';
import { 
  CalendarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  MapPinIcon,
  UserGroupIcon,
  ChartBarIcon,
  PencilIcon,
  PlusIcon,
  ViewColumnsIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

type TabType = 'overview' | 'tasks' | 'settings';
type TaskViewType = 'kanban' | 'list';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'overview'
  );
  const [taskViewType, setTaskViewType] = useState<TaskViewType>('kanban');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        projectService.getProject(id),
        taskService.getTasks({ projectId: id })
      ]);
      
      setProject(projectData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Nie udało się załadować projektu');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUpdate = async (updatedProject: ProjectWithDetails) => {
    setProject(updatedProject);
    setShowProjectForm(false);
  };

  const handleProjectUpdateFromSettings = async (updatedProject: ProjectWithDetails) => {
    setProject(updatedProject);
    setActiveTab('overview');
  };

  const handleTaskCreate = async (newTask: TaskWithDetails) => {
    setTasks(prev => [...prev, newTask]);
    setShowTaskForm(false);
  };

  const handleTaskUpdate = async (updatedTask: TaskWithDetails) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setEditingTask(null);
  };

  const handleTaskDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus as TaskStatus);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus as TaskStatus } : task
      ));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-gray-100 text-gray-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = project && user && (
    user.role === 'SUPERADMIN' || 
    project.createdById === user.id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Projekt nie został znaleziony'}</p>
        <Button onClick={() => navigate('/projects')}>
          Powrót do projektów
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projekty', href: '/projects' },
    { label: project.name, href: `/projects/${project.id}` }
  ];

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: ChartBarIcon },
    { id: 'tasks', label: 'Zadania', icon: ListBulletIcon },
    { id: 'settings', label: 'Ustawienia', icon: PencilIcon }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-secondary-900">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority}
              </Badge>
            </div>
            
            {project.description && (
              <p className="text-secondary-600 mb-4">{project.description}</p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {project.clientName && (
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">Klient:</span>
                  <span className="font-medium">{project.clientName}</span>
                </div>
              )}
              
              {project.location && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">Lokalizacja:</span>
                  <span className="font-medium">{project.location}</span>
                </div>
              )}
              
              {project.budget && (
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">Budżet:</span>
                  <span className="font-medium">{project.budget.toLocaleString()} zł</span>
                </div>
              )}
              
              {project.deadline && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-secondary-400" />
                  <span className="text-secondary-600">Termin:</span>
                  <span className="font-medium">
                    {new Date(project.deadline).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {canEdit && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProjectForm(true)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edytuj
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Statystyki projektu</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{tasks.length}</div>
                  <div className="text-sm text-secondary-600">Wszystkie zadania</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {tasks.filter(t => t.status === 'DONE').length}
                  </div>
                  <div className="text-sm text-secondary-600">Ukończone</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                  </div>
                  <div className="text-sm text-secondary-600">W trakcie</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {tasks.filter(t => t.priority === 'URGENT').length}
                  </div>
                  <div className="text-sm text-secondary-600">Pilne</div>
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">Ostatnie zadania</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('tasks')}
                >
                  Zobacz wszystkie
                </Button>
              </div>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-secondary-900">{task.title}</h4>
                      <p className="text-sm text-secondary-600">{task.description}</p>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-secondary-500 text-center py-4">Brak zadań w projekcie</p>
                )}
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Informacje o projekcie</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-secondary-600">Data utworzenia:</span>
                  <p className="font-medium">{new Date(project.createdAt).toLocaleDateString('pl-PL')}</p>
                </div>
                {project.startDate && (
                  <div>
                    <span className="text-sm text-secondary-600">Data rozpoczęcia:</span>
                    <p className="font-medium">{new Date(project.startDate).toLocaleDateString('pl-PL')}</p>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <span className="text-sm text-secondary-600">Data zakończenia:</span>
                    <p className="font-medium">{new Date(project.endDate).toLocaleDateString('pl-PL')}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-secondary-600">Utworzony przez:</span>
                  <p className="font-medium">{project.createdBy?.firstName ? `${project.createdBy.firstName} ${project.createdBy.lastName || ''}`.trim() : project.createdBy?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Tasks Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-secondary-900">Zadania projektu</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTaskViewType('kanban')}
                  className={`p-2 rounded-lg ${
                    taskViewType === 'kanban'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-secondary-400 hover:text-secondary-600'
                  }`}
                >
                  <ViewColumnsIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setTaskViewType('list')}
                  className={`p-2 rounded-lg ${
                    taskViewType === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-secondary-400 hover:text-secondary-600'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {canEdit && (
              <Button onClick={() => setShowTaskForm(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nowe zadanie
              </Button>
            )}
          </div>

          {/* Tasks Content */}
          {taskViewType === 'kanban' ? (
            <KanbanBoard
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onStatusChange={handleTaskStatusChange}
              canEdit={canEdit || false}
            />
          ) : (
            <TasksList
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onEditTask={setEditingTask}
              canEdit={canEdit || false}
            />
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          {canEdit ? (
            <>
              <h2 className="text-xl font-semibold text-secondary-900 mb-6">Ustawienia projektu</h2>
              <ProjectForm
                project={project}
                onSubmit={handleProjectUpdateFromSettings}
                onCancel={() => setActiveTab('overview')}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                <PencilIcon className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">Brak uprawnień</h3>
              <p className="text-secondary-600">
                Nie masz uprawnień do edycji tego projektu. Skontaktuj się z właścicielem projektu.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-6">Edytuj projekt</h2>
              <ProjectForm
                project={project}
                onSubmit={handleProjectUpdate}
                onCancel={() => setShowProjectForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-6">Nowe zadanie</h2>
              <TaskForm
                projectId={project?.id}
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
                projectId={project?.id}
                onSubmit={handleTaskUpdate}
                onCancel={() => setEditingTask(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage; 
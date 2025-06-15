import React, { useState } from 'react';
import type { TaskWithDetails, TaskStatus, Priority } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface TasksListProps {
  tasks: TaskWithDetails[];
  onTaskUpdate: (task: TaskWithDetails) => void;
  onTaskDelete: (taskId: string) => void;
  onEditTask: (task: TaskWithDetails) => void;
  canEdit: boolean;
}

export const TasksList: React.FC<TasksListProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onEditTask,
  canEdit
}) => {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'created'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityOrder = (priority: Priority) => {
    switch (priority) {
      case 'URGENT': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  };

  const filteredAndSortedTasks = tasks
    .filter(task => statusFilter === 'ALL' || task.status === statusFilter)
    .filter(task => priorityFilter === 'ALL' || task.priority === priorityFilter)
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
        case 'priority':
          comparison = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      onTaskDelete(taskId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-secondary-400" />
            <span className="text-sm font-medium text-secondary-700">Filtry:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
              className="text-sm border border-secondary-300 rounded-md px-2 py-1"
            >
              <option value="ALL">Wszystkie</option>
              <option value="TODO">Do zrobienia</option>
              <option value="IN_PROGRESS">W trakcie</option>
              <option value="REVIEW">Do sprawdzenia</option>
              <option value="DONE">Ukończone</option>
              <option value="CANCELLED">Anulowane</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600">Priorytet:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
              className="text-sm border border-secondary-300 rounded-md px-2 py-1"
            >
              <option value="ALL">Wszystkie</option>
              <option value="URGENT">Pilne</option>
              <option value="HIGH">Wysokie</option>
              <option value="MEDIUM">Średnie</option>
              <option value="LOW">Niskie</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600">Sortuj:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-secondary-300 rounded-md px-2 py-1"
            >
              <option value="dueDate">Termin</option>
              <option value="priority">Priorytet</option>
              <option value="status">Status</option>
              <option value="created">Data utworzenia</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="p-8 text-center text-secondary-500">
            <p>Brak zadań spełniających kryteria filtrowania</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {filteredAndSortedTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-secondary-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-secondary-900 truncate">
                        {task.title}
                      </h3>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-secondary-500">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          <span>
                            {task.assignedTo.firstName 
                              ? `${task.assignedTo.firstName} ${task.assignedTo.lastName || ''}`.trim()
                              : task.assignedTo.email
                            }
                          </span>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${
                          new Date(task.dueDate) < new Date() 
                            ? 'text-red-600 font-medium' 
                            : ''
                        }`}>
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            Termin: {new Date(task.dueDate).toLocaleDateString('pl-PL')}
                          </span>
                        </div>
                      )}
                      
                      {task.estimatedHours && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>
                            {task.estimatedHours}h
                            {task.actualHours && ` / ${task.actualHours}h`}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        Utworzono: {new Date(task.createdAt).toLocaleDateString('pl-PL')}
                      </div>
                    </div>
                  </div>
                  
                  {canEdit && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTask(task)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 
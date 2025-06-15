import React from 'react';
import { Link } from 'react-router-dom';
import type { TaskWithDetails, TaskStatus, Priority } from '../../types';

interface TaskCardProps {
  task: TaskWithDetails;
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (task: TaskWithDetails) => void;
  onStatusChange?: (task: TaskWithDetails, status: TaskStatus) => void;
  canEdit?: boolean;
  showProject?: boolean;
  compact?: boolean;
}

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'Do zrobienia',
  IN_PROGRESS: 'W toku',
  REVIEW: 'Do sprawdzenia',
  DONE: 'Gotowe',
  CANCELLED: 'Anulowane'
};

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Niski',
  MEDIUM: 'Średni',
  HIGH: 'Wysoki',
  URGENT: 'Pilny'
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit = false,
  showProject = true,
  compact = false
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
    const statusFlow: Record<TaskStatus, TaskStatus | null> = {
      TODO: 'IN_PROGRESS',
      IN_PROGRESS: 'REVIEW',
      REVIEW: 'DONE',
      DONE: null,
      CANCELLED: null
    };
    return statusFlow[currentStatus];
  };

  const nextStatus = getNextStatus(task.status);

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
            {task.title}
          </h3>
          {canEdit && (
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => onEdit?.(task)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edytuj zadanie"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Priority and Status */}
        <div className="flex items-center space-x-2 mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Przeterminowane
            </span>
          )}
        </div>

        {/* Assigned to */}
        {task.assignedTo && (
          <div className="flex items-center space-x-2 mb-2">
            {task.assignedTo.avatar ? (
              <img 
                src={task.assignedTo.avatar} 
                alt={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {task.assignedTo.firstName?.[0] || task.assignedTo.email[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-600">
              {task.assignedTo.firstName && task.assignedTo.lastName 
                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                : task.assignedTo.email
              }
            </span>
          </div>
        )}

        {/* Due date */}
        {task.dueDate && (
          <div className="text-xs text-gray-500 mb-2">
            Termin: {formatDate(task.dueDate)}
          </div>
        )}

        {/* Quick status change */}
        {nextStatus && canEdit && (
          <button
            onClick={() => onStatusChange?.(task, nextStatus)}
            className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
          >
            → {statusLabels[nextStatus]}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : ''}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-3">
                {task.description}
              </p>
            )}
          </div>
          
          {canEdit && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onEdit?.(task)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edytuj zadanie"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete?.(task)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Usuń zadanie"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Status and Priority */}
        <div className="flex items-center space-x-3 mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Przeterminowane
            </span>
          )}
        </div>

        {/* Project info */}
        {showProject && (
          <div className="mb-4">
            <Link 
              to={`/projects/${task.project.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {task.project.name} • {task.project.company.name}
            </Link>
          </div>
        )}

        {/* Task details */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          {task.dueDate && (
            <div>
              <span className="text-gray-500">Termin:</span>
              <span className={`ml-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          )}
          {task.estimatedHours && (
            <div>
              <span className="text-gray-500">Szacowany czas:</span>
              <span className="ml-2 text-gray-900">{task.estimatedHours}h</span>
            </div>
          )}
          {task.actualHours && (
            <div>
              <span className="text-gray-500">Rzeczywisty czas:</span>
              <span className="ml-2 text-gray-900">{task.actualHours}h</span>
            </div>
          )}
        </div>

        {/* Assigned to */}
        {task.assignedTo && (
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-sm text-gray-500">Przypisane do:</span>
            <div className="flex items-center space-x-2">
              {task.assignedTo.avatar ? (
                <img 
                  src={task.assignedTo.avatar} 
                  alt={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-600">
                    {task.assignedTo.firstName?.[0] || task.assignedTo.email[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-900">
                {task.assignedTo.firstName && task.assignedTo.lastName 
                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                  : task.assignedTo.email
                }
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {nextStatus && canEdit && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Następny krok:</span>
            <button
              onClick={() => onStatusChange?.(task, nextStatus)}
              className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm transition-colors"
            >
              → {statusLabels[nextStatus]}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {task.createdBy.avatar ? (
              <img 
                src={task.createdBy.avatar} 
                alt={`${task.createdBy.firstName} ${task.createdBy.lastName}`}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {task.createdBy.firstName?.[0] || task.createdBy.email[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs text-gray-600">
              Utworzone przez {task.createdBy.firstName && task.createdBy.lastName 
                ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                : task.createdBy.email
              }
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(task.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}; 
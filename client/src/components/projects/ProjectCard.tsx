import React from 'react';
import { Link } from 'react-router-dom';
import type { ProjectWithStats, ProjectStatus, Priority } from '../../types';

interface ProjectCardProps {
  project: ProjectWithStats;
  onEdit?: (project: ProjectWithStats) => void;
  onDelete?: (project: ProjectWithStats) => void;
  canEdit?: boolean;
}

const statusColors: Record<ProjectStatus, string> = {
  PLANNING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planowanie',
  ACTIVE: 'Aktywny',
  ON_HOLD: 'Wstrzymany',
  COMPLETED: 'Ukończony',
  CANCELLED: 'Anulowany'
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

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  canEdit = false
}) => {
  const completionRate = project.stats.totalTasks > 0 
    ? Math.round((project.stats.doneTasks / project.stats.totalTasks) * 100)
    : 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link 
              to={`/projects/${project.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {project.name}
            </Link>
            {project.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          
          {canEdit && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onEdit?.(project)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edytuj projekt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete?.(project)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Usuń projekt"
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[project.priority]}`}>
            {priorityLabels[project.priority]}
          </span>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          {project.clientName && (
            <div>
              <span className="text-gray-500">Klient:</span>
              <span className="ml-2 text-gray-900">{project.clientName}</span>
            </div>
          )}
          {project.location && (
            <div>
              <span className="text-gray-500">Lokalizacja:</span>
              <span className="ml-2 text-gray-900">{project.location}</span>
            </div>
          )}
          {project.deadline && (
            <div>
              <span className="text-gray-500">Termin:</span>
              <span className="ml-2 text-gray-900">{formatDate(project.deadline)}</span>
            </div>
          )}
          {project.budget && (
            <div>
              <span className="text-gray-500">Budżet:</span>
              <span className="ml-2 text-gray-900">{formatCurrency(project.budget)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Postęp zadań</span>
            <span className="text-gray-900 font-medium">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{project.stats.totalTasks}</div>
            <div className="text-xs text-gray-500">Zadania</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">{project.stats.inProgressTasks}</div>
            <div className="text-xs text-gray-500">W toku</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">{project.stats.doneTasks}</div>
            <div className="text-xs text-gray-500">Gotowe</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">{project.stats.highPriorityTasks}</div>
            <div className="text-xs text-gray-500">Pilne</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {project.createdBy.avatar ? (
              <img 
                src={project.createdBy.avatar} 
                alt={`${project.createdBy.firstName} ${project.createdBy.lastName}`}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {project.createdBy.firstName?.[0] || project.createdBy.email[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">
              {project.createdBy.firstName && project.createdBy.lastName 
                ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
                : project.createdBy.email
              }
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(project.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}; 
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
  PLANNING: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white',
  ACTIVE: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white',
  ON_HOLD: 'bg-gradient-to-r from-orange-400 to-red-400 text-white',
  COMPLETED: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white',
  CANCELLED: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
};

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planowanie',
  ACTIVE: 'Aktywny',
  ON_HOLD: 'Wstrzymany',
  COMPLETED: 'Ukończony',
  CANCELLED: 'Anulowany'
};

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-600 border border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border border-blue-200',
  HIGH: 'bg-orange-50 text-orange-700 border border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border border-red-200'
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
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
      {/* Header gradient */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600"></div>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/projects/${project.id}`}
              className="block text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors duration-200 mb-2 truncate"
            >
              {project.name}
            </Link>
            {project.description && (
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          
          {canEdit && (
            <div className="flex items-center space-x-1 ml-3">
              <button
                onClick={() => onEdit?.(project)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Edytuj projekt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete?.(project)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Usuń projekt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Status and Priority badges */}
        <div className="flex items-center gap-3 mb-5">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityColors[project.priority]}`}>
            {priorityLabels[project.priority]}
          </span>
        </div>

        {/* Project Details */}
        <div className="space-y-3 mb-6">
          {project.clientName && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              <span className="text-slate-500 min-w-0 flex-shrink-0">Klient:</span>
              <span className="ml-2 text-slate-700 font-medium truncate">{project.clientName}</span>
            </div>
          )}
          {project.location && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              <span className="text-slate-500 min-w-0 flex-shrink-0">Lokalizacja:</span>
              <span className="ml-2 text-slate-700 font-medium truncate">{project.location}</span>
            </div>
          )}
          {project.deadline && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-amber-400 rounded-full mr-3"></div>
              <span className="text-slate-500 min-w-0 flex-shrink-0">Termin:</span>
              <span className="ml-2 text-slate-700 font-medium">{formatDate(project.deadline)}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
              <span className="text-slate-500 min-w-0 flex-shrink-0">Budżet:</span>
              <span className="ml-2 text-slate-700 font-medium">{formatCurrency(project.budget)}</span>
            </div>
          )}
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">Postęp zadań</span>
            <span className="text-sm font-bold text-slate-800">{completionRate}%</span>
          </div>
          <div className="relative">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            {completionRate > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-lg font-bold text-slate-700">{project.stats.totalTasks}</div>
            <div className="text-xs text-slate-500 font-medium">Zadania</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-lg font-bold text-blue-600">{project.stats.inProgressTasks}</div>
            <div className="text-xs text-blue-600 font-medium">W toku</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="text-lg font-bold text-green-600">{project.stats.doneTasks}</div>
            <div className="text-xs text-green-600 font-medium">Gotowe</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="text-lg font-bold text-orange-600">{project.stats.highPriorityTasks}</div>
            <div className="text-xs text-orange-600 font-medium">Pilne</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-3">
            {project.createdBy.avatar ? (
              <img 
                src={project.createdBy.avatar} 
                alt={`${project.createdBy.firstName} ${project.createdBy.lastName}`}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs font-semibold text-white">
                  {project.createdBy.firstName?.[0] || project.createdBy.email[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-slate-700">
                {project.createdBy.firstName && project.createdBy.lastName 
                  ? `${project.createdBy.firstName} ${project.createdBy.lastName}`
                  : project.createdBy.email
                }
              </div>
              <div className="text-xs text-slate-500">Właściciel projektu</div>
            </div>
          </div>
          
          <Link 
            to={`/projects/${project.id}`}
            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Zobacz projekt
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}; 
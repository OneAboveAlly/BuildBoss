import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProjectCard } from '../components/projects/ProjectCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { projectService } from '../services/projectService';
import { companyService } from '../services/companyService';
import type { ProjectWithStats, CompanyWithDetails, ProjectFilters, ProjectStatus, Priority } from '../types';

export const ProjectsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedCompany, setSelectedCompany] = useState<string>(searchParams.get('company') || '');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>(searchParams.get('status') as ProjectStatus || '');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>(searchParams.get('priority') as Priority || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadProjects();
    } else {
      setProjects([]);
    }
  }, [selectedCompany, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (selectedCompany) params.set('company', selectedCompany);
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (searchQuery) params.set('search', searchQuery);
    
    setSearchParams(params);
  }, [selectedCompany, statusFilter, priorityFilter, searchQuery, setSearchParams]);

  const loadCompanies = async () => {
    try {
      const data = await companyService.getCompanies();
      setCompanies(data);
      
      // Auto-select first company if none selected
      if (!selectedCompany && data.length > 0) {
        setSelectedCompany(data[0].id);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Błąd podczas ładowania firm');
    }
  };

  const loadProjects = async () => {
    if (!selectedCompany) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filters: ProjectFilters = {};
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (searchQuery) filters.search = searchQuery;
      
      const data = await projectService.getProjects(selectedCompany, filters);
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Błąd podczas ładowania projektów');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    if (!selectedCompany) {
      setError('Wybierz firmę aby utworzyć projekt');
      return;
    }
    navigate(`/projects/new?company=${selectedCompany}`);
  };

  const handleEditProject = (project: ProjectWithStats) => {
    navigate(`/projects/${project.id}/edit`);
  };

  const handleDeleteProject = async (project: ProjectWithStats) => {
    if (!confirm(`Czy na pewno chcesz usunąć projekt "${project.name}"?`)) {
      return;
    }

    try {
      await projectService.deleteProject(project.id);
      await loadProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Błąd podczas usuwania projektu');
    }
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);
  const canEdit = selectedCompanyData?.userPermissions.canEdit || false;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projekty', href: '/projects' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projekty</h1>
              <p className="text-gray-600 mt-1">
                Zarządzaj projektami budowlanymi i śledź postępy
              </p>
            </div>
            {canEdit && (
              <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nowy projekt
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Company selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wybierz firmę</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie statusy</option>
                <option value="PLANNING">Planowanie</option>
                <option value="ACTIVE">Aktywny</option>
                <option value="ON_HOLD">Wstrzymany</option>
                <option value="COMPLETED">Ukończony</option>
                <option value="CANCELLED">Anulowany</option>
              </select>
            </div>

            {/* Priority filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorytet
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie priorytety</option>
                <option value="LOW">Niski</option>
                <option value="MEDIUM">Średni</option>
                <option value="HIGH">Wysoki</option>
                <option value="URGENT">Pilny</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wyszukaj
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nazwa, opis, klient..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(statusFilter || priorityFilter || searchQuery) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPriorityFilter('');
                  setSearchQuery('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Wyczyść filtry
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        {!selectedCompany ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Wybierz firmę</h3>
            <p className="text-gray-600">Wybierz firmę z listy powyżej, aby zobaczyć jej projekty</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Ładowanie projektów...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak projektów</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter || priorityFilter || searchQuery 
                ? 'Nie znaleziono projektów spełniających kryteria wyszukiwania'
                : 'Ta firma nie ma jeszcze żadnych projektów'
              }
            </p>
            {canEdit && !statusFilter && !priorityFilter && !searchQuery && (
              <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700">
                Utwórz pierwszy projekt
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {projects.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Podsumowanie</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
                <div className="text-sm text-gray-600">Projektów</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'ACTIVE').length}
                </div>
                <div className="text-sm text-gray-600">Aktywnych</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-600">Ukończonych</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {projects.reduce((sum, p) => sum + p.stats.totalTasks, 0)}
                </div>
                <div className="text-sm text-gray-600">Zadań</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
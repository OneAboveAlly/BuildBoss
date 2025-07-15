import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProjectCard } from '../components/projects/ProjectCard';
import { DeleteProjectModal } from '../components/projects/DeleteProjectModal';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { projectService } from '../services/projectService';
import { companyService } from '../services/companyService';
import type { ProjectWithStats, CompanyWithDetails, ProjectFilters, ProjectStatus, Priority } from '../types';
import { toast } from 'react-hot-toast';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithStats | null>(null);

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
      const filters: ProjectFilters & { companyId?: string } = {
        companyId: selectedCompany,
      };
      
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (searchQuery) filters.search = searchQuery;
      
      const data = await projectService.getProjects(filters);
      setProjects(data);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      
      if (error.response?.status === 403) {
        setError('Brak dostępu do projektów tej firmy. Sprawdź czy jesteś członkiem firmy.');
        // Clear selected company if no access
        setSelectedCompany('');
      } else {
        setError('Błąd podczas ładowania projektów. Spróbuj ponownie.');
      }
      setProjects([]);
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
    navigate(`/projects/${project.id}?tab=settings`);
  };

  const handleDeleteProject = (project: ProjectWithStats) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleProjectDeleted = async () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
    await loadProjects();
    toast.success('Projekt został usunięty');
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);
  const canEdit = selectedCompanyData?.userPermissions.canEdit || false;

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projekty', href: '/projects' }
  ];

  // Calculate summary stats
  const summaryStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    planning: projects.filter(p => p.status === 'PLANNING').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Projekty
                </h1>
                <p className="text-slate-600 mt-2 text-lg">
                  Zarządzaj projektami budowlanymi i śledź postępy
                </p>
              </div>
              {canEdit && (
                <Button 
                  onClick={handleCreateProject} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Nowy projekt
                  </div>
                </Button>
              )}
            </div>

            {/* Summary Stats */}
            {projects.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                  <div className="text-2xl font-bold text-slate-700">{summaryStats.total}</div>
                  <div className="text-sm text-slate-500">Łącznie projektów</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">{summaryStats.active}</div>
                  <div className="text-sm text-slate-500">Aktywne</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                  <div className="text-2xl font-bold text-amber-600">{summaryStats.planning}</div>
                  <div className="text-sm text-slate-500">W planowaniu</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{summaryStats.completed}</div>
                  <div className="text-sm text-slate-500">Ukończone</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-10">
          <h3 className="text-lg font-semibold text-slate-700 mb-6">Filtry projektów</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Company selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Firma
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Priorytet
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              >
                <option value="">Wszystkie priorytety</option>
                <option value="URGENT">Pilny</option>
                <option value="HIGH">Wysoki</option>
                <option value="MEDIUM">Średni</option>
                <option value="LOW">Niski</option>
              </select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Wyszukaj
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nazwa lub opis projektu..."
                  className="w-full px-4 py-3 pl-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8 rounded-r-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <span className="ml-4 text-slate-600 font-medium">Ładowanie projektów...</span>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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

        {/* Empty State */}
        {!loading && projects.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0v-9a2 2 0 012-2h2m4 0h2a2 2 0 012 2v9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Brak projektów</h3>
              <p className="text-slate-500 mb-6">
                {selectedCompany 
                  ? 'Nie znaleziono projektów spełniających kryteria filtrowania. Spróbuj zmienić filtry lub utwórz nowy projekt.'
                  : 'Wybierz firmę aby zobaczyć projekty lub utwórz pierwszy projekt'
                }
              </p>
              {canEdit && selectedCompany && (
                <Button 
                  onClick={handleCreateProject}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Utwórz pierwszy projekt
                  </div>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        {showDeleteModal && projectToDelete && (
          <DeleteProjectModal
            project={projectToDelete}
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setProjectToDelete(null);
            }}
            onDeleted={handleProjectDeleted}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectsPage; 
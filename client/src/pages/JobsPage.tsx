import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { jobService } from '../services/jobService';
import type { JobOffer, JobFilters, JobCategory, JobType, ExperienceLevel } from '../types/job';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS, VOIVODESHIPS } from '../types/job';
import { useAuth } from '../contexts/AuthContext';

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filtry
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    category: undefined,
    voivodeship: '',
    city: '',
    type: undefined,
    experience: undefined,
    salaryMin: undefined,
    salaryMax: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  });

  // Pobieranie ogłoszeń
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobService.getJobs(filters);
      setJobs(response.jobs);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Błąd podczas pobierania ogłoszeń');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  // Obsługa filtrów
  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset strony przy zmianie filtrów
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: undefined,
      voivodeship: '',
      city: '',
      type: undefined,
      experience: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20
    });
  };

  // Obsługa paginacji
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie ogłoszeń...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
                Ogłoszenia o pracę
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Znajdź pracę w branży budowlanej
              </p>
            </div>
            
            {user && (
              <div className="mt-4 sm:mt-0">
                <Link
                  to="/jobs/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Dodaj ogłoszenie
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtry - Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Filtry</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Wyszukiwanie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wyszukaj
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Stanowisko, firma, miasto..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Kategoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoria
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Wszystkie kategorie</option>
                    {Object.entries(JOB_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Województwo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Województwo
                  </label>
                  <select
                    value={filters.voivodeship || ''}
                    onChange={(e) => handleFilterChange('voivodeship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Wszystkie województwa</option>
                    {VOIVODESHIPS.map(voivodeship => (
                      <option key={voivodeship} value={voivodeship}>
                        {voivodeship}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Miasto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Miasto
                  </label>
                  <input
                    type="text"
                    value={filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    placeholder="Nazwa miasta"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Typ pracy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typ pracy
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Wszystkie typy</option>
                    {Object.entries(JOB_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Doświadczenie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doświadczenie
                  </label>
                  <select
                    value={filters.experience || ''}
                    onChange={(e) => handleFilterChange('experience', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Wszystkie poziomy</option>
                    {Object.entries(EXPERIENCE_LEVELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Wynagrodzenie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wynagrodzenie (PLN)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={filters.salaryMin || ''}
                      onChange={(e) => handleFilterChange('salaryMin', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Od"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      value={filters.salaryMax || ''}
                      onChange={(e) => handleFilterChange('salaryMax', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Do"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Sortowanie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sortuj według
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange('sortBy', sortBy);
                      handleFilterChange('sortOrder', sortOrder);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt-desc">Najnowsze</option>
                    <option value="createdAt-asc">Najstarsze</option>
                    <option value="title-asc">Nazwa A-Z</option>
                    <option value="title-desc">Nazwa Z-A</option>
                    <option value="salaryMin-desc">Wynagrodzenie malejąco</option>
                    <option value="salaryMin-asc">Wynagrodzenie rosnąco</option>
                  </select>
                </div>

                {/* Przyciski akcji */}
                <div className="flex space-x-3">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Wyczyść
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista ogłoszeń */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Statystyki */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Znaleziono <span className="font-medium">{pagination.total}</span> ogłoszeń
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Strona</span>
                  <span className="text-sm font-medium">
                    {pagination.page} z {pagination.pages}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista ogłoszeń */}
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                            <Link to={`/jobs/${job.id}`}>
                              {job.title}
                            </Link>
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {JOB_CATEGORIES[job.category]}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            {job.company.name}
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {job.city}, {job.voivodeship}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatDate(job.createdAt)}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                              {jobService.formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {JOB_TYPES[job.type]}
                            </span>
                            <span className="text-sm text-gray-500">
                              {EXPERIENCE_LEVELS[job.experience]}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {job.applicationCount !== undefined && (
                              <span className="text-sm text-gray-500">
                                {job.applicationCount} aplikacji
                              </span>
                            )}
                            <Link
                              to={`/jobs/${job.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Zobacz
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginacja */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Poprzednia
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === pagination.page
                            ? 'text-blue-600 bg-blue-50 border border-blue-300'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Następna
                  </button>
                </nav>
              </div>
            )}

            {/* Brak wyników */}
            {!loading && jobs.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Brak ogłoszeń</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Nie znaleziono ogłoszeń spełniających kryteria wyszukiwania.
                </p>
                <div className="mt-6">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Wyczyść filtry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage; 
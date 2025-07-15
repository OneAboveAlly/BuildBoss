import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOffice2Icon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import PublicLayout from '../components/layout/PublicLayout';
import Layout from '../components/layout/Layout';
import { jobService } from '../services/jobService';
import type { JobOffer, JobFilters } from '../types/job';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS } from '../types/job';
import { useAuth } from '../contexts/AuthContext';

// Województwa Polski
const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
];

interface JobCardProps {
  job: JobOffer;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const navigate = useNavigate();
  const { t } = useTranslation('jobs');
  
  const salaryText = job.salaryMin || job.salaryMax 
    ? `${job.salaryMin || 'od'} - ${job.salaryMax || 'do'} ${job.currency || 'PLN'}`
    : t('salary_negotiable');

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('time_ago.just_now');
    if (diffInHours < 24) return t('time_ago.hours_ago', { count: diffInHours });
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t('time_ago.days_ago', { count: diffInDays });
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
          <div className="flex items-center text-gray-600 mb-2">
            <BuildingOffice2Icon className="w-4 h-4 mr-2" />
            <span className="font-medium">{job.company.name}</span>
          </div>
          <div className="flex items-center text-gray-500 mb-2">
            <MapPinIcon className="w-4 h-4 mr-2" />
            <span>{job.city}, {job.voivodeship}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-green-600 font-semibold mb-2">
            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
            <span>{salaryText}</span>
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>{timeAgo(job.createdAt)}</span>
          </div>
          {job.viewCount !== undefined && (
            <div className="flex items-center text-gray-400 text-sm mt-1">
              <EyeIcon className="w-4 h-4 mr-1" />
              <span>{job.viewCount.toLocaleString('pl-PL')} wyświetleń</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">
        {job.description.substring(0, 150)}...
      </p>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {JOB_CATEGORIES[job.category]}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {JOB_TYPES[job.type]}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            {EXPERIENCE_LEVELS[job.experience]}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/jobs/${job.id}`);
          }}
        >
          Zobacz szczegóły
        </Button>
      </div>
    </div>
  );
};

export const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation('jobs');
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filtry z URL params
  const [filters, setFilters] = useState<JobFilters>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') as any || undefined,
    voivodeship: searchParams.get('voivodeship') || undefined,
    city: searchParams.get('city') || undefined,
    type: searchParams.get('type') as any || undefined,
    experience: searchParams.get('experience') as any || undefined,
    salaryMin: searchParams.get('salaryMin') ? Number(searchParams.get('salaryMin')) : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
  });

  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 12;

  useEffect(() => {
    loadJobs();
  }, [filters, currentPage]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      // Używamy publicznego endpointu dla ogłoszeń
      const params = {
        ...filters,
        page: currentPage,
        limit: jobsPerPage,
        isPublic: true // tylko publiczne ogłoszenia
      };
      
      const response = await jobService.getJobs(params);
      setJobs(response.jobs || response);
      setTotalJobs(response.pagination?.total || response.length || 0);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<JobFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setCurrentPage(1);

    // Aktualizuj URL
    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchParams({});
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Wybierz odpowiedni layout w zależności od stanu logowania
  const LayoutComponent = user ? Layout : PublicLayout;

  return (
    <LayoutComponent>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('title')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('subtitle')}
              </p>
              <div className="mt-4 text-sm text-gray-500">
                {t('found_jobs', { count: totalJobs })}
              </div>
            </div>
            
            {user && (
              <div className="hidden sm:block">
                <Link to="/jobs/create">
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    {t('add_job')}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
              {t('filters')}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Kategoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('filters_form.category')}
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => updateFilters({ category: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('filters_form.all_categories')}</option>
                    {Object.entries(JOB_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{t(`categories.${key}`) || label}</option>
                    ))}
                  </select>
                </div>

                {/* Województwo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('filters_form.voivodeship')}
                  </label>
                  <select
                    value={filters.voivodeship || ''}
                    onChange={(e) => updateFilters({ voivodeship: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('filters_form.all_voivodeships')}</option>
                    {VOIVODESHIPS.map(voivodeship => (
                      <option key={voivodeship} value={voivodeship}>
                        {voivodeship}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Typ pracy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('filters_form.job_type')}
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => updateFilters({ type: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('filters_form.all_types')}</option>
                    {Object.entries(JOB_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{t(`types.${key}`) || label}</option>
                    ))}
                  </select>
                </div>

                {/* Minimalne wynagrodzenie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('filters_form.min_salary')}
                  </label>
                  <input
                    type="number"
                    placeholder="3000"
                    value={filters.salaryMin || ''}
                    onChange={(e) => updateFilters({ salaryMin: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={clearFilters}>
                  {t('clear_filters')}
                </Button>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">{t('sort_by')}</label>
                  <select
                    value={`${filters.sortBy}_${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('_');
                      updateFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any });
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="createdAt_desc">{t('sort_newest')}</option>
                    <option value="createdAt_asc">{t('sort_oldest')}</option>
                    <option value="title_asc">{t('sort_name_asc')}</option>
                    <option value="title_desc">{t('sort_name_desc')}</option>
                    <option value="salaryMin_desc">{t('sort_salary_desc')}</option>
                    <option value="salaryMin_asc">{t('sort_salary_asc')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_jobs')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('no_jobs_description')}
            </p>
            <div className="mt-6">
              <Button variant="outline" onClick={clearFilters}>
                {t('clear_filters')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="inline-flex -space-x-px rounded-md shadow-sm">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('previous')}
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium border ${
                          currentPage === page
                            ? 'bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('next')}
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA for companies */}
      {!user && (
        <div className="bg-primary-50 border-t border-primary-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('looking_for_employees')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('looking_for_employees_description')}
            </p>
            <div className="space-x-4">
              <Link to="/login">
                <Button variant="outline">
                  {t('login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary-600 hover:bg-primary-700">
                  {t('register_company')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </LayoutComponent>
  );
};

export default JobsPage; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAutoRefreshUser } from '../hooks/useAuth';
import type { CompanyWithDetails } from '../types';
import { companyService } from '../services/companyService';
import { Button } from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import WorkersList from '../components/companies/WorkersList';

const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Hook do automatycznego odświeżania danych użytkownika
  useAutoRefreshUser();

  const [company, setCompany] = useState<CompanyWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'settings'>('overview');

  useEffect(() => {
    if (id) {
      loadCompany();
    }
  }, [id]);

  const loadCompany = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const companyData = await companyService.getCompany(id);
      setCompany(companyData);
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Błąd podczas ładowania danych firmy');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkersChange = () => {
    loadCompany(); // Reload company data to update worker counts
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-secondary-600">Ładowanie danych firmy...</span>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Firma nie została znaleziona'}</div>
          <div className="space-x-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Powrót do dashboardu
            </Button>
            <Button onClick={loadCompany}>
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: company.name, current: true }
  ];

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: '📊' },
    { id: 'workers', label: `Pracownicy (${company._count?.workers || 0})`, icon: '👥' },
    { id: 'settings', label: 'Ustawienia', icon: '⚙️' }
  ] as const;

  const canManage = company.userRole === 'OWNER';

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 mb-6">
          <div className="px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-primary-600 font-bold text-2xl">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-secondary-900">{company.name}</h1>
                  {company.description && (
                    <p className="text-secondary-600 mt-2">{company.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.userRole === 'OWNER' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {company.userRole === 'OWNER' ? 'Właściciel' : 'Pracownik'}
                    </span>
                    {company.nip && (
                      <span className="text-sm text-secondary-500">NIP: {company.nip}</span>
                    )}
                  </div>
                </div>
              </div>
              {canManage && (
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => navigate(`/companies/${company.id}/edit`)}>
                    Edytuj firmę
                  </Button>
                </div>
              )}
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div>
                <h3 className="text-sm font-medium text-secondary-500 uppercase tracking-wide">
                  Kontakt
                </h3>
                <div className="mt-2 space-y-1">
                  {company.email && (
                    <div className="text-sm text-secondary-900">{company.email}</div>
                  )}
                  {company.phone && (
                    <div className="text-sm text-secondary-900">{company.phone}</div>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {company.website}
                    </a>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-secondary-500 uppercase tracking-wide">
                  Adres
                </h3>
                <div className="mt-2">
                  {company.address ? (
                    <div className="text-sm text-secondary-900">{company.address}</div>
                  ) : (
                    <div className="text-sm text-secondary-500">Nie podano</div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-secondary-500 uppercase tracking-wide">
                  Utworzono
                </h3>
                <div className="mt-2">
                  <div className="text-sm text-secondary-900">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-secondary-500">
                    przez {company.createdBy.firstName || company.createdBy.lastName 
                      ? `${company.createdBy.firstName || ''} ${company.createdBy.lastName || ''}`.trim()
                      : company.createdBy.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                    Przegląd firmy
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-secondary-50 p-6 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-900">
                        {company._count?.workers || 0}
                      </div>
                      <div className="text-sm text-secondary-600">Pracowników</div>
                    </div>
                    <div className="bg-secondary-50 p-6 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-900">0</div>
                      <div className="text-sm text-secondary-600">Projektów</div>
                    </div>
                    <div className="bg-secondary-50 p-6 rounded-lg">
                      <div className="text-2xl font-bold text-secondary-900">0</div>
                      <div className="text-sm text-secondary-600">Zadań</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">
                    Ostatnia aktywność
                  </h3>
                  <div className="bg-secondary-50 p-6 rounded-lg text-center">
                    <div className="text-secondary-500">
                      Brak ostatniej aktywności do wyświetlenia
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workers' && (
              <WorkersList company={company} onWorkersChange={handleWorkersChange} />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                    Ustawienia firmy
                  </h2>
                  {canManage ? (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Strefa niebezpieczna
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>Usunięcie firmy jest nieodwracalne. Wszystkie dane zostaną utracone.</p>
                            </div>
                            <div className="mt-4">
                              <Button variant="danger" size="sm">
                                Usuń firmę
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-secondary-50 p-6 rounded-lg text-center">
                      <div className="text-secondary-500">
                        Tylko właściciel firmy może zarządzać ustawieniami
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPage; 
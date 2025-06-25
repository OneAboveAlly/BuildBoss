import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAutoRefreshUser } from '../hooks/useAuth';
import { companyService } from '../services/companyService';
import { dashboardService } from '../services/dashboardService';
import { CompanyCard } from '../components/companies/CompanyCard';
import { CompanyForm } from '../components/companies/CompanyForm';
import { DeleteCompanyModal } from '../components/companies/DeleteCompanyModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  BuildingOffice2Icon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  PlusIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import type { 
  CompanyWithDetails, 
  CreateCompanyRequest, 
  DashboardStats, 
  WorkerInvitation 
} from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Hook do automatycznego odświeżania danych użytkownika
  useAutoRefreshUser();
  
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invitations, setInvitations] = useState<WorkerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [companiesData, statsData, invitationsData] = await Promise.all([
        companyService.getCompanies(),
        dashboardService.getStats(),
        dashboardService.getInvitations()
      ]);
      
      setCompanies(companiesData);
      setStats(statsData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (data: CreateCompanyRequest) => {
    try {
      setFormLoading(true);
      const newCompany = await companyService.createCompany(data);
      setCompanies(prev => [...prev, newCompany]);
      setShowCreateModal(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCompany = async (data: CreateCompanyRequest) => {
    if (!selectedCompany) return;
    
    try {
      setFormLoading(true);
      const updatedCompany = await companyService.updateCompany(selectedCompany.id, data);
      setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? updatedCompany : c));
      setShowEditModal(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCompany = async (company: CompanyWithDetails) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  const handleCompanyDeleted = async () => {
    if (selectedCompany) {
      setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id));
      await loadDashboardData();
    }
  };

  const handleAcceptInvitation = async (invitation: WorkerInvitation) => {
    try {
      await companyService.acceptInvitation(invitation.company.id);
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
      await loadDashboardData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (invitation: WorkerInvitation) => {
    try {
      await companyService.rejectInvitation(invitation.company.id);
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  const formatTime = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return 'Dzień dobry';
    if (hour < 18) return 'Dzień dobry';
    return 'Dobry wieczór';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-secondary-600">Ładowanie dashboardu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {formatTime()}, {user?.firstName || 'Użytkowniku'}! 👋
            </h1>
            <p className="text-primary-100 text-lg">
              Zarządzaj swoimi projektami budowlanymi efektywnie
            </p>
          </div>
          <div className="flex items-center justify-between md:justify-end space-x-4">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="text-2xl font-bold text-white">{new Date().getDate()}</div>
              <div className="text-sm text-primary-200">
                {new Date().toLocaleDateString('pl-PL', { month: 'short' })}
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="white"
              size="lg"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nowa firma
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-secondary-200 hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
              <ClipboardDocumentListIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <ArrowTrendingUpIcon className="h-4 w-4 text-secondary-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-secondary-900 text-sm md:text-base">Projekty</h3>
          <p className="text-xs md:text-sm text-secondary-600">Zarządzaj projektami</p>
        </button>

        <button
          onClick={() => navigate('/materials')}
          className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-secondary-200 hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
              <CurrencyDollarIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
            <ArrowTrendingUpIcon className="h-4 w-4 text-secondary-400 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-secondary-900 text-sm md:text-base">Materiały</h3>
          <p className="text-xs md:text-sm text-secondary-600">Inwentarz i koszty</p>
        </button>

        <button
          onClick={() => navigate('/analytics')}
          className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-secondary-200 hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
              <ChartBarIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
            <ArrowTrendingUpIcon className="h-4 w-4 text-secondary-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-secondary-900 text-sm md:text-base">Analityki</h3>
          <p className="text-xs md:text-sm text-secondary-600">Raporty i metryki</p>
        </button>

        <button
          onClick={() => navigate('/messages')}
          className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-secondary-200 hover:shadow-md transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
              <EnvelopeIcon className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
            </div>
            <BellIcon className="h-4 w-4 text-secondary-400 group-hover:text-orange-600 transition-colors" />
          </div>
          <h3 className="font-semibold text-secondary-900 text-sm md:text-base">Wiadomości</h3>
          <p className="text-xs md:text-sm text-secondary-600">Komunikacja zespołu</p>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Wszystkie firmy</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.companies.total}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                    Aktywne firmy
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Jako właściciel</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.companies.asOwner}</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Pełne uprawnienia
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Jako pracownik</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.companies.asWorker}</p>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    Współpraca
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Zaproszenia</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.pendingInvitations}</p>
                  <p className="text-xs text-purple-600 flex items-center mt-1">
                    <BellIcon className="h-3 w-3 mr-1" />
                    Oczekujące
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <EnvelopeIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invitations */}
      {invitations.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-secondary-900 flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2 text-primary-600" />
                Zaproszenia do firm
              </CardTitle>
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-lg text-sm font-medium">
                {invitations.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <BuildingOffice2Icon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-secondary-900">
                          {invitation.company.name}
                        </h4>
                        <p className="text-sm text-secondary-600">
                          Zaproszenie od: {invitation.company.createdBy.firstName} {invitation.company.createdBy.lastName}
                        </p>
                        {invitation.position && (
                          <p className="text-sm text-primary-700 font-medium">
                            Stanowisko: {invitation.position}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Akceptuj
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectInvitation(invitation)}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Odrzuć
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-secondary-900 flex items-center">
            <BuildingOffice2Icon className="h-6 w-6 mr-2 text-primary-600" />
            Twoje firmy
          </h2>
        </div>

        {companies.length === 0 ? (
          <Card className="bg-gradient-to-br from-secondary-50 to-primary-50 border-0 shadow-sm">
            <CardContent className="text-center py-16">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BuildingOffice2Icon className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                Rozpocznij swoją przygodę z SiteBoss
              </h3>
              <p className="text-secondary-600 mb-6 max-w-md mx-auto">
                Utwórz swoją pierwszą firmę i zacznij zarządzać projektami budowlanymi 
                w sposób profesjonalny i efektywny.
              </p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="lg"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Utwórz pierwszą firmę
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onView={(company) => {
                  navigate(`/companies/${company.id}`);
                }}
                onEdit={(company) => {
                  setSelectedCompany(company);
                  setShowEditModal(true);
                }}
                onDelete={handleDeleteCompany}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Utwórz nową firmę"
        size="xl"
      >
        <CompanyForm
          onSubmit={handleCreateCompany}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCompany(null);
        }}
        title="Edytuj firmę"
        size="xl"
      >
        <CompanyForm
          company={selectedCompany || undefined}
          onSubmit={handleEditCompany}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
          loading={formLoading}
        />
      </Modal>

              {/* Delete Company Modal */}
        <DeleteCompanyModal
          company={selectedCompany}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCompany(null);
          }}
          onDeleted={handleCompanyDeleted}
        />
    </div>
  );
};

export default DashboardPage; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { companyService } from '../services/companyService';
import { dashboardService } from '../services/dashboardService';
import { CompanyCard } from '../components/companies/CompanyCard';
import { CompanyForm } from '../components/companies/CompanyForm';
import { DeleteCompanyModal } from '../components/companies/DeleteCompanyModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import {
  BuildingOffice2Icon,
  PlusIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import type { 
  CompanyWithDetails, 
  CreateCompanyRequest, 
  WorkerInvitation 
} from '../types';
import { toast } from 'react-hot-toast';

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [invitations, setInvitations] = useState<WorkerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'worker'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData, invitationsData] = await Promise.all([
        companyService.getCompanies(),
        dashboardService.getInvitations()
      ]);
      
      setCompanies(companiesData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Błąd podczas ładowania danych');
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
      toast.success('Firma została utworzona pomyślnie');
      await loadData();
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
      toast.success('Firma została zaktualizowana pomyślnie');
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
    await loadData();
    toast.success('Firma została usunięta pomyślnie');
  };

  const handleAcceptInvitation = async (invitation: WorkerInvitation) => {
    try {
      await dashboardService.acceptInvitation(invitation.id);
      await loadData();
      toast.success('Zaproszenie zostało zaakceptowane');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Błąd podczas akceptacji zaproszenia');
    }
  };

  const handleRejectInvitation = async (invitation: WorkerInvitation) => {
    try {
      await dashboardService.rejectInvitation(invitation.id);
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      toast.success('Zaproszenie zostało odrzucone');
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Błąd podczas odrzucania zaproszenia');
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
                       (roleFilter === 'owner' && company.userRole === 'OWNER') ||
                       (roleFilter === 'worker' && company.userRole === 'WORKER');
    
    return matchesSearch && matchesRole;
  });

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Firmy', current: true }
  ];

  const ownedCompanies = companies.filter(c => c.userRole === 'OWNER').length;
  const workerCompanies = companies.filter(c => c.userRole === 'WORKER').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <span className="text-secondary-600">Ładowanie firm...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Zarządzanie firmami
            </h1>
            <p className="text-secondary-600 mt-2">
              Przeglądaj i zarządzaj swoimi firmami
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Utwórz firmę
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Łącznie firm</p>
                  <p className="text-2xl font-bold text-secondary-900">{companies.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Jako właściciel</p>
                  <p className="text-2xl font-bold text-secondary-900">{ownedCompanies}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <BuildingOffice2Icon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Jako pracownik</p>
                  <p className="text-2xl font-bold text-secondary-900">{workerCompanies}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <BuildingOffice2Icon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {invitations.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg mb-8">
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

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Szukaj firm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-secondary-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'owner' | 'worker')}
                  className="border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Wszystkie role</option>
                  <option value="owner">Właściciel</option>
                  <option value="worker">Pracownik</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredCompanies.length === 0 ? (
          <Card className="bg-gradient-to-br from-secondary-50 to-primary-50 border-0 shadow-lg">
            <CardContent className="text-center py-16">
              <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BuildingOffice2Icon className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                {companies.length === 0 ? 'Rozpocznij swoją przygodę z SiteBoss' : 'Brak wyników'}
              </h3>
              <p className="text-secondary-600 mb-6 max-w-md mx-auto">
                {companies.length === 0 
                  ? 'Utwórz swoją pierwszą firmę i zacznij zarządzać projektami budowlanymi w sposób profesjonalny i efektywny.'
                  : 'Nie znaleziono firm pasujących do kryteriów wyszukiwania.'
                }
              </p>
              {companies.length === 0 && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  size="lg"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Utwórz pierwszą firmę
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
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
    </div>
  );
};

export default CompaniesPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { companyService } from '../services/companyService';
import { dashboardService } from '../services/dashboardService';
import { CompanyCard } from '../components/companies/CompanyCard';
import { CompanyForm } from '../components/companies/CompanyForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import type { 
  CompanyWithDetails, 
  CreateCompanyRequest, 
  DashboardStats, 
  WorkerInvitation 
} from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invitations, setInvitations] = useState<WorkerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
      await loadDashboardData(); // Refresh stats
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
    if (!confirm(`Czy na pewno chcesz usunąć firmę "${company.name}"?`)) {
      return;
    }

    try {
      await companyService.deleteCompany(company.id);
      setCompanies(prev => prev.filter(c => c.id !== company.id));
      await loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const handleAcceptInvitation = async (invitation: WorkerInvitation) => {
    try {
      await companyService.acceptInvitation(invitation.company.id);
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleRejectInvitation = async (invitation: WorkerInvitation) => {
    try {
      await companyService.rejectInvitation(invitation.company.id);
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting invitation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Witaj z powrotem, {user?.firstName || user?.email}!
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nowa firma
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="text-2xl mr-4">🏢</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Wszystkie firmy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.companies.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="text-2xl mr-4">👑</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Jako właściciel</p>
                <p className="text-2xl font-bold text-gray-900">{stats.companies.asOwner}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="text-2xl mr-4">👥</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Jako pracownik</p>
                <p className="text-2xl font-bold text-gray-900">{stats.companies.asWorker}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="text-2xl mr-4">📨</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Zaproszenia</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingInvitations}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Zaproszenia do firm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Zaproszenie do firmy: {invitation.company.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Od: {invitation.company.createdBy.firstName} {invitation.company.createdBy.lastName}
                    </p>
                    {invitation.position && (
                      <p className="text-sm text-gray-600">
                        Stanowisko: {invitation.position}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvitation(invitation)}
                    >
                      Akceptuj
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectInvitation(invitation)}
                    >
                      Odrzuć
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Twoje firmy</h2>
        {companies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nie masz jeszcze żadnych firm
              </h3>
              <p className="text-gray-600 mb-4">
                Utwórz swoją pierwszą firmę, aby rozpocząć zarządzanie projektami budowlanymi.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
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
        size="lg"
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
        size="lg"
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
    </div>
  );
};

export default DashboardPage; 
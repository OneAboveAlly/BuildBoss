import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProjectForm } from '../components/projects/ProjectForm';
import { companyService } from '../services/companyService';
import { projectService } from '../services/projectService';
import { Button } from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import type { CompanyWithDetails, CreateProjectRequest, ProjectWithDetails } from '../types';

export const CreateProjectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState<CompanyWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const companyId = searchParams.get('company');

  useEffect(() => {
    if (companyId) {
      loadCompany();
    } else {
      setError('Brak ID firmy w parametrach URL');
      setLoading(false);
    }
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const companyData = await companyService.getCompany(companyId);
      setCompany(companyData);
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Nie udało się załadować danych firmy');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!companyId) return;

    try {
      setFormLoading(true);
      
      const projectData: CreateProjectRequest = {
        ...formData,
        companyId,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        deadline: formData.deadline || undefined
      };

      const newProject = await projectService.createProject(projectData);
      
      // Redirect to the new project
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      throw err; // Let ProjectForm handle the error display
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Firma nie została znaleziona'}</p>
        <Button onClick={() => navigate('/projects')}>
          Powrót do projektów
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projekty', href: '/projects' },
    { label: 'Nowy projekt', href: `/projects/new?company=${companyId}` }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Utwórz nowy projekt</h1>
            <p className="text-secondary-600 mt-1">
              Dodaj nowy projekt dla firmy <span className="font-medium">{company.name}</span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Anuluj
          </Button>
        </div>
      </div>

      {/* Project Form */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <ProjectForm
          companyId={companyId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      </div>
    </div>
  );
}; 
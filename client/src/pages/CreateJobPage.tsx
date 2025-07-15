import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobOfferForm } from '../components/jobs/JobOfferForm';
import { jobService } from '../services/jobService';
import { companyService } from '../services/companyService';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import type { CreateJobOfferData } from '../types/job';
import type { CompanyWithDetails } from '../types';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';

const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const companiesData = await companyService.getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Błąd podczas ładowania firm');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (data: CreateJobOfferData) => {
    try {
      setLoading(true);
      const newJob = await jobService.createJob(data);
      toast.success('Ogłoszenie zostało utworzone pomyślnie');
      navigate('/jobs');
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error('Błąd podczas tworzenia ogłoszenia');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/jobs');
  };

  const handleCreateCompany = () => {
    navigate('/companies/create');
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Praca', href: '/jobs' },
    { label: 'Dodaj ogłoszenie', current: true }
  ];

  if (loadingCompanies) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie firm...</p>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Dodaj nowe ogłoszenie o pracę
            </h1>
            <p className="text-gray-600 mt-2">
              Utwórz ogłoszenie i znajdź odpowiednich kandydatów dla swojej firmy
            </p>
          </div>

          {/* No companies message */}
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Brak firm
              </h3>
              <p className="text-gray-600 mb-6">
                Aby utworzyć ogłoszenie o pracę, musisz najpierw utworzyć firmę lub zostać zaproszonym do istniejącej firmy.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleCreateCompany}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  Utwórz nową firmę
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full"
                >
                  Wróć do listy ogłoszeń
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dodaj nowe ogłoszenie o pracę
          </h1>
          <p className="text-gray-600 mt-2">
            Utwórz ogłoszenie i znajdź odpowiednich kandydatów dla swojej firmy
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <JobOfferForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobPage; 
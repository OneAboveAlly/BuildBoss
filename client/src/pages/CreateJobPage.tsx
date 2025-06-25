import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobOfferForm } from '../components/jobs/JobOfferForm';
import { jobService } from '../services/jobService';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import type { CreateJobOfferData } from '../types/job';
import { toast } from 'react-hot-toast';

const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Praca', href: '/jobs' },
    { label: 'Dodaj ogłoszenie', current: true }
  ];

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
import React, { useState, useEffect } from 'react';
import type { WorkerWithUser, CompanyWithDetails, UpdateWorkerRequest } from '../../types';
import { companyService } from '../../services/companyService';
import WorkerCard from './WorkerCard';
import { Button } from '../ui/Button';
import InviteWorkerForm from './InviteWorkerForm';

interface WorkersListProps {
  company: CompanyWithDetails;
  onWorkersChange: () => void;
}

const WorkersList: React.FC<WorkersListProps> = ({ company, onWorkersChange }) => {
  const [workers, setWorkers] = useState<WorkerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const canManage = company.userRole === 'OWNER';

  useEffect(() => {
    loadWorkers();
  }, [company.id]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const workersData = await companyService.getWorkers(company.id);
      setWorkers(workersData);
    } catch (err) {
      console.error('Error loading workers:', err);
      setError('Błąd podczas ładowania listy pracowników');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorker = async (workerId: string, data: UpdateWorkerRequest) => {
    try {
      await companyService.updateWorker(company.id, workerId, data);
      await loadWorkers();
      onWorkersChange();
    } catch (error) {
      console.error('Error updating worker:', error);
      throw error;
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    try {
      await companyService.removeWorker(company.id, workerId);
      await loadWorkers();
      onWorkersChange();
    } catch (error) {
      console.error('Error removing worker:', error);
      throw error;
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    loadWorkers();
    onWorkersChange();
  };

  const getWorkersByStatus = () => {
    const active = workers.filter(w => w.status === 'ACTIVE');
    const invited = workers.filter(w => w.status === 'INVITED');
    const inactive = workers.filter(w => w.status === 'INACTIVE');
    const left = workers.filter(w => w.status === 'LEFT');

    return { active, invited, inactive, left };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-secondary-600">Ładowanie pracowników...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadWorkers} variant="outline">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  const { active, invited, inactive, left } = getWorkersByStatus();

  return (
    <div className="space-y-6">
      {/* Header with invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900">
            Pracownicy ({workers.length})
          </h2>
          <p className="text-sm text-secondary-600 mt-1">
            Zarządzaj pracownikami firmy i ich uprawnieniami
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowInviteForm(true)}>
            Zaproś pracownika
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{active.length}</div>
          <div className="text-sm text-green-700">Aktywni</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{invited.length}</div>
          <div className="text-sm text-yellow-700">Zaproszeni</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{inactive.length}</div>
          <div className="text-sm text-gray-700">Nieaktywni</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{left.length}</div>
          <div className="text-sm text-red-700">Opuścili</div>
        </div>
      </div>

      {/* Workers sections */}
      {workers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-secondary-200">
          <div className="text-secondary-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Brak pracowników
          </h3>
          <p className="text-secondary-600 mb-4">
            Zaproś pierwszego pracownika do swojej firmy
          </p>
          {canManage && (
            <Button onClick={() => setShowInviteForm(true)}>
              Zaproś pracownika
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active workers */}
          {active.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Aktywni pracownicy ({active.length})
              </h3>
              <div className="grid gap-4">
                {active.map(worker => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    canManage={canManage}
                    onUpdateWorker={handleUpdateWorker}
                    onRemoveWorker={handleRemoveWorker}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Invited workers */}
          {invited.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Oczekujący na akceptację ({invited.length})
              </h3>
              <div className="grid gap-4">
                {invited.map(worker => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    canManage={canManage}
                    onUpdateWorker={handleUpdateWorker}
                    onRemoveWorker={handleRemoveWorker}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive workers */}
          {inactive.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Nieaktywni pracownicy ({inactive.length})
              </h3>
              <div className="grid gap-4">
                {inactive.map(worker => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    canManage={canManage}
                    onUpdateWorker={handleUpdateWorker}
                    onRemoveWorker={handleRemoveWorker}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Left workers */}
          {left.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4">
                Byli pracownicy ({left.length})
              </h3>
              <div className="grid gap-4">
                {left.map(worker => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    canManage={canManage}
                    onUpdateWorker={handleUpdateWorker}
                    onRemoveWorker={handleRemoveWorker}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Worker Form */}
      {showInviteForm && (
        <InviteWorkerForm
          companyId={company.id}
          onSuccess={handleInviteSuccess}
          onCancel={() => setShowInviteForm(false)}
        />
      )}
    </div>
  );
};

export default WorkersList; 
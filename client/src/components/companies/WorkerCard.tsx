import React, { useState } from 'react';
import type { WorkerWithUser, UpdateWorkerRequest } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface WorkerCardProps {
  worker: WorkerWithUser;
  canManage: boolean;
  onUpdateWorker: (workerId: string, data: UpdateWorkerRequest) => Promise<void>;
  onRemoveWorker: (workerId: string) => Promise<void>;
}

const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  canManage,
  onUpdateWorker,
  onRemoveWorker
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    position: worker.position || '',
    canEdit: worker.canEdit,
    canView: worker.canView,
    canManageFinance: worker.canManageFinance,
    status: worker.status
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      INVITED: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      LEFT: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      INVITED: 'Zaproszony',
      ACTIVE: 'Aktywny',
      INACTIVE: 'Nieaktywny',
      LEFT: 'Opuścił'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.INACTIVE}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPermissionsBadges = () => {
    const permissions = [];
    if (worker.canEdit) permissions.push('Edycja');
    if (worker.canView) permissions.push('Podgląd');
    if (worker.canManageFinance) permissions.push('Finanse');
    
    return permissions.length > 0 ? permissions.join(', ') : 'Brak uprawnień';
  };

  const handleUpdateWorker = async () => {
    setIsLoading(true);
    try {
      await onUpdateWorker(worker.id, formData);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating worker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWorker = async () => {
    setIsLoading(true);
    try {
      await onRemoveWorker(worker.id);
      setIsRemoveModalOpen(false);
    } catch (error) {
      console.error('Error removing worker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (worker.user.firstName || worker.user.lastName) {
      return `${worker.user.firstName || ''} ${worker.user.lastName || ''}`.trim();
    }
    return worker.user.email;
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-secondary-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              {worker.user.avatar ? (
                <img
                  src={worker.user.avatar}
                  alt={getUserDisplayName()}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary-600 font-semibold text-lg">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">
                {getUserDisplayName()}
              </h3>
              <p className="text-sm text-secondary-600">{worker.user.email}</p>
              {worker.position && (
                <p className="text-sm text-secondary-500 mt-1">{worker.position}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(worker.status)}
            {canManage && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edytuj
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsRemoveModalOpen(true)}
                >
                  Usuń
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-secondary-600">
            <strong>Uprawnienia:</strong> {getPermissionsBadges()}
          </div>
          <div className="text-xs text-secondary-500 mt-2">
            {worker.status === 'INVITED' && worker.invitedAt && (
              <>Zaproszony: {new Date(worker.invitedAt).toLocaleDateString()}</>
            )}
            {worker.status === 'ACTIVE' && worker.joinedAt && (
              <>Dołączył: {new Date(worker.joinedAt).toLocaleDateString()}</>
            )}
            {worker.status === 'LEFT' && worker.leftAt && (
              <>Opuścił: {new Date(worker.leftAt).toLocaleDateString()}</>
            )}
          </div>
        </div>
      </div>

      {/* Edit Worker Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edytuj pracownika"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Stanowisko
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="np. Kierownik budowy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'INVITED' | 'ACTIVE' | 'INACTIVE' | 'LEFT' })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="INVITED">Zaproszony</option>
              <option value="ACTIVE">Aktywny</option>
              <option value="INACTIVE">Nieaktywny</option>
              <option value="LEFT">Opuścił</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Uprawnienia
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canView}
                  onChange={(e) => setFormData({ ...formData, canView: e.target.checked })}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">Podgląd danych</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canEdit}
                  onChange={(e) => setFormData({ ...formData, canEdit: e.target.checked })}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">Edycja danych</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canManageFinance}
                  onChange={(e) => setFormData({ ...formData, canManageFinance: e.target.checked })}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-700">Zarządzanie finansami</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleUpdateWorker}
              loading={isLoading}
            >
              Zapisz zmiany
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Worker Modal */}
      <Modal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        title="Usuń pracownika"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Czy na pewno chcesz usunąć pracownika <strong>{getUserDisplayName()}</strong> z firmy?
            Ta akcja jest nieodwracalna.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsRemoveModalOpen(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button
              variant="danger"
              onClick={handleRemoveWorker}
              loading={isLoading}
            >
              Usuń pracownika
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default WorkerCard; 
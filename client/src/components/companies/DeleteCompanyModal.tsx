import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { authService } from '../../services/authService';
import { companyService } from '../../services/companyService';
import type { CompanyWithDetails } from '../../types';
import { 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';

interface DeleteCompanyModalProps {
  company: CompanyWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
  company,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredConfirmText = company ? company.name : '';
  const isConfirmValid = confirmText === requiredConfirmText;
  const canSubmit = password.trim() && isConfirmValid;

  const handleClose = () => {
    setPassword('');
    setConfirmText('');
    setShowPassword(false);
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      // Najpierw zweryfikuj hasło
      await authService.verifyPassword(password);
      
      // Następnie usuń firmę
      await companyService.deleteCompany(company.id);
      
      onDeleted();
      handleClose();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      setError(error.message || 'Błąd podczas usuwania firmy');
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Usuń firmę"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warning Section */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Ta operacja jest nieodwracalna!
              </h3>
              <div className="text-sm text-red-700 space-y-1">
                <p>• Wszystkie projekty firmy zostaną usunięte</p>
                <p>• Wszystkie zadania i materiały zostaną utracone</p>
                <p>• Pracownicy stracą dostęp do firmowych danych</p>
                <p>• Historia komunikacji zostanie usunięta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Name Confirmation */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            Aby potwierdzić, wpisz nazwę firmy: <span className="font-semibold text-red-600">{company.name}</span>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder={company.name}
            disabled={loading}
          />
          {confirmText && !isConfirmValid && (
            <p className="text-sm text-red-600">Nazwa firmy nie jest poprawna</p>
          )}
        </div>

        {/* Password Confirmation */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            Potwierdź swoim hasłem
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Wprowadź swoje hasło"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-secondary-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-secondary-400" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-secondary-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
            disabled={!canSubmit}
            className="order-1 sm:order-2"
          >
            Usuń firmę "{company.name}"
          </Button>
        </div>
      </form>
    </Modal>
  );
}; 
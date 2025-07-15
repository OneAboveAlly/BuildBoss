import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrashIcon as Trash,
  ExclamationTriangleIcon as AlertTriangle,
  ShieldExclamationIcon as ShieldAlert,
  InformationCircleIcon as Info,
  XMarkIcon as X
} from '@heroicons/react/24/outline';
import { legalService } from '../../services/legalService';

interface DataDeletionRequestProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const DataDeletionRequest: React.FC<DataDeletionRequestProps> = ({
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation('legal');
  const [step, setStep] = useState<'warning' | 'confirmation' | 'processing' | 'completed'>('warning');
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState({
    dataLoss: false,
    accountClosure: false,
    irreversible: false,
    projectAccess: false
  });
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredConfirmationText = 'DELETE_MY_ACCOUNT';
  const isConfirmationValid = confirmationText === requiredConfirmationText;
  const allWarningsAcknowledged = Object.values(acknowledgedWarnings).every(Boolean);

  const handleWarningAcknowledgment = (warning: keyof typeof acknowledgedWarnings) => {
    setAcknowledgedWarnings(prev => ({
      ...prev,
      [warning]: !prev[warning]
    }));
  };

  const handleProceedToConfirmation = () => {
    if (allWarningsAcknowledged) {
      setStep('confirmation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmationText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for deletion');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await legalService.requestAccountDeletion(confirmationText);
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit deletion request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWarningStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('gdpr.delete.warningTitle')}
        </h2>
        <p className="text-gray-600">
          {t('gdpr.delete.warningSubtitle')}
        </p>
      </div>

      {/* Warning List */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {t('gdpr.delete.consequences')}
        </h3>
        
        <div className="space-y-4">
          {Object.keys(acknowledgedWarnings).map((warning) => (
            <label key={warning} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgedWarnings[warning as keyof typeof acknowledgedWarnings]}
                onChange={() => handleWarningAcknowledgment(warning as keyof typeof acknowledgedWarnings)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-1"
              />
              <div className="text-sm">
                <div className="font-medium text-red-800">
                  {t(`gdpr.delete.warnings.${warning}.title`)}
                </div>
                <div className="text-red-700">
                  {t(`gdpr.delete.warnings.${warning}.description`)}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">{t('gdpr.delete.alternativeTitle')}</p>
            <p>{t('gdpr.delete.alternativeDescription')}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleProceedToConfirmation}
          disabled={!allWarningsAcknowledged}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('gdpr.delete.proceedButton')}
        </button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <Trash className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('gdpr.delete.confirmationTitle')}
        </h2>
        <p className="text-gray-600">
          {t('gdpr.delete.confirmationSubtitle')}
        </p>
      </div>

      {/* Confirmation Input */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('gdpr.delete.confirmationLabel')}
        </label>
        <p className="text-sm text-gray-600 mb-4">
          {t('gdpr.delete.confirmationInstruction', { text: requiredConfirmationText })}
        </p>
        <input
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder={requiredConfirmationText}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        {confirmationText && !isConfirmationValid && (
          <p className="mt-2 text-sm text-red-600">
            {t('gdpr.delete.confirmationError')}
          </p>
        )}
      </div>

      {/* Final Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">{t('gdpr.delete.finalWarning')}</p>
            <p>{t('gdpr.delete.finalWarningDescription')}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setStep('warning')}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t('common.back')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isConfirmationValid || isSubmitting}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? t('gdpr.delete.processing') : t('gdpr.delete.confirmButton')}
        </button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900">
        {t('gdpr.delete.processingTitle')}
      </h2>
      <p className="text-gray-600">
        {t('gdpr.delete.processingDescription')}
      </p>
    </div>
  );

  const renderCompletedStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <Trash className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">
        {t('gdpr.delete.completedTitle')}
      </h2>
      <p className="text-gray-600">
        {t('gdpr.delete.completedDescription')}
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          {t('gdpr.delete.completedNote')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        {step !== 'processing' && step !== 'completed' && (
          <div className="flex justify-end mb-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Step Content */}
        {step === 'warning' && renderWarningStep()}
        {step === 'confirmation' && renderConfirmationStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'completed' && renderCompletedStep()}
      </div>
    </div>
  );
}; 
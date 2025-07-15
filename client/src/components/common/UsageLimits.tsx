import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { useTranslation } from 'react-i18next';

interface UsageLimitsProps {
  currentUsage: {
    companies: number;
    projects: number;
    workers: number;
    jobOffers: number;
    workRequests: number;
  };
  showUpgradeButton?: boolean;
  className?: string;
}

export const UsageLimits: React.FC<UsageLimitsProps> = ({ 
  currentUsage, 
  showUpgradeButton = true,
  className = '' 
}) => {
  const { t, i18n } = useTranslation('subscription');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
    };

    i18n.on('languageChanged', handleLanguageChange);
    window.addEventListener('languagechange', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [i18n]);
  const { 
    getUsageLimit, 
    getPlanName, 
    isPlanActive, 
    isTrialActive,
    getTrialDaysLeft,
    isTrialEndingSoon
  } = useSubscription();

  const limits = {
    companies: getUsageLimit('maxCompanies'),
    projects: getUsageLimit('maxProjects'),
    workers: getUsageLimit('maxWorkers'),
    jobOffers: getUsageLimit('maxJobOffers'),
    workRequests: getUsageLimit('maxWorkRequests')
  };

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === -1) return 0; // unlimited
    if (limit === 0) return 100;
    return Math.min(100, (current / limit) * 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number): string => {
    if (limit === -1) return tCommon('unlimited');
    return limit.toString();
  };

  const renderUsageItem = (
    label: string,
    current: number,
    limit: number,
    key: string
  ) => {
    const percentage = getUsagePercentage(current, limit);
    const isUnlimited = limit === -1;

    return (
      <div key={key} className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">
            {current} / {formatLimit(limit)}
          </span>
        </div>
        {!isUnlimited && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('subscription:usageLimits')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('subscription:currentPlan')}: {getPlanName()}
          </p>
        </div>
        {isTrialActive() && (
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600">
              {t('subscription:trialDaysLeft', { days: getTrialDaysLeft() })}
            </div>
            {isTrialEndingSoon() && (
              <div className="text-xs text-red-600">
                {t('subscription:trialEndingSoon')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {renderUsageItem(
          t('subscription:companies'),
          currentUsage.companies,
          limits.companies,
          'companies'
        )}
        {renderUsageItem(
          t('subscription:projects'),
          currentUsage.projects,
          limits.projects,
          'projects'
        )}
        {renderUsageItem(
          t('subscription:workers'),
          currentUsage.workers,
          limits.workers,
          'workers'
        )}
        {renderUsageItem(
          t('subscription:jobOffers'),
          currentUsage.jobOffers,
          limits.jobOffers,
          'jobOffers'
        )}
        {renderUsageItem(
          t('subscription:workRequests'),
          currentUsage.workRequests,
          limits.workRequests,
          'workRequests'
        )}
      </div>

      {showUpgradeButton && !isPlanActive() && (
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {t('subscription:upgradePlan')}
          </button>
        </div>
      )}
    </div>
  );
}; 
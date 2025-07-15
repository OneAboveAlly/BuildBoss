/**
 * AutoRefresh Component
 * 
 * Automatycznie odświeża aplikację po wykryciu zmian w kodzie
 * i zapewnia, że użytkownik zawsze ma najnowszą wersję
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

export const AutoRefresh: React.FC = () => {
  const { t } = useTranslation('common');
  const { 
    updateAvailable, 
    isChecking, 
    refreshApp, 
    dismissUpdate 
  } = useAutoRefresh({
    checkInterval: 30000, // 30 sekund
    autoRefreshDelay: 2000, // 2 sekundy
    enabled: true
  });

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-amber-200 p-4 animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">
              {t('autoRefresh.update_available')}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {t('autoRefresh.update_description')}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={refreshApp}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                <ArrowPathIcon className="w-3 h-3 mr-1" />
                {t('autoRefresh.refresh_now')}
              </button>
              <button
                onClick={dismissUpdate}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                {t('autoRefresh.later')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
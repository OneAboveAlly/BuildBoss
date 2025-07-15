/**
 * Offline Fallback Page
 * 
 * Displayed when the user is offline and tries to access
 * a page that's not cached
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SignalSlashIcon, 
  ArrowPathIcon,
  HomeIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export const OfflinePage: React.FC = () => {
  const { t } = useTranslation('common');

  const handleRetry = () => {
    window.location.reload();
  };

  const checkConnection = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      alert(t('pwa.still_offline'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <SignalSlashIcon className="mx-auto h-24 w-24 text-gray-400" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('pwa.offline_title', 'You\'re Offline')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('pwa.offline_page_description', 'This page is not available offline. Please check your internet connection and try again.')}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Retry button */}
          <button
            onClick={handleRetry}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            {t('pwa.retry', 'Try Again')}
          </button>

          {/* Check connection button */}
          <button
            onClick={checkConnection}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <WifiIcon className="w-4 h-4 mr-2" />
            {t('pwa.check_connection', 'Check Connection')}
          </button>

          {/* Go to home */}
          <Link
            to="/"
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            {t('pwa.go_home', 'Go to Home')}
          </Link>
        </div>

        {/* Offline tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <SignalSlashIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {t('pwa.offline_tips_title', 'Offline Tips')}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('pwa.offline_tip_1', 'Some pages may be available offline if you\'ve visited them before')}</li>
                  <li>{t('pwa.offline_tip_2', 'Your work is saved locally and will sync when you\'re back online')}</li>
                  <li>{t('pwa.offline_tip_3', 'Check your WiFi or mobile data connection')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Connection status */}
        <div className="mt-4 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            navigator.onLine 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {navigator.onLine ? (
              <>
                <WifiIcon className="w-3 h-3 mr-1" />
                {t('pwa.online', 'Online')}
              </>
            ) : (
              <>
                <SignalSlashIcon className="w-3 h-3 mr-1" />
                {t('pwa.offline', 'Offline')}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage; 
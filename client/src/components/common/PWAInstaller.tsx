/**
 * PWA Installer Component
 * 
 * Handles PWA installation prompts, service worker updates,
 * and offline status notifications for BuildBoss
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowDownTrayIcon, 
  CloudArrowDownIcon, 
  ExclamationTriangleIcon,
  XMarkIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAInstaller: React.FC = () => {
  const { t } = useTranslation('common');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Don't show if already installed or dismissed recently
      const dismissedAt = localStorage.getItem('pwa-install-dismissed');
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      
      if (!isInstalled && (!dismissedAt || Date.now() - parseInt(dismissedAt) > 7 * 24 * 60 * 60 * 1000)) {
        setShowInstallPrompt(true);
      }
    };

    // Handle online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Register service worker and handle updates
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const { Workbox } = await import('workbox-window');
          const wb = new Workbox('/sw.js');

          wb.addEventListener('installed', (event) => {
            if (event.isUpdate) {
              setShowUpdatePrompt(true);
              setServiceWorkerRegistration(wb as any);
              // Automatycznie odśwież po 3 sekundach jeśli użytkownik nie zareaguje
              setTimeout(() => {
                if (showUpdatePrompt) {
                  handleUpdate();
                }
              }, 3000);
            }
          });

          wb.addEventListener('waiting', () => {
            setShowUpdatePrompt(true);
            setServiceWorkerRegistration(wb as any);
            // Automatycznie odśwież po 2 sekundach
            setTimeout(() => {
              handleUpdate();
            }, 2000);
          });

          wb.addEventListener('controlling', () => {
            // Natychmiastowe odświeżenie po przejęciu kontroli
            window.location.reload();
          });

          const registration = await wb.register();
        } catch (error) {
          // Silent fail - don't spam console
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    registerServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // Installation accepted - no need to log
      } else {
        // Installation dismissed - store timestamp
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
    } catch (error) {
      // Silent fail - don't spam console
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleUpdate = () => {
    if (serviceWorkerRegistration) {
      // Skip waiting and activate new service worker
      (serviceWorkerRegistration as any).messageSkipWaiting();
    }
    setShowUpdatePrompt(false);
  };

  const handleUpdateDismiss = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center space-x-2">
            <SignalSlashIcon className="w-4 h-4" />
            <span>{t('pwa.offline_mode')}</span>
            <span className="text-amber-100">
              {t('pwa.offline_description')}
            </span>
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <ArrowDownTrayIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {t('pwa.install_title')}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {t('pwa.install_description')}
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleInstallClick}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                    {t('pwa.install_button')}
                  </button>
                  <button
                    onClick={handleInstallDismiss}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t('pwa.install_dismiss')}
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleInstallDismiss}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CloudArrowDownIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {t('pwa.update_title')}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {t('pwa.update_description')}
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleUpdate}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CloudArrowDownIcon className="w-3 h-3 mr-1" />
                    {t('pwa.update_button')}
                  </button>
                  <button
                    onClick={handleUpdateDismiss}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {t('pwa.update_dismiss')}
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleUpdateDismiss}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="fixed bottom-20 right-4 z-30">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isOffline 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {isOffline ? (
            <SignalSlashIcon className="w-3 h-3 mr-1" />
          ) : (
            <WifiIcon className="w-3 h-3 mr-1" />
          )}
          {isOffline ? t('pwa.offline') : t('pwa.online')}
        </div>
      </div>
    </>
  );
};

export default PWAInstaller; 
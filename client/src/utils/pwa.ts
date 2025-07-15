/**
 * PWA Utilities
 * 
 * Utility functions for PWA functionality including
 * service worker management, offline detection, and caching strategies
 */

import { Workbox } from 'workbox-window';

let workbox: Workbox | null = null;

/**
 * Initialize service worker with Workbox
 */
export const initializeServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser');
    return null;
  }

  try {
    workbox = new Workbox('/sw.js');
    
    // Set up event listeners
    workbox.addEventListener('installed', (event) => {
      console.log('Service Worker installed', event);
      if (event.isUpdate) {
        console.log('New service worker version available');
        // Dispatch custom event for update notification
        window.dispatchEvent(new CustomEvent('sw-update-available'));
      }
    });

    workbox.addEventListener('waiting', () => {
      console.log('Service Worker waiting to activate');
      window.dispatchEvent(new CustomEvent('sw-waiting'));
    });

    workbox.addEventListener('controlling', () => {
      console.log('Service Worker is now controlling the page');
      // window.location.reload();
    });

    workbox.addEventListener('activated', (event) => {
      console.log('Service Worker activated', event);
      window.dispatchEvent(new CustomEvent('sw-activated'));
    });

    const registration = await workbox.register();
    console.log('Service Worker registered successfully:', registration);
    return registration || null;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Update service worker when new version is available
 */
export const updateServiceWorker = (): void => {
  if (workbox) {
    workbox.messageSkipWaiting();
  }
};

/**
 * Check if the app is running in standalone mode (PWA)
 */
export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

/**
 * Check if the app is installable
 */
export const isInstallable = (): boolean => {
  return 'beforeinstallprompt' in window;
};

/**
 * Get network connection status
 */
export const getConnectionStatus = (): {
  online: boolean;
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
} => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  return {
    online: navigator.onLine,
    type: connection?.type,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt
  };
};

/**
 * Cache important resources manually
 */
export const cacheImportantResources = async (urls: string[]): Promise<void> => {
  if (!('caches' in window)) {
    console.warn('Cache API not supported');
    return;
  }

  try {
    const cache = await caches.open('buildboss-important-v1');
    await cache.addAll(urls);
    console.log('Important resources cached:', urls);
  } catch (error) {
    console.error('Failed to cache important resources:', error);
  }
};

/**
 * Get cached response for offline fallback
 */
export const getCachedResponse = async (url: string): Promise<Response | null> => {
  if (!('caches' in window)) {
    return null;
  }

  try {
    const response = await caches.match(url);
    return response || null;
  } catch (error) {
    console.error('Failed to get cached response:', error);
    return null;
  }
};

/**
 * Clear old caches
 */
export const clearOldCaches = async (currentCacheName: string): Promise<void> => {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => name !== currentCacheName);
    
    await Promise.all(
      oldCaches.map(name => caches.delete(name))
    );
    
    console.log('Old caches cleared:', oldCaches);
  } catch (error) {
    console.error('Failed to clear old caches:', error);
  }
};

/**
 * Show install prompt
 */
export const showInstallPrompt = async (deferredPrompt: any): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    return outcome === 'accepted';
  } catch (error) {
    console.error('Install prompt failed:', error);
    return false;
  }
};

/**
 * Add to home screen banner for iOS
 */
export const shouldShowIOSInstallBanner = (): boolean => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = isPWA();
  const hasBeenPrompted = localStorage.getItem('ios-install-prompted') === 'true';
  
  return isIOS && !isInStandaloneMode && !hasBeenPrompted;
};

/**
 * Track PWA usage analytics
 */
export const trackPWAUsage = (event: string, data?: any): void => {
  // Analytics integration point
  console.log('PWA Event:', event, data);
  
  // You can integrate with your analytics service here
  // For example: gtag('event', event, data);
};

/**
 * Sync data when online
 */
export const syncWhenOnline = (callback: () => Promise<void>): void => {
  if (navigator.onLine) {
    callback().catch(console.error);
  } else {
    const handleOnline = () => {
      callback().catch(console.error);
      window.removeEventListener('online', handleOnline);
    };
    window.addEventListener('online', handleOnline);
  }
};

/**
 * Store data for offline use
 */
export const storeOfflineData = (key: string, data: any): void => {
  try {
    localStorage.setItem(`offline_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to store offline data:', error);
  }
};

/**
 * Retrieve offline data
 */
export const getOfflineData = (key: string, maxAge = 24 * 60 * 60 * 1000): any => {
  try {
    const stored = localStorage.getItem(`offline_${key}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const age = Date.now() - parsed.timestamp;
    
    if (age > maxAge) {
      localStorage.removeItem(`offline_${key}`);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Failed to retrieve offline data:', error);
    return null;
  }
};

// Force update Service Worker
export async function forceUpdateServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Service Worker update forced');
      }
    } catch (error) {
      console.error('Failed to force update Service Worker:', error);
    }
  }
}

/**
 * Clear update state from localStorage
 * Use this function to reset the update notification state
 */
export const clearUpdateState = (): void => {
  try {
    localStorage.removeItem('last-checked-version');
    localStorage.removeItem('app-version');
    console.log('✅ Update state cleared from localStorage');
    
    // Reload the page to reset the state
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear update state:', error);
  }
};

/**
 * Debug function to check current update state
 */
export const debugUpdateState = (): void => {
  const lastCheckedVersion = localStorage.getItem('last-checked-version');
  const appVersion = localStorage.getItem('app-version');
  const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
  
  console.log('🔍 Update State Debug:', {
    lastCheckedVersion,
    appVersion,
    currentVersion,
    hasUpdate: lastCheckedVersion !== currentVersion
  });
}; 
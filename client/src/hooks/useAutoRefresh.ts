/**
 * useAutoRefresh Hook
 * 
 * Hook do automatycznego odświeżania aplikacji po wykryciu zmian
 */

import { useEffect, useState, useCallback } from 'react';

interface UseAutoRefreshOptions {
  checkInterval?: number; // ms
  autoRefreshDelay?: number; // ms
  enabled?: boolean;
}

export const useAutoRefresh = (options: UseAutoRefreshOptions = {}) => {
  const {
    checkInterval = 30000, // 30 sekund
    autoRefreshDelay = 2000, // 2 sekundy
    enabled = true
  } = options;

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);

  // Sprawdź czy jest nowa wersja aplikacji
  const checkForUpdates = useCallback(async () => {
    if (!enabled) return;

    setIsChecking(true);
    try {
      // Sprawdź wersję aplikacji z meta tagów
      const appVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
      const buildTime = document.querySelector('meta[name="build-time"]')?.getAttribute('content');
      
      // Sprawdź czy Service Worker ma nową wersję
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Sprawdź czy jest nowa wersja Service Worker
          await registration.update();
        }
      }

      // Sprawdź czy główny plik aplikacji się zmienił
      const response = await fetch('/src/main.tsx', {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        setUpdateAvailable(true);
      }

      setLastCheck(new Date());
    } catch (error) {
      console.log('Sprawdzanie aktualizacji:', error);
      // Jeśli nie można sprawdzić, prawdopodobnie jest nowa wersja
      setUpdateAvailable(true);
    } finally {
      setIsChecking(false);
    }
  }, [enabled]);

  // Automatyczne odświeżenie
  const refreshApp = useCallback(() => {
    console.log('[useAutoRefresh] refreshApp wywołany!');
    // Wyczyść cache przed odświeżeniem
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Wyczyść localStorage jeśli potrzebne
    const keysToClear = ['app-cache-version', 'last-update-check'];
    keysToClear.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

    // Odśwież stronę
    console.log('[useAutoRefresh] window.location.reload() wywołany!');
    window.location.reload();
  }, []);

  // Automatyczne odświeżenie po opóźnieniu
  const autoRefresh = useCallback(() => {
    if (updateAvailable) {
      if (import.meta.env.DEV) {
        console.log('[useAutoRefresh] DEV: updateAvailable, ale nie reloaduję automatycznie!');
        return;
      }
      setTimeout(() => {
        console.log('[useAutoRefresh] PROD: updateAvailable, reloaduję aplikację!');
        refreshApp();
      }, autoRefreshDelay);
    }
  }, [updateAvailable, autoRefreshDelay, refreshApp]);

  // Anuluj aktualizację
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    // Pokaż ponownie za 5 minut
    setTimeout(() => {
      if (enabled) {
        setUpdateAvailable(true);
      }
    }, 5 * 60 * 1000);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Sprawdzaj aktualizacje co określony czas
    const interval = setInterval(checkForUpdates, checkInterval);

    // Sprawdzaj gdy użytkownik wraca do karty
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkForUpdates, 1000);
      }
    };

    // Sprawdzaj gdy połączenie wraca
    const handleOnline = () => {
      setTimeout(checkForUpdates, 2000);
    };

    // Nasłuchuj na zmiany w Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          setUpdateAvailable(true);
        }
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    // Pierwsze sprawdzenie
    checkForUpdates();

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForUpdates, checkInterval, enabled]);

  // Automatyczne odświeżenie gdy wykryto aktualizację
  useEffect(() => {
    if (updateAvailable) {
      autoRefresh();
    }
  }, [updateAvailable, autoRefresh]);

  return {
    updateAvailable,
    isChecking,
    lastCheck,
    checkForUpdates,
    refreshApp,
    dismissUpdate
  };
}; 
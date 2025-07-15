import { useEffect, useState, useRef } from 'react';
import { forceUpdateServiceWorker } from '../utils/pwa';

export const useAppUpdate = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const reloadTimeout = useRef<NodeJS.Timeout | null>(null);

  // Funkcja do resetowania stanu aktualizacji
  const resetUpdateState = () => {
    const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
    if (currentVersion) {
      localStorage.setItem('last-checked-version', currentVersion);
      localStorage.setItem('app-version', currentVersion);
    }
    setHasUpdate(false);
    setUpdateSuccess(false);
  };

  const checkForUpdate = async () => {
    try {
      setIsChecking(true);
      
      // W trybie deweloperskim nie sprawdzaj aktualizacji
      if (import.meta.env.DEV) {
        console.log('🔧 Development mode - skipping update check');
        setHasUpdate(false);
        return;
      }
      
      // 1. Sprawdź wersję backendu i frontendu z timeoutem
      let backendVersion, frontendVersion;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekund timeout
        
        const response = await fetch('/api/version', { 
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn('API version endpoint nie odpowiada:', response.status);
          return;
        }
        
        const versionData = await response.json();
        backendVersion = versionData.backendVersion;
        frontendVersion = versionData.frontendVersion;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Timeout podczas sprawdzania wersji - pomijam');
        } else {
          console.warn('Błąd podczas sprawdzania wersji API:', error);
        }
        return;
      }
      
      // 2. Pobierz aktualną wersję z meta tagu
      const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
      
      // 3. Pobierz ostatnią sprawdzoną wersję z localStorage
      const lastCheckedVersion = localStorage.getItem('last-checked-version');
      const storedAppVersion = localStorage.getItem('app-version');
      
      console.log('🔍 Checking for updates:', {
        currentVersion,
        lastCheckedVersion,
        storedAppVersion,
        backendVersion,
        frontendVersion
      });
      
      // 4. Porównaj wersje - tylko jeśli się zmieniły od ostatniego sprawdzenia
      if (currentVersion && lastCheckedVersion && currentVersion !== lastCheckedVersion) {
        setHasUpdate(true);
        console.log('🔄 Nowa wersja wykryta:', { old: lastCheckedVersion, new: currentVersion });
      } else if (currentVersion && !lastCheckedVersion) {
        // Pierwsze uruchomienie - zapisz aktualną wersję
        localStorage.setItem('last-checked-version', currentVersion);
        localStorage.setItem('app-version', currentVersion);
        setHasUpdate(false);
      } else {
        // Wersje są identyczne - nie ma aktualizacji
        setHasUpdate(false);
      }
      
      // 5. Sprawdź czy Service Worker ma nową wersję (tylko w produkcji)
      if ('serviceWorker' in navigator && !import.meta.env.DEV) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.waiting) {
            setHasUpdate(true);
            console.log('🔄 Service Worker czeka na aktywację');
          }
        } catch (swError) {
          console.warn('Błąd sprawdzania Service Worker:', swError);
        }
      }
    } catch (error) {
      console.warn('Błąd sprawdzania aktualizacji:', error);
      setHasUpdate(false);
    } finally {
      setIsChecking(false);
    }
  };

  const clearAllCachesAndReload = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        Promise.all(names.map(name => caches.delete(name))).then(() => {
          (window as any).location.reload();
        });
      });
    } else {
      (window as any).location.reload();
    }
  };

  const applyUpdate = () => {
    // 1. Wymuś update Service Workera
    forceUpdateServiceWorker();
    
    // 2. Zaktualizuj wersję w localStorage
    const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
    if (currentVersion) {
      localStorage.setItem('last-checked-version', currentVersion);
      localStorage.setItem('app-version', currentVersion);
    }
    
    // 3. Pokaż komunikat o udanej aktualizacji
    setUpdateSuccess(true);
    setHasUpdate(false);
    
    // 4. Ukryj komunikat po 3 sekundach i zresetuj stan
    setTimeout(() => {
      setUpdateSuccess(false);
      resetUpdateState();
    }, 3000);
    
    // 5. Fallback: jeśli SW nie przejmie kontroli w 5 sekund, twardy reload
    if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
    reloadTimeout.current = setTimeout(() => {
      clearAllCachesAndReload();
    }, 5000);
    
    // 6. Jeśli SW przejmie kontrolę szybciej, reload nastąpi automatycznie
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
        clearAllCachesAndReload();
      });
    }
  };

  useEffect(() => {
    // W trybie deweloperskim nie ustawiaj listenerów
    if (import.meta.env.DEV) {
      console.log('🔧 Development mode - update notifications disabled');
      return;
    }
    
    // Listen for Service Worker update events
    const handleSWUpdate = () => {
      setHasUpdate(true);
    };
    const handleSWWaiting = () => {
      setHasUpdate(true);
    };
    const handleSWActivated = () => {
      // Reset po aktywacji SW
      resetUpdateState();
    };
    
    window.addEventListener('sw-update-available', handleSWUpdate);
    window.addEventListener('sw-waiting', handleSWWaiting);
    window.addEventListener('sw-activated', handleSWActivated);
    
    // Sprawdź aktualizacje co 5 minut (zamiast 2)
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
    
    // Sprawdź przy pierwszym uruchomieniu
    checkForUpdate();
    
    // Sprawdź gdy użytkownik wraca do karty
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sw-update-available', handleSWUpdate);
      window.removeEventListener('sw-waiting', handleSWWaiting);
      window.removeEventListener('sw-activated', handleSWActivated);
      if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
    };
  }, []);

  return {
    hasUpdate,
    isChecking,
    updateSuccess,
    checkForUpdate,
    applyUpdate,
    resetUpdateState
  };
}; 
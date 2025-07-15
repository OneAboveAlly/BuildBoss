import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'
import './i18n'

// Initialize Sentry after other imports
import { initSentry } from './config/sentry';

import App from './App.tsx'
import { initializeServiceWorker, clearUpdateState, debugUpdateState } from './utils/pwa';

// --- Fallback na typowe cache error (np. Cannot read property ... of null) ---
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('NO_DEVICE_SPACE')) {
    alert('Brak miejsca na urządzeniu. Zwolnij trochę przestrzeni, aby móc korzystać z aplikacji.');
  }
});

// Dodaj funkcje debugowania do globalnego obiektu window
(window as any).clearUpdateState = clearUpdateState;
(window as any).debugUpdateState = debugUpdateState;

// Dodaj prostszą wersję funkcji debugowania
(window as any).debugUpdate = () => {
  const lastCheckedVersion = localStorage.getItem('last-checked-version');
  const appVersion = localStorage.getItem('app-version');
  const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
  
  console.log('🔍 Update State Debug:', {
    lastCheckedVersion,
    appVersion,
    currentVersion,
    hasUpdate: lastCheckedVersion !== currentVersion
  });
  
  return {
    lastCheckedVersion,
    appVersion,
    currentVersion,
    hasUpdate: lastCheckedVersion !== currentVersion
  };
};

// Dodaj funkcję do czyszczenia stanu
(window as any).clearUpdate = () => {
  localStorage.removeItem('last-checked-version');
  localStorage.removeItem('app-version');
  console.log('✅ Update state cleared from localStorage');
  window.location.reload();
};

// Dodaj funkcję do sprawdzenia Service Worker
(window as any).checkServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('🔧 Service Worker Status:', {
        exists: !!registration,
        waiting: !!registration?.waiting,
        active: !!registration?.active,
        installing: !!registration?.installing,
        scope: registration?.scope,
        updateViaCache: registration?.updateViaCache
      });
      
      if (registration?.waiting) {
        console.log('⚠️ Service Worker czeka na aktywację!');
      }
      
      return registration;
    } catch (error) {
      console.error('❌ Błąd sprawdzania Service Worker:', error);
      return null;
    }
  } else {
    console.log('❌ Service Worker nie jest obsługiwany');
    return null;
  }
};

// Dodaj funkcję do wymuszenia aktualizacji Service Worker
(window as any).forceSWUpdate = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('🔄 Service Worker update wymuszony');
      }
    } catch (error) {
      console.error('❌ Błąd wymuszania aktualizacji SW:', error);
    }
  }
};

// Auto-refresh mechanism for new app versions
const checkForAppUpdate = () => {
  try {
    // Skip auto-refresh in development mode
    if (import.meta.env.DEV) {
      return;
    }
    
    const meta = document.querySelector('meta[name="app-version"]');
    const currentVersion = meta?.getAttribute('content');
    const storedVersion = localStorage.getItem('app-version');
    
    if (storedVersion && currentVersion && storedVersion !== currentVersion) {
      console.log('🔄 New app version detected, refreshing...', {
        old: storedVersion,
        new: currentVersion
      });
      // Store new version BEFORE reload to prevent infinite loop
      localStorage.setItem('app-version', currentVersion);
      // Clear all caches and reload
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      console.log('[main.tsx] window.location.reload() wywołany!');
      window.location.reload();
      return;
    }
    // Jeśli nie ma storedVersion, zapisz currentVersion i NIE reloaduj!
    if (!storedVersion && currentVersion) {
      localStorage.setItem('app-version', currentVersion);
      // NIE reloaduj!
    }
  } catch (error) {
    console.warn('Failed to check for app update:', error);
  }
};

// Check for updates on app start
checkForAppUpdate();

// Initialize Sentry
try {
  initSentry();
} catch (error) {
  console.warn('Failed to initialize Sentry:', error);
}

// Initialize PWA service worker
if (import.meta.env.PROD) {
  initializeServiceWorker().catch(console.error);
}

// Ustaw wersję appki w meta tagu na starcie (runtime)
const meta = document.querySelector('meta[name="app-version"]');
if (meta) {
  meta.setAttribute('content', import.meta.env.VITE_APP_VERSION);
}

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (event.reason.name === 'QuotaExceededError' ||
    (typeof event.reason.message === 'string' && event.reason.message.includes('NO_DEVICE_SPACE')))) {
    alert('Brak miejsca na urządzeniu. Zwolnij trochę przestrzeni, aby móc korzystać z aplikacji.');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Hook do automatycznego odświeżania danych użytkownika w kluczowych momentach
export const useAutoRefreshUser = () => {
  const { refreshUser, user, token } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Odśwież dane użytkownika po powrocie ze Stripe Success
    if (location.pathname === '/subscription/success' && token && user) {
      const timer = setTimeout(() => {
        refreshUser().catch((err: Error) => {
          console.error('Failed to refresh user after subscription:', err);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Odśwież dane użytkownika po powrocie z zewnętrznych stron
    if (location.pathname === '/dashboard' && token && user) {
      // Sprawdź czy użytkownik wrócił z zewnętrznej strony
      const wasExternal = sessionStorage.getItem('was_external');
      if (wasExternal) {
        sessionStorage.removeItem('was_external');
        refreshUser().catch((err: Error) => {
          console.error('Failed to refresh user after external return:', err);
        });
      }
    }
  }, [location, refreshUser, token, user]);

  // Oznacz jako zewnętrzną stronę gdy użytkownik opuszcza aplikację
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (location.pathname.includes('/subscription') || 
          location.pathname.includes('/payment')) {
        sessionStorage.setItem('was_external', 'true');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location]);
}; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType, AuthLoginResult } from '../types';
import { authService } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';
import { setSentryUser, clearSentryUser, addBreadcrumb } from '../config/sentry';
import { SessionExpiredModal } from '../components/auth/SessionExpiredModal';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    // Check for existing token on app start
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      // Verify token and get user data
      authService.getMe(savedToken)
        .then((response) => {
          const userData = { ...response.user, ownedCompaniesCount: response.ownedCompaniesCount };
          setUser(userData);
          // Set user context in Sentry
          setSentryUser({
            id: response.user.id,
            email: response.user.email,
            role: response.user.role
          });
          addBreadcrumb('User authenticated from stored token', 'auth', 'info', {
            userId: response.user.id,
            role: response.user.role
          });
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setToken(null);
          clearSentryUser();
          addBreadcrumb('Invalid token removed from storage', 'auth', 'info');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  }, [user, token, loading]);

  const login: (email: string, password: string) => Promise<AuthLoginResult> = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setToken(response.token);
      try {
        localStorage.setItem('token', response.token);
      } catch (e) {
        if (e instanceof Error && (e.name === 'QuotaExceededError' || (typeof e.message === 'string' && e.message.includes('NO_DEVICE_SPACE')))) {
          alert('Brak miejsca na urządzeniu. Zwolnij trochę przestrzeni, aby móc się zalogować.');
        } else {
          throw e;
        }
      }
      
      // Odśwież informacje o subskrypcji po zalogowaniu
      if (response.user) {
        try {
          await refreshSubscription();
        } catch (error) {
          // Silent fail - nie blokuj logowania jeśli nie udało się odświeżyć subskrypcji
        }
      }
      
      // Set user context in Sentry
      setSentryUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      });
      addBreadcrumb('User logged in', 'auth', 'info', {
        userId: response.user.id,
        role: response.user.role
      });
      return { success: true };
    } catch (error) {
      addBreadcrumb('Login failed', 'auth', 'error', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    setLoading(true);
    try {
      const response = await authService.register({ email, password, firstName, lastName });
      setUser(response.user);
      setToken(response.token);
      try {
        localStorage.setItem('token', response.token);
      } catch (e) {
        if (e instanceof Error && (e.name === 'QuotaExceededError' || (typeof e.message === 'string' && e.message.includes('NO_DEVICE_SPACE')))) {
          alert('Brak miejsca na urządzeniu. Zwolnij trochę przestrzeni, aby móc się zalogować.');
        } else {
          throw e;
        }
      }
      
      // Set user context in Sentry
      setSentryUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role
      });
      
      addBreadcrumb('User registered', 'auth', 'info', {
        userId: response.user.id,
        role: response.user.role
      });
    } catch (error) {
      addBreadcrumb('Registration failed', 'auth', 'error', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async (): Promise<User> => {
    const currentToken = token || localStorage.getItem('token');
    if (currentToken) {
      try {
        const response = await authService.getMe(currentToken);
        const userData = { ...response.user, ownedCompaniesCount: response.ownedCompaniesCount };
        setUser(userData);
        
        // Update user context in Sentry
        setSentryUser({
          id: response.user.id,
          email: response.user.email,
          role: response.user.role
        });
        
        return userData;
      } catch (error: any) {
        // Sprawdź typ błędu
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token jest nieprawidłowy, wyloguj użytkownika i pokaż modal
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          clearSentryUser();
          addBreadcrumb('User logged out (session expired)', 'auth', 'info');
          setShowSessionExpired(true);
          throw error;
        } else if (error.response?.status === 500) {
          // Błąd serwera - nie wylogowuj użytkownika, tylko zaloguj błąd
          console.warn('Server error during user refresh, keeping current state');
          throw error;
        } else {
          // Inne błędy - nie wylogowuj użytkownika
          console.warn('Error during user refresh, keeping current state:', error.message);
          throw error;
        }
      }
    }
    throw new Error('No token available');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    clearSentryUser();
    addBreadcrumb('User logged out', 'auth', 'info');
    setShowSessionExpired(false);
  };

  const handleSessionExpiredClose = () => {
    setShowSessionExpired(false);
  };

  const handleSessionExpiredLogin = () => {
    setShowSessionExpired(false);
    window.location.href = '/login';
  };

  // Subscription helpers
  const hasFeature = (feature: keyof NonNullable<User['subscription']>['plan']): boolean => {
    if (!user?.subscription?.plan) return false;
    
    // Sprawdź czy to pole boolean (funkcjonalność)
    const booleanFeatures = [
      'hasAdvancedReports',
      'hasApiAccess', 
      'hasPrioritySupport',
      'hasCustomBranding',
      'hasTeamManagement'
    ];
    
    if (booleanFeatures.includes(feature)) {
      return user.subscription.plan[feature] === true;
    }
    
    return false;
  };

  const getUsageLimit = (limit: string): number => {
    if (!user?.subscription?.plan) {
      return 0;
    }
    
    // Mapowanie nazw limitów na pola w planie
    const limitMap: Record<string, keyof NonNullable<User['subscription']>['plan']> = {
      'maxCompanies': 'maxCompanies',
      'maxProjects': 'maxProjects',
      'maxWorkers': 'maxWorkers',
      'maxJobOffers': 'maxJobOffers',
      'maxWorkRequests': 'maxWorkRequests',
      'maxStorageGB': 'maxStorageGB'
    };
    
    const field = limitMap[limit];
    if (!field) {
      return 0;
    }
    
    const value = (user.subscription.plan[field] as number) || 0;
    return value;
  };

  const isSubscriptionActive = (): boolean => {
    if (!user?.subscription) return false;
    return ['ACTIVE', 'TRIAL'].includes(user.subscription.status);
  };

  const isTrialActive = (): boolean => {
    if (!user?.subscription) return false;
    return user.subscription.status === 'TRIAL';
  };

  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const subscriptionData = await subscriptionService.getCurrentSubscription();
      
      if (subscriptionData) {
        setUser(prev => prev ? {
          ...prev,
          subscription: {
            status: subscriptionData.status,
            plan: subscriptionData.plan,
            trialEndDate: subscriptionData.trialEndDate,
            nextBillingDate: subscriptionData.nextBillingDate
          }
        } : null);
      }
    } catch (error) {
      console.warn('Error refreshing subscription:', error);
      // Silent fail - don't break the app if subscription refresh fails
    }
  };

  // Funkcja do odświeżania danych użytkownika po zmianach w subskrypcji
  const refreshUserData = async (): Promise<void> => {
    if (!user) return;
    
    try {
      await refreshUser();
    } catch (error) {
      console.warn('Error refreshing user data:', error);
    }
  };

  // Funkcja do wymuszenia odświeżenia danych użytkownika z backendu
  const forceRefreshUserData = async (): Promise<void> => {
    if (!user) return;
    
    try {
      // Usuń token z localStorage, aby wymusić ponowne pobranie danych
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        localStorage.removeItem('token');
        localStorage.setItem('token', currentToken);
      }
      await refreshUser();
    } catch (error) {
      console.warn('Error force refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    loading,
    hasFeature,
    getUsageLimit,
    isSubscriptionActive,
    isTrialActive,
    refreshSubscription,
    refreshUserData,
    forceRefreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredModal
        isOpen={showSessionExpired}
        onClose={handleSessionExpiredClose}
        onLogin={handleSessionExpiredLogin}
      />
    </AuthContext.Provider>
  );
}; 
import { useAuth } from '../contexts/AuthContext';

export const useSubscription = () => {
  const { 
    user, 
    hasFeature, 
    getUsageLimit, 
    isSubscriptionActive, 
    isTrialActive, 
    refreshSubscription 
  } = useAuth();

  const canCreateCompany = (currentCount: number): boolean => {
    const limit = getUsageLimit('maxCompanies');
    return limit === -1 || currentCount < limit; // -1 = unlimited
  };

  const canCreateProject = (currentCount: number): boolean => {
    const limit = getUsageLimit('maxProjects');
    return limit === -1 || currentCount < limit;
  };

  const canAddWorker = (currentCount: number): boolean => {
    const limit = getUsageLimit('maxWorkers');
    return limit === -1 || currentCount < limit;
  };

  const canCreateJobOffer = (currentCount: number): boolean => {
    const limit = getUsageLimit('maxJobOffers');
    return limit === -1 || currentCount < limit;
  };

  const canCreateWorkRequest = (currentCount: number): boolean => {
    const limit = getUsageLimit('maxWorkRequests');
    return limit === -1 || currentCount < limit;
  };

  const canUseAdvancedReports = (): boolean => {
    return hasFeature('hasAdvancedReports');
  };

  const canUseApiAccess = (): boolean => {
    return hasFeature('hasApiAccess');
  };

  const canUsePrioritySupport = (): boolean => {
    return hasFeature('hasPrioritySupport');
  };

  const canUseCustomBranding = (): boolean => {
    return hasFeature('hasCustomBranding');
  };

  const canUseTeamManagement = (): boolean => {
    return hasFeature('hasTeamManagement');
  };

  const getPlanName = (): string => {
    return user?.subscription?.plan?.displayName || 'Free';
  };

  const getPlanStatus = (): string => {
    if (!user?.subscription) return 'Free';
    if (isTrialActive()) return 'Trial';
    return user.subscription.status;
  };

  const isPlanActive = (): boolean => {
    return isSubscriptionActive();
  };

  const getTrialDaysLeft = (): number => {
    if (!user?.subscription?.trialEndDate) return 0;
    
    const trialEnd = new Date(user.subscription.trialEndDate);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const isTrialEndingSoon = (): boolean => {
    const daysLeft = getTrialDaysLeft();
    return daysLeft <= 3 && daysLeft > 0;
  };

  return {
    // User info
    user,
    getPlanName,
    getPlanStatus,
    isPlanActive,
    isTrialActive,
    
    // Limits
    canCreateCompany,
    canCreateProject,
    canAddWorker,
    canCreateJobOffer,
    canCreateWorkRequest,
    getUsageLimit,
    
    // Features
    canUseAdvancedReports,
    canUseApiAccess,
    canUsePrioritySupport,
    canUseCustomBranding,
    canUseTeamManagement,
    hasFeature,
    
    // Trial
    getTrialDaysLeft,
    isTrialEndingSoon,
    
    // Actions
    refreshSubscription
  };
}; 
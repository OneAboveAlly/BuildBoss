import type { 
  SubscriptionPlan, 
  Subscription, 
  SubscriptionResponse, 
  PlansResponse, 
  CheckoutResponse, 
  UsageResponse,
  CreateCheckoutRequest,
  CancelSubscriptionRequest
} from '../types/subscription';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
};

export const subscriptionService = {
  // Pobierz dostępne plany subskrypcji
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data: PlansResponse = await handleResponse(response);
      return data.plans;
    } catch (error) {
      console.error('Błąd pobierania planów:', error);
      throw error;
    }
  },

  // Pobierz aktualną subskrypcję użytkownika
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data: SubscriptionResponse = await handleResponse(response);
      return data.subscription;
    } catch (error) {
      console.error('Błąd pobierania subskrypcji:', error);
      throw error;
    }
  },

  // Utwórz sesję checkout dla płatności
  async createCheckoutSession(planId: string): Promise<{ sessionId: string; url: string }> {
    try {
      const requestData: CreateCheckoutRequest = { planId };
      
      const response = await fetch(`${API_BASE_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const data: CheckoutResponse = await handleResponse(response);
      return {
        sessionId: data.sessionId,
        url: data.url
      };
    } catch (error) {
      console.error('Błąd tworzenia sesji checkout:', error);
      throw error;
    }
  },

  // Anuluj subskrypcję
  async cancelSubscription(reason?: string): Promise<Subscription> {
    try {
      const requestData: CancelSubscriptionRequest = { reason };
      
      const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      const data = await handleResponse(response);
      return data.subscription;
    } catch (error) {
      console.error('Błąd anulowania subskrypcji:', error);
      throw error;
    }
  },

  // Reaktywuj anulowaną subskrypcję
  async reactivateSubscription(): Promise<Subscription> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/reactivate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await handleResponse(response);
      return data.subscription;
    } catch (error) {
      console.error('Błąd reaktywacji subskrypcji:', error);
      throw error;
    }
  },

  // Pobierz statystyki użycia
  async getUsageStats(): Promise<UsageResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/usage`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data: UsageResponse = await handleResponse(response);
      return data;
    } catch (error) {
      console.error('Błąd pobierania statystyk użycia:', error);
      throw error;
    }
  },

  // Sprawdź czy użytkownik ma aktywną subskrypcję
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) return false;

      const now = new Date();
      const isTrialActive = subscription.status === 'TRIAL' && 
                           subscription.trialEndDate && 
                           new Date(subscription.trialEndDate) > now;
      const isSubscriptionActive = subscription.status === 'ACTIVE';

      return isTrialActive || isSubscriptionActive;
    } catch (error) {
      console.error('Błąd sprawdzania subskrypcji:', error);
      return false;
    }
  },

  // Sprawdź czy użytkownik ma dostęp do funkcji premium
  async hasPremiumFeature(featureName: keyof Pick<SubscriptionPlan, 'hasAdvancedReports' | 'hasApiAccess' | 'hasPrioritySupport' | 'hasCustomBranding' | 'hasTeamManagement'>): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) return false;

      const hasActiveSubscription = await this.hasActiveSubscription();
      if (!hasActiveSubscription) return false;

      return subscription.plan[featureName] === true;
    } catch (error) {
      console.error('Błąd sprawdzania funkcji premium:', error);
      return false;
    }
  },

  // Sprawdź limit zasobu
  async checkResourceLimit(resourceType: string): Promise<{ canCreate: boolean; current: number; max: number }> {
    try {
      const usageData = await this.getUsageStats();
      const { usage, limits } = usageData;

      let current = 0;
      let max = 0;

      switch (resourceType) {
        case 'companies':
          current = usage.companies;
          max = limits.maxCompanies;
          break;
        case 'projects':
          current = usage.projects;
          max = limits.maxProjects;
          break;
        case 'workers':
          current = usage.workers;
          max = limits.maxWorkers;
          break;
        case 'jobOffers':
          current = usage.jobOffers;
          max = limits.maxJobOffers;
          break;
        case 'workRequests':
          current = usage.workRequests;
          max = limits.maxWorkRequests;
          break;
        default:
          throw new Error(`Nieznany typ zasobu: ${resourceType}`);
      }

      const canCreate = max === -1 || current < max; // -1 = unlimited

      return { canCreate, current, max };
    } catch (error) {
      console.error('Błąd sprawdzania limitu zasobu:', error);
      throw error;
    }
  },

  // Przekieruj do Stripe Checkout
  async redirectToCheckout(planId: string): Promise<void> {
    try {
      const { url } = await this.createCheckoutSession(planId);
      window.location.href = url;
    } catch (error) {
      console.error('Błąd przekierowania do checkout:', error);
      throw error;
    }
  },

  // Formatuj datę dla wyświetlenia
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Formatuj datę i czas dla wyświetlenia
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Oblicz dni do końca okresu próbnego
  getDaysUntilTrialEnd(trialEndDate: string): number {
    const now = new Date();
    const endDate = new Date(trialEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },

  // Sprawdź czy okres próbny kończy się wkrótce (mniej niż 3 dni)
  isTrialEndingSoon(trialEndDate: string): boolean {
    const daysLeft = this.getDaysUntilTrialEnd(trialEndDate);
    return daysLeft <= 3 && daysLeft > 0;
  }
}; 
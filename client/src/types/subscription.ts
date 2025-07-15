// ETAP 10 - Subscription & Payment Types

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  price: number;
  currency: string;
  priceFormatted?: string;
  maxCompanies: number;
  maxProjects: number;
  maxWorkers: number;
  maxJobOffers: number;
  maxWorkRequests: number;
  maxStorageGB: number;
  hasAdvancedReports: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  hasTeamManagement: boolean;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  plan: SubscriptionPlan;
  usage: UsageStats;
  recentPayments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface UsageStats {
  companies: number;
  projects: number;
  workers: number;
  jobOffers: number;
  workRequests: number;
}

export interface UsageLimits {
  maxCompanies: number;
  maxProjects: number;
  maxWorkers: number;
  maxJobOffers: number;
  maxWorkRequests: number;
  maxStorageGB: number;
}

export interface UsagePercentages {
  companies: number;
  projects: number;
  workers: number;
  jobOffers: number;
  workRequests: number;
}

export interface UsageResponse {
  success: boolean;
  usage: UsageStats;
  limits: UsageLimits;
  percentages: UsagePercentages;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription: Subscription | null;
  message?: string;
}

export interface PlansResponse {
  success: boolean;
  plans: SubscriptionPlan[];
}

export interface CheckoutResponse {
  success: boolean;
  sessionId: string;
  url: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
}

export interface CreateCheckoutRequest {
  planId: string;
  billingCycle?: BillingCycle;
}

// Enums
export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  PAUSED = 'PAUSED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

// Helper functions
export const getStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return 'text-green-600 bg-green-100';
    case SubscriptionStatus.TRIAL:
      return 'text-blue-600 bg-blue-100';
    case SubscriptionStatus.PAST_DUE:
      return 'text-yellow-600 bg-yellow-100';
    case SubscriptionStatus.CANCELED:
      return 'text-red-600 bg-red-100';
    case SubscriptionStatus.UNPAID:
      return 'text-red-600 bg-red-100';
    case SubscriptionStatus.INCOMPLETE:
      return 'text-gray-600 bg-gray-100';
    case SubscriptionStatus.INCOMPLETE_EXPIRED:
      return 'text-gray-600 bg-gray-100';
    case SubscriptionStatus.PAUSED:
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusText = (status: SubscriptionStatus): string => {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return 'Aktywna';
    case SubscriptionStatus.TRIAL:
      return 'Okres próbny';
    case SubscriptionStatus.PAST_DUE:
      return 'Zaległa płatność';
    case SubscriptionStatus.CANCELED:
      return 'Anulowana';
    case SubscriptionStatus.UNPAID:
      return 'Nieopłacona';
    case SubscriptionStatus.INCOMPLETE:
      return 'Niekompletna';
    case SubscriptionStatus.INCOMPLETE_EXPIRED:
      return 'Wygasła';
    case SubscriptionStatus.PAUSED:
      return 'Wstrzymana';
    default:
      return 'Nieznany';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.SUCCEEDED:
      return 'text-green-600 bg-green-100';
    case PaymentStatus.PENDING:
    case PaymentStatus.PROCESSING:
      return 'text-yellow-600 bg-yellow-100';
    case PaymentStatus.FAILED:
    case PaymentStatus.CANCELED:
      return 'text-red-600 bg-red-100';
    case PaymentStatus.REFUNDED:
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getPaymentStatusText = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.SUCCEEDED:
      return 'Udana';
    case PaymentStatus.PENDING:
      return 'Oczekująca';
    case PaymentStatus.PROCESSING:
      return 'Przetwarzana';
    case PaymentStatus.FAILED:
      return 'Nieudana';
    case PaymentStatus.CANCELED:
      return 'Anulowana';
    case PaymentStatus.REFUNDED:
      return 'Zwrócona';
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'Częściowo zwrócona';
    default:
      return 'Nieznany';
  }
};

export const formatPrice = (priceInCents: number, currency: string = 'PLN'): string => {
  return `${(priceInCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
};

export const isUnlimited = (value: number): boolean => {
  return value === -1;
};

export const formatLimit = (value: number, unit: string = ''): string => {
  if (isUnlimited(value)) {
    return 'Nieograniczone';
  }
  return `${value}${unit ? ' ' + unit : ''}`;
};

// Oblicz cenę roczną z rabatem
export const calculateYearlyPrice = (monthlyPrice: number, discountPercent: number = 20): {
  yearlyPrice: number;
  monthlyEquivalent: number;
  savings: number;
  discountPercent: number;
} => {
  const fullYearlyPrice = monthlyPrice * 12;
  const yearlyPrice = fullYearlyPrice * (1 - discountPercent / 100);
  const monthlyEquivalent = yearlyPrice / 12;
  const savings = fullYearlyPrice - yearlyPrice;

  return {
    yearlyPrice,
    monthlyEquivalent,
    savings,
    discountPercent
  };
}; 
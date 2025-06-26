const Stripe = require('stripe');

// Inicjalizacja Stripe z kluczem sekretnym (tylko jeśli klucz jest dostępny)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY nie jest skonfigurowany - funkcje płatności będą niedostępne');
}

// Konfiguracja planów subskrypcji
const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'basic',
    displayName: 'Plan Podstawowy',
    price: 2900, // 29.00 PLN w groszach
    currency: 'pln',
    interval: 'month',
    features: {
      maxCompanies: 1,
      maxProjects: 5,
      maxWorkers: 10,
      maxJobOffers: 3,
      maxWorkRequests: 5,
      maxStorageGB: 1.0,
      hasAdvancedReports: false,
      hasApiAccess: false,
      hasPrioritySupport: false,
      hasCustomBranding: false,
      hasTeamManagement: false
    }
  },
  PRO: {
    name: 'pro',
    displayName: 'Plan Pro',
    price: 7900, // 79.00 PLN w groszach
    currency: 'pln',
    interval: 'month',
    features: {
      maxCompanies: 3,
      maxProjects: 25,
      maxWorkers: 50,
      maxJobOffers: 15,
      maxWorkRequests: 25,
      maxStorageGB: 10.0,
      hasAdvancedReports: true,
      hasApiAccess: false,
      hasPrioritySupport: true,
      hasCustomBranding: false,
      hasTeamManagement: true
    }
  },
  ENTERPRISE: {
    name: 'enterprise',
    displayName: 'Plan Enterprise',
    price: 19900, // 199.00 PLN w groszach
    currency: 'pln',
    interval: 'month',
    features: {
      maxCompanies: -1, // unlimited
      maxProjects: -1, // unlimited
      maxWorkers: -1, // unlimited
      maxJobOffers: -1, // unlimited
      maxWorkRequests: -1, // unlimited
      maxStorageGB: 100.0,
      hasAdvancedReports: true,
      hasApiAccess: true,
      hasPrioritySupport: true,
      hasCustomBranding: true,
      hasTeamManagement: true
    }
  }
};

// Funkcje pomocnicze
const formatPrice = (priceInCents) => {
  return (priceInCents / 100).toFixed(2);
};

const getPlanByName = (planName) => {
  return SUBSCRIPTION_PLANS[planName.toUpperCase()];
};

const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS);
};

module.exports = {
  stripe,
  SUBSCRIPTION_PLANS,
  formatPrice,
  getPlanByName,
  getAllPlans
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XMarkIcon, BuildingOffice2Icon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import type { SubscriptionPlan } from '../types/subscription';
import { formatLimit, calculateYearlyPrice, BillingCycle } from '../types/subscription';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionService.getPlans();
      console.log('📋 PricingPage - Pobrano plany z API:', plansData.length);
      plansData.forEach(plan => {
        console.log(`   - ${plan.displayName} (${plan.name}) - ${(plan.price / 100).toFixed(2)} ${plan.currency}`);
      });
      setPlans(plansData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania planów');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      setProcessingPlan(planId);
      await subscriptionService.redirectToCheckout(planId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas przekierowania do płatności');
      setProcessingPlan(null);
    }
  };

  const calculatePrice = (monthlyPrice: number, cycle: BillingCycle) => {
    if (cycle === BillingCycle.YEARLY) {
      return calculateYearlyPrice(monthlyPrice, 20);
    }
    return {
      yearlyPrice: monthlyPrice,
      monthlyEquivalent: monthlyPrice,
      savings: 0,
      discountPercent: 0
    };
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return 'border-gray-200 bg-gray-50';
      case 'basic':
        return 'border-blue-200 bg-blue-50';
      case 'pro':
        return 'border-green-500 bg-green-50 ring-2 ring-green-500';
      case 'enterprise':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-neutral-200 bg-white';
    }
  };

  const getButtonColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'basic':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'pro':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'enterprise':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      default:
        return 'bg-neutral-600 hover:bg-neutral-700 text-white';
    }
  };

  const getPlanBadge = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return { text: 'Darmowy', color: 'bg-gray-500' };
      case 'basic':
        return { text: 'Podstawowy', color: 'bg-blue-500' };
      case 'pro':
        return { text: 'Najpopularniejszy', color: 'bg-green-500' };
      case 'enterprise':
        return { text: 'Enterprise', color: 'bg-purple-500' };
      default:
        return { text: 'Plan', color: 'bg-gray-500' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Ładowanie planów...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-error-100 border border-error-400 text-error-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
          <button
            onClick={loadPlans}
            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20 py-0">
      {/* Nagłówek z logo i animacją */}
      <header className="w-full sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-lg animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 group"
          >
            <span className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <BuildingOffice2Icon className="h-7 w-7 text-white animate-pulse-slow" />
            </span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 bg-clip-text text-transparent animate-gradient-x">
              BuildBoss
            </span>
          </button>
          
          {/* Przycisk powrotu dla zalogowanych użytkowników */}
          {user && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Powrót do aplikacji</span>
            </button>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl mb-4">
            Wybierz plan dopasowany do potrzeb Twojej firmy
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            14 dni za darmo – przetestuj bez zobowiązań!
          </p>
        </div>
        <div className="flex items-center justify-center mb-10 animate-fade-in-up delay-100">
          <div className="relative bg-neutral-100 p-1 rounded-lg">
            <div className="flex items-center">
              <button
                onClick={() => setBillingCycle(BillingCycle.MONTHLY)}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                  billingCycle === BillingCycle.MONTHLY
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Miesięcznie
              </button>
              <button
                onClick={() => setBillingCycle(BillingCycle.YEARLY)}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all relative ${
                  billingCycle === BillingCycle.YEARLY
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Rocznie
                <span className="absolute -top-2 -right-1 bg-success-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-bounce">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center items-stretch">
          {plans.map((plan, idx) => {
            const priceInfo = calculatePrice(plan.price, billingCycle);
            const isPro = plan.name.toLowerCase() === 'pro';
            const badge = getPlanBadge(plan.name);
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-white rounded-2xl border-2 p-8 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up ${getPlanColor(plan.name)} animate-slide-up`}
                style={{ minHeight: '600px', animationDelay: `${100 + idx * 100}ms` }}
              >
                {/* Badge Najlepsza oferta/Najpopularniejszy */}
                {isPro && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 animate-slide-in">
                    <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap animate-fade-in">
                      {billingCycle === BillingCycle.YEARLY ? 'Najlepsza oferta' : 'Najpopularniejszy'}
                    </span>
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2 animate-fade-in-up delay-200">{plan.displayName}</h3>
                    {/* Badge Oszczędzasz ... */}
                    {billingCycle === BillingCycle.YEARLY && priceInfo.savings > 0 && (
                      <div className="flex justify-center mb-2 animate-slide-in delay-200">
                        <span className="bg-warning-500/90 text-white px-3 py-0.5 rounded-full text-xs font-medium shadow animate-fade-in opacity-80">
                          Oszczędzasz {(priceInfo.savings / 100).toFixed(0)} zł/rok
                        </span>
                      </div>
                    )}
                    <div className="mb-4 animate-fade-in-up delay-400">
                      {billingCycle === BillingCycle.YEARLY ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center mb-1">
                            <span className="text-base text-neutral-400 line-through mr-2 font-medium">
                              {((plan.price * 12) / 100).toFixed(0)} zł
                            </span>
                            <span className="text-5xl font-extrabold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent drop-shadow">
                              {(priceInfo.yearlyPrice / 100).toFixed(0)}
                            </span>
                            <span className="text-xl text-neutral-600 ml-1 font-semibold">zł</span>
                          </div>
                          <div className="text-neutral-500 text-sm">
                            (~{(priceInfo.monthlyEquivalent / 100).toFixed(0)} zł/miesiąc)
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="text-5xl font-extrabold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent drop-shadow">
                            {plan.price === 0 ? '0' : (plan.price / 100).toFixed(0)}
                          </span>
                          <span className="text-xl text-neutral-600 ml-1 font-semibold">zł</span>
                        </div>
                      )}
                    </div>
                    <p className="text-neutral-600 mb-6 animate-fade-in-up delay-300">{plan.description}</p>
                  </div>
                  <ul className="space-y-4 mb-8 text-left animate-fade-in-up delay-500">
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-700">{formatLimit(plan.maxCompanies, 'firm')}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-700">{formatLimit(plan.maxProjects, 'projektów')}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-700">{formatLimit(plan.maxWorkers, 'pracowników')}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-700">{formatLimit(plan.maxJobOffers, 'ogłoszeń o pracę')}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-neutral-700">{formatLimit(plan.maxStorageGB, 'GB przestrzeni')}</span>
                    </li>
                    
                    {/* Premium features */}
                    {plan.hasAdvancedReports && (
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-neutral-700 font-medium">📊 Zaawansowane raporty</span>
                      </li>
                    )}
                    {plan.hasApiAccess && (
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-neutral-700 font-medium">🔌 Dostęp do API</span>
                      </li>
                    )}
                    {plan.hasPrioritySupport && (
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-neutral-700 font-medium">⚡ Wsparcie priorytetowe</span>
                      </li>
                    )}
                    {plan.hasCustomBranding && (
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-neutral-700 font-medium">🎨 Własny branding</span>
                      </li>
                    )}
                    {plan.hasTeamManagement && (
                      <li className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-neutral-700 font-medium">👥 Zarządzanie zespołem</span>
                      </li>
                    )}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={processingPlan === plan.id}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 mt-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 animate-fade-in-up delay-700 ${
                      processingPlan === plan.id
                        ? 'bg-neutral-400 text-white cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {processingPlan === plan.id ? 'Przekierowywanie...' : plan.price === 0 ? 'Rozpocznij za darmo' : 'Wybierz plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-16 text-center animate-fade-in-up delay-1000">
          <p className="text-neutral-600">
            🔒 Wszystkie plany zawierają 14-dniowy bezpłatny okres próbny
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Możesz anulować w każdej chwili. Żadnych ukrytych opłat.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PricingPage; 
import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionPlan } from '../types/subscription';
import { formatLimit } from '../types/subscription';

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionService.getPlans();
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

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return 'border-blue-200 bg-blue-50';
      case 'pro':
        return 'border-green-200 bg-green-50 ring-2 ring-green-500';
      case 'enterprise':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getButtonColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'pro':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'enterprise':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie planów...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
          <button
            onClick={loadPlans}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Wybierz plan dla swojej firmy
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Rozpocznij z 14-dniowym okresem próbnym. Anuluj w każdej chwili.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 shadow-lg ${getPlanColor(plan.name)} ${
                plan.name.toLowerCase() === 'pro' ? 'transform scale-105' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.name.toLowerCase() === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Najpopularniejszy
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{plan.displayName}</h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {(plan.price / 100).toFixed(0)}
                  </span>
                  <span className="text-xl text-gray-600"> zł</span>
                  <span className="text-gray-500">/miesiąc</span>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    {formatLimit(plan.features.maxCompanies)} firm
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    {formatLimit(plan.features.maxProjects)} projektów
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    {formatLimit(plan.features.maxWorkers)} pracowników
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    {formatLimit(plan.features.maxJobOffers)} ogłoszeń o pracę
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    {formatLimit(plan.features.maxWorkRequests)} zleceń
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">
                    {plan.features.maxStorageGB} GB przestrzeni
                  </span>
                </div>

                {/* Premium Features */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    {plan.features.hasAdvancedReports ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <span className={plan.features.hasAdvancedReports ? 'text-gray-700' : 'text-gray-400'}>
                      Zaawansowane raporty
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    {plan.features.hasPrioritySupport ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <span className={plan.features.hasPrioritySupport ? 'text-gray-700' : 'text-gray-400'}>
                      Priorytetowe wsparcie
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    {plan.features.hasTeamManagement ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <span className={plan.features.hasTeamManagement ? 'text-gray-700' : 'text-gray-400'}>
                      Zarządzanie zespołem
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    {plan.features.hasApiAccess ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <span className={plan.features.hasApiAccess ? 'text-gray-700' : 'text-gray-400'}>
                      Dostęp do API
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    {plan.features.hasCustomBranding ? (
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    <span className={plan.features.hasCustomBranding ? 'text-gray-700' : 'text-gray-400'}>
                      Własny branding
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={processingPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${getButtonColor(plan.name)} ${
                    processingPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {processingPlan === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Przekierowywanie...
                    </div>
                  ) : (
                    'Rozpocznij 14-dniowy trial'
                  )}
                </button>
              </div>

              {/* Trial Info */}
              <p className="mt-4 text-center text-sm text-gray-500">
                Bez zobowiązań. Anuluj w każdej chwili.
              </p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Często zadawane pytania
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy mogę zmienić plan w trakcie subskrypcji?
              </h3>
              <p className="text-gray-600">
                Tak, możesz w każdej chwili przejść na wyższy plan. Zmiana zostanie naliczona proporcjonalnie.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy okres próbny jest bezpłatny?
              </h3>
              <p className="text-gray-600">
                Tak, 14-dniowy okres próbny jest całkowicie bezpłatny. Nie pobieramy opłat do końca okresu próbnego.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Jakie metody płatności akceptujecie?
              </h3>
              <p className="text-gray-600">
                Akceptujemy wszystkie główne karty kredytowe i debetowe. Płatności są bezpiecznie przetwarzane przez Stripe.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Czy mogę anulować subskrypcję?
              </h3>
              <p className="text-gray-600">
                Tak, możesz anulować subskrypcję w każdej chwili. Zachowasz dostęp do końca opłaconego okresu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 
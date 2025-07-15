import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CreditCardIcon, 
  CalendarIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { subscriptionService } from '../services/subscriptionService';
import { UsageLimits } from '../components/common/UsageLimits';
import type { Subscription, UsageResponse } from '../types/subscription';
import { 
  getStatusColor, 
  getStatusText, 
  getPaymentStatusColor, 
  getPaymentStatusText,
  formatLimit
} from '../types/subscription';

const SubscriptionPage: React.FC = () => {
  const { t, i18n } = useTranslation('subscription');
  const { t: tCommon } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
    };

    i18n.on('languageChanged', handleLanguageChange);
    window.addEventListener('languagechange', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [i18n]);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subscriptionData, usageData] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getUsageStats().catch(() => null)
      ]);
      
      setSubscription(subscriptionData);
      setUsage(usageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setActionLoading('cancel');
      await subscriptionService.cancelSubscription(cancelReason);
      await loadSubscriptionData();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading('reactivate');
      await subscriptionService.reactivateSubscription();
      await loadSubscriptionData();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{tCommon('loading')}</p>
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
            onClick={loadSubscriptionData}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {tCommon('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Brak aktywnej subskrypcji</h2>
          <p className="text-gray-600 mb-6">
            Aby korzystać z BuildBoss, musisz wybrać plan subskrypcji.
          </p>
          <a
            href="/pricing"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Zobacz plany
          </a>
        </div>
      </div>
    );
  }

  const trialDaysLeft = subscription.trialEndDate ? 
    subscriptionService.getDaysUntilTrialEnd(subscription.trialEndDate) : 0;
  const isTrialEndingSoon = subscription.trialEndDate ? 
    subscriptionService.isTrialEndingSoon(subscription.trialEndDate) : false;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zarządzanie subskrypcją</h1>
          <p className="mt-2 text-gray-600">
                          Przeglądaj i zarządzaj swoją subskrypcją BuildBoss
          </p>
        </div>

        {/* Trial Warning */}
        {subscription.status === 'TRIAL' && isTrialEndingSoon && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Okres próbny kończy się za {trialDaysLeft} {trialDaysLeft === 1 ? 'dzień' : 'dni'}
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Aby kontynuować korzystanie z BuildBoss, wybierz plan płatny.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Aktualny plan</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                  {getStatusText(subscription.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{subscription.plan.displayName}</h3>
                  <p className="text-gray-600 mt-1">{subscription.plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {(subscription.plan.price / 100).toFixed(0)} zł
                    </span>
                    <span className="text-gray-500">/miesiąc</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      Rozpoczęto: {subscriptionService.formatDate(subscription.startDate)}
                    </span>
                  </div>
                  {subscription.nextBillingDate && (
                    <div className="flex items-center text-sm">
                      <CreditCardIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        Następna płatność: {subscriptionService.formatDate(subscription.nextBillingDate)}
                      </span>
                    </div>
                  )}
                  {subscription.endDate && (
                    <div className="flex items-center text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-gray-600">
                        Plan aktywny do: {subscriptionService.formatDate(subscription.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                {subscription.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={actionLoading === 'reactivate'}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading === 'reactivate' ? 'Reaktywowanie...' : 'Reaktywuj subskrypcję'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Anuluj subskrypcję
                  </button>
                )}
                <a
                  href="/pricing"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Zmień plan
                </a>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Subskrypcja zostanie anulowana {subscription.nextBillingDate ? 
                      subscriptionService.formatDate(subscription.nextBillingDate) : 'na końcu okresu rozliczeniowego'}.
                    Do tego czasu zachowasz pełny dostęp do wszystkich funkcji.
                  </p>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            {usage && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Użycie zasobów
                </h2>
                <UsageLimits 
                  currentUsage={usage.usage}
                  showUpgradeButton={false}
                />
              </div>
            )}

            {/* Recent Payments */}
            {subscription.recentPayments && subscription.recentPayments.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Ostatnie płatności</h2>
                <div className="space-y-3">
                  {subscription.recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                      <div>
                        <p className="font-medium text-gray-900">
                          {(payment.amount / 100).toFixed(2)} {payment.currency}
                        </p>
                        <p className="text-sm text-gray-600">{payment.description}</p>
                        <p className="text-xs text-gray-500">
                          {subscriptionService.formatDateTime(payment.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {getPaymentStatusText(payment.status)}
                        </span>
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Zobacz paragon
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Funkcje planu</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  {subscription.plan.hasAdvancedReports ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <span className={subscription.plan.hasAdvancedReports ? 'text-gray-700' : 'text-gray-400'}>
                    Zaawansowane raporty
                  </span>
                </div>
                <div className="flex items-center">
                  {subscription.plan.hasPrioritySupport ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <span className={subscription.plan.hasPrioritySupport ? 'text-gray-700' : 'text-gray-400'}>
                    Priorytetowe wsparcie
                  </span>
                </div>
                <div className="flex items-center">
                  {subscription.plan.hasTeamManagement ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <span className={subscription.plan.hasTeamManagement ? 'text-gray-700' : 'text-gray-400'}>
                    Zarządzanie zespołem
                  </span>
                </div>
                <div className="flex items-center">
                  {subscription.plan.hasApiAccess ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <span className={subscription.plan.hasApiAccess ? 'text-gray-700' : 'text-gray-400'}>
                    Dostęp do API
                  </span>
                </div>
                <div className="flex items-center">
                  {subscription.plan.hasCustomBranding ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <span className={subscription.plan.hasCustomBranding ? 'text-gray-700' : 'text-gray-400'}>
                    Własny branding
                  </span>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Potrzebujesz pomocy?</h3>
              <p className="text-gray-600 mb-4">
                Nasz zespół wsparcia jest gotowy, aby Ci pomóc.
              </p>
              <a
                href="mailto:support@buildboss.pl"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium block text-center"
              >
                Skontaktuj się z nami
              </a>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Anuluj subskrypcję
              </h3>
              <p className="text-gray-600 mb-4">
                Czy na pewno chcesz anulować subskrypcję? Zachowasz dostęp do końca opłaconego okresu.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Powód anulowania (opcjonalnie)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Powiedz nam, dlaczego anulowujesz subskrypcję..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading === 'cancel'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? 'Anulowanie...' : 'Potwierdź anulowanie'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage; 
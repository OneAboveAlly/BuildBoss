import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';

const SubscriptionSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Sprawdź status płatności po kilku sekundach
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoToSubscription = () => {
    navigate('/subscription');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Przetwarzanie płatności...</p>
          <p className="text-sm text-gray-500 mt-2">To może potrwać kilka sekund</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Płatność zakończona pomyślnie!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Twoja subskrypcja została aktywowana. Możesz teraz korzystać ze wszystkich funkcji SiteBoss.
          </p>

          {/* Session Info */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">
                ID sesji: <span className="font-mono text-xs">{sessionId}</span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Przejdź do Dashboard
            </button>
            
            <button
              onClick={handleGoToSubscription}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Zarządzaj subskrypcją
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Co dalej?</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Sprawdź swoją skrzynkę email - otrzymasz potwierdzenie płatności
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Zacznij tworzyć projekty i zarządzać swoją firmą
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Zaproś członków zespołu do współpracy
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Skontaktuj się z nami, jeśli potrzebujesz pomocy
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Potrzebujesz pomocy?{' '}
              <a 
                href="mailto:support@siteboss.pl" 
                className="text-blue-600 hover:text-blue-800"
              >
                Skontaktuj się z nami
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage; 
import React from 'react';
import { XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const SubscriptionCancelPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/pricing');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@buildboss.pl?subject=Pomoc z subskrypcją';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Cancel Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>

          {/* Cancel Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Płatność została anulowana
          </h1>
          
          <p className="text-gray-600 mb-6">
            Nie martw się - żadne opłaty nie zostały pobrane. Możesz spróbować ponownie w każdej chwili.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Wróć do planów
            </button>
            
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Przejdź do Dashboard
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Potrzebujesz pomocy?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Jeśli masz problemy z płatnością lub pytania dotyczące planów, skontaktuj się z nami.
            </p>
            
            <button
              onClick={handleContactSupport}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Skontaktuj się z pomocą
            </button>
          </div>

          {/* Common Issues */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Częste problemy:</h4>
            <ul className="text-xs text-gray-600 space-y-1 text-left">
              <li>• Sprawdź dane karty kredytowej</li>
              <li>• Upewnij się, że karta ma wystarczające środki</li>
              <li>• Spróbuj użyć innej karty lub metody płatności</li>
              <li>• Wyczyść cache przeglądarki i spróbuj ponownie</li>
            </ul>
          </div>

          {/* Trial Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Pamiętaj:</strong> Możesz nadal korzystać z 14-dniowego okresu próbnego bez podawania danych karty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelPage; 
import React from 'react';
import { ArrowPathIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAppUpdate } from '../../hooks/useAppUpdate';

export const UpdateNotification: React.FC = () => {
  const { hasUpdate, isChecking, updateSuccess, applyUpdate, resetUpdateState } = useAppUpdate();

  // Pokaż komunikat o udanej aktualizacji
  if (updateSuccess) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm animate-fade-in">
        <div className="flex items-start space-x-3">
          <CheckIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-sm">Aktualizacja zakończona!</h3>
            <p className="text-xs text-green-100 mt-1">
              Aplikacja została zaktualizowana do najnowszej wersji.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pokaż komunikat o dostępnej aktualizacji
  if (!hasUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm animate-fade-in">
      <div className="flex items-start space-x-3">
        <ArrowPathIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-sm">Nowa wersja dostępna</h3>
          <p className="text-xs text-blue-100 mt-1">
            Kliknij, aby zaktualizować aplikację i uzyskać najnowsze funkcje.
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <button
            onClick={applyUpdate}
            disabled={isChecking}
            className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {isChecking ? 'Aktualizuję...' : 'Aktualizuj'}
          </button>
          <button
            onClick={applyUpdate}
            className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium hover:bg-red-200 transition-colors"
          >
            Wymuś aktualizację
          </button>
          <button
            onClick={resetUpdateState}
            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
            title="Ukryj komunikat (jeśli już zaktualizowałeś)"
          >
            Ukryj
          </button>
        </div>
      </div>
    </div>
  );
}; 
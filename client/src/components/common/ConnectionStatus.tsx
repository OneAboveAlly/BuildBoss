import React, { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Hide after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show status initially if offline
    if (!navigator.onLine) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`
      fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg animate-slide-down
      ${isOnline 
        ? 'bg-success-100 text-success-800 border border-success-200' 
        : 'bg-warning-100 text-warning-800 border border-warning-200'
      }
    `}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <WifiIcon className="w-5 h-5 text-success-600" />
        ) : (
          <ExclamationTriangleIcon className="w-5 h-5 text-warning-600" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Połączenie przywrócone' : 'Brak połączenia z internetem'}
        </span>
      </div>
    </div>
  );
}; 
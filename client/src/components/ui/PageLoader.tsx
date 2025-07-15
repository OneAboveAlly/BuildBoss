import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        {/* Main spinner */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary-200 border-t-primary-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-primary-100 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <h2 className="text-lg font-semibold text-secondary-900 mb-2">Ładowanie strony...</h2>
        <p className="text-secondary-600 max-w-md mx-auto">
          Przygotowujemy zawartość dla Ciebie
        </p>
        
        {/* Progress dots */}
        <div className="flex justify-center space-x-1 mt-4">
          <div className="h-2 w-2 bg-primary-400 rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-2 w-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader; 
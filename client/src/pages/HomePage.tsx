import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-secondary-900 sm:text-5xl md:text-6xl">
                            <span className="text-primary-600">Site</span>Boss
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-secondary-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Kompleksowe rozwiązanie SaaS dla małych ekip budowlanych. 
            Zarządzaj zadaniami, dokumentami, fakturami i zespołem w jednym miejscu.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/register"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
              >
                Rozpocznij za darmo
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-secondary-50 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
              >
                Zaloguj się
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card p-6">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">Zarządzanie zadaniami</h3>
              <p className="text-secondary-600">Przydzielaj zadania, śledź postępy i zarządzaj terminami realizacji projektów.</p>
            </div>
            
            <div className="card p-6">
              <div className="text-3xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">Dokumenty</h3>
              <p className="text-secondary-600">Przechowuj i organizuj wszystkie dokumenty projektowe w jednym miejscu.</p>
            </div>
            
            <div className="card p-6">
              <div className="text-3xl mb-4">🧾</div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">Faktury</h3>
              <p className="text-secondary-600">Generuj faktury, śledź płatności i zarządzaj finansami firmy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 
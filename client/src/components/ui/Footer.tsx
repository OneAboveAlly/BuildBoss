import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BuildingOffice2Icon, 
  EnvelopeIcon, 
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

// Hook do pobierania wersji aplikacji
function useFooterVersion() {
  const [data, setData] = useState<{ frontend: string; backend: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchVersion() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch('/api/version', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Błąd pobierania wersji');
        const json = await res.json();
        setData({
          frontend: json.frontendVersion || '-',
          backend: json.backendVersion || '-',
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchVersion();
  }, []);

  return { data, loading, error };
}

export const Footer: React.FC = () => {
  const { data, loading, error } = useFooterVersion();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl shadow-lg">
                  <BuildingOffice2Icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Build<span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Boss</span>
                  </span>
                  <p className="text-sm text-gray-400">Professional</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                Nowoczesne narzędzie do zarządzania firmą budowlaną. Usprawnij swoje procesy, 
                zwiększ efektywność i rozwijaj swój biznes z BuildBoss.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="mailto:kontakt@buildboss.pl" 
                  className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50"
                >
                  <EnvelopeIcon className="h-5 w-5" />
                </a>
                <a 
                  href="tel:+48123456789" 
                  className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50"
                >
                  <PhoneIcon className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50"
                >
                  <MapPinIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Szybkie linki</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/features" className="text-gray-300 hover:text-white transition-colors">
                    Funkcje
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">
                    Cennik
                  </Link>
                </li>
                <li>
                  <Link to="/jobs" className="text-gray-300 hover:text-white transition-colors">
                    Oferty pracy
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                    O nas
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                    Kontakt
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Wsparcie</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/help" className="text-gray-300 hover:text-white transition-colors">
                    Centrum pomocy
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className="text-gray-300 hover:text-white transition-colors">
                    Dokumentacja
                  </Link>
                </li>
                <li>
                  <Link to="/tutorials" className="text-gray-300 hover:text-white transition-colors">
                    Tutoriale
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="text-gray-300 hover:text-white transition-colors">
                    Społeczność
                  </Link>
                </li>
                <li>
                  <Link to="/status" className="text-gray-300 hover:text-white transition-colors">
                    Status systemu
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 BuildBoss. Wszystkie prawa zastrzeżone.
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:space-x-6 text-sm w-full md:w-auto md:justify-end">
                <div className="flex space-x-6 mb-2 md:mb-0">
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Polityka prywatności
                  </Link>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Regulamin
                  </Link>
                  <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                    Pliki cookie
                  </Link>
                </div>
                <div className="text-gray-500 text-xs mt-2 md:mt-0 md:ml-6 whitespace-nowrap">
                  {loading && 'Wersja: ...'}
                  {error && 'Błąd pobierania wersji'}
                  {data && !loading && !error && (
                    <>
                      Wersja: frontend {data.frontend}, backend {data.backend}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 
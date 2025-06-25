import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface PublicLayoutProps {
  children: React.ReactNode;
}

// Publiczny navbar dla niezalogowanych użytkowników
const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <span className="text-white font-bold text-lg">🏗️</span>
            </div>
            <h1 className="text-xl font-bold text-primary-600 hidden sm:block">
              SiteBoss
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Strona główna
            </Link>
            <Link 
              to="/jobs" 
              className="relative bg-gradient-to-r from-primary-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <span className="mr-1">💼</span>
              Oferty pracy
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                <span className="animate-pulse">•</span>
              </span>
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              Logowanie
            </Link>
            <Link 
              to="/register" 
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Rejestracja
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-900 px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Strona główna
              </Link>
              <Link 
                to="/jobs" 
                className="relative bg-gradient-to-r from-primary-600 to-blue-600 text-white px-4 py-2 rounded-lg mx-2 text-center font-medium shadow-lg flex items-center justify-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-2">💼</span>
                Oferty pracy
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="animate-pulse">•</span>
                </span>
              </Link>
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-gray-900 px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Logowanie
              </Link>
              <Link 
                to="/register" 
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg mx-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Rejestracja
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Footer
const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-secondary-900 text-white py-16 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BuildingOffice2Icon className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold">
                Site<span className="text-primary-400">Boss</span>
              </span>
            </div>
            <p className="text-secondary-300 mb-6 max-w-md">
              Profesjonalne zarządzanie projektami budowlanymi. Planuj, organizuj i realizuj swoje projekty efektywniej niż kiedykolwiek.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:kontakt@siteboss.pl" className="text-secondary-300 hover:text-white transition-colors">
                <EnvelopeIcon className="h-6 w-6" />
              </a>
              <a href="tel:+48123456789" className="text-secondary-300 hover:text-white transition-colors">
                <PhoneIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2 text-secondary-300">
              <li><Link to="/jobs" className="hover:text-white transition-colors">Oferty pracy</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Cennik</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integracje</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Firma</h4>
            <ul className="space-y-2 text-secondary-300">
              <li><a href="#" className="hover:text-white transition-colors">O nas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kariera</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-secondary-400 text-sm">
            © 2024 SiteBoss. Wszystkie prawa zastrzeżone.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/legal/privacy" className="text-secondary-400 hover:text-white text-sm transition-colors">Polityka prywatności</a>
            <a href="/legal/terms" className="text-secondary-400 hover:text-white text-sm transition-colors">Regulamin</a>
            <a href="/legal/gdpr" className="text-secondary-400 hover:text-white text-sm transition-colors">GDPR</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Główny komponent layout-u
const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout; 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { NotificationBell } from '../notifications/NotificationBell';
import GlobalSearch from '../search/GlobalSearch';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Keyboard shortcut for global search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <span className="text-white font-bold text-lg">🏗️</span>
                </div>
                <h1 className="text-xl font-bold text-primary-600 hidden sm:block">
                  SiteBoss
                </h1>
              </Link>
            </div>
            
            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-lg mx-4 sm:mx-8 hidden md:block">
              <div className="relative">
                <button
                  onClick={() => setShowGlobalSearch(true)}
                  className="w-full flex items-center px-4 py-2 text-sm text-secondary-500 bg-secondary-50 border border-secondary-200 rounded-lg hover:bg-secondary-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 mr-3 text-secondary-400" />
                  <span>Szukaj projektów, zadań, materiałów...</span>
                  <kbd className="ml-auto hidden lg:inline-block px-2 py-1 text-xs font-semibold text-secondary-400 bg-white border border-secondary-200 rounded">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Search Icon - Mobile */}
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="md:hidden p-2 text-secondary-500 hover:text-primary-600 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>

              {/* Language Selector */}
              <LanguageSelector compact={true} showLabel={false} />

              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-secondary-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {user?.email}
                  </p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-secondary-700 hover:text-primary-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-primary-600" />
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-sm font-medium text-secondary-700 hover:text-red-600 transition-colors"
                >
                  Wyloguj
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="p-2 text-secondary-500 hover:text-primary-600 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
              <NotificationBell />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-secondary-500 hover:text-primary-600 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-secondary-200 py-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-secondary-500">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 px-4">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 py-2 text-secondary-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Mój profil</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 py-2 text-red-600 hover:text-red-700 transition-colors text-left"
                  >
                    <span>🚪</span>
                    <span>Wyloguj</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </>
  );
};

export default Header; 
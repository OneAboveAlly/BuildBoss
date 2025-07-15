import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, BellIcon, UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { NotificationBell } from '../notifications/NotificationBell';
import GlobalSearch from '../search/GlobalSearch';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    toast.success('Wylogowano pomyślnie');
    navigate('/login');
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-lg shadow-glass border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">🏗️</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                    BuildBoss
                  </h1>
                  <p className="text-xs text-secondary-500 font-medium">Professional</p>
                </div>
              </Link>
            </div>
            
            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-lg mx-4 sm:mx-8 hidden md:block">
              <div className="relative">
                <button
                  onClick={() => setShowGlobalSearch(true)}
                  className="w-full flex items-center px-4 py-3 text-sm text-secondary-500 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/80 hover:border-primary-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-300 shadow-sm hover:shadow-md group"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 mr-3 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                  <span className="group-hover:text-secondary-700 transition-colors">Szukaj projektów, zadań, materiałów...</span>
                  <kbd className="ml-auto hidden lg:inline-flex items-center px-2 py-1 text-xs font-semibold text-secondary-400 bg-white/80 border border-secondary-200/50 rounded-md shadow-sm">
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
                className="md:hidden p-2.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>

              {/* Language Selector */}
              <div className="hover:scale-105 transition-transform">
                <LanguageSelector compact={true} showLabel={false} />
              </div>

              {/* Notifications */}
              <div className="hover:scale-105 transition-transform">
                <NotificationBell />
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {/* Plan Badge */}
                <PlanBadge />
                
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
                  className="flex items-center space-x-2 text-secondary-700 hover:text-primary-600 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                    <UserCircleIcon className="w-5 h-5 text-primary-600" />
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-secondary-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  Wyloguj
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="p-2.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
              <div className="hover:scale-105 transition-transform">
                <NotificationBell />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
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
            <div className="md:hidden border-t border-white/20 py-4 bg-white/80 backdrop-blur-lg animate-slide-down">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center shadow-sm">
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

                <div className="flex flex-col space-y-1 px-4">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 py-3 px-3 text-secondary-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Mój profil</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      toast.success('Wylogowano pomyślnie');
                      setIsMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="flex items-center space-x-3 py-3 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-left"
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

// Dodaj komponent PlanBadge
const PlanBadge: React.FC = () => {
  const { user, isSubscriptionActive, isTrialActive } = useAuth();
  
  if (!user?.subscription) return null;
  
  const { subscription } = user;
  const isActive = isSubscriptionActive();
  const isTrial = isTrialActive();
  
  const getBadgeColor = () => {
    if (isTrial) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (isActive) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  const getBadgeText = () => {
    if (isTrial) return 'Trial';
    return subscription.plan.displayName;
  };
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor()}`}>
      {getBadgeText()}
    </div>
  );
};

export default Header; 
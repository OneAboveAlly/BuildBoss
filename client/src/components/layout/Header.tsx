import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">
              SiteBoss
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="text-secondary-700 hover:text-primary-600 transition-colors"
            >
              Witaj, {user?.firstName || user?.email}!
            </Link>
            <button
              onClick={logout}
              className="btn-secondary text-sm"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
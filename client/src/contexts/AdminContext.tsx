import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AdminContextType {
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  isAdminLoggedIn: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('admin_token'));

  const isAdminLoggedIn = !!adminToken;

  const handleSetAdminToken = (token: string | null) => {
    setAdminToken(token);
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
    }
  };

  const value: AdminContextType = {
    adminToken,
    setAdminToken: handleSetAdminToken,
    isAdminLoggedIn
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}; 
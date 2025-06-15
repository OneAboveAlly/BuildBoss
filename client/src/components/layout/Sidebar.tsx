import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Projekty', path: '/projects', icon: '🏗️' },
    { name: 'Zadania', path: '/tasks', icon: '✅' },
    { name: 'Dokumenty', path: '/documents', icon: '📁' },
    { name: 'Faktury', path: '/invoices', icon: '🧾' },
    { name: 'Materiały', path: '/materials', icon: '🧱' },
    { name: 'Praca', path: '/jobs', icon: '👷' },
    { name: 'Wiadomości', path: '/messages', icon: '💬' },
    { name: 'Subskrypcja', path: '/subscription', icon: '💳' },
    { name: 'Firma', path: '/company', icon: '🏢' },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-secondary-200 min-h-screen">
      <nav className="mt-8">
        <div className="px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                    }`
                  }
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar; 
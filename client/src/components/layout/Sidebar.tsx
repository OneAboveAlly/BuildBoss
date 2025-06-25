import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  FolderIcon,
  UsersIcon,
  CubeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  group: 'main' | 'projects' | 'business' | 'reports';
  badge?: number;
}

const Sidebar: React.FC = () => {
  const { t, i18n } = useTranslation('navigation');
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
    };

    i18n.on('languageChanged', handleLanguageChange);
    window.addEventListener('languagechange', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [i18n]);

  const menuItems: MenuItem[] = [
    // Main
    { name: t('dashboard'), path: '/dashboard', icon: HomeIcon, group: 'main' },
    { name: 'Wyszukiwanie', path: '/search', icon: MagnifyingGlassIcon, group: 'main' },
    { name: t('notifications'), path: '/notifications', icon: BellIcon, group: 'main', badge: 3 },
    
    // Projects
    { name: t('projects'), path: '/projects', icon: BuildingOffice2Icon, group: 'projects' },
    { name: t('tasks'), path: '/tasks', icon: ClipboardDocumentListIcon, group: 'projects' },
    { name: t('materials'), path: '/materials', icon: CubeIcon, group: 'projects' },
    { name: t('messages'), path: '/messages', icon: ChatBubbleLeftRightIcon, group: 'projects', badge: 2 },
    
    // Business
    { name: 'Firma', path: '/company', icon: UserGroupIcon, group: 'business' },
    { name: '💼 Praca', path: '/jobs', icon: BriefcaseIcon, group: 'business', badge: 999 }, // specjalne wyróżnienie
    { name: t('subscription'), path: '/subscription', icon: CreditCardIcon, group: 'business' },
    
    // Reports
    { name: 'Analityki', path: '/analytics', icon: ChartBarIcon, group: 'reports' },
    { name: 'Raporty', path: '/reports', icon: DocumentChartBarIcon, group: 'reports' },
    { name: 'Dokumenty', path: '/documents', icon: DocumentTextIcon, group: 'reports' },
  ];

  const groupLabels = {
    main: t('menu'),
    projects: t('projects'),
    business: 'Biznes',
    reports: 'Raporty'
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const isActiveLink = (path: string) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  return (
    <aside className={`
      ${isCollapsed ? 'w-16' : 'w-64'} 
      bg-white shadow-lg border-r border-secondary-200 min-h-screen 
      transition-all duration-300 ease-in-out
      flex flex-col
    `}>
      {/* Header */}
      <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <span className="text-white font-bold text-lg">🏗️</span>
            </div>
            <h2 className="text-lg font-bold text-primary-600">SiteBoss</h2>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-6">
          {Object.entries(groupedItems).map(([groupKey, items]) => (
            <div key={groupKey}>
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
                  {groupLabels[groupKey as keyof typeof groupLabels]}
                </h3>
              )}
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveLink(item.path);
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`
                          group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg 
                          transition-all duration-200 relative
                          ${item.path === '/jobs' 
                            ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                            : isActive
                              ? 'bg-primary-100 text-primary-700 shadow-sm'
                              : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                          }
                        `}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon className={`
                          ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}
                          ${item.path === '/jobs' 
                            ? 'text-white' 
                            : isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
                          }
                          transition-colors duration-200
                        `} />
                        {!isCollapsed && (
                          <>
                            <span className="truncate">{item.name}</span>
                            {item.badge && item.badge > 0 && (
                              <span className={`
                                ml-auto text-xs rounded-full h-5 px-2 flex items-center justify-center font-semibold
                                ${item.path === '/jobs' 
                                  ? 'bg-yellow-400 text-yellow-900 animate-pulse' 
                                  : 'bg-red-500 text-white'
                                }
                              `}>
                                {item.path === '/jobs' ? 'HOT' : (item.badge > 9 ? '9+' : item.badge)}
                              </span>
                            )}
                          </>
                        )}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-lg" />
                        )}
                        {isCollapsed && item.badge && item.badge > 0 && (
                          <div className={`
                            absolute -top-1 -right-1 text-xs rounded-full h-4 flex items-center justify-center font-semibold px-1 min-w-4
                            ${item.path === '/jobs' 
                              ? 'bg-yellow-400 text-yellow-900 animate-pulse text-xs' 
                              : 'bg-red-500 text-white'
                            }
                          `}>
                            {item.path === '/jobs' ? 'HOT' : (item.badge > 9 ? '9' : item.badge)}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Section - Only Settings */}
      <div className="border-t border-secondary-200 p-4">
        <Link
          to="/settings"
          className={`
            group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg 
            transition-all duration-200
            text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900
          `}
          title={isCollapsed ? 'Ustawienia' : undefined}
        >
          <Cog6ToothIcon className={`
            ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}
            text-secondary-400 group-hover:text-secondary-600
            transition-colors duration-200
          `} />
          {!isCollapsed && <span>{t('settings')}</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar; 
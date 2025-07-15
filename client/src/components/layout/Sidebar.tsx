import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
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
  SparklesIcon,
  RocketLaunchIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

// Import lazy components for preloading
import { 
  DashboardPage,
  ProjectsPage,
  TasksPage,
  MaterialsPage,
  MessagesPage,
  CompaniesPage,
  JobsPage,
  SubscriptionPage,
  AnalyticsPage,
  ReportsPage,
  SearchPage,
  NotificationsPage,
  SettingsPage
} from '../../App';

import { messageService } from '../../services/messageService';
import { notificationService } from '../../services/notificationService';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  group: 'main' | 'projects' | 'business' | 'reports';
  badge?: number;
  component?: any; // For preloading
}

const Sidebar: React.FC = () => {
  const { t, i18n } = useTranslation('navigation');
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const { unreadMessages, unreadNotifications, unreadAdminMessages, totalUnread } = useUnreadMessages();

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
    { name: t('dashboard'), path: '/dashboard', icon: HomeIcon, group: 'main', component: DashboardPage },
    { name: 'Wyszukiwanie', path: '/search', icon: MagnifyingGlassIcon, group: 'main', component: SearchPage },
    { name: t('notifications'), path: '/notifications', icon: BellIcon, group: 'main', badge: unreadNotifications > 0 ? unreadNotifications : undefined, component: NotificationsPage },
    
    // Projects
    { name: t('projects'), path: '/projects', icon: RocketLaunchIcon, group: 'projects', component: ProjectsPage },
    { name: t('tasks'), path: '/tasks', icon: ClipboardDocumentListIcon, group: 'projects', component: TasksPage },
    { name: t('materials'), path: '/materials', icon: CubeIcon, group: 'projects', component: MaterialsPage },
    { 
      name: t('messages'), 
      path: '/messages', 
      icon: ChatBubbleLeftRightIcon, 
      group: 'projects', 
      badge: (unreadMessages + unreadAdminMessages) > 0 ? (unreadMessages + unreadAdminMessages) : undefined, 
      component: MessagesPage 
    },
    
    // Business
    { name: 'Firma', path: '/company', icon: BuildingOffice2Icon, group: 'business', component: CompaniesPage },
    { name: '💼 Praca', path: '/jobs', icon: BriefcaseIcon, group: 'business', badge: 999, component: JobsPage }, // specjalne wyróżnienie
    { name: t('subscription'), path: '/subscription', icon: SparklesIcon, group: 'business', component: SubscriptionPage },
    
    // Reports
    { name: 'Analityki', path: '/analytics', icon: PresentationChartLineIcon, group: 'reports', component: AnalyticsPage },
    { name: 'Raporty', path: '/reports', icon: DocumentChartBarIcon, group: 'reports', component: ReportsPage },
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

  const handleMouseEnter = (component: any) => {
    if (component && typeof component.preload === 'function') {
      // Small delay to avoid unnecessary preloads for quick hovers
      setTimeout(() => {
        component.preload();
      }, 100);
    }
  };

  return (
    <aside className={`
      ${isCollapsed ? 'w-16' : 'w-64'} 
      bg-white/80 backdrop-blur-lg shadow-glass border-r border-white/20 min-h-screen 
      transition-all duration-300 ease-in-out
      flex flex-col
    `}>
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2.5 rounded-xl shadow-lg">
              <span className="text-white font-bold text-lg">🏗️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                BuildBoss
              </h2>
              <p className="text-xs text-secondary-500 font-medium">Professional</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-105"
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
                          group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl 
                          transition-all duration-300 relative
                          ${item.path === '/jobs' 
                            ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg hover:shadow-xl hover:shadow-primary-500/25 transform hover:scale-105'
                            : isActive
                              ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 shadow-card'
                              : 'text-secondary-600 hover:bg-white/60 hover:text-secondary-900 hover:shadow-sm'
                          }
                        `}
                        title={isCollapsed ? item.name : undefined}
                        onMouseEnter={() => handleMouseEnter(item.component)}
                      >
                        <Icon className={`
                          ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}
                          ${item.path === '/jobs' 
                            ? 'text-white' 
                            : isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'
                          }
                          transition-all duration-300 group-hover:scale-110
                        `} />
                        {!isCollapsed && (
                          <>
                            <span className="truncate">{item.name}</span>
                            {item.badge && item.badge > 0 && (
                              <span className={`
                                ml-auto text-xs rounded-full h-5 px-2 flex items-center justify-center font-semibold shadow-sm
                                ${item.path === '/jobs' 
                                  ? 'bg-gradient-to-r from-warning-400 to-warning-500 text-warning-900 animate-pulse' 
                                  : 'bg-gradient-to-r from-error-500 to-error-600 text-white'
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
                            absolute -top-1 -right-1 text-xs rounded-full h-4 flex items-center justify-center font-semibold px-1 min-w-4 shadow-sm
                            ${item.path === '/jobs' 
                              ? 'bg-gradient-to-r from-warning-400 to-warning-500 text-warning-900 animate-pulse text-xs' 
                              : 'bg-gradient-to-r from-error-500 to-error-600 text-white'
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
      <div className="border-t border-white/20 p-4">
        <Link
          to="/settings"
          className={`
            group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl 
            transition-all duration-300
            text-secondary-600 hover:bg-white/60 hover:text-secondary-900 hover:shadow-sm
          `}
          title={isCollapsed ? 'Ustawienia' : undefined}
        >
          <Cog6ToothIcon className={`
            ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}
            text-secondary-400 group-hover:text-secondary-600
            transition-all duration-300 group-hover:scale-110
          `} />
          {!isCollapsed && <span>{t('settings')}</span>}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar; 
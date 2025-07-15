import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  UsersIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  pendingReports: number;
  unreadMessages: number;
  systemAlerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

interface AdminDashboardProps {
  onNavigate: (section: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Zastąp rzeczywistymi API calls
      const mockStats: SystemStats = {
        totalUsers: 1247,
        activeUsers: 892,
        totalCompanies: 156,
        totalProjects: 423,
        totalTasks: 2156,
        completedTasks: 1892,
        totalRevenue: 45678.90,
        monthlyRevenue: 12345.67,
        systemHealth: 'good',
        pendingReports: 23,
        unreadMessages: 7,
        systemAlerts: [
          {
            id: '1',
            type: 'warning',
            message: 'Wysokie zużycie CPU na serwerze produkcyjnym',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'info',
            message: 'Nowa wersja systemu została wdrożona',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'user_registration',
            description: 'Nowy użytkownik zarejestrował się',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            user: 'jan.kowalski@example.com'
          },
          {
            id: '2',
            type: 'project_created',
            description: 'Utworzono nowy projekt',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            user: 'anna.nowak@example.com'
          },
          {
            id: '3',
            type: 'payment_received',
            description: 'Otrzymano płatność za subskrypcję',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            user: 'firma@example.com'
          }
        ]
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Błąd podczas ładowania danych dashboardu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'danger';
      default: return 'default';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
      case 'good':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />;
      case 'critical':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />;
      default:
        return <CogIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Ładowanie dashboardu...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nie udało się załadować danych dashboardu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administratora</h1>
          <p className="text-gray-600 mt-1">Przegląd systemu BuildBoss</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getHealthColor(stats.systemHealth)}>
            {getHealthIcon(stats.systemHealth)}
            <span className="ml-1">System: {stats.systemHealth}</span>
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Użytkownicy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600">+{stats.activeUsers} aktywnych</p>
            </div>
          </div>
        </Card>

        {/* Companies */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BuildingOffice2Icon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Firmy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
              <p className="text-xs text-gray-500">Zarejestrowane</p>
            </div>
          </div>
        </Card>

        {/* Projects */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projekty</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              <p className="text-xs text-gray-500">Aktywne</p>
            </div>
          </div>
        </Card>

        {/* Revenue */}
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Przychód (mies.)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-xs text-green-600">+12% vs poprzedni miesiąc</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tasks Progress */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Zadania</h3>
            <Badge variant="secondary">{stats.completedTasks}/{stats.totalTasks}</Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {Math.round((stats.completedTasks / stats.totalTasks) * 100)}% ukończonych
          </p>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Szybkie Akcje</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => onNavigate('messages')}
            >
              <BellIcon className="w-4 h-4 mr-2" />
              Wiadomości ({stats.unreadMessages})
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => onNavigate('reports')}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Raporty ({stats.pendingReports})
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => onNavigate('users')}
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              Zarządzaj użytkownikami
            </Button>
          </div>
        </Card>

        {/* System Health */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Stan Systemu</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CPU</span>
              <Badge variant="success">65%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">RAM</span>
              <Badge variant="warning">78%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dysk</span>
              <Badge variant="success">45%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sieć</span>
              <Badge variant="success">92%</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Alerty Systemowe</h3>
          <div className="space-y-3">
            {stats.systemAlerts.length === 0 ? (
              <p className="text-gray-500 text-sm">Brak alertów systemowych</p>
            ) : (
              stats.systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {alert.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />}
                    {alert.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />}
                    {alert.type === 'info' && <CheckCircleIcon className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">{formatDate(alert.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Ostatnia Aktywność</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  {activity.user && (
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  )}
                  <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}; 
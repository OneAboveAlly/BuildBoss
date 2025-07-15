import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface SystemStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
    byRole: { role: string; count: number }[];
  };
  companies: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growthRate: number;
    byPlan: { plan: string; amount: number }[];
  };
  performance: {
    systemUptime: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

interface AdminStatsProps {
  onBack: () => void;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // TODO: Zastąp rzeczywistymi API calls
      const mockStats: SystemStats = {
        users: {
          total: 1247,
          active: 892,
          newThisMonth: 45,
          growthRate: 12.5,
          byRole: [
            { role: 'WORKER', count: 1180 },
            { role: 'ADMIN', count: 67 }
          ]
        },
        companies: {
          total: 156,
          active: 134,
          newThisMonth: 8,
          growthRate: 8.2
        },
        projects: {
          total: 423,
          active: 89,
          completed: 334,
          completionRate: 79.0
        },
        revenue: {
          total: 45678.90,
          monthly: 12345.67,
          growthRate: 15.3,
          byPlan: [
            { plan: 'Basic', amount: 5678.90 },
            { plan: 'Premium', amount: 40000.00 }
          ]
        },
        performance: {
          systemUptime: 99.8,
          avgResponseTime: 245,
          errorRate: 0.02
        }
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Błąd podczas ładowania statystyk:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Ładowanie statystyk...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nie udało się załadować statystyk</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            ← Powrót
          </Button>
          <h1 className="text-2xl font-bold">Statystyki Systemu</h1>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="7d">Ostatnie 7 dni</option>
            <option value="30d">Ostatnie 30 dni</option>
            <option value="90d">Ostatnie 90 dni</option>
            <option value="1y">Ostatni rok</option>
          </select>
          <Button>
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Eksportuj raport
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Użytkownicy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.total.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                {stats.users.growthRate > 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${stats.users.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(Math.abs(stats.users.growthRate))}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs poprzedni okres</span>
              </div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Companies */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Firmy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.companies.total}</p>
              <div className="flex items-center mt-1">
                {stats.companies.growthRate > 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${stats.companies.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(Math.abs(stats.companies.growthRate))}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs poprzedni okres</span>
              </div>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <BuildingOffice2Icon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Projects */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projekty</p>
              <p className="text-2xl font-bold text-gray-900">{stats.projects.total}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">
                  {formatPercentage(stats.projects.completionRate)} ukończonych
                </span>
              </div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Revenue */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Przychód (mies.)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue.monthly)}</p>
              <div className="flex items-center mt-1">
                {stats.revenue.growthRate > 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm ${stats.revenue.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(Math.abs(stats.revenue.growthRate))}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs poprzedni miesiąc</span>
              </div>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Użytkownicy według roli</h3>
          <div className="space-y-3">
            {stats.users.byRole.map((role) => (
              <div key={role.role} className="flex items-center justify-between">
                <span className="text-sm font-medium">{role.role}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(role.count / stats.users.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {role.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Przychód według planu</h3>
          <div className="space-y-3">
            {stats.revenue.byPlan.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between">
                <span className="text-sm font-medium">{plan.plan}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(plan.amount / stats.revenue.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-20 text-right">
                    {formatCurrency(plan.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Wydajność Systemu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{formatPercentage(stats.performance.systemUptime)}</div>
            <div className="text-sm text-gray-600">Dostępność systemu</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.performance.avgResponseTime}ms</div>
            <div className="text-sm text-gray-600">Średni czas odpowiedzi</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{formatPercentage(stats.performance.errorRate)}</div>
            <div className="text-sm text-gray-600">Współczynnik błędów</div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Ostatnia Aktywność</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Nowy użytkownik zarejestrował się</p>
              <p className="text-xs text-gray-500">2 minuty temu</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Otrzymano płatność za subskrypcję Premium</p>
              <p className="text-xs text-gray-500">15 minut temu</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <DocumentTextIcon className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Utworzono nowy projekt</p>
              <p className="text-xs text-gray-500">1 godzinę temu</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 
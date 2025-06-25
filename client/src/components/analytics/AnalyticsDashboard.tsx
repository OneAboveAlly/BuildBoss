import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import toast from 'react-hot-toast';

// Rejestracja komponentów Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

interface AnalyticsDashboardProps {
  companyId: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ companyId }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [companyId, period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDashboardData(companyId, period);
      setDashboardData(data);
      
      // Generuj insights
      const generatedInsights = analyticsService.generateInsights(data);
      setInsights(generatedInsights);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Błąd podczas ładowania danych analitycznych');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pl-PL').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Brak danych</h3>
        <p className="mt-1 text-sm text-gray-500">
          Nie udało się załadować danych analitycznych.
        </p>
      </div>
    );
  }

  const { overview, trends, team, distributions } = dashboardData;

  // Przygotuj dane dla wykresów
  const projectTrendsData = analyticsService.prepareProjectTrendsData(trends.projects);
  const taskTrendsData = analyticsService.prepareProjectTrendsData(trends.tasks);
  const projectStatusData = analyticsService.prepareProjectStatusData(distributions.projectStatus);
  const taskPriorityData = analyticsService.prepareTaskPriorityData(distributions.taskPriority);

  // Opcje wykresów
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header z selekcją okresu */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Analityczny</h2>
          <p className="text-sm text-gray-500">
            Okres: {dashboardData.dateRange.start} - {dashboardData.dateRange.end}
          </p>
        </div>
        <div className="flex space-x-2">
          {['week', 'month', 'quarter', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p === 'week' && 'Tydzień'}
              {p === 'month' && 'Miesiąc'}
              {p === 'quarter' && 'Kwartał'}
              {p === 'year' && 'Rok'}
            </button>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-3">💡 Insights</h3>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start">
                <span className="mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Karty z kluczowymi metrykami */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Projekty */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Projekty
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(overview.projects.total)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-green-600">
                        {formatNumber(overview.projects.completed)} ukończone
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ukończenie</span>
                <span>{formatPercentage(overview.projects.completionRate)}</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${overview.projects.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Zadania */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Zadania
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(overview.tasks.total)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-green-600">
                        {formatNumber(overview.tasks.completed)} ukończone
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ukończenie</span>
                <span>{formatPercentage(overview.tasks.completionRate)}</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${overview.tasks.completionRate}%` }}
                ></div>
              </div>
              {overview.tasks.overdue > 0 && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {formatNumber(overview.tasks.overdue)} przeterminowane
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Materiały */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Materiały
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatNumber(overview.materials.total)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            {overview.materials.lowStock > 0 && (
              <div className="mt-3 flex items-center text-sm text-orange-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {formatNumber(overview.materials.lowStock)} niski stan
              </div>
            )}
          </div>
        </div>

        {/* Zespół */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Top Wykonawca
                  </dt>
                  <dd className="flex items-baseline">
                    {team.topPerformers.length > 0 ? (
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {team.topPerformers[0].user.firstName} {team.topPerformers[0].user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(team.topPerformers[0].completedTasks)} zadań
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Brak danych</div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trendy projektów */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Trendy Projektów
          </h3>
          <div className="h-64">
            <Line data={projectTrendsData} options={lineChartOptions} />
          </div>
        </div>

        {/* Trendy zadań */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Trendy Zadań
          </h3>
          <div className="h-64">
            <Line data={taskTrendsData} options={lineChartOptions} />
          </div>
        </div>

        {/* Status projektów */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Status Projektów
          </h3>
          <div className="h-64">
            <Doughnut data={projectStatusData} options={doughnutOptions} />
          </div>
        </div>

        {/* Priorytety zadań */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Priorytety Zadań
          </h3>
          <div className="h-64">
            <Doughnut data={taskPriorityData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Top wykonawcy */}
      {team.topPerformers.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              🏆 Top Wykonawcy
            </h3>
            <div className="space-y-4">
              {team.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={performer.user.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {performer.user.firstName} {performer.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {performer.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(performer.completedTasks)} zadań
                    </div>
                    <div className="text-sm text-gray-500">
                      ukończonych
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 
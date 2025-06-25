import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Typy dla analityk
export interface DashboardOverview {
  projects: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
  materials: {
    total: number;
    lowStock: number;
  };
}

export interface TrendData {
  period: string;
  created: number;
  completed: number;
}

export interface TopPerformer {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  completedTasks: number;
}

export interface StatusDistribution {
  status: string;
  _count: {
    id: number;
  };
}

export interface DashboardData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: DashboardOverview;
  trends: {
    projects: TrendData[];
    tasks: TrendData[];
  };
  team: {
    topPerformers: TopPerformer[];
  };
  distributions: {
    projectStatus: StatusDistribution[];
    taskPriority: StatusDistribution[];
  };
}

export interface ProjectMetrics {
  project: {
    id: string;
    name: string;
    status: string;
    priority: string;
    budget: number;
    startDate: string;
    endDate: string;
    deadline: string;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };
  time: {
    estimatedHours: number;
    actualHours: number;
    efficiency: number;
  };
  costs: {
    budget: number;
    materialsCost: number;
    remaining: number;
  };
  progress: {
    timeline: Array<{
      date: string;
      completed: number;
      total: number;
      percentage: number;
    }>;
  };
  team: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
    assigned: number;
    completed: number;
    inProgress: number;
    estimatedHours: number;
    actualHours: number;
  }>;
  materials: {
    total: number;
    totalCost: number;
  };
}

export interface TeamMember {
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metrics: {
    assignedTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    estimatedHours: number;
    actualHours: number;
    efficiency: number;
  };
}

export interface TeamPerformanceData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  teamAverages: {
    completionRate: number;
    efficiency: number;
    totalTasks: number;
    totalCompleted: number;
    totalOverdue: number;
  };
  members: TeamMember[];
}

export interface CostAnalysisProject {
  project: {
    id: string;
    name: string;
    status: string;
  };
  costs: {
    budget: number;
    materials: number;
    labor: number;
    total: number;
    variance: number;
    variancePercentage: number;
  };
}

export interface MaterialCategory {
  category: string;
  quantity: number;
  averagePrice: number;
  totalValue: number;
  itemsCount: number;
}

export interface CostAnalysisData {
  period: string;
  summary: {
    totalBudget: number;
    totalActualCost: number;
    totalMaterialsCost: number;
    totalLaborCost: number;
    totalVariance: number;
    variancePercentage: number;
  };
  projects: CostAnalysisProject[];
  materialCategories: MaterialCategory[];
}

export interface AnalyticsRecord {
  id: string;
  type: string;
  data: any;
  period: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// Konfiguracja axios
const axiosConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Dodaj token do każdego żądania
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyticsService = {
  // Pobierz dane dashboardu analitycznego
  async getDashboardData(companyId: string, period: string = 'month'): Promise<DashboardData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analytics/dashboard`,
        {
          ...axiosConfig,
          params: { companyId, period }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Pobierz metryki konkretnego projektu
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analytics/projects/${projectId}/metrics`,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching project metrics:', error);
      throw error;
    }
  },

  // Pobierz dane wydajności zespołu
  async getTeamPerformance(companyId: string, period: string = 'month'): Promise<TeamPerformanceData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analytics/team-performance`,
        {
          ...axiosConfig,
          params: { companyId, period }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching team performance:', error);
      throw error;
    }
  },

  // Pobierz analizę kosztów
  async getCostAnalysis(companyId: string, period: string = 'month'): Promise<CostAnalysisData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analytics/cost-analysis`,
        {
          ...axiosConfig,
          params: { companyId, period }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
      throw error;
    }
  },

  // Zapisz dane analityczne
  async saveAnalytics(data: {
    companyId: string;
    type: string;
    data: any;
    period?: string;
    startDate: string;
    endDate: string;
  }): Promise<AnalyticsRecord> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/analytics/save`,
        data,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error saving analytics:', error);
      throw error;
    }
  },

  // Funkcje pomocnicze dla wykresów

  // Przygotuj dane dla wykresu trendów projektów
  prepareProjectTrendsData(trends: TrendData[]) {
    return {
      labels: trends.map(t => t.period),
      datasets: [
        {
          label: 'Utworzone',
          data: trends.map(t => t.created),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Ukończone',
          data: trends.map(t => t.completed),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
        }
      ]
    };
  },

  // Przygotuj dane dla wykresu statusów projektów
  prepareProjectStatusData(distribution: StatusDistribution[]) {
    const statusColors = {
      'PLANNING': '#f59e0b',
      'ACTIVE': '#3b82f6',
      'ON_HOLD': '#ef4444',
      'COMPLETED': '#10b981',
      'CANCELLED': '#6b7280'
    };

    return {
      labels: distribution.map(d => d.status),
      datasets: [{
        data: distribution.map(d => d._count.id),
        backgroundColor: distribution.map(d => statusColors[d.status as keyof typeof statusColors] || '#6b7280'),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  },

  // Przygotuj dane dla wykresu priorytetów zadań
  prepareTaskPriorityData(distribution: StatusDistribution[]) {
    const priorityColors = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#ef4444',
      'URGENT': '#dc2626'
    };

    return {
      labels: distribution.map(d => d.status),
      datasets: [{
        data: distribution.map(d => d._count.id),
        backgroundColor: distribution.map(d => priorityColors[d.status as keyof typeof priorityColors] || '#6b7280'),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  },

  // Przygotuj dane dla wykresu postępu projektu
  prepareProjectProgressData(timeline: ProjectMetrics['progress']['timeline']) {
    return {
      labels: timeline.map(t => t.date),
      datasets: [{
        label: 'Postęp (%)',
        data: timeline.map(t => t.percentage),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  },

  // Przygotuj dane dla wykresu kosztów
  prepareCostAnalysisData(projects: CostAnalysisProject[]) {
    return {
      labels: projects.map(p => p.project.name),
      datasets: [
        {
          label: 'Budżet',
          data: projects.map(p => p.costs.budget),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
        {
          label: 'Rzeczywiste koszty',
          data: projects.map(p => p.costs.total),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
        }
      ]
    };
  },

  // Formatowanie wartości
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  },

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  },

  formatHours(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    return `${hours.toFixed(1)}h`;
  },

  // Oblicz wskaźniki wydajności
  calculateEfficiencyScore(member: TeamMember): number {
    const completionWeight = 0.4;
    const efficiencyWeight = 0.3;
    const timelinessWeight = 0.3;

    const completionScore = member.metrics.completionRate;
    const efficiencyScore = member.metrics.efficiency;
    const timelinessScore = member.metrics.overdueTasks === 0 ? 100 : 
      Math.max(0, 100 - (member.metrics.overdueTasks / member.metrics.assignedTasks * 100));

    return (
      completionScore * completionWeight +
      efficiencyScore * efficiencyWeight +
      timelinessScore * timelinessWeight
    );
  },

  // Generuj insights na podstawie danych
  generateInsights(dashboardData: DashboardData): string[] {
    const insights: string[] = [];

    // Analiza ukończenia projektów
    if (dashboardData.overview.projects.completionRate < 50) {
      insights.push('Wskaźnik ukończenia projektów jest niski. Rozważ przegląd procesów zarządzania projektami.');
    }

    // Analiza zadań przeterminowanych
    if (dashboardData.overview.tasks.overdue > 0) {
      insights.push(`Masz ${dashboardData.overview.tasks.overdue} przeterminowanych zadań. Priorytetem powinno być ich ukończenie.`);
    }

    // Analiza materiałów
    if (dashboardData.overview.materials.lowStock > 0) {
      insights.push(`${dashboardData.overview.materials.lowStock} materiałów ma niski stan magazynowy. Rozważ uzupełnienie zapasów.`);
    }

    // Analiza trendów
    const projectTrends = dashboardData.trends.projects;
    if (projectTrends.length >= 2) {
      const lastPeriod = projectTrends[projectTrends.length - 1];
      const previousPeriod = projectTrends[projectTrends.length - 2];
      
      if (lastPeriod.completed > previousPeriod.completed) {
        insights.push('Trend ukończenia projektów jest pozytywny - dobra robota!');
      } else if (lastPeriod.completed < previousPeriod.completed) {
        insights.push('Spadek w ukończeniu projektów. Sprawdź czy zespół nie jest przeciążony.');
      }
    }

    return insights;
  }
};

export default analyticsService; 
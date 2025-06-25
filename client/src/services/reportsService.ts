import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Typy dla raportów
export interface ReportTemplate {
  type: string;
  name: string;
  description: string;
  fields: string[];
  formats: string[];
  premium?: boolean;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  config: any;
  data?: any;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED';
  isScheduled: boolean;
  schedule?: string;
  filePath?: string;
  fileFormat?: string;
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface GenerateReportRequest {
  name: string;
  type: string;
  config: any;
  format?: string;
}

export interface ScheduleReportRequest {
  name: string;
  type: string;
  config: any;
  format?: string;
  schedule: string;
}

export interface GenerateReportResponse {
  reportId: string;
  status: string;
  message: string;
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

export const reportsService = {
  // Pobierz listę raportów
  async getReports(filters?: {
    companyId?: string;
    type?: string;
    status?: string;
  }): Promise<Report[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reports`,
        {
          ...axiosConfig,
          params: filters
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Pobierz szablony raportów
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reports/templates`,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  },

  // Generuj raport
  async generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/reports/generate`,
        request,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // Pobierz szczegóły raportu
  async getReport(reportId: string): Promise<Report> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reports/${reportId}`,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  },

  // Pobierz raport (download)
  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/reports/${reportId}/download`,
        {
          ...axiosConfig,
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  },

  // Zaplanuj automatyczny raport
  async scheduleReport(request: ScheduleReportRequest): Promise<Report> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/reports/schedule`,
        request,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  },

  // Usuń raport
  async deleteReport(reportId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/reports/${reportId}`,
        axiosConfig
      );
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  // Funkcje pomocnicze

  // Pobierz ikonę dla typu raportu
  getReportTypeIcon(type: string): string {
    const icons = {
      'PROJECT_SUMMARY': '📊',
      'FINANCIAL_REPORT': '💰',
      'TEAM_PRODUCTIVITY': '👥',
      'TASK_COMPLETION': '✅',
      'MATERIAL_INVENTORY': '📦',
      'TIME_TRACKING': '⏱️',
      'COST_BREAKDOWN': '💸',
      'CUSTOM_REPORT': '📋'
    };
    return icons[type as keyof typeof icons] || '📄';
  },

  // Pobierz kolor dla statusu raportu
  getStatusColor(status: string): string {
    const colors = {
      'PENDING': 'text-yellow-600 bg-yellow-100',
      'GENERATING': 'text-blue-600 bg-blue-100',
      'COMPLETED': 'text-green-600 bg-green-100',
      'FAILED': 'text-red-600 bg-red-100',
      'SCHEDULED': 'text-purple-600 bg-purple-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  },

  // Pobierz opis statusu
  getStatusDescription(status: string): string {
    const descriptions = {
      'PENDING': 'Oczekuje na generowanie',
      'GENERATING': 'Generowanie w toku...',
      'COMPLETED': 'Gotowy do pobrania',
      'FAILED': 'Błąd podczas generowania',
      'SCHEDULED': 'Zaplanowany automatycznie'
    };
    return descriptions[status as keyof typeof descriptions] || 'Nieznany status';
  },

  // Waliduj konfigurację raportu
  validateReportConfig(type: string, config: any): string[] {
    const errors: string[] = [];

    switch (type) {
      case 'PROJECT_SUMMARY':
        if (!config.projectId) {
          errors.push('Wybierz projekt do raportu');
        }
        break;

      case 'FINANCIAL_REPORT':
      case 'TEAM_PRODUCTIVITY':
      case 'MATERIAL_INVENTORY':
        if (!config.companyId) {
          errors.push('Wybierz firmę do raportu');
        }
        break;

      case 'TASK_COMPLETION':
        if (!config.companyId) {
          errors.push('Wybierz firmę do raportu');
        }
        if (config.projectId && !config.companyId) {
          errors.push('Projekt wymaga wybrania firmy');
        }
        break;

      case 'TIME_TRACKING':
        if (!config.companyId) {
          errors.push('Wybierz firmę do raportu');
        }
        if (!config.period) {
          errors.push('Wybierz okres do raportu');
        }
        break;
    }

    return errors;
  },

  // Waliduj cron expression
  validateCronExpression(expression: string): boolean {
    // Podstawowa walidacja cron expression (5 lub 6 pól)
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(expression);
  },

  // Pobierz przykłady cron expressions
  getCronExamples(): Array<{ expression: string; description: string }> {
    return [
      { expression: '0 9 * * 1', description: 'Każdy poniedziałek o 9:00' },
      { expression: '0 9 1 * *', description: 'Pierwszy dzień miesiąca o 9:00' },
      { expression: '0 9 * * 1-5', description: 'Dni robocze o 9:00' },
      { expression: '0 18 * * 5', description: 'Każdy piątek o 18:00' },
      { expression: '0 9 1 1,4,7,10 *', description: 'Kwartalnie (1 stycznia, kwietnia, lipca, października) o 9:00' }
    ];
  },

  // Formatuj rozmiar pliku
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Pobierz typ MIME dla formatu
  getMimeType(format: string): string {
    const mimeTypes = {
      'PDF': 'application/pdf',
      'EXCEL': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'CSV': 'text/csv'
    };
    return mimeTypes[format as keyof typeof mimeTypes] || 'application/octet-stream';
  },

  // Pobierz rozszerzenie pliku dla formatu
  getFileExtension(format: string): string {
    const extensions = {
      'PDF': 'pdf',
      'EXCEL': 'xlsx',
      'CSV': 'csv'
    };
    return extensions[format as keyof typeof extensions] || 'bin';
  },

  // Generuj nazwę pliku dla raportu
  generateFileName(report: Report): string {
    const date = new Date(report.createdAt).toISOString().split('T')[0];
    const extension = this.getFileExtension(report.fileFormat || 'PDF');
    const safeName = report.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeName}_${date}.${extension}`;
  },

  // Pobierz dostępne okresy dla raportów
  getAvailablePeriods(): Array<{ value: string; label: string }> {
    return [
      { value: 'week', label: 'Ostatni tydzień' },
      { value: 'month', label: 'Ostatni miesiąc' },
      { value: 'quarter', label: 'Ostatni kwartał' },
      { value: 'year', label: 'Ostatni rok' },
      { value: 'custom', label: 'Okres niestandardowy' }
    ];
  },

  // Pobierz dostępne formaty raportów
  getAvailableFormats(): Array<{ value: string; label: string; description: string }> {
    return [
      { 
        value: 'PDF', 
        label: 'PDF', 
        description: 'Dokument PDF gotowy do druku i udostępniania' 
      },
      { 
        value: 'EXCEL', 
        label: 'Excel', 
        description: 'Arkusz kalkulacyjny z danymi do dalszej analizy' 
      },
      { 
        value: 'CSV', 
        label: 'CSV', 
        description: 'Dane w formacie CSV do importu w innych systemach' 
      }
    ];
  },

  // Sprawdź czy raport wymaga premium
  isReportPremium(type: string): boolean {
    const premiumReports = [
      'FINANCIAL_REPORT',
      'TEAM_PRODUCTIVITY',
      'TIME_TRACKING',
      'COST_BREAKDOWN'
    ];
    return premiumReports.includes(type);
  },

  // Pobierz szacowany czas generowania
  getEstimatedGenerationTime(type: string, config: any): string {
    // Szacowany czas w zależności od typu raportu i ilości danych
    const baseTimes = {
      'PROJECT_SUMMARY': 30,
      'FINANCIAL_REPORT': 60,
      'TEAM_PRODUCTIVITY': 45,
      'TASK_COMPLETION': 30,
      'MATERIAL_INVENTORY': 20,
      'TIME_TRACKING': 50,
      'COST_BREAKDOWN': 40,
      'CUSTOM_REPORT': 60
    };

    const baseTime = baseTimes[type as keyof typeof baseTimes] || 30;
    
    // Dodaj czas w zależności od zakresu danych
    let multiplier = 1;
    if (config.period === 'year') multiplier = 2;
    else if (config.period === 'quarter') multiplier = 1.5;

    const estimatedSeconds = baseTime * multiplier;
    
    if (estimatedSeconds < 60) {
      return `${Math.round(estimatedSeconds)} sekund`;
    } else {
      return `${Math.round(estimatedSeconds / 60)} minut`;
    }
  },

  // Pobierz sugerowane nazwy raportów
  getSuggestedReportName(type: string, config: any): string {
    const typeNames = {
      'PROJECT_SUMMARY': 'Podsumowanie Projektu',
      'FINANCIAL_REPORT': 'Raport Finansowy',
      'TEAM_PRODUCTIVITY': 'Produktywność Zespołu',
      'TASK_COMPLETION': 'Ukończenie Zadań',
      'MATERIAL_INVENTORY': 'Inwentarz Materiałów',
      'TIME_TRACKING': 'Śledzenie Czasu',
      'COST_BREAKDOWN': 'Podział Kosztów',
      'CUSTOM_REPORT': 'Raport Niestandardowy'
    };

    const baseName = typeNames[type as keyof typeof typeNames] || 'Raport';
    const date = new Date().toLocaleDateString('pl-PL');
    
    return `${baseName} - ${date}`;
  }
}; 
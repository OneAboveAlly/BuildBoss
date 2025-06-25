import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon as FileText, 
  ArrowDownTrayIcon as Download, 
  CalendarIcon as Calendar, 
  PlusIcon as Plus, 
  FunnelIcon as Filter, 
  MagnifyingGlassIcon as Search,
  ClockIcon as Clock,
  CheckCircleIcon as CheckCircle,
  XCircleIcon as XCircle,
  ExclamationTriangleIcon as AlertCircle,
  TrashIcon as Trash2,
  CogIcon as Settings,
  EyeIcon as Eye,
  ArrowPathIcon as RefreshCw
} from '@heroicons/react/24/outline';
import { reportsService } from '../services/reportsService';
import type { Report, ReportTemplate, GenerateReportRequest } from '../services/reportsService';
import ReportBuilder from '../components/reports/ReportBuilder';

interface Company {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  companyId: string;
}

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtry
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, templatesData] = await Promise.all([
        reportsService.getReports(),
        reportsService.getTemplates()
      ]);
      
      setReports(reportsData);
      setTemplates(templatesData);
      
      // TODO: Pobierz firmy i projekty z odpowiednich serwisów
      // setCompanies(await companyService.getCompanies());
      // setProjects(await projectService.getProjects());
      
    } catch (err) {
      setError('Błąd podczas ładowania danych');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (report: GenerateReportRequest) => {
    try {
      await reportsService.generateReport(report);
      loadData(); // Odśwież listę raportów
      
    } catch (err) {
      setError('Błąd podczas generowania raportu');
      console.error(err);
    }
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      const blob = await reportsService.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportsService.generateFileName(report);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Błąd podczas pobierania raportu');
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten raport?')) return;
    
    try {
      await reportsService.deleteReport(reportId);
      loadData();
    } catch (err) {
      setError('Błąd podczas usuwania raportu');
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'GENERATING':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'SCHEDULED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'PENDING': 'Oczekujący',
      'GENERATING': 'Generowanie',
      'COMPLETED': 'Ukończony',
      'FAILED': 'Nieudany',
      'SCHEDULED': 'Zaplanowany'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const filteredReports = reports.filter(report => {
    const matchesCompany = !selectedCompany || report.company?.id === selectedCompany;
    const matchesType = !selectedType || report.type === selectedType;
    const matchesStatus = !selectedStatus || report.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      report.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCompany && matchesType && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Ładowanie raportów...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raporty</h1>
          <p className="text-gray-600 mt-1">Generuj i zarządzaj raportami projektów</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Zaplanuj raport
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nowy raport
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Szukaj raportów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Wszystkie firmy</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Wszystkie typy</option>
            {templates.map(template => (
              <option key={template.type} value={template.type}>{template.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Wszystkie statusy</option>
            <option value="PENDING">Oczekujący</option>
            <option value="GENERATING">Generowanie</option>
            <option value="COMPLETED">Ukończony</option>
            <option value="FAILED">Nieudany</option>
            <option value="SCHEDULED">Zaplanowany</option>
          </select>

          <button
            onClick={loadData}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Odśwież
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak raportów</h3>
            <p className="text-gray-600 mb-4">
              {reports.length === 0 
                ? 'Nie masz jeszcze żadnych raportów. Utwórz pierwszy raport.'
                : 'Nie znaleziono raportów spełniających kryteria wyszukiwania.'
              }
            </p>
            {reports.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Utwórz pierwszy raport
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utworzono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {reportsService.getReportTypeIcon(report.type)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.name}
                          </div>
                          {report.company && (
                            <div className="text-sm text-gray-500">
                              {report.company.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {templates.find(t => t.type === report.type)?.name || report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(report.status)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(report.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {report.fileFormat || 'PDF'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {report.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Pobierz raport"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Zobacz szczegóły"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Usuń raport"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Builder */}
      <ReportBuilder
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGenerate={handleGenerateReport}
        templates={templates}
        companies={companies}
        projects={projects}
      />

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Szczegóły raportu</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nazwa</label>
                  <p className="text-sm text-gray-900">{selectedReport.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Typ</label>
                  <p className="text-sm text-gray-900">
                    {templates.find(t => t.type === selectedReport.type)?.name || selectedReport.type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center">
                    {getStatusIcon(selectedReport.status)}
                    <span className="ml-2 text-sm text-gray-900">
                      {getStatusText(selectedReport.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Format</label>
                  <p className="text-sm text-gray-900">{selectedReport.fileFormat || 'PDF'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Utworzono</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedReport.createdAt).toLocaleString('pl-PL')}
                  </p>
                </div>
                {selectedReport.generatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Wygenerowano</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedReport.generatedAt).toLocaleString('pl-PL')}
                    </p>
                  </div>
                )}
              </div>

              {selectedReport.isScheduled && selectedReport.schedule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harmonogram</label>
                  <p className="text-sm text-gray-900">{selectedReport.schedule}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              {selectedReport.status === 'COMPLETED' && (
                <button
                  onClick={() => handleDownloadReport(selectedReport)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Pobierz
                </button>
              )}
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage; 
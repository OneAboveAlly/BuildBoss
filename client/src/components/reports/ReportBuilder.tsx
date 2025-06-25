import React, { useState, useEffect } from 'react';
import { 
  CogIcon as Settings, 
  CalendarIcon as Calendar, 
  BuildingOfficeIcon as Building, 
  FolderOpenIcon as FolderOpen, 
  UsersIcon as Users, 
  ClockIcon as Clock,
  CurrencyDollarIcon as DollarSign,
  DocumentTextIcon as FileText,
  ArrowDownTrayIcon as Download,
  EyeIcon as Eye,
  ExclamationTriangleIcon as AlertCircle,
  CheckCircleIcon as CheckCircle
} from '@heroicons/react/24/outline';
import { reportsService } from '../../services/reportsService';
import type { ReportTemplate, GenerateReportRequest } from '../../services/reportsService';

interface Company {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  companyId: string;
}

interface ReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (report: GenerateReportRequest) => void;
  templates: ReportTemplate[];
  companies: Company[];
  projects: Project[];
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  isOpen,
  onClose,
  onGenerate,
  templates,
  companies,
  projects
}) => {
  const [step, setStep] = useState(1);
  const [report, setReport] = useState<GenerateReportRequest>({
    name: '',
    type: '',
    config: {},
    format: 'PDF'
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setReport({
        name: '',
        type: '',
        config: {},
        format: 'PDF'
      });
      setSelectedTemplate(null);
      setErrors([]);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReport(prev => ({
      ...prev,
      type: template.type,
      name: reportsService.getSuggestedReportName(template.type, {})
    }));
    setStep(2);
  };

  const handleConfigChange = (field: string, value: any) => {
    setReport(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  const validateReport = (): string[] => {
    const validationErrors = [];
    
    if (!report.name.trim()) {
      validationErrors.push('Nazwa raportu jest wymagana');
    }
    
    if (!report.type) {
      validationErrors.push('Typ raportu jest wymagany');
    }
    
    if (selectedTemplate) {
      const configErrors = reportsService.validateReportConfig(report.type, report.config);
      validationErrors.push(...configErrors);
    }
    
    return validationErrors;
  };

  const handleGenerate = () => {
    const validationErrors = validateReport();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onGenerate(report);
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
        <div className={`w-12 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          3
        </div>
      </div>
    </div>
  );

  const renderTemplateSelection = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Wybierz typ raportu</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <div
            key={template.type}
            onClick={() => handleTemplateSelect(template)}
            className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">
                {reportsService.getReportTypeIcon(template.type)}
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 flex items-center">
                  {template.name}
                  {template.premium && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      Premium
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="flex items-center mt-2 space-x-2">
                  {template.formats.map(format => (
                    <span key={format} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConfiguration = () => {
    if (!selectedTemplate) return null;

    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Konfiguracja raportu</h3>
        
        <div className="space-y-4">
          {/* Nazwa raportu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa raportu *
            </label>
            <input
              type="text"
              value={report.name}
              onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Wprowadź nazwę raportu"
            />
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={report.format}
              onChange={(e) => setReport(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {selectedTemplate.formats.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          {/* Firma (jeśli wymagana) */}
          {selectedTemplate.fields.includes('companyId') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Firma *
              </label>
              <select
                value={report.config.companyId || ''}
                onChange={(e) => handleConfigChange('companyId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wybierz firmę</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Projekt (jeśli wymagany) */}
          {selectedTemplate.fields.includes('projectId') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projekt *
              </label>
              <select
                value={report.config.projectId || ''}
                onChange={(e) => handleConfigChange('projectId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wybierz projekt</option>
                {projects
                  .filter(project => !report.config.companyId || project.companyId === report.config.companyId)
                  .map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Okres (jeśli wymagany) */}
          {selectedTemplate.fields.includes('period') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Okres
              </label>
              <select
                value={report.config.period || 'monthly'}
                onChange={(e) => handleConfigChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reportsService.getAvailablePeriods().map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Daty niestandardowe */}
          {selectedTemplate.fields.includes('dateRange') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data od
                </label>
                <input
                  type="date"
                  value={report.config.startDate || ''}
                  onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do
                </label>
                <input
                  type="date"
                  value={report.config.endDate || ''}
                  onChange={(e) => handleConfigChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Szacowany czas generowania */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Szacowany czas generowania: {reportsService.getEstimatedGenerationTime(report.type, report.config)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPreview = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Podgląd raportu</h3>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-20 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{report.name}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {selectedTemplate?.name} • {report.format}
            </p>
            
            <div className="mt-4 space-y-2">
              {report.config.companyId && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  {companies.find(c => c.id === report.config.companyId)?.name}
                </div>
              )}
              
              {report.config.projectId && (
                <div className="flex items-center text-sm text-gray-600">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {projects.find(p => p.id === report.config.projectId)?.name}
                </div>
              )}
              
              {report.config.period && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {reportsService.getAvailablePeriods().find(p => p.value === report.config.period)?.label}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Błędy walidacji */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="font-medium text-red-800">Błędy walidacji:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Kreator raportów</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          {renderStepIndicator()}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 1 && renderTemplateSelection()}
          {step === 2 && renderConfiguration()}
          {step === 3 && renderPreview()}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Wstecz
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !selectedTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Dalej
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Generuj raport
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder; 
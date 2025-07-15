import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowDownTrayIcon as Download,
  DocumentTextIcon as Document,
  ClockIcon as Clock,
  CheckCircleIcon as CheckCircle,
  ExclamationTriangleIcon as AlertTriangle,
  InformationCircleIcon as Info
} from '@heroicons/react/24/outline';

interface ExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'expired' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  format: 'json' | 'csv';
  size?: string;
}

interface DataExportRequestProps {
  userId?: string;
  onRequestSubmitted?: (requestId: string) => void;
}

const DataExportRequest: React.FC<DataExportRequestProps> = ({
  userId,
  onRequestSubmitted
}) => {
  const { t } = useTranslation('legal');
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [includeOptions, setIncludeOptions] = useState({
    profile: true,
    projects: true,
    tasks: true,
    messages: true,
    files: false,
    analytics: false
  });
  const [currentRequest, setCurrentRequest] = useState<ExportRequest | null>(null);
  const [requestHistory, setRequestHistory] = useState<ExportRequest[]>([]);

  const handleSubmitRequest = async () => {
    try {
      setLoading(true);
      
      const requestData = {
        format: selectedFormat,
        include: includeOptions
      };

      // API call to submit export request
      const response = await fetch('/api/gdpr/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        const newRequest: ExportRequest = {
          id: result.requestId,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          format: selectedFormat
        };
        
        setCurrentRequest(newRequest);
        setRequestHistory(prev => [newRequest, ...prev]);
        onRequestSubmitted?.(result.requestId);
      } else {
        throw new Error('Failed to submit export request');
      }
    } catch (error) {
      console.error('Export request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (request: ExportRequest) => {
    if (request.downloadUrl) {
      const link = document.createElement('a');
      link.href = request.downloadUrl;
              link.download = `buildboss-data-export.${request.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusIcon = (status: ExportRequest['status']) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = (status: ExportRequest['status']) => {
    return t(`gdpr.export.status.${status}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Download className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('gdpr.export.title')}
          </h1>
          <p className="text-gray-600">
            {t('gdpr.export.description')}
          </p>
        </div>
      </div>

      {/* Current Request Status */}
      {currentRequest && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('gdpr.export.currentRequest')}
          </h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(currentRequest.status)}
              <div>
                <p className="font-medium text-gray-900">
                  {getStatusText(currentRequest.status)}
                </p>
                <p className="text-sm text-gray-600">
                  {t('gdpr.export.requestedOn', { date: formatDate(currentRequest.requestedAt) })}
                </p>
              </div>
            </div>
            
            {currentRequest.status === 'ready' && (
              <button
                onClick={() => handleDownload(currentRequest)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>{t('gdpr.export.download')}</span>
              </button>
            )}
          </div>

          {currentRequest.status === 'ready' && currentRequest.expiresAt && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  {t('gdpr.export.expiresOn', { date: formatDate(currentRequest.expiresAt) })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Export Request */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('gdpr.export.newRequest')}
        </h2>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('gdpr.export.format')}
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="json"
                checked={selectedFormat === 'json'}
                onChange={(e) => setSelectedFormat(e.target.value as 'json' | 'csv')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">JSON</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={selectedFormat === 'csv'}
                onChange={(e) => setSelectedFormat(e.target.value as 'json' | 'csv')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">CSV</span>
            </label>
          </div>
        </div>

        {/* Data Categories */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('gdpr.export.includeData')}
          </label>
          <div className="space-y-3">
            {Object.entries(includeOptions).map(([key, checked]) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setIncludeOptions(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t(`gdpr.export.dataTypes.${key}`)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t(`gdpr.export.dataTypes.${key}Desc`)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('gdpr.export.info')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('gdpr.export.infoPoint1')}</li>
                <li>{t('gdpr.export.infoPoint2')}</li>
                <li>{t('gdpr.export.infoPoint3')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitRequest}
          disabled={loading || !!currentRequest}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-5 w-5" />
          <span>
            {loading ? t('gdpr.export.requesting') : t('gdpr.export.submitRequest')}
          </span>
        </button>
      </div>

      {/* Request History */}
      {requestHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('gdpr.export.history')}
          </h2>
          
          <div className="space-y-3">
            {requestHistory.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {getStatusText(request.status)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(request.requestedAt)} • {request.format.toUpperCase()}
                      {request.size && ` • ${request.size}`}
                    </p>
                  </div>
                </div>
                
                {request.status === 'ready' && (
                  <button
                    onClick={() => handleDownload(request)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>{t('gdpr.export.download')}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExportRequest; 
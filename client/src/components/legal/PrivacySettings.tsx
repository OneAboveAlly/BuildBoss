import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheckIcon as Shield, 
  EyeIcon as Eye, 
  EyeSlashIcon as EyeOff, 
  ArrowDownTrayIcon as Download, 
  TrashIcon as Trash2, 
  CogIcon as Settings, 
  ExclamationTriangleIcon as AlertTriangle,
  CheckIcon as Check,
  XMarkIcon as X
} from '@heroicons/react/24/outline';

interface PrivacyPreferences {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  dataProcessing: boolean;
  profileVisibility: 'public' | 'team' | 'private';
  activityTracking: boolean;
  emailNotifications: boolean;
}

interface PrivacySettingsProps {
  userId?: string;
  onSettingsChange?: (settings: PrivacyPreferences) => void;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  userId,
  onSettingsChange
}) => {
  const { t } = useTranslation('legal');
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    analytics: false,
    marketing: false,
    functional: true,
    dataProcessing: true,
    profileVisibility: 'team',
    activityTracking: false,
    emailNotifications: true
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showDataDeletion, setShowDataDeletion] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, [userId]);

  const loadPrivacySettings = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      // API call to load user privacy settings
      // const response = await fetch(`/api/users/${userId}/privacy-settings`);
      // const data = await response.json();
      // setPreferences(data);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof PrivacyPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    onSettingsChange?.(newPreferences);
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // API call to save privacy settings
      // await fetch(`/api/users/${userId}/privacy-settings`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(preferences)
      // });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = () => {
    setShowDataExport(true);
  };

  const handleDataDeletion = () => {
    setShowDataDeletion(true);
  };

  const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }> = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-blue-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('privacy.settings.title')}
          </h1>
          <p className="text-gray-600">
            {t('privacy.settings.description')}
          </p>
        </div>
      </div>

      {/* Cookie and Tracking Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          {t('privacy.cookies.title')}
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {t('privacy.cookies.functional')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('privacy.cookies.functionalDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.functional}
              onChange={(checked) => handlePreferenceChange('functional', checked)}
              disabled={true} // Always required
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {t('privacy.cookies.analytics')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('privacy.cookies.analyticsDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.analytics}
              onChange={(checked) => handlePreferenceChange('analytics', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {t('privacy.cookies.marketing')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('privacy.cookies.marketingDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.marketing}
              onChange={(checked) => handlePreferenceChange('marketing', checked)}
            />
          </div>
        </div>
      </div>

      {/* Data Processing Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('privacy.dataProcessing.title')}
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {t('privacy.dataProcessing.core')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('privacy.dataProcessing.coreDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.dataProcessing}
              onChange={(checked) => handlePreferenceChange('dataProcessing', checked)}
              disabled={true} // Required for service
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {t('privacy.dataProcessing.activity')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('privacy.dataProcessing.activityDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.activityTracking}
              onChange={(checked) => handlePreferenceChange('activityTracking', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {t('privacy.dataProcessing.notifications')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('privacy.dataProcessing.notificationsDesc')}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.emailNotifications}
              onChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
            />
          </div>
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          {t('privacy.visibility.title')}
        </h2>
        
        <div className="space-y-3">
          {(['public', 'team', 'private'] as const).map((visibility) => (
            <label key={visibility} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="profileVisibility"
                value={visibility}
                checked={preferences.profileVisibility === visibility}
                onChange={(e) => handlePreferenceChange('profileVisibility', e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {t(`privacy.visibility.${visibility}`)}
                </div>
                <div className="text-sm text-gray-600">
                  {t(`privacy.visibility.${visibility}Desc`)}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* GDPR Rights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('gdpr.rights.title')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDataExport}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5 text-blue-600" />
            <span className="font-medium">{t('gdpr.export.button')}</span>
          </button>

          <button
            onClick={handleDataDeletion}
            className="flex items-center justify-center space-x-2 p-4 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-600"
          >
            <Trash2 className="h-5 w-5" />
            <span className="font-medium">{t('gdpr.delete.button')}</span>
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('gdpr.rights.info')}</p>
              <p>{t('gdpr.rights.infoDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {saved && (
            <>
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-medium">
                {t('privacy.settings.saved')}
              </span>
            </>
          )}
        </div>
        
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('common.saving') : t('common.save')}
        </button>
      </div>

      {/* Data Export Modal */}
      {showDataExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('gdpr.export.title')}</h3>
              <button
                onClick={() => setShowDataExport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              {t('gdpr.export.description')}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDataExport(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  // Handle data export
                  setShowDataExport(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('gdpr.export.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Deletion Modal */}
      {showDataDeletion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                {t('gdpr.delete.title')}
              </h3>
              <button
                onClick={() => setShowDataDeletion(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-600">
                  {t('gdpr.delete.warning')}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {t('gdpr.delete.description')}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDataDeletion(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  // Handle data deletion
                  setShowDataDeletion(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t('gdpr.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettings; 
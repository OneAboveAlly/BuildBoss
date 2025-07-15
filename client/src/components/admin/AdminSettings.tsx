import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  ServerIcon,
  CloudIcon,
  KeyIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailConfirmation: boolean;
    enableTwoFactor: boolean;
    passwordMinLength: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    userRegistrationAlerts: boolean;
    paymentAlerts: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
    lastBackup: string;
    nextBackup: string;
  };
}

interface AdminSettingsProps {
  onBack: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // TODO: Zastąp rzeczywistymi API calls
      const mockSettings: SystemSettings = {
        general: {
          siteName: 'BuildBoss',
          siteDescription: 'Platforma do zarządzania projektami budowlanymi',
          maintenanceMode: false,
          maxFileSize: 10,
          allowedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx']
        },
        security: {
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          requireEmailConfirmation: true,
          enableTwoFactor: false,
          passwordMinLength: 8
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'noreply@buildboss.pl',
          smtpSecure: true,
          fromEmail: 'noreply@buildboss.pl',
          fromName: 'BuildBoss System'
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          adminAlerts: true,
          userRegistrationAlerts: true,
          paymentAlerts: true
        },
        backup: {
          autoBackup: true,
          backupFrequency: 'daily',
          retentionDays: 30,
          lastBackup: '2024-07-09T02:00:00Z',
          nextBackup: '2024-07-10T02:00:00Z'
        }
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error('Błąd podczas ładowania ustawień:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      // TODO: Zastąp rzeczywistymi API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Ustawienia zapisane:', settings);
    } catch (error) {
      console.error('Błąd podczas zapisywania ustawień:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Ładowanie ustawień...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nie udało się załadować ustawień</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Ogólne', icon: CogIcon },
    { id: 'security', label: 'Bezpieczeństwo', icon: ShieldCheckIcon },
    { id: 'email', label: 'Email', icon: BellIcon },
    { id: 'notifications', label: 'Powiadomienia', icon: BellIcon },
    { id: 'backup', label: 'Backup', icon: ServerIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            ← Powrót
          </Button>
          <h1 className="text-2xl font-bold">Ustawienia Systemu</h1>
        </div>
        <Button onClick={handleSaveSettings} loading={saving}>
          Zapisz ustawienia
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Ustawienia ogólne</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nazwa strony</label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, siteName: e.target.value }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Opis strony</label>
                  <input
                    type="text"
                    value={settings.general.siteDescription}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, siteDescription: e.target.value }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Maksymalny rozmiar pliku (MB)</label>
                  <input
                    type="number"
                    value={settings.general.maxFileSize}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, maxFileSize: parseInt(e.target.value) }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Dozwolone typy plików</label>
                  <input
                    type="text"
                    value={settings.general.allowedFileTypes.join(', ')}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, allowedFileTypes: e.target.value.split(',').map(s => s.trim()) }
                    } : null)}
                    placeholder="jpg, png, pdf, doc, docx"
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    general: { ...prev.general, maintenanceMode: e.target.checked }
                  } : null)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="maintenanceMode" className="text-sm font-medium">
                  Tryb konserwacji
                </label>
                <Badge variant={settings.general.maintenanceMode ? 'warning' : 'success'}>
                  {settings.general.maintenanceMode ? 'Włączony' : 'Wyłączony'}
                </Badge>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Ustawienia bezpieczeństwa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Timeout sesji (godziny)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Maksymalna liczba prób logowania</label>
                  <input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Minimalna długość hasła</label>
                  <input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireEmailConfirmation"
                    checked={settings.security.requireEmailConfirmation}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, requireEmailConfirmation: e.target.checked }
                    } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireEmailConfirmation" className="text-sm font-medium">
                    Wymagaj potwierdzenia email
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableTwoFactor"
                    checked={settings.security.enableTwoFactor}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, enableTwoFactor: e.target.checked }
                    } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enableTwoFactor" className="text-sm font-medium">
                    Włącz uwierzytelnianie dwuskładnikowe
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Konfiguracja email</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.email.smtpHost}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, smtpHost: e.target.value }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, smtpPort: parseInt(e.target.value) }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">SMTP User</label>
                  <input
                    type="text"
                    value={settings.email.smtpUser}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, smtpUser: e.target.value }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">From Email</label>
                  <input
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, fromEmail: e.target.value }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">From Name</label>
                  <input
                    type="text"
                    value={settings.email.fromName}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, fromName: e.target.value }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={settings.email.smtpSecure}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    email: { ...prev.email, smtpSecure: e.target.checked }
                  } : null)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="smtpSecure" className="text-sm font-medium">
                  Użyj SSL/TLS
                </label>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Ustawienia powiadomień</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, emailNotifications: e.target.checked }
                    } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="emailNotifications" className="text-sm font-medium">
                    Powiadomienia email
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, pushNotifications: e.target.checked }
                    } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="pushNotifications" className="text-sm font-medium">
                    Powiadomienia push
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="adminAlerts"
                    checked={settings.notifications.adminAlerts}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, adminAlerts: e.target.checked }
                    } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="adminAlerts" className="text-sm font-medium">
                    Alerty dla administratorów
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="userRegistrationAlerts"
                    checked={settings.notifications.userRegistrationAlerts}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, userRegistrationAlerts: e.target.checked }
                    } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="userRegistrationAlerts" className="text-sm font-medium">
                    Powiadomienia o rejestracji użytkowników
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="paymentAlerts"
                    checked={settings.notifications.paymentAlerts}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, paymentAlerts: e.target.checked }
                    } : null)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="paymentAlerts" className="text-sm font-medium">
                    Powiadomienia o płatnościach
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Ustawienia backupu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Częstotliwość backupu</label>
                  <select
                    value={settings.backup.backupFrequency}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      backup: { ...prev.backup, backupFrequency: e.target.value }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="hourly">Co godzinę</option>
                    <option value="daily">Codziennie</option>
                    <option value="weekly">Co tydzień</option>
                    <option value="monthly">Co miesiąc</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Retencja (dni)</label>
                  <input
                    type="number"
                    value={settings.backup.retentionDays}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      backup: { ...prev.backup, retentionDays: parseInt(e.target.value) }
                    } : null)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoBackup"
                  checked={settings.backup.autoBackup}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    backup: { ...prev.backup, autoBackup: e.target.checked }
                  } : null)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoBackup" className="text-sm font-medium">
                  Automatyczny backup
                </label>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Status backupu</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Ostatni backup:</span> {formatDate(settings.backup.lastBackup)}</div>
                  <div><span className="font-medium">Następny backup:</span> {formatDate(settings.backup.nextBackup)}</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Wykonaj backup teraz
                </Button>
                <Button variant="outline" size="sm">
                  Przywróć z backupu
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}; 
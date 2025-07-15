import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { User } from '../types';
import { AdminModal } from '../components/common/AdminModal';
import { AdminMessages } from '../components/admin/AdminMessages';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminUsers } from '../components/admin/AdminUsers';
import { AdminStats } from '../components/admin/AdminStats';
import { AdminCompanies } from '../components/admin/AdminCompanies';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminProvider, useAdmin } from '../contexts/AdminContext';
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const API = 'http://localhost:5000/plans-admin';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  maxCompanies: number;
  maxProjects: number;
  maxWorkers: number;
  maxJobOffers: number;
  maxWorkRequests: number;
  maxStorageGB: number;
  hasAdvancedReports: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  hasTeamManagement: boolean;
  isActive: boolean;
}

interface UserStats {
  totalUsers: number;
  usersByPlan: { [planName: string]: number };
  usersWithoutSubscription: number;
}

type AdminSection = 'dashboard' | 'messages' | 'users' | 'stats' | 'companies' | 'settings' | 'plans';

const AdminSecretPlansPageContent: React.FC = () => {
  const { t } = useTranslation('subscription');
  const { t: tCommon } = useTranslation('common');
  const { adminToken, setAdminToken, isAdminLoggedIn } = useAdmin();
  
  // Authentication states
  const [step, setStep] = useState<'login' | 'panel'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Panel states
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Plans states
  const [plans, setPlans] = useState<Plan[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Users states
  const [userEmail, setUserEmail] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [userSubLoading, setUserSubLoading] = useState(false);
  const [userSubError, setUserSubError] = useState('');
  const [editUserPlan, setEditUserPlan] = useState<string | null>(null);
  const [editTrialEnd, setEditTrialEnd] = useState<string | null>(null);
  const [editEndDate, setEditEndDate] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [cancelledSubscriptions, setCancelledSubscriptions] = useState<any[]>([]);
  const [cancellationReasons, setCancellationReasons] = useState<any[]>([]);
  const [showCancelledSubs, setShowCancelledSubs] = useState(false);
  const [userUsage, setUserUsage] = useState<any>(null);

  // Sprawdź czy użytkownik jest już zalogowany przy ładowaniu
  useEffect(() => {
    if (isAdminLoggedIn) {
      setStep('panel');
    }
  }, [isAdminLoggedIn]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/login`, { email, password });
      const newToken = res.data.token;
      setAdminToken(newToken);
      setStep('panel');
    } catch (err: any) {
      setError(err.response?.data?.error || tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when panel is active
  useEffect(() => {
    if (adminToken && step === 'panel') {
      fetchPlans();
      fetchChanges();
      fetchUserStats();
    }
  }, [adminToken, step]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API}/plans`, { headers: { Authorization: `Bearer ${adminToken}` } });
      setPlans(res.data);
    } catch (err) {
      setError(tCommon('error'));
    }
  };

  const fetchChanges = async () => {
    try {
      const res = await axios.get(`${API}/changes`, { headers: { Authorization: `Bearer ${adminToken}` } });
      setChanges(res.data);
    } catch (err) {
      setError(tCommon('error'));
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await axios.get(`${API}/user-stats`, { headers: { Authorization: `Bearer ${adminToken}` } });
      setUserStats(res.data);
    } catch (err) {
      console.error('Błąd pobierania statystyk użytkowników:', err);
    }
  };

  // Pobierz anulowane subskrypcje
  const fetchCancelledSubscriptions = async () => {
    try {
      const res = await axios.get(`${API}/cancelled-subscriptions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setCancelledSubscriptions(res.data);
    } catch (err) {
      console.error('Błąd pobierania anulowanych subskrypcji:', err);
    }
  };

  // Pobierz powody anulowania
  const fetchCancellationReasons = async () => {
    try {
      const res = await axios.get(`${API}/cancellation-reasons`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setCancellationReasons(res.data);
    } catch (err) {
      console.error('Błąd pobierania powodów anulowania:', err);
    }
  };

  // Pobierz statystyki użycia dla użytkownika
  const fetchUserUsage = async (userId: string) => {
    try {
      const res = await axios.get(`${API}/user-usage/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      return res.data;
    } catch (err) {
      console.error('Błąd pobierania statystyk użycia użytkownika:', err);
      return null;
    }
  };

  // Dynamiczne wyszukiwanie użytkowników
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const res = await axios.get(`${API}/search-users?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setSearchResults(res.data.users);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Błąd wyszukiwania użytkowników:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Pobierz dane po zalogowaniu
  useEffect(() => {
    if (adminToken && step === 'panel') {
      fetchPlans();
      fetchChanges();
      fetchUserStats();
      fetchCancelledSubscriptions();
      fetchCancellationReasons();
    }
  }, [adminToken, step]);

  // Interceptor dla błędów autoryzacji
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 && adminToken) {
          // Token wygasł lub jest nieprawidłowy
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [adminToken]);

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    
    try {
      await axios.put(`${API}/plans/${editingPlan.id}`, editingPlan, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setEditingPlan(null);
      fetchPlans();
      fetchChanges();
      setModalTitle('Sukces');
      setModalMessage('Plan zaktualizowany! Zmiany będą widoczne dla użytkowników.');
      setModalOpen(true);
    } catch (err: any) {
      setModalTitle('Błąd');
      setModalMessage(err.response?.data?.error || 'Błąd aktualizacji planu');
      setModalOpen(true);
    }
  };

  const initializePlans = async () => {
    try {
      await axios.post(`${API}/initialize-plans`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchPlans();
      fetchChanges();
      setModalTitle('Sukces');
      setModalMessage('Plany zostały zainicjalizowane!');
      setModalOpen(true);
    } catch (err: any) {
      setModalTitle('Błąd');
      setModalMessage(err.response?.data?.error || 'Błąd inicjalizacji planów');
      setModalOpen(true);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten plan? Ta operacja jest nieodwracalna.')) {
      return;
    }

    try {
      await axios.delete(`${API}/plans/${planId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchPlans();
      fetchChanges();
      setModalTitle('Sukces');
      setModalMessage('Plan został usunięty!');
      setModalOpen(true);
    } catch (err: any) {
      setModalTitle('Błąd');
      setModalMessage(err.response?.data?.error || 'Błąd usuwania planu');
      setModalOpen(true);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      await axios.patch(`${API}/plans/${plan.id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchPlans();
      fetchChanges();
      setModalTitle('Sukces');
      setModalMessage(`Plan ${plan.isActive ? 'dezaktywowany' : 'aktywowany'}!`);
      setModalOpen(true);
    } catch (err: any) {
      setModalTitle('Błąd');
      setModalMessage(err.response?.data?.error || 'Błąd zmiany statusu planu');
      setModalOpen(true);
    }
  };

  const handleFindUser = async () => {
    if (!userEmail.trim()) return;

    try {
      setUserSubLoading(true);
      setUserSubError('');
      const res = await axios.get(`${API}/user/${encodeURIComponent(userEmail)}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setFoundUser(res.data.user);
      setEditUserPlan(res.data.user.subscription?.plan?.id || null);
      setEditTrialEnd(res.data.user.subscription?.trialEndDate ? 
        new Date(res.data.user.subscription.trialEndDate).toISOString().split('T')[0] : null);
      setEditEndDate(res.data.user.subscription?.endDate ? 
        new Date(res.data.user.subscription.endDate).toISOString().split('T')[0] : null);
    } catch (err: any) {
      setUserSubError(err.response?.data?.error || 'Użytkownik nie został znaleziony');
      setFoundUser(null);
    } finally {
      setUserSubLoading(false);
    }
  };

  const handleUpdateUserSub = async () => {
    if (!foundUser) return;

    try {
      setUserSubLoading(true);
      await axios.put(`${API}/user/${foundUser.id}/subscription`, {
        planId: editUserPlan,
        trialEndDate: editTrialEnd,
        endDate: editEndDate
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setModalTitle('Sukces');
      setModalMessage('Subskrypcja użytkownika zaktualizowana!');
      setModalOpen(true);
      handleFindUser(); // Odśwież dane użytkownika
    } catch (err: any) {
      setModalTitle('Błąd');
      setModalMessage(err.response?.data?.error || 'Błąd aktualizacji subskrypcji');
      setModalOpen(true);
    } finally {
      setUserSubLoading(false);
    }
  };

  const selectUser = async (user: User) => {
    setUserEmail(user.email);
    setShowSearchResults(false);
    setSearchQuery('');
    setSearchResults([]);
    await handleFindUser();
  };

  const handleLogout = () => {
    setAdminToken(null);
    setStep('login');
    setEmail('');
    setPassword('');
    setError('');
  };

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { key: 'messages', label: 'Wiadomości', icon: ChatBubbleLeftRightIcon },
    { key: 'users', label: 'Użytkownicy', icon: UsersIcon },
    { key: 'stats', label: 'Statystyki', icon: ChartBarIcon },
    { key: 'companies', label: 'Firmy', icon: BuildingOffice2Icon },
    { key: 'settings', label: 'Ustawienia', icon: Cog6ToothIcon },
    { key: 'plans', label: 'Plany', icon: CreditCardIcon },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard onNavigate={(section) => setActiveSection(section as AdminSection)} />;
      case 'messages':
        return <AdminMessages onBack={() => setActiveSection('dashboard')} />;
      case 'users':
        return <AdminUsers onBack={() => setActiveSection('dashboard')} />;
      case 'stats':
        return <AdminStats onBack={() => setActiveSection('dashboard')} />;
      case 'companies':
        return <AdminCompanies onBack={() => setActiveSection('dashboard')} />;
      case 'settings':
        return <AdminSettings onBack={() => setActiveSection('dashboard')} />;
      case 'plans':
        return <PlansSection 
          plans={plans}
          changes={changes}
          editingPlan={editingPlan}
          setEditingPlan={setEditingPlan}
          onEditPlan={handleEditPlan}
          onSavePlan={handleSavePlan}
          onDeletePlan={handleDeletePlan}
          onToggleActive={handleToggleActive}
          onInitializePlans={initializePlans}
        />;
      default:
        return <AdminDashboard onNavigate={(section) => setActiveSection(section as AdminSection)} />;
    }
  };

  // Login form
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Panel Administratora</h1>
            <p className="text-gray-600 mt-2">Zaloguj się, aby uzyskać dostęp</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasło</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main admin panel
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        ${sidebarCollapsed ? 'w-16' : 'w-64'} 
        bg-white shadow-lg transition-all duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg">
                <span className="text-white font-bold text-lg">🔐</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">BuildBoss</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key as AdminSection)}
                  className={`
                    w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg 
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`
                    ${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}
                    ${isActive ? 'text-blue-600' : 'text-gray-400'}
                  `} />
                  {!sidebarCollapsed && item.label}
                </button>
              );
            })}
          </div>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            {!sidebarCollapsed && 'Wyloguj się'}
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderSection()}
        </div>
      </main>
      
      {/* Admin Modal */}
      <AdminModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

// Wrapper component with AdminProvider
const AdminSecretPlansPage: React.FC = () => {
  return (
    <AdminProvider>
      <AdminSecretPlansPageContent />
    </AdminProvider>
  );
};

// Section components
const DashboardSection: React.FC<{ userStats: UserStats | null }> = ({ userStats }) => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UsersIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Użytkownicy</p>
            <p className="text-2xl font-bold text-gray-900">{userStats?.totalUsers || 0}</p>
          </div>
        </div>
      </div>
      {/* Add more dashboard cards */}
    </div>
  </div>
);

const MessagesSection: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <AdminMessages onBack={onBack} />
);

const UsersSection: React.FC<any> = (props) => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Użytkownicy</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Zarządzanie użytkownikami (w budowie)</p>
    </div>
  </div>
);

const StatsSection: React.FC<{ userStats: UserStats | null }> = ({ userStats }) => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Statystyki</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Statystyki systemu (w budowie)</p>
    </div>
  </div>
);

const CompaniesSection: React.FC = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Firmy</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Zarządzanie firmami (w budowie)</p>
    </div>
  </div>
);

const SettingsSection: React.FC = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900 mb-8">Ustawienia</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600">Ustawienia panelu admina (w budowie)</p>
    </div>
  </div>
);

const PlansSection: React.FC<{
  plans: Plan[];
  changes: any[];
  editingPlan: Plan | null;
  setEditingPlan: (plan: Plan | null) => void;
  onEditPlan: (plan: Plan) => void;
  onSavePlan: () => void;
  onDeletePlan: (planId: string) => void;
  onToggleActive: (plan: Plan) => void;
  onInitializePlans: () => void;
}> = ({
  plans,
  changes,
  editingPlan,
  setEditingPlan,
  onEditPlan,
  onSavePlan,
  onDeletePlan,
  onToggleActive,
  onInitializePlans
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'changes' | 'users'>('plans');
  const [showInitializeModal, setShowInitializeModal] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return `${(price / 100).toFixed(2)} ${currency}`;
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? '∞' : limit.toString();
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return '🆓';
      case 'basic': return '📦';
      case 'pro': return '🚀';
      case 'enterprise': return '🏢';
      default: return '📋';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Planami</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowInitializeModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            🔧 Inicjalizuj Plany
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Plany ({plans.length})
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'changes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Historia Zmian ({changes.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {plans.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">Brak planów w systemie</p>
              <button
                onClick={onInitializePlans}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                🔧 Zainicjalizuj Plany
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-lg border-2 ${
                    plan.isActive ? 'border-green-200' : 'border-red-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{getPlanIcon(plan.name)}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{plan.displayName}</h3>
                          <p className="text-sm text-gray-600">{plan.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(plan.price, plan.currency)}
                        </div>
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          plan.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.isActive ? 'Aktywny' : 'Nieaktywny'}
                        </div>
                      </div>
                    </div>

                    {editingPlan?.id === plan.id ? (
                      // Formularz edycji
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa wyświetlana</label>
                          <input
                            type="text"
                            value={editingPlan.displayName}
                            onChange={(e) => setEditingPlan({ ...editingPlan, displayName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                          <textarea
                            value={editingPlan.description}
                            onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cena (grosze)</label>
                            <input
                              type="number"
                              value={editingPlan.price}
                              onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Waluta</label>
                            <select
                              value={editingPlan.currency}
                              onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="PLN">PLN</option>
                              <option value="EUR">EUR</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Limity</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Maks. firmy (-1 = ∞)</label>
                              <input
                                type="number"
                                value={editingPlan.maxCompanies}
                                onChange={(e) => setEditingPlan({ ...editingPlan, maxCompanies: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Maks. projekty (-1 = ∞)</label>
                              <input
                                type="number"
                                value={editingPlan.maxProjects}
                                onChange={(e) => setEditingPlan({ ...editingPlan, maxProjects: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Maks. pracownicy (-1 = ∞)</label>
                              <input
                                type="number"
                                value={editingPlan.maxWorkers}
                                onChange={(e) => setEditingPlan({ ...editingPlan, maxWorkers: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Maks. oferty pracy (-1 = ∞)</label>
                              <input
                                type="number"
                                value={editingPlan.maxJobOffers}
                                onChange={(e) => setEditingPlan({ ...editingPlan, maxJobOffers: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Maks. zlecenia (-1 = ∞)</label>
                              <input
                                type="number"
                                value={editingPlan.maxWorkRequests}
                                onChange={(e) => setEditingPlan({ ...editingPlan, maxWorkRequests: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Maks. przestrzeń (GB)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editingPlan.maxStorageGB}
                                onChange={(e) => setEditingPlan({ ...editingPlan, maxStorageGB: parseFloat(e.target.value) || 0 })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Funkcje</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingPlan.hasAdvancedReports}
                                onChange={(e) => setEditingPlan({ ...editingPlan, hasAdvancedReports: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm">Zaawansowane raporty</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingPlan.hasApiAccess}
                                onChange={(e) => setEditingPlan({ ...editingPlan, hasApiAccess: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm">API</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingPlan.hasPrioritySupport}
                                onChange={(e) => setEditingPlan({ ...editingPlan, hasPrioritySupport: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm">Priorytetowe wsparcie</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingPlan.hasCustomBranding}
                                onChange={(e) => setEditingPlan({ ...editingPlan, hasCustomBranding: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm">Własny branding</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editingPlan.hasTeamManagement}
                                onChange={(e) => setEditingPlan({ ...editingPlan, hasTeamManagement: e.target.checked })}
                                className="mr-2"
                              />
                              <span className="text-sm">Zarządzanie zespołem</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Widok tylko do odczytu
                      <>
                        <p className="text-gray-600 mb-4">{plan.description}</p>

                        {/* Limits */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Firmy:</span> {formatLimit(plan.maxCompanies)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Projekty:</span> {formatLimit(plan.maxProjects)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Pracownicy:</span> {formatLimit(plan.maxWorkers)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Oferty pracy:</span> {formatLimit(plan.maxJobOffers)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Zlecenia:</span> {formatLimit(plan.maxWorkRequests)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Przestrzeń:</span> {plan.maxStorageGB} GB
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Funkcje:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className={`flex items-center ${plan.hasAdvancedReports ? 'text-green-600' : 'text-gray-400'}`}>
                              <span className="mr-2">{plan.hasAdvancedReports ? '✅' : '❌'}</span>
                              Zaawansowane raporty
                            </div>
                            <div className={`flex items-center ${plan.hasApiAccess ? 'text-green-600' : 'text-gray-400'}`}>
                              <span className="mr-2">{plan.hasApiAccess ? '✅' : '❌'}</span>
                              API
                            </div>
                            <div className={`flex items-center ${plan.hasPrioritySupport ? 'text-green-600' : 'text-gray-400'}`}>
                              <span className="mr-2">{plan.hasPrioritySupport ? '✅' : '❌'}</span>
                              Priorytetowe wsparcie
                            </div>
                            <div className={`flex items-center ${plan.hasCustomBranding ? 'text-green-600' : 'text-gray-400'}`}>
                              <span className="mr-2">{plan.hasCustomBranding ? '✅' : '❌'}</span>
                              Własny branding
                            </div>
                            <div className={`flex items-center ${plan.hasTeamManagement ? 'text-green-600' : 'text-gray-400'}`}>
                              <span className="mr-2">{plan.hasTeamManagement ? '✅' : '❌'}</span>
                              Zarządzanie zespołem
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {editingPlan?.id === plan.id ? (
                        <>
                          <button
                            onClick={onSavePlan}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            💾 Zapisz
                          </button>
                          <button
                            onClick={() => setEditingPlan(null)}
                            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            ❌ Anuluj
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onEditPlan(plan)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            ✏️ Edytuj
                          </button>
                          <button
                            onClick={() => onToggleActive(plan)}
                            className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                              plan.isActive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {plan.isActive ? '🚫 Dezaktywuj' : '✅ Aktywuj'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Changes Tab */}
      {activeTab === 'changes' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historia Zmian Planów</h3>
            {changes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Brak zmian do wyświetlenia</p>
            ) : (
              <div className="space-y-4">
                {changes.slice(0, 20).map((change) => (
                  <div key={change.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{change.planName}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          change.changeType === 'created' || change.changeType === 'activated' || change.changeType === 'initialized'
                            ? 'bg-green-100 text-green-800'
                            : change.changeType === 'deleted' || change.changeType === 'deactivated'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {change.changeType}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(change.createdAt).toLocaleString('pl-PL')}
                      </span>
                    </div>
                    {change.description && (
                      <p className="text-sm text-gray-600">{change.description}</p>
                    )}
                    {change.admin && (
                      <p className="text-xs text-gray-500 mt-1">
                        Admin: {change.admin.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initialize Modal */}
      {showInitializeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inicjalizacja Planów</h3>
            <p className="text-gray-600 mb-6">
              Ta operacja utworzy 4 standardowe plany subskrypcji: Free, Basic, Pro i Enterprise.
              Czy chcesz kontynuować?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onInitializePlans();
                  setShowInitializeModal(false);
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Tak, inicjalizuj
              </button>
              <button
                onClick={() => setShowInitializeModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ❌ Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecretPlansPage; 
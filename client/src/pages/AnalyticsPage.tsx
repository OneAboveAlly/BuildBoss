import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { useAuth } from '../contexts/AuthContext';
import { companyService } from '../services/companyService';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await companyService.getCompanies();
      setCompanies(companiesData);
      
      // Wybierz pierwszą firmę jako domyślną
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Błąd podczas ładowania firm');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      name: 'Dashboard',
      icon: ChartBarIcon,
      component: AnalyticsDashboard,
      description: 'Przegląd kluczowych metryk i trendów'
    },
    {
      name: 'Zespół',
      icon: UserGroupIcon,
      component: () => <div className="p-8 text-center text-gray-500">Analiza zespołu - wkrótce</div>,
      description: 'Wydajność i produktywność zespołu'
    },
    {
      name: 'Koszty',
      icon: CurrencyDollarIcon,
      component: () => <div className="p-8 text-center text-gray-500">Analiza kosztów - wkrótce</div>,
      description: 'Analiza budżetów i kosztów projektów'
    },
    {
      name: 'Czas',
      icon: ClockIcon,
      component: () => <div className="p-8 text-center text-gray-500">Śledzenie czasu - wkrótce</div>,
      description: 'Śledzenie czasu pracy i efektywności'
    }
  ];

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Brak dostępu do firm</h3>
        <p className="mt-1 text-sm text-gray-500">
          Aby korzystać z analityk, musisz być członkiem przynajmniej jednej firmy.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analityki</h1>
              <p className="mt-2 text-sm text-gray-600">
                Analizuj wydajność, koszty i trendy swoich projektów
              </p>
            </div>
            
            {/* Selektor firmy */}
            <div className="flex items-center space-x-4">
              <label htmlFor="company-select" className="text-sm font-medium text-gray-700">
                Firma:
              </label>
              <select
                id="company-select"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-8">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                <div className="flex items-center justify-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  'rounded-xl bg-white p-3',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                {/* Opis taba */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <tab.icon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">{tab.name}</h3>
                      <p className="text-sm text-blue-700">{tab.description}</p>
                    </div>
                  </div>
                </div>

                {/* Zawartość taba */}
                {selectedCompany && (
                  <tab.component companyId={selectedCompany} />
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>

        {/* Informacje o funkcjach premium */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Cog6ToothIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-purple-900">
                🚀 Funkcje Premium
              </h3>
              <div className="mt-2 text-sm text-purple-700">
                <p className="mb-2">
                  Odblokuj zaawansowane analityki z planem Pro lub Enterprise:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Szczegółowa analiza wydajności zespołu</li>
                  <li>Zaawansowane raporty finansowe</li>
                  <li>Śledzenie czasu pracy w czasie rzeczywistym</li>
                  <li>Prognozy i trendy AI</li>
                  <li>Eksport danych do Excel i PDF</li>
                  <li>Automatyczne raporty okresowe</li>
                </ul>
              </div>
              <div className="mt-4">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sprawdź plany premium
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Szybkie akcje */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <DocumentChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Generuj Raport</h3>
                <p className="text-sm text-gray-500">Stwórz szczegółowy raport projektu</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Nowy raport
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Eksportuj Dane</h3>
                <p className="text-sm text-gray-500">Pobierz dane do analizy zewnętrznej</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Eksportuj CSV
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Ustawienia</h3>
                <p className="text-sm text-gray-500">Konfiguruj preferencje analityk</p>
              </div>
            </div>
            <div className="mt-4">
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Ustawienia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookmarkIcon,
  ClockIcon,
  TagIcon,
  SparklesIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { searchService, type SearchResult, type SearchHistoryItem, type SavedSearch, type SearchFilters } from '../services/searchService';
import { companyService } from '../services/companyService';
import { useAuth } from '../contexts/AuthContext';
import GlobalSearch from '../components/search/GlobalSearch';
import TagManager from '../components/search/TagManager';

interface Company {
  id: string;
  name: string;
}

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  
  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    category: (searchParams.get('category') as any) || 'all',
    companyId: searchParams.get('company') || undefined,
    limit: 50
  });

  // Load data on mount
  useEffect(() => {
    loadCompanies();
    loadSearchHistory();
    loadSavedSearches();
    
    // Perform search if query exists
    if (query.trim()) {
      performSearch();
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.companyId) params.set('company', filters.companyId);
    
    setSearchParams(params);
  }, [query, filters, setSearchParams]);

  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getUserCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await searchService.getSearchHistory(10);
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const saved = await searchService.getSavedSearches();
      setSavedSearches(saved);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const performSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await searchService.globalSearch(searchQuery, filters);
      
      // Flatten results for display
      const allResults = [
        ...response.results.projects,
        ...response.results.tasks,
        ...response.results.materials,
        ...response.results.users,
        ...response.results.companies
      ];
      
      setResults(allResults);
      loadSearchHistory(); // Refresh history
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  const handleHistoryClick = (historyItem: SearchHistoryItem) => {
    setQuery(historyItem.query);
    if (historyItem.category) {
      setFilters(prev => ({ ...prev, category: historyItem.category as any }));
    }
    performSearch(historyItem.query);
  };

  const handleSavedSearchClick = async (savedSearch: SavedSearch) => {
    try {
      setQuery(savedSearch.query);
      setFilters(prev => ({
        ...prev,
        category: savedSearch.category as any || 'all',
        ...savedSearch.filters
      }));
      
      const response = await searchService.executeSavedSearch(savedSearch);
      const allResults = [
        ...response.results.projects,
        ...response.results.tasks,
        ...response.results.materials,
        ...response.results.users,
        ...response.results.companies
      ];
      setResults(allResults);
    } catch (error) {
      console.error('Error executing saved search:', error);
    }
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim() || !query.trim()) return;

    try {
      await searchService.saveSearch({
        name: saveSearchName.trim(),
        query,
        filters,
        category: filters.category
      });
      
      setShowSaveModal(false);
      setSaveSearchName('');
      loadSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      await searchService.deleteSavedSearch(id);
      loadSavedSearches();
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await searchService.deleteHistoryItem(id);
      loadSearchHistory();
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return '📁';
      case 'task':
        return '✅';
      case 'material':
        return '📦';
      case 'user':
        return '👤';
      case 'company':
        return '🏢';
      default:
        return '🔍';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'project':
        return 'Projekt';
      case 'task':
        return 'Zadanie';
      case 'material':
        return 'Materiał';
      case 'user':
        return 'Użytkownik';
      case 'company':
        return 'Firma';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zaawansowane wyszukiwanie
          </h1>
          <p className="text-gray-600">
            Przeszukuj projekty, zadania, materiały i więcej w jednym miejscu
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Szybkie akcje
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowGlobalSearch(true)}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                    Globalne wyszukiwanie
                  </button>
                  <button
                    onClick={() => setShowTagManager(true)}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <TagIcon className="w-4 h-4 mr-2" />
                    Zarządzaj tagami
                  </button>
                </div>
              </div>

              {/* Saved Searches */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Zapisane wyszukiwania
                  </h3>
                  <BookmarkIcon className="w-4 h-4 text-gray-400" />
                </div>
                
                {savedSearches.length > 0 ? (
                  <div className="space-y-2">
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                      >
                        <button
                          onClick={() => handleSavedSearchClick(saved)}
                          className="flex-1 text-left text-sm text-gray-700 hover:text-blue-600"
                        >
                          {saved.name}
                        </button>
                        <button
                          onClick={() => handleDeleteSavedSearch(saved.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Brak zapisanych wyszukiwań
                  </p>
                )}
              </div>

              {/* Search History */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Historia wyszukiwań
                  </h3>
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                </div>
                
                {searchHistory.length > 0 ? (
                  <div className="space-y-2">
                    {searchHistory.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                      >
                        <button
                          onClick={() => handleHistoryClick(item)}
                          className="flex-1 text-left"
                        >
                          <div className="text-sm text-gray-700">
                            {item.query}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.results} wyników • {formatDate(item.createdAt)}
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Brak historii wyszukiwań
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Wpisz zapytanie wyszukiwania..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategoria
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Wszystkie</option>
                      <option value="projects">Projekty</option>
                      <option value="tasks">Zadania</option>
                      <option value="materials">Materiały</option>
                      <option value="users">Użytkownicy</option>
                      <option value="companies">Firmy</option>
                    </select>
                  </div>

                  {/* Company Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firma
                    </label>
                    <select
                      value={filters.companyId || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, companyId: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Wszystkie firmy</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limit wyników
                    </label>
                    <select
                      value={filters.limit}
                      onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wyszukiwanie...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                        Szukaj
                      </>
                    )}
                  </button>

                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(true)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <BookmarkIcon className="w-4 h-4 mr-2" />
                      Zapisz wyszukiwanie
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Results */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Wyszukiwanie...</span>
                </div>
              ) : results.length > 0 ? (
                <div>
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Wyniki wyszukiwania ({results.length})
                    </h3>
                    {query && (
                      <p className="text-sm text-gray-600">
                        dla zapytania: "{query}"
                      </p>
                    )}
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-start space-x-4"
                      >
                        <div className="text-2xl flex-shrink-0">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {result.title}
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {getTypeName(result.type)}
                            </span>
                          </div>
                          
                          {result.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {result.company && (
                              <span>{result.company}</span>
                            )}
                            {result.project && (
                              <span>• {result.project}</span>
                            )}
                            {result.status && (
                              <span>• {result.status}</span>
                            )}
                            <span>• {formatDate(result.updatedAt)}</span>
                          </div>
                          
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex items-center space-x-1 mt-2">
                              {result.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {result.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{result.tags.length - 3} więcej
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : query.trim() && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MagnifyingGlassIcon className="w-12 h-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Brak wyników</h3>
                  <p className="text-sm">
                    Nie znaleziono wyników dla zapytania "{query}"
                  </p>
                  <p className="text-sm">
                    Spróbuj użyć innych słów kluczowych lub zmień filtry
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <SparklesIcon className="w-12 h-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Zacznij wyszukiwanie</h3>
                  <p className="text-sm">
                    Wpisz zapytanie, aby przeszukać wszystkie dane
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        initialQuery={query}
      />

      {/* Tag Manager Modal */}
      <TagManager
        isOpen={showTagManager}
        onClose={() => setShowTagManager(false)}
      />

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowSaveModal(false)} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Zapisz wyszukiwanie
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa wyszukiwania
                  </label>
                  <input
                    type="text"
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    placeholder="np. Pilne zadania"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                    <div><strong>Zapytanie:</strong> {query}</div>
                    <div><strong>Kategoria:</strong> {filters.category === 'all' ? 'Wszystkie' : filters.category}</div>
                    {filters.companyId && (
                      <div><strong>Firma:</strong> {companies.find(c => c.id === filters.companyId)?.name}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSaveSearch}
                    disabled={!saveSearchName.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
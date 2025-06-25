import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  SparklesIcon,
  DocumentTextIcon,
  CheckIcon,
  CubeIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { searchService, type SearchResult, type SearchSuggestion, type SearchFilters } from '../../services/searchService';
import { companyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';

interface Company {
  id: string;
  name: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    limit: 50
  });

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load suggestions when query changes
  useEffect(() => {
    if (query.trim().length > 0) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getUserCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const suggestionsData = await searchService.getSuggestions(query, 8);
      setSuggestions(suggestionsData);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const performSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setShowSuggestions(false);
      
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

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    performSearch(suggestion.text);
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'task':
        return <CheckIcon className="w-4 h-4" />;
      case 'material':
        return <CubeIcon className="w-4 h-4" />;
      case 'user':
        return <UserIcon className="w-4 h-4" />;
      case 'company':
        return <BuildingOfficeIcon className="w-4 h-4" />;
      default:
        return <MagnifyingGlassIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'text-blue-600 bg-blue-50';
      case 'task':
        return 'text-green-600 bg-green-50';
      case 'material':
        return 'text-orange-600 bg-orange-50';
      case 'user':
        return 'text-purple-600 bg-purple-50';
      case 'company':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
      year: 'numeric'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-16">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Globalne wyszukiwanie
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search Form */}
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Szukaj projektów, zadań, materiałów..."
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                      setSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.id}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                        index === selectedSuggestionIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className={`p-1 rounded ${getTypeColor(suggestion.type)}`}>
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{suggestion.text}</div>
                        <div className="text-sm text-gray-500">{suggestion.category}</div>
                      </div>
                      {suggestion.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: suggestion.color }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Filters */}
            <div className="mt-4 flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <FunnelIcon className="w-4 h-4 mr-1" />
                Filtry
              </button>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="all">Wszystkie</option>
                <option value="projects">Projekty</option>
                <option value="tasks">Zadania</option>
                <option value="materials">Materiały</option>
                <option value="users">Użytkownicy</option>
                <option value="companies">Firmy</option>
              </select>

              {/* Company Filter */}
              {companies.length > 1 && (
                <select
                  value={filters.companyId || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, companyId: e.target.value || undefined }))}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="">Wszystkie firmy</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Wyszukiwanie...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3"
                  >
                    <div className={`p-2 rounded ${getTypeColor(result.type)} flex-shrink-0`}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getTypeName(result.type)}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
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
            ) : query.trim() && !loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <MagnifyingGlassIcon className="w-12 h-12 mb-2" />
                <p>Brak wyników dla "{query}"</p>
                <p className="text-sm">Spróbuj użyć innych słów kluczowych</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <SparklesIcon className="w-12 h-12 mb-2" />
                <p>Zacznij wpisywać, aby wyszukać</p>
                <p className="text-sm">Przeszukaj projekty, zadania, materiały i więcej</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Użyj ↑↓ do nawigacji</span>
                <span>Enter aby wybrać</span>
                <span>Esc aby zamknąć</span>
              </div>
              {results.length > 0 && (
                <span>{results.length} wyników</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch; 
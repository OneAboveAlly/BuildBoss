import React, { useState, useRef, useEffect } from 'react';
import { MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface AddressData {
  address: string;
  city: string;
  voivodeship: string;
  country: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    'ISO3166-2-lvl4'?: string;
    postcode?: string;
  };
}

interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
  showFullAddress?: boolean; // czy pokazywać pełny adres czy tylko miasto
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Wpisz adres lub miasto...",
  required = false,
  error,
  label = "Lokalizacja",
  showFullAddress = true
}) => {
  const [query, setQuery] = useState(showFullAddress ? value.address : value.city);
  const [suggestions, setSuggestions] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Mapa województw dla walidacji
  const VOIVODESHIPS = [
    'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
    'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
    'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
    'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
  ];

  // Aktualizuj query gdy value się zmieni z zewnątrz
  useEffect(() => {
    setQuery(showFullAddress ? value.address : value.city);
  }, [value.address, value.city, showFullAddress]);

  // Funkcja do wyszukiwania adresów za pomocą Nominatim (OpenStreetMap)
  const searchAddresses = async (searchQuery: string): Promise<AddressData[]> => {
    if (searchQuery.length < 3) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: `${searchQuery}, Polska`,
          format: 'json',
          limit: '5',
          countrycodes: 'pl',
          addressdetails: '1',
          'accept-language': 'pl'
        }),
        {
          headers: {
            'User-Agent': 'BuildBoss Construction App'
          }
        }
      );

      if (!response.ok) throw new Error('Błąd wyszukiwania');

      const data: NominatimResult[] = await response.json();
      
      return data.map((item) => {
        const address = item.address || {};
        
        // Próbuj znaleźć województwo w różnych polach
        let voivodeship = '';
        const stateField = address.state || address['ISO3166-2-lvl4'] || '';
        
        // Sprawdź czy mamy dokładne dopasowanie województwa
        const foundVoivodeship = VOIVODESHIPS.find(v => 
          stateField.toLowerCase().includes(v.toLowerCase()) ||
          v.toLowerCase().includes(stateField.toLowerCase())
        );
        
        if (foundVoivodeship) {
          voivodeship = foundVoivodeship;
        } else {
          // Fallback - spróbuj wyciągnąć z nazwy
          voivodeship = stateField || 'mazowieckie'; // domyślne
        }

        const city = address.city || address.town || address.village || address.municipality || '';
        const street = address.road || '';
        const houseNumber = address.house_number || '';
        
        let fullAddress = '';
        if (street && houseNumber) {
          fullAddress = `${street} ${houseNumber}, ${city}`;
        } else if (street) {
          fullAddress = `${street}, ${city}`;
        } else {
          fullAddress = city;
        }

        return {
          address: fullAddress,
          city,
          voivodeship,
          country: 'Polska',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          postalCode: address.postcode || undefined
        };
      }).filter(item => item.city); // Filtruj tylko te z miastem
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Anuluj poprzedni timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Ustaw nowy timeout dla wyszukiwania
    timeoutRef.current = setTimeout(async () => {
      if (newQuery.length >= 3) {
        setIsLoading(true);
        const results = await searchAddresses(newQuery);
        setSuggestions(results);
        setShowSuggestions(true);
        setIsLoading(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const handleSuggestionClick = (suggestion: AddressData) => {
    setQuery(showFullAddress ? suggestion.address : suggestion.city);
    setShowSuggestions(false);
    onChange(suggestion);
  };

  const handleInputBlur = () => {
    // Opóźnij ukrycie sugestii, żeby kliknięcie zadziałało
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Manualne wprowadzenie (gdy nie wybrano z sugestii)
  const handleManualInput = () => {
    if (!showSuggestions && query) {
      // Spróbuj wyciągnąć miasto z query
      const cityMatch = query.split(',').pop()?.trim() || query;
      onChange({
        address: showFullAddress ? query : '',
        city: cityMatch,
        voivodeship: value.voivodeship || 'mazowieckie',
        country: 'Polska'
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          ) : (
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleManualInput();
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        
        {value.latitude && value.longitude && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <MapPinIcon className="h-4 w-4 text-green-500" title="Lokalizacja została znaleziona" />
          </div>
        )}
      </div>

      {/* Sugestie */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {suggestion.address}
                  </div>
                  <div className="text-xs text-gray-500">
                    {suggestion.city}, {suggestion.voivodeship}
                    {suggestion.postalCode && `, ${suggestion.postalCode}`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Błąd */}
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}

      {/* Dodatkowe informacje */}
      {query && !isLoading && suggestions.length === 0 && showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500">
            Brak wyników. Możesz wprowadzić adres ręcznie.
          </div>
        </div>
      )}
    </div>
  );
}; 
import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, parse } from 'date-fns';
import { pl, de, enUS, uk } from 'date-fns/locale';

interface LocalizedDatePickerProps {
  value?: Date | string;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
}

const LocalizedDatePicker: React.FC<LocalizedDatePickerProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  label,
  error
}) => {
  const { i18n } = useTranslation();

  // Mapowanie języków na locale date-fns
  const localeMap = {
    pl: pl,
    de: de,
    en: enUS,
    ua: uk
  };

  // Mapowanie języków na formaty dat
  const formatMap = {
    pl: 'dd.MM.yyyy',
    de: 'dd.MM.yyyy',
    en: 'MM/dd/yyyy',
    ua: 'dd.MM.yyyy'
  };

  const currentLocale = localeMap[i18n.language as keyof typeof localeMap] || pl;
  const currentFormat = formatMap[i18n.language as keyof typeof formatMap] || 'dd.MM.yyyy';

  // Konwersja wartości na string dla input
  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return format(dateObj, currentFormat, { locale: currentLocale });
  };

  // Parsowanie string na Date
  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString.trim()) return null;
    
    try {
      const parsedDate = parse(dateString, currentFormat, new Date(), { locale: currentLocale });
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    } catch {
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const parsedDate = parseDateFromInput(inputValue);
    onChange(parsedDate);
  };

  const inputValue = formatDateForInput(value);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder || currentFormat.toLowerCase()}
          disabled={disabled}
          required={required}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
            dark:focus:ring-blue-500 dark:focus:border-blue-500
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />
        
        {/* Ikona kalendarza */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {/* Podpowiedź formatu */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Format: {currentFormat}
      </p>
    </div>
  );
};

export default LocalizedDatePicker; 
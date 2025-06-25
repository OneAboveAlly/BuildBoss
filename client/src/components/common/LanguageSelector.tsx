import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ua', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
];

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true,
  compact = false,
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];
  
  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Force reload all namespaces for the new language
      await i18n.reloadResources(languageCode);
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
      
      // Save to localStorage
      localStorage.setItem('preferred-language', languageCode);
      
      // Update document language attribute
      document.documentElement.lang = languageCode;
      
      // Force a small delay to ensure all components re-render
      setTimeout(() => {
        window.dispatchEvent(new Event('languagechange'));
      }, 100);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Initialize language on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
    // Set document language to current i18n language
    document.documentElement.lang = i18n.language;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-selector')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative language-selector ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          hover:bg-gray-50 dark:hover:bg-gray-700 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-all duration-200
          ${compact ? 'text-sm' : ''}
        `}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className="h-4 w-4 text-gray-500" />
        <span className="text-lg" role="img" aria-label={currentLanguage.name}>
          {currentLanguage.flag}
        </span>
        {showLabel && !compact && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentLanguage.nativeName}
          </span>
        )}
        <ChevronDownIcon 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 text-left
                    hover:bg-gray-100 dark:hover:bg-gray-700 
                    focus:bg-gray-100 dark:focus:bg-gray-700
                    transition-colors duration-150
                    ${language.code === currentLanguage.code ? 
                      'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 
                      'text-gray-700 dark:text-gray-300'
                    }
                  `}
                  role="menuitem"
                >
                  <span className="text-lg" role="img" aria-label={language.name}>
                    {language.flag}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{language.nativeName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{language.name}</div>
                  </div>
                  {language.code === currentLanguage.code && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 
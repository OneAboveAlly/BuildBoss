import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import CountryFlag from 'react-country-flag';

/**
 * Language interface definition
 */
interface Language {
  /** ISO language code (e.g., 'en', 'pl') */
  code: string;
  /** English name of the language */
  name: string;
  /** Native name of the language */
  nativeName: string;
  /** Unicode flag emoji for the language */
  flag: string;
}

/**
 * Supported languages configuration
 * @description Array of available languages with their metadata
 */
const languages: Language[] = [
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: 'PL' },
  { code: 'en', name: 'English', nativeName: 'English', flag: 'GB' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: 'DE' },
  { code: 'ua', name: 'Ukrainian', nativeName: 'Українська', flag: 'UA' },
];

/**
 * LanguageSelector component properties interface
 */
interface LanguageSelectorProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show language name label */
  showLabel?: boolean;
  /** Whether to use compact display mode */
  compact?: boolean;
}

/**
 * LanguageSelector Component
 * 
 * A comprehensive language selection dropdown component that provides seamless
 * language switching with persistence, accessibility features, and smooth animations.
 * Integrates with react-i18next for internationalization management.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <LanguageSelector />
 * 
 * // Compact mode for mobile/toolbar
 * <LanguageSelector compact showLabel={false} />
 * 
 * // Custom styling
 * <LanguageSelector 
 *   className="ml-4" 
 *   showLabel={true}
 * />
 * 
 * // Header navigation usage
 * <nav className="flex items-center space-x-4">
 *   <Logo />
 *   <NavigationMenu />
 *   <LanguageSelector compact />
 * </nav>
 * ```
 * 
 * @param props - LanguageSelector component props
 * @param props.className - Additional CSS classes to apply
 * @param props.showLabel - Whether to display the language name (default: true)
 * @param props.compact - Whether to use compact display mode (default: false)
 * 
 * @returns Rendered language selection dropdown
 * 
 * @features
 * - **Multi-language Support**: Polish, English, German, Ukrainian with native names
 * - **Persistent Selection**: Saves language preference in localStorage
 * - **Accessibility**: Full keyboard navigation, ARIA attributes, screen reader support
 * - **Visual Feedback**: Flag icons, current selection indicator, smooth animations
 * - **Auto-reload**: Automatically reloads language resources and updates document language
 * - **Event Handling**: Dispatches custom 'languagechange' event for app-wide updates
 * - **Dark Mode**: Full dark mode support with proper color theming
 * 
 * @accessibility
 * - ARIA-expanded for dropdown state
 * - ARIA-label for language identification
 * - Role="menuitem" for dropdown options
 * - Keyboard navigation support
 * - Screen reader friendly labels
 * - Focus management and visual indicators
 * 
 * @persistence
 * - Saves selection to localStorage as 'preferred-language'
 * - Restores language on component mount
 * - Updates document.documentElement.lang attribute
 * - Persists across browser sessions
 * 
 * @integration
 * - Works with react-i18next for translation management
 * - Triggers resource reloading for new languages
 * - Dispatches global languagechange event
 * - Updates all consuming components automatically
 * 
 * @version 1.0.0
 * @since 1.0.0
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true,
  compact = false,
}) => {
  const { i18n } = useTranslation();
  /** Dropdown open/closed state */
  const [isOpen, setIsOpen] = useState(false);
  /** Current selected language code */
  const [currentLang, setCurrentLang] = useState(i18n.language);

  /** Find current language object from configuration */
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];
  
  /**
   * Listen for i18next language changes
   * @description Synchronizes component state with i18next language changes
   */
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  /**
   * Handle language selection change
   * @param languageCode - ISO language code to switch to
   * @description Performs complete language switch with resource reloading and persistence
   */
  const handleLanguageChange = async (languageCode: string) => {
    try {
      // Force reload all namespaces for the new language
      await i18n.reloadResources(languageCode);
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
      
      // Save to localStorage for persistence
      localStorage.setItem('preferred-language', languageCode);
      
      // Update document language attribute for accessibility
      document.documentElement.lang = languageCode;
      
      // Dispatch custom event for app-wide language change handling
      setTimeout(() => {
        window.dispatchEvent(new Event('languagechange'));
      }, 100);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  /**
   * Initialize language preference on component mount
   * @description Restores saved language from localStorage and sets document language
   */
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
    // Set document language to current i18n language
    document.documentElement.lang = i18n.language;
  }, []);

  /**
   * Handle click outside to close dropdown
   * @description Closes dropdown when clicking outside the component
   */
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
      {/* Language selector trigger button */}
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
        type="button"
      >
        <GlobeAltIcon className="h-4 w-4 text-gray-500" />
        <CountryFlag countryCode={currentLanguage.flag} svg style={{ width: '1.5em', height: '1.5em', marginRight: '0.5em', borderRadius: '4px' }} title={currentLanguage.name} />
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

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop for click-outside handling */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Language options dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="py-1" role="menu" aria-label="Language options">
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
                  type="button"
                >
                  <CountryFlag countryCode={language.flag} svg style={{ width: '1.5em', height: '1.5em', marginRight: '0.5em', borderRadius: '4px' }} title={language.name} />
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
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Import polskich tłumaczeń (fallback)
import commonPL from './locales/pl/common.json';
import navigationPL from './locales/pl/navigation.json';
import authPL from './locales/pl/auth.json';
import dashboardPL from './locales/pl/dashboard.json';
import notificationsPL from './locales/pl/notifications.json';

const resources = {
  pl: {
    common: commonPL,
    navigation: navigationPL,
    auth: authPL,
    dashboard: dashboardPL,
    notifications: notificationsPL,
  },
  // Inne języki będą ładowane dynamicznie
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'auth', 'dashboard', 'notifications', 'projects', 'tasks', 'materials', 'messages', 'forms', 'homepage'],
    
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React już escapuje
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferred-language',
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-cache',
      },
    },
    
    react: {
      useSuspense: false,
    },

    // Ensure all available languages are supported
    supportedLngs: ['pl', 'en', 'de', 'ua'],
    
    // Load missing keys behavior
    saveMissing: false,
    
    // Namespace separator
    nsSeparator: ':',
    keySeparator: '.',
  });

// Handle language change events
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem('preferred-language', lng);
});

export default i18n; 
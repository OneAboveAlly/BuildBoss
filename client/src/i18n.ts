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
import homepagePL from './locales/pl/homepage.json';
import projectsPL from './locales/pl/projects.json';
import tasksPL from './locales/pl/tasks.json';
import materialsPL from './locales/pl/materials.json';
import messagesPL from './locales/pl/messages.json';
import formsPL from './locales/pl/forms.json';
import jobsPL from './locales/pl/jobs.json';

const resources = {
  pl: {
    common: commonPL,
    navigation: navigationPL,
    auth: authPL,
    dashboard: dashboardPL,
    notifications: notificationsPL,
    homepage: homepagePL,
    projects: projectsPL,
    tasks: tasksPL,
    materials: materialsPL,
    messages: messagesPL,
    forms: formsPL,
    jobs: jobsPL,
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
    ns: ['common', 'navigation', 'auth', 'dashboard', 'notifications', 'projects', 'tasks', 'materials', 'messages', 'forms', 'homepage', 'subscription', 'jobs'],
    
    debug: false, // Disable debug in production
    
    // Set explicit language on init
    lng: 'pl', // Default to Polish
    
    interpolation: {
      escapeValue: false, // React już escapuje
    },
    
    detection: {
      order: ['localStorage', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferred-language',
      // Don't use navigator detection on first visit - use explicit default
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
    },
    
    // Always load fallback language first
    preload: ['pl'],
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Allow cross-origin requests
      crossDomain: true,
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
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

// Wait for i18n to be initialized before using it
i18n.on('initialized', () => {
  console.log('i18n initialized');
  // Initialize with Polish if no language is stored
  if (!localStorage.getItem('preferred-language')) {
    localStorage.setItem('preferred-language', 'pl');
    i18n.changeLanguage('pl');
  }
});

export default i18n; 
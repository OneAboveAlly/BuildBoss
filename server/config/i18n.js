const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

// Inicjalizacja i18next dla backendu
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'pl',
    preload: ['pl', 'de', 'en', 'ua'],
    
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['header', 'querystring'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lng',
      caches: false,
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    defaultNS: 'common',
    ns: ['common', 'errors', 'notifications', 'emails'],
  });

module.exports = { i18next, middleware }; 
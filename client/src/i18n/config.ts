import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pl: {
    translation: {
      // Common
      loading: 'Ładowanie...',
      error: 'Błąd',
      success: 'Sukces',
      cancel: 'Anuluj',
      save: 'Zapisz',
      delete: 'Usuń',
      edit: 'Edytuj',
      
      // Auth
      login: 'Zaloguj się',
      register: 'Zarejestruj się',
      logout: 'Wyloguj',
      email: 'Email',
      password: 'Hasło',
      
      // Navigation
      dashboard: 'Dashboard',
      tasks: 'Zadania',
      documents: 'Dokumenty',
      invoices: 'Faktury',
      materials: 'Materiały',
      company: 'Firma',
    }
  },
  en: {
    translation: {
      // Common
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      
      // Auth
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      
      // Navigation
      dashboard: 'Dashboard',
      tasks: 'Tasks',
      documents: 'Documents',
      invoices: 'Invoices',
      materials: 'Materials',
      company: 'Company',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pl', // default language
    fallbackLng: 'pl',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n; 
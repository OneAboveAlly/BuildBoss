#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Kolory dla konsoli
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

// Konfiguracja
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const REFERENCE_LANG = 'pl'; // Język referencyjny (kompletny)
const TARGET_LANGUAGES = ['de', 'en', 'ua'];

// Funkcja do rekurencyjnego pobierania kluczy z obiektu
function getKeys(obj, prefix = '') {
  let keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Funkcja do ładowania pliku JSON
function loadTranslationFile(language, namespace) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log('red', `❌ Błąd ładowania ${filePath}: ${error.message}`);
    return null;
  }
}

// Funkcja do pobierania wszystkich namespace'ów
function getNamespaces() {
  const referencePath = path.join(LOCALES_DIR, REFERENCE_LANG);
  
  if (!fs.existsSync(referencePath)) {
    log('red', `❌ Katalog referencyjny ${referencePath} nie istnieje`);
    process.exit(1);
  }
  
  return fs.readdirSync(referencePath)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

// Główna funkcja walidacji
function validateTranslations() {
  log('cyan', '🌍 Walidacja tłumaczeń...\n');
  
  const namespaces = getNamespaces();
  let totalIssues = 0;
  const report = {
    languages: {},
    summary: {
      totalKeys: 0,
      totalNamespaces: namespaces.length
    }
  };
  
  // Dla każdego namespace
  for (const namespace of namespaces) {
    log('blue', `📁 Sprawdzanie namespace: ${namespace}`);
    
    // Ładuj referencyjne tłumaczenia
    const referenceTranslations = loadTranslationFile(REFERENCE_LANG, namespace);
    if (!referenceTranslations) {
      log('red', `❌ Nie można załadować referencyjnych tłumaczeń dla ${namespace}`);
      continue;
    }
    
    const referenceKeys = getKeys(referenceTranslations);
    report.summary.totalKeys += referenceKeys.length;
    
    log('magenta', `   📊 Klucze referencyjne: ${referenceKeys.length}`);
    
    // Sprawdź każdy język docelowy
    for (const language of TARGET_LANGUAGES) {
      if (!report.languages[language]) {
        report.languages[language] = {
          namespaces: {},
          totalKeys: 0,
          translatedKeys: 0,
          coverage: 0
        };
      }
      
      const targetTranslations = loadTranslationFile(language, namespace);
      
      if (!targetTranslations) {
        log('yellow', `   ⚠️  ${language}: Brak pliku ${namespace}.json`);
        report.languages[language].namespaces[namespace] = {
          exists: false,
          keys: 0,
          missing: referenceKeys.length,
          coverage: 0
        };
        totalIssues += referenceKeys.length;
        continue;
      }
      
      const targetKeys = getKeys(targetTranslations);
      const missingKeys = referenceKeys.filter(key => !targetKeys.includes(key));
      const extraKeys = targetKeys.filter(key => !referenceKeys.includes(key));
      
      const coverage = Math.round((targetKeys.length / referenceKeys.length) * 100);
      
      report.languages[language].namespaces[namespace] = {
        exists: true,
        keys: targetKeys.length,
        missing: missingKeys.length,
        extra: extraKeys.length,
        coverage: coverage
      };
      
      report.languages[language].totalKeys += referenceKeys.length;
      report.languages[language].translatedKeys += targetKeys.length;
      
      // Wyświetl wyniki
      if (missingKeys.length === 0 && extraKeys.length === 0) {
        log('green', `   ✅ ${language}: Kompletne (${coverage}%)`);
      } else {
        log('yellow', `   ⚠️  ${language}: ${coverage}% (${missingKeys.length} brakuje, ${extraKeys.length} nadmiarowe)`);
        
        if (missingKeys.length > 0) {
          log('red', `      Brakujące klucze: ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? '...' : ''}`);
        }
        
        if (extraKeys.length > 0) {
          log('magenta', `      Nadmiarowe klucze: ${extraKeys.slice(0, 5).join(', ')}${extraKeys.length > 5 ? '...' : ''}`);
        }
        
        totalIssues += missingKeys.length;
      }
    }
    
    console.log('');
  }
  
  // Oblicz ogólne pokrycie dla każdego języka
  for (const language of TARGET_LANGUAGES) {
    if (report.languages[language]) {
      report.languages[language].coverage = Math.round(
        (report.languages[language].translatedKeys / report.languages[language].totalKeys) * 100
      );
    }
  }
  
  // Podsumowanie
  log('cyan', '📊 PODSUMOWANIE:');
  log('blue', `   📁 Namespace'y: ${report.summary.totalNamespaces}`);
  log('blue', `   🔑 Łączna liczba kluczy: ${report.summary.totalKeys}`);
  
  console.log('');
  log('cyan', '🌍 POKRYCIE JĘZYKÓW:');
  
  for (const language of TARGET_LANGUAGES) {
    const data = report.languages[language];
    if (data) {
      const color = data.coverage >= 90 ? 'green' : data.coverage >= 70 ? 'yellow' : 'red';
      const icon = data.coverage >= 90 ? '✅' : data.coverage >= 70 ? '⚠️' : '❌';
      
      log(color, `   ${icon} ${language.toUpperCase()}: ${data.coverage}% (${data.translatedKeys}/${data.totalKeys})`);
    }
  }
  
  console.log('');
  
  if (totalIssues === 0) {
    log('green', '🎉 Wszystkie tłumaczenia są kompletne!');
    process.exit(0);
  } else {
    log('red', `❌ Znaleziono ${totalIssues} problemów z tłumaczeniami`);
    process.exit(1);
  }
}

// Uruchom walidację
if (require.main === module) {
  validateTranslations();
}

module.exports = { validateTranslations }; 
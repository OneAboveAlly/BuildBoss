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
const PUBLIC_LOCALES_DIR = path.join(__dirname, '../public/locales');
const REFERENCE_LANG = 'pl';
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

// Funkcja do ustawiania wartości w zagnieżdżonym obiekcie
function setValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Funkcja do pobierania wartości z zagnieżdżonego obiektu
function getValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Funkcja do ładowania pliku JSON
function loadTranslationFile(language, namespace) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log('red', `❌ Błąd ładowania ${filePath}: ${error.message}`);
    return {};
  }
}

// Funkcja do zapisywania pliku JSON
function saveTranslationFile(language, namespace, data) {
  const dirPath = path.join(LOCALES_DIR, language);
  const filePath = path.join(dirPath, `${namespace}.json`);
  
  try {
    // Utwórz katalog jeśli nie istnieje
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Zapisz z ładnym formatowaniem
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    
    return true;
  } catch (error) {
    log('red', `❌ Błąd zapisywania ${filePath}: ${error.message}`);
    return false;
  }
}

// Funkcja do kopiowania plików do public/locales
function syncToPublic() {
  log('blue', '📁 Synchronizacja z public/locales...');
  
  try {
    // Utwórz katalog public/locales jeśli nie istnieje
    if (!fs.existsSync(PUBLIC_LOCALES_DIR)) {
      fs.mkdirSync(PUBLIC_LOCALES_DIR, { recursive: true });
    }
    
    const allLanguages = [REFERENCE_LANG, ...TARGET_LANGUAGES];
    
    for (const language of allLanguages) {
      const srcDir = path.join(LOCALES_DIR, language);
      const destDir = path.join(PUBLIC_LOCALES_DIR, language);
      
      if (!fs.existsSync(srcDir)) continue;
      
      // Utwórz katalog docelowy
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Kopiuj wszystkie pliki JSON
      const files = fs.readdirSync(srcDir).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        
        fs.copyFileSync(srcFile, destFile);
      }
      
      log('green', `   ✅ ${language}: ${files.length} plików skopiowanych`);
    }
    
  } catch (error) {
    log('red', `❌ Błąd synchronizacji z public: ${error.message}`);
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

// Główna funkcja synchronizacji
function syncTranslations(options = {}) {
  const {
    addMissingKeys = true,
    removeExtraKeys = false,
    preserveExisting = true,
    dryRun = false
  } = options;
  
  log('cyan', '🔄 Synchronizacja tłumaczeń...\n');
  
  const namespaces = getNamespaces();
  let totalChanges = 0;
  
  // Dla każdego namespace
  for (const namespace of namespaces) {
    log('blue', `📁 Synchronizacja namespace: ${namespace}`);
    
    // Ładuj referencyjne tłumaczenia
    const referenceTranslations = loadTranslationFile(REFERENCE_LANG, namespace);
    const referenceKeys = getKeys(referenceTranslations);
    
    log('magenta', `   📊 Klucze referencyjne: ${referenceKeys.length}`);
    
    // Synchronizuj każdy język docelowy
    for (const language of TARGET_LANGUAGES) {
      let targetTranslations = loadTranslationFile(language, namespace);
      const originalTargetKeys = getKeys(targetTranslations);
      let changes = 0;
      
      // Dodaj brakujące klucze
      if (addMissingKeys) {
        for (const key of referenceKeys) {
          if (getValue(targetTranslations, key) === undefined) {
            const referenceValue = getValue(referenceTranslations, key);
            
            if (preserveExisting) {
              // Dodaj komentarz że wymaga tłumaczenia
              setValue(targetTranslations, key, `[TODO: ${language.toUpperCase()}] ${referenceValue}`);
            } else {
              // Skopiuj wartość referencyjną
              setValue(targetTranslations, key, referenceValue);
            }
            
            changes++;
          }
        }
      }
      
      // Usuń nadmiarowe klucze
      if (removeExtraKeys) {
        const targetKeys = getKeys(targetTranslations);
        const extraKeys = targetKeys.filter(key => !referenceKeys.includes(key));
        
        for (const key of extraKeys) {
          // Usuń klucz (to jest skomplikowane w zagnieżdżonych obiektach)
          // Na razie tylko loguj
          log('yellow', `   ⚠️  ${language}: Nadmiarowy klucz: ${key}`);
        }
      }
      
      // Zapisz zmiany
      if (changes > 0) {
        if (!dryRun) {
          if (saveTranslationFile(language, namespace, targetTranslations)) {
            log('green', `   ✅ ${language}: ${changes} zmian zapisanych`);
          } else {
            log('red', `   ❌ ${language}: Błąd zapisywania zmian`);
          }
        } else {
          log('yellow', `   🔍 ${language}: ${changes} zmian (dry run)`);
        }
        
        totalChanges += changes;
      } else {
        log('green', `   ✅ ${language}: Brak zmian`);
      }
    }
    
    console.log('');
  }
  
  // Synchronizuj z public/locales
  if (!dryRun && totalChanges > 0) {
    syncToPublic();
  }
  
  // Podsumowanie
  log('cyan', '📊 PODSUMOWANIE SYNCHRONIZACJI:');
  
  if (totalChanges === 0) {
    log('green', '🎉 Wszystkie tłumaczenia są zsynchronizowane!');
  } else {
    log('blue', `🔄 Łącznie ${totalChanges} zmian ${dryRun ? '(dry run)' : 'zapisanych'}`);
    
    if (!dryRun) {
      log('green', '✅ Synchronizacja zakończona pomyślnie');
    }
  }
}

// Parsowanie argumentów wiersza poleceń
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    addMissingKeys: true,
    removeExtraKeys: false,
    preserveExisting: true,
    dryRun: false
  };
  
  for (const arg of args) {
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--remove-extra':
        options.removeExtraKeys = true;
        break;
      case '--no-preserve':
        options.preserveExisting = false;
        break;
      case '--help':
        console.log(`
🔄 Skrypt synchronizacji tłumaczeń

Użycie: node sync-translations.js [opcje]

Opcje:
  --dry-run        Pokaż zmiany bez zapisywania
  --remove-extra   Usuń nadmiarowe klucze z języków docelowych
  --no-preserve    Nie zachowuj istniejących tłumaczeń (nadpisz referencyjnymi)
  --help           Pokaż tę pomoc

Przykłady:
  node sync-translations.js                    # Standardowa synchronizacja
  node sync-translations.js --dry-run          # Podgląd zmian
  node sync-translations.js --remove-extra     # Usuń nadmiarowe klucze
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// Uruchom synchronizację
if (require.main === module) {
  const options = parseArgs();
  syncTranslations(options);
}

module.exports = { syncTranslations }; 
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const SUPPORTED_LOCALES = ['en', 'pl', 'de', 'ua'];
const BASE_LOCALE = 'en'; // English as reference

/**
 * Load JSON file safely
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.log(chalk.red(`Error loading ${filePath}: ${error.message}`));
    return null;
  }
}

/**
 * Save JSON file with proper formatting
 */
function saveJsonFile(filePath, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(filePath, jsonString, 'utf8');
    return true;
  } catch (error) {
    console.log(chalk.red(`Error saving ${filePath}: ${error.message}`));
    return false;
  }
}

/**
 * Get all keys from nested object with dot notation
 */
function getNestedKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getNestedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys.sort();
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * Generate TODO placeholder for missing translation
 */
function generateTodoPlaceholder(locale, key, baseValue) {
  const localeCode = locale.toUpperCase();
  
  // For certain keys, provide better placeholders
  if (typeof baseValue === 'string') {
    // For simple strings, use TODO prefix
    return `[TODO: ${localeCode}] ${baseValue}`;
  }
  
  return `[TODO: ${localeCode}]`;
}

/**
 * Sync missing keys from base locale to target locale
 */
function syncTranslationFile(locale, filename) {
  const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE, `${filename}.json`);
  const localeFilePath = path.join(LOCALES_DIR, locale, `${filename}.json`);
  
  // Check if base file exists
  if (!fs.existsSync(baseFilePath)) {
    console.log(chalk.yellow(`⚠️  Base file not found: ${BASE_LOCALE}/${filename}.json`));
    return { added: 0, updated: 0 };
  }
  
  // Load base data
  const baseData = loadJsonFile(baseFilePath);
  if (!baseData) return { added: 0, updated: 0 };
  
  // Load or create locale data
  let localeData = {};
  if (fs.existsSync(localeFilePath)) {
    localeData = loadJsonFile(localeFilePath) || {};
  }
  
  // Get all keys from base
  const baseKeys = getNestedKeys(baseData);
  let addedCount = 0;
  let updatedCount = 0;
  
  // Add missing keys
  baseKeys.forEach(key => {
    const baseValue = getNestedValue(baseData, key);
    const localeValue = getNestedValue(localeData, key);
    
    if (localeValue === undefined || localeValue === null || localeValue === '') {
      const placeholder = generateTodoPlaceholder(locale, key, baseValue);
      setNestedValue(localeData, key, placeholder);
      addedCount++;
    }
  });
  
  // Save the updated file
  if (addedCount > 0) {
    if (saveJsonFile(localeFilePath, localeData)) {
      console.log(chalk.green(`  ✅ ${filename}.json: Added ${addedCount} missing keys`));
    } else {
      console.log(chalk.red(`  ❌ ${filename}.json: Failed to save`));
    }
  } else {
    console.log(chalk.gray(`  ✅ ${filename}.json: Already complete`));
  }
  
  return { added: addedCount, updated: updatedCount };
}

/**
 * Get all translation files in base locale
 */
function getBaseTranslationFiles() {
  const baseDir = path.join(LOCALES_DIR, BASE_LOCALE);
  
  if (!fs.existsSync(baseDir)) {
    console.log(chalk.red(`❌ Base locale directory not found: ${baseDir}`));
    return [];
  }
  
  return fs.readdirSync(baseDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

/**
 * Ensure locale directory exists
 */
function ensureLocaleDirectory(locale) {
  const localeDir = path.join(LOCALES_DIR, locale);
  
  if (!fs.existsSync(localeDir)) {
    fs.mkdirSync(localeDir, { recursive: true });
    console.log(chalk.blue(`📁 Created directory: ${locale}/`));
  }
}

/**
 * Sync all files for a specific locale
 */
function syncLocale(locale) {
  console.log(chalk.blue.bold(`\n🔄 Syncing locale: ${locale.toUpperCase()}`));
  
  ensureLocaleDirectory(locale);
  
  const baseFiles = getBaseTranslationFiles();
  let totalAdded = 0;
  let totalUpdated = 0;
  
  baseFiles.forEach(filename => {
    const result = syncTranslationFile(locale, filename);
    totalAdded += result.added;
    totalUpdated += result.updated;
  });
  
  // Summary for this locale
  if (totalAdded > 0 || totalUpdated > 0) {
    console.log(chalk.green(`📊 ${locale.toUpperCase()} Summary: ${totalAdded} keys added, ${totalUpdated} keys updated`));
  } else {
    console.log(chalk.green(`✅ ${locale.toUpperCase()}: All translations in sync`));
  }
  
  return { added: totalAdded, updated: totalUpdated };
}

/**
 * Clean up TODO placeholders (optional feature)
 */
function cleanupTodoPlaceholders(locale, dryRun = true) {
  console.log(chalk.yellow.bold(`\n🧹 ${dryRun ? 'Checking' : 'Cleaning'} TODO placeholders: ${locale.toUpperCase()}`));
  
  const baseFiles = getBaseTranslationFiles();
  let todoCount = 0;
  
  baseFiles.forEach(filename => {
    const localeFilePath = path.join(LOCALES_DIR, locale, `${filename}.json`);
    
    if (!fs.existsSync(localeFilePath)) return;
    
    const localeData = loadJsonFile(localeFilePath);
    if (!localeData) return;
    
    const keys = getNestedKeys(localeData);
    const todoKeys = keys.filter(key => {
      const value = getNestedValue(localeData, key);
      return typeof value === 'string' && (value.includes('[TODO:') || value.startsWith('[TODO'));
    });
    
    if (todoKeys.length > 0) {
      console.log(chalk.magenta(`  📝 ${filename}.json: ${todoKeys.length} TODO placeholders`));
      todoCount += todoKeys.length;
      
      if (!dryRun) {
        // Here you could implement auto-translation or other cleanup logic
        console.log(chalk.gray(`    (Cleanup logic not implemented yet)`));
      }
    }
  });
  
  if (todoCount === 0) {
    console.log(chalk.green(`✅ ${locale.toUpperCase()}: No TODO placeholders found`));
  }
  
  return todoCount;
}

/**
 * Main sync function
 */
function main() {
  const args = process.argv.slice(2);
  const shouldCleanup = args.includes('--cleanup');
  const specificLocale = args.find(arg => !arg.startsWith('--'));
  
  console.log(chalk.green.bold('🌍 BuildBoss Translation Sync Tool\n'));
  console.log(`📍 Base locale: ${BASE_LOCALE.toUpperCase()}`);
  console.log(`🌐 Target locales: ${SUPPORTED_LOCALES.filter(l => l !== BASE_LOCALE).join(', ').toUpperCase()}\n`);
  
  // Validate base locale exists
  if (!fs.existsSync(path.join(LOCALES_DIR, BASE_LOCALE))) {
    console.log(chalk.red.bold(`❌ Base locale directory not found: ${BASE_LOCALE}`));
    process.exit(1);
  }
  
  const targetLocales = specificLocale 
    ? [specificLocale]
    : SUPPORTED_LOCALES.filter(locale => locale !== BASE_LOCALE);
  
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalTodos = 0;
  
  // Sync each locale
  targetLocales.forEach(locale => {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      console.log(chalk.red(`❌ Unsupported locale: ${locale}`));
      return;
    }
    
    const result = syncLocale(locale);
    totalAdded += result.added;
    totalUpdated += result.updated;
    
    if (shouldCleanup) {
      totalTodos += cleanupTodoPlaceholders(locale, true);
    }
  });
  
  // Overall summary
  console.log(chalk.green.bold('\n🎯 SYNC SUMMARY:'));
  console.log(`📊 Total changes:`);
  console.log(`  ➕ Keys added: ${totalAdded}`);
  console.log(`  🔄 Keys updated: ${totalUpdated}`);
  
  if (shouldCleanup) {
    console.log(`  📝 TODO placeholders: ${totalTodos}`);
  }
  
  if (totalAdded === 0 && totalUpdated === 0) {
    console.log(chalk.green('🎉 All translations are in perfect sync!'));
  } else {
    console.log(chalk.yellow('\n📝 Next steps:'));
    console.log('1. Review the added TODO placeholders');
    console.log('2. Replace them with actual translations');
    console.log('3. Run: npm run validate-translations');
  }
  
  // Usage instructions
  console.log(chalk.cyan('\n📚 Usage examples:'));
  console.log('  npm run sync-translations           # Sync all locales');
  console.log('  npm run sync-translations pl        # Sync only Polish');
  console.log('  npm run sync-translations -- --cleanup # Check TODO count');
}

// Run the sync
main(); 
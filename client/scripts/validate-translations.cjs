#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const SUPPORTED_LOCALES = ['en', 'pl', 'de', 'ua'];
const BASE_LOCALE = 'en'; // English as reference

// Statistics tracking
let stats = {
  totalFiles: 0,
  totalKeys: 0,
  missingKeys: 0,
  extraKeys: 0,
  emptyValues: 0,
  todoValues: 0,
  errors: []
};

/**
 * Load JSON file safely
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    stats.errors.push(`Error loading ${filePath}: ${error.message}`);
    return null;
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
 * Get all translation files in a locale directory
 */
function getTranslationFiles(locale) {
  const localeDir = path.join(LOCALES_DIR, locale);
  
  if (!fs.existsSync(localeDir)) {
    stats.errors.push(`Locale directory not found: ${localeDir}`);
    return [];
  }
  
  return fs.readdirSync(localeDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

/**
 * Validate individual translation file
 */
function validateTranslationFile(locale, filename) {
  const filePath = path.join(LOCALES_DIR, locale, `${filename}.json`);
  const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE, `${filename}.json`);
  
  // Check if base file exists
  if (!fs.existsSync(baseFilePath)) {
    stats.errors.push(`Base file missing: ${BASE_LOCALE}/${filename}.json`);
    return {
      missingKeys: [],
      extraKeys: [],
      emptyValues: [],
      todoValues: [],
      totalKeys: 0
    };
  }
  
  // Load files
  const baseData = loadJsonFile(baseFilePath);
  const localeData = loadJsonFile(filePath);
  
  if (!baseData || !localeData) {
    return {
      missingKeys: [],
      extraKeys: [],
      emptyValues: [],
      todoValues: [],
      totalKeys: 0
    };
  }
  
  // Get all keys
  const baseKeys = getNestedKeys(baseData);
  const localeKeys = getNestedKeys(localeData);
  
  // Find differences
  const missingKeys = baseKeys.filter(key => !localeKeys.includes(key));
  const extraKeys = localeKeys.filter(key => !baseKeys.includes(key));
  
  // Check for empty and TODO values
  const emptyValues = [];
  const todoValues = [];
  
  baseKeys.forEach(key => {
    const value = getNestedValue(localeData, key);
    
    if (value === undefined || value === null || value === '') {
      emptyValues.push(key);
    } else if (typeof value === 'string') {
      if (value.includes('[TODO:') || value.startsWith('[TODO')) {
        todoValues.push(key);
      }
    }
  });
  
  stats.totalKeys += baseKeys.length;
  
  return {
    missingKeys,
    extraKeys,
    emptyValues,
    todoValues,
    totalKeys: baseKeys.length
  };
}

/**
 * Generate detailed report for a locale
 */
function generateLocaleReport(locale) {
  console.log(chalk.blue.bold(`\n📍 Validating locale: ${locale.toUpperCase()}`));
  
  const baseFiles = getTranslationFiles(BASE_LOCALE);
  const localeFiles = getTranslationFiles(locale);
  
  // Check for missing files
  const missingFiles = baseFiles.filter(file => !localeFiles.includes(file));
  const extraFiles = localeFiles.filter(file => !baseFiles.includes(file));
  
  if (missingFiles.length > 0) {
    console.log(chalk.red(`❌ Missing files: ${missingFiles.join(', ')}`));
    stats.errors.push(`${locale}: Missing files - ${missingFiles.join(', ')}`);
  }
  
  if (extraFiles.length > 0) {
    console.log(chalk.yellow(`⚠️  Extra files: ${extraFiles.join(', ')}`));
  }
  
  let localeStats = {
    totalFiles: baseFiles.length,
    missingKeys: 0,
    extraKeys: 0,
    emptyValues: 0,
    todoValues: 0,
    totalKeys: 0
  };
  
  // Validate each file
  baseFiles.forEach(filename => {
    const result = validateTranslationFile(locale, filename);
    
    localeStats.missingKeys += result.missingKeys.length;
    localeStats.extraKeys += result.extraKeys.length;
    localeStats.emptyValues += result.emptyValues.length;
    localeStats.todoValues += result.todoValues.length;
    localeStats.totalKeys += result.totalKeys;
    
    // Report file-specific issues
    if (result.missingKeys.length > 0 || result.extraKeys.length > 0 || 
        result.emptyValues.length > 0 || result.todoValues.length > 0) {
      
      console.log(chalk.cyan(`\n  📄 ${filename}.json:`));
      
      if (result.missingKeys.length > 0) {
        console.log(chalk.red(`    ❌ Missing keys (${result.missingKeys.length}):`));
        result.missingKeys.slice(0, 5).forEach(key => {
          console.log(chalk.red(`      - ${key}`));
        });
        if (result.missingKeys.length > 5) {
          console.log(chalk.red(`      ... and ${result.missingKeys.length - 5} more`));
        }
      }
      
      if (result.extraKeys.length > 0) {
        console.log(chalk.yellow(`    ⚠️  Extra keys (${result.extraKeys.length}):`));
        result.extraKeys.slice(0, 3).forEach(key => {
          console.log(chalk.yellow(`      + ${key}`));
        });
        if (result.extraKeys.length > 3) {
          console.log(chalk.yellow(`      ... and ${result.extraKeys.length - 3} more`));
        }
      }
      
      if (result.emptyValues.length > 0) {
        console.log(chalk.red(`    🔍 Empty values (${result.emptyValues.length}):`));
        result.emptyValues.slice(0, 3).forEach(key => {
          console.log(chalk.red(`      ∅ ${key}`));
        });
        if (result.emptyValues.length > 3) {
          console.log(chalk.red(`      ... and ${result.emptyValues.length - 3} more`));
        }
      }
      
      if (result.todoValues.length > 0) {
        console.log(chalk.magenta(`    📝 TODO values (${result.todoValues.length}):`));
        result.todoValues.slice(0, 3).forEach(key => {
          console.log(chalk.magenta(`      📋 ${key}`));
        });
        if (result.todoValues.length > 3) {
          console.log(chalk.magenta(`      ... and ${result.todoValues.length - 3} more`));
        }
      }
    } else {
      console.log(chalk.green(`  ✅ ${filename}.json - Perfect!`));
    }
  });
  
  // Locale summary
  const completeness = ((localeStats.totalKeys - localeStats.missingKeys - localeStats.emptyValues) / localeStats.totalKeys * 100).toFixed(1);
  
  console.log(chalk.blue(`\n  📊 ${locale.toUpperCase()} Summary:`));
  console.log(`    📁 Files: ${localeStats.totalFiles} files processed`);
  console.log(`    🔑 Keys: ${localeStats.totalKeys} total keys`);
  console.log(`    ❌ Missing: ${localeStats.missingKeys} keys`);
  console.log(`    ⚠️  Extra: ${localeStats.extraKeys} keys`);
  console.log(`    🔍 Empty: ${localeStats.emptyValues} values`);
  console.log(`    📝 TODO: ${localeStats.todoValues} values`);
  console.log(`    ✅ Completeness: ${completeness}%`);
  
  // Update global stats
  stats.totalFiles += localeStats.totalFiles;
  stats.missingKeys += localeStats.missingKeys;
  stats.extraKeys += localeStats.extraKeys;
  stats.emptyValues += localeStats.emptyValues;
  stats.todoValues += localeStats.todoValues;
  
  return localeStats;
}

/**
 * Generate fix suggestions
 */
function generateFixSuggestions() {
  console.log(chalk.yellow.bold('\n🔧 SUGGESTED FIXES:'));
  
  if (stats.missingKeys > 0) {
    console.log(chalk.red('1. Missing Keys:'));
    console.log('   - Copy missing keys from base locale (en)');
    console.log('   - Add placeholder values with [TODO: LOCALE] prefix');
    console.log('   - Run: npm run sync-translations');
  }
  
  if (stats.extraKeys > 0) {
    console.log(chalk.yellow('2. Extra Keys:'));
    console.log('   - Review if extra keys should be added to base locale');
    console.log('   - Remove unnecessary keys from locale files');
  }
  
  if (stats.emptyValues > 0) {
    console.log(chalk.red('3. Empty Values:'));
    console.log('   - Add placeholder translations');
    console.log('   - Use base locale values as fallback temporarily');
  }
  
  if (stats.todoValues > 0) {
    console.log(chalk.magenta('4. TODO Values:'));
    console.log('   - Replace TODO placeholders with actual translations');
    console.log('   - Prioritize high-usage keys (auth, navigation, common)');
  }
  
  console.log(chalk.cyan('\n📚 AUTOMATION SCRIPTS:'));
  console.log('  npm run sync-translations  - Sync missing keys');
  console.log('  npm run validate-translations - Run this validation');
}

/**
 * Main validation function
 */
function main() {
  console.log(chalk.green.bold('🌍 BuildBoss Translation Validation Tool\n'));
  console.log(`📍 Base locale: ${BASE_LOCALE.toUpperCase()}`);
  console.log(`🌐 Supported locales: ${SUPPORTED_LOCALES.join(', ').toUpperCase()}\n`);
  
  // Validate base locale exists
  if (!fs.existsSync(path.join(LOCALES_DIR, BASE_LOCALE))) {
    console.log(chalk.red.bold(`❌ Base locale directory not found: ${BASE_LOCALE}`));
    process.exit(1);
  }
  
  // Validate each locale
  const localeResults = {};
  
  SUPPORTED_LOCALES.forEach(locale => {
    if (locale !== BASE_LOCALE) {
      localeResults[locale] = generateLocaleReport(locale);
    }
  });
  
  // Overall summary
  console.log(chalk.green.bold('\n🎯 OVERALL SUMMARY:'));
  console.log(`📊 Total validation coverage:`);
  console.log(`  🔑 Total keys across all locales: ${stats.totalKeys}`);
  console.log(`  ❌ Missing keys: ${stats.missingKeys}`);
  console.log(`  ⚠️  Extra keys: ${stats.extraKeys}`);
  console.log(`  🔍 Empty values: ${stats.emptyValues}`);
  console.log(`  📝 TODO values: ${stats.todoValues}`);
  
  // Calculate overall health
  const totalIssues = stats.missingKeys + stats.emptyValues + stats.todoValues;
  const healthScore = ((stats.totalKeys - totalIssues) / stats.totalKeys * 100).toFixed(1);
  
  console.log(`\n🏥 Translation Health Score: ${healthScore}%`);
  
  if (totalIssues === 0) {
    console.log(chalk.green.bold('🎉 Perfect! All translations are complete and consistent!'));
  } else if (healthScore >= 90) {
    console.log(chalk.green('✅ Excellent! Minor issues to fix.'));
  } else if (healthScore >= 70) {
    console.log(chalk.yellow('⚠️  Good, but needs attention.'));
  } else {
    console.log(chalk.red('❌ Needs significant work.'));
  }
  
  // Show errors if any
  if (stats.errors.length > 0) {
    console.log(chalk.red.bold('\n💥 ERRORS ENCOUNTERED:'));
    stats.errors.forEach(error => {
      console.log(chalk.red(`  ❌ ${error}`));
    });
  }
  
  // Generate suggestions
  if (totalIssues > 0) {
    generateFixSuggestions();
  }
  
  // Exit with appropriate code
  process.exit(totalIssues > 0 ? 1 : 0);
}

// Run the validation
main(); 
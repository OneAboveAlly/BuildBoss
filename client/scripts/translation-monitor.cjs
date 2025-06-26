#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const SUPPORTED_LOCALES = ['en', 'pl', 'de', 'ua'];
const BASE_LOCALE = 'en';

/**
 * Load JSON file safely
 */
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
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
 * Calculate translation coverage statistics
 */
function calculateCoverage() {
  console.log(chalk.green.bold('📊 Translation Coverage Monitor\n'));
  
  const baseFiles = fs.readdirSync(path.join(LOCALES_DIR, BASE_LOCALE))
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
  
  const overallStats = {
    totalKeys: 0,
    locales: {}
  };
  
  // Initialize locale stats
  SUPPORTED_LOCALES.forEach(locale => {
    overallStats.locales[locale] = {
      totalKeys: 0,
      translatedKeys: 0,
      todoKeys: 0,
      emptyKeys: 0,
      coverage: 0,
      files: {}
    };
  });
  
  // Analyze each file
  baseFiles.forEach(filename => {
    const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE, `${filename}.json`);
    const baseData = loadJsonFile(baseFilePath);
    
    if (!baseData) return;
    
    const baseKeys = getNestedKeys(baseData);
    overallStats.totalKeys += baseKeys.length;
    
    console.log(chalk.cyan(`📄 ${filename}.json:`));
    
    SUPPORTED_LOCALES.forEach(locale => {
      const localeFilePath = path.join(LOCALES_DIR, locale, `${filename}.json`);
      const localeData = loadJsonFile(localeFilePath);
      
      let fileStats = {
        total: baseKeys.length,
        translated: 0,
        todo: 0,
        empty: 0
      };
      
      if (localeData) {
        baseKeys.forEach(key => {
          const value = getNestedValue(localeData, key);
          
          if (!value || value === '') {
            fileStats.empty++;
          } else if (typeof value === 'string' && (value.includes('[TODO:') || value.startsWith('[TODO'))) {
            fileStats.todo++;
          } else {
            fileStats.translated++;
          }
        });
      } else {
        fileStats.empty = baseKeys.length;
      }
      
      const coverage = fileStats.total > 0 ? (fileStats.translated / fileStats.total * 100).toFixed(1) : 0;
      
      // Color coding based on coverage
      const color = coverage >= 95 ? chalk.green :
                   coverage >= 80 ? chalk.yellow :
                   coverage >= 50 ? chalk.red : chalk.gray;
      
      console.log(`  ${color(`${locale.toUpperCase()}: ${coverage}% (${fileStats.translated}/${fileStats.total})`)}`);
      
      // Update overall stats
      overallStats.locales[locale].totalKeys += fileStats.total;
      overallStats.locales[locale].translatedKeys += fileStats.translated;
      overallStats.locales[locale].todoKeys += fileStats.todo;
      overallStats.locales[locale].emptyKeys += fileStats.empty;
      overallStats.locales[locale].files[filename] = {
        ...fileStats,
        coverage: parseFloat(coverage)
      };
    });
    
    console.log(''); // Empty line between files
  });
  
  // Calculate overall coverage for each locale
  Object.keys(overallStats.locales).forEach(locale => {
    const stats = overallStats.locales[locale];
    stats.coverage = stats.totalKeys > 0 ? 
      (stats.translatedKeys / stats.totalKeys * 100).toFixed(1) : 0;
  });
  
  return overallStats;
}

/**
 * Generate coverage summary
 */
function generateCoverageSummary(stats) {
  console.log(chalk.green.bold('🎯 COVERAGE SUMMARY:\n'));
  
  // Sort locales by coverage
  const sortedLocales = Object.entries(stats.locales)
    .sort(([, a], [, b]) => parseFloat(b.coverage) - parseFloat(a.coverage));
  
  sortedLocales.forEach(([locale, localeStats]) => {
    const coverage = parseFloat(localeStats.coverage);
    const color = coverage >= 95 ? chalk.green :
                 coverage >= 80 ? chalk.yellow :
                 coverage >= 50 ? chalk.red : chalk.gray;
    
    const status = coverage >= 95 ? '🟢 Excellent' :
                  coverage >= 80 ? '🟡 Good' :
                  coverage >= 50 ? '🟠 Needs Work' : '🔴 Critical';
    
    console.log(color(`📍 ${locale.toUpperCase()}: ${coverage}% ${status}`));
    console.log(`   ✅ Translated: ${localeStats.translatedKeys}/${localeStats.totalKeys}`);
    console.log(`   📝 TODO: ${localeStats.todoKeys}`);
    console.log(`   🔍 Empty: ${localeStats.emptyKeys}`);
    console.log('');
  });
}

/**
 * Identify priority translation targets
 */
function identifyPriorityTargets(stats) {
  console.log(chalk.yellow.bold('🎯 PRIORITY TRANSLATION TARGETS:\n'));
  
  const priorities = [];
  
  Object.entries(stats.locales).forEach(([locale, localeStats]) => {
    if (locale === BASE_LOCALE) return;
    
    Object.entries(localeStats.files).forEach(([filename, fileStats]) => {
      if (fileStats.coverage < 100) {
        priorities.push({
          locale,
          filename,
          coverage: fileStats.coverage,
          missing: fileStats.todo + fileStats.empty,
          priority: calculatePriority(filename, fileStats.coverage)
        });
      }
    });
  });
  
  // Sort by priority and coverage
  priorities.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.coverage - b.coverage;
  });
  
  // Show top priorities
  const topPriorities = priorities.slice(0, 10);
  
  if (topPriorities.length === 0) {
    console.log(chalk.green('🎉 All translations are complete!'));
    return;
  }
  
  topPriorities.forEach((item, index) => {
    const priorityLabel = item.priority >= 90 ? '🔥 CRITICAL' :
                         item.priority >= 70 ? '⚡ HIGH' :
                         item.priority >= 50 ? '📋 MEDIUM' : '📝 LOW';
    
    console.log(`${index + 1}. ${priorityLabel} - ${item.locale.toUpperCase()}/${item.filename}.json`);
    console.log(`   Coverage: ${item.coverage}% (${item.missing} keys missing)`);
    console.log('');
  });
}

/**
 * Calculate priority score for a file
 */
function calculatePriority(filename, coverage) {
  // High priority files
  const highPriorityFiles = ['auth', 'navigation', 'common', 'forms'];
  const mediumPriorityFiles = ['dashboard', 'homepage', 'notifications'];
  
  let basePriority = 30; // Low priority by default
  
  if (highPriorityFiles.includes(filename)) {
    basePriority = 90;
  } else if (mediumPriorityFiles.includes(filename)) {
    basePriority = 70;
  } else if (filename.includes('legal')) {
    basePriority = 40; // Legal is less urgent
  }
  
  // Adjust by coverage - lower coverage = higher priority
  const coverageMultiplier = (100 - coverage) / 100;
  
  return Math.round(basePriority * (1 + coverageMultiplier));
}

/**
 * Generate translation progress report
 */
function generateProgressReport(stats) {
  console.log(chalk.blue.bold('📈 TRANSLATION PROGRESS REPORT:\n'));
  
  const totalTranslatable = stats.totalKeys * (SUPPORTED_LOCALES.length - 1); // Exclude base locale
  let totalTranslated = 0;
  let totalTodo = 0;
  
  Object.entries(stats.locales).forEach(([locale, localeStats]) => {
    if (locale !== BASE_LOCALE) {
      totalTranslated += localeStats.translatedKeys;
      totalTodo += localeStats.todoKeys;
    }
  });
  
  const overallProgress = (totalTranslated / totalTranslatable * 100).toFixed(1);
  
  console.log(`📊 Overall Progress: ${overallProgress}%`);
  console.log(`✅ Completed Translations: ${totalTranslated}/${totalTranslatable}`);
  console.log(`📝 TODO Placeholders: ${totalTodo}`);
  console.log(`🎯 Remaining Work: ${totalTranslatable - totalTranslated} translations`);
  
  // Estimate completion time (rough calculation)
  const avgTranslationsPerHour = 50; // Conservative estimate
  const remainingHours = Math.ceil((totalTranslatable - totalTranslated) / avgTranslationsPerHour);
  
  console.log(`\n⏱️  Estimated completion time: ${remainingHours} hours`);
  
  // Milestone targets
  console.log(chalk.cyan('\n🎯 MILESTONE TARGETS:'));
  console.log('80% Complete: Focus on high-priority files (auth, navigation, common)');
  console.log('90% Complete: Complete dashboard and homepage translations');
  console.log('95% Complete: Polish remaining medium-priority content');
  console.log('100% Complete: Final review and quality assurance');
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(stats) {
  console.log(chalk.magenta.bold('\n💡 ACTIONABLE RECOMMENDATIONS:\n'));
  
  // Find the locale that needs most work
  const localesByWork = Object.entries(stats.locales)
    .filter(([locale]) => locale !== BASE_LOCALE)
    .map(([locale, localeStats]) => ({
      locale,
      missing: localeStats.todoKeys + localeStats.emptyKeys,
      coverage: parseFloat(localeStats.coverage)
    }))
    .sort((a, b) => b.missing - a.missing);
  
  if (localesByWork.length > 0) {
    const mostWork = localesByWork[0];
    console.log(`1. 🎯 Focus on ${mostWork.locale.toUpperCase()} first (${mostWork.missing} missing translations)`);
  }
  
  // High priority file recommendations
  console.log('2. 🔥 Prioritize these files in order:');
  console.log('   - auth.json (login/registration)');
  console.log('   - navigation.json (menu items)');
  console.log('   - common.json (buttons, labels)');
  console.log('   - forms.json (form validation)');
  
  // Quality recommendations
  console.log('3. 🏆 Quality best practices:');
  console.log('   - Use consistent terminology across files');
  console.log('   - Maintain placeholder variables {{variable}}');
  console.log('   - Keep similar string lengths when possible');
  console.log('   - Review punctuation consistency');
  
  // Automation recommendations
  console.log('4. 🤖 Use automation tools:');
  console.log('   - npm run i18n:sync - Add missing keys');
  console.log('   - npm run i18n:validate - Check for issues');
  console.log('   - npm run i18n:quality - Quality analysis');
  console.log('   - npm run i18n:monitor - Track progress');
}

/**
 * Main monitoring function
 */
function main() {
  const args = process.argv.slice(2);
  const showDetailed = args.includes('--detailed');
  const specificLocale = args.find(arg => !arg.startsWith('--'));
  
  console.log(chalk.green.bold('🌍 BuildBoss Translation Monitor\n'));
  console.log(`📍 Base locale: ${BASE_LOCALE.toUpperCase()}`);
  console.log(`🌐 Monitoring locales: ${SUPPORTED_LOCALES.filter(l => l !== BASE_LOCALE).join(', ').toUpperCase()}\n`);
  
  const stats = calculateCoverage();
  
  generateCoverageSummary(stats);
  identifyPriorityTargets(stats);
  generateProgressReport(stats);
  generateRecommendations(stats);
  
  console.log(chalk.cyan('\n📚 Available Commands:'));
  console.log('  npm run i18n:monitor          - This monitoring report');
  console.log('  npm run i18n:monitor -- --detailed - Detailed file-by-file report');
  console.log('  npm run i18n:validate         - Validation check');
  console.log('  npm run i18n:quality          - Quality analysis');
  console.log('  npm run i18n:sync             - Sync missing keys');
}

// Run the monitor
main(); 
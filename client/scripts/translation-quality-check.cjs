#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const SUPPORTED_LOCALES = ['en', 'pl', 'de', 'ua'];
const BASE_LOCALE = 'en';

// Quality check rules
const QUALITY_RULES = {
  // Check for common translation issues
  placeholder_consistency: true,
  variable_consistency: true,
  punctuation_consistency: true,
  length_variance_check: true,
  html_tag_consistency: true,
  case_consistency: true
};

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
 * Check placeholder consistency ({{variable}} format)
 */
function checkPlaceholderConsistency(baseValue, translatedValue, key) {
  const basePlaceholders = (baseValue.match(/\{\{[^}]+\}\}/g) || []).sort();
  const translatedPlaceholders = (translatedValue.match(/\{\{[^}]+\}\}/g) || []).sort();
  
  if (JSON.stringify(basePlaceholders) !== JSON.stringify(translatedPlaceholders)) {
    return {
      type: 'placeholder_mismatch',
      base: basePlaceholders,
      translated: translatedPlaceholders,
      severity: 'error'
    };
  }
  
  return null;
}

/**
 * Check HTML tag consistency
 */
function checkHtmlTagConsistency(baseValue, translatedValue, key) {
  const baseTags = (baseValue.match(/<[^>]+>/g) || []).sort();
  const translatedTags = (translatedValue.match(/<[^>]+>/g) || []).sort();
  
  if (JSON.stringify(baseTags) !== JSON.stringify(translatedTags)) {
    return {
      type: 'html_tag_mismatch',
      base: baseTags,
      translated: translatedTags,
      severity: 'error'
    };
  }
  
  return null;
}

/**
 * Check length variance (extreme differences might indicate issues)
 */
function checkLengthVariance(baseValue, translatedValue, key) {
  const baseLength = baseValue.length;
  const translatedLength = translatedValue.length;
  
  if (baseLength > 0) {
    const variance = Math.abs(translatedLength - baseLength) / baseLength;
    
    // Flag if translation is more than 300% longer or shorter than original
    if (variance > 3.0) {
      return {
        type: 'extreme_length_variance',
        baseLength,
        translatedLength,
        variance: (variance * 100).toFixed(1) + '%',
        severity: 'warning'
      };
    }
  }
  
  return null;
}

/**
 * Check punctuation consistency at end of strings
 */
function checkPunctuationConsistency(baseValue, translatedValue, key) {
  const basePunctuation = baseValue.match(/[.!?:;,]$/);
  const translatedPunctuation = translatedValue.match(/[.!?:;,]$/);
  
  // If base has ending punctuation but translation doesn't (or vice versa)
  if ((basePunctuation && !translatedPunctuation) || (!basePunctuation && translatedPunctuation)) {
    return {
      type: 'punctuation_inconsistency',
      base: basePunctuation ? basePunctuation[0] : 'none',
      translated: translatedPunctuation ? translatedPunctuation[0] : 'none',
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * Check if translation is just a TODO placeholder
 */
function checkTodoPlaceholder(translatedValue, key) {
  if (translatedValue.includes('[TODO:') || translatedValue.startsWith('[TODO')) {
    return {
      type: 'todo_placeholder',
      severity: 'info'
    };
  }
  
  return null;
}

/**
 * Check for common translation mistakes
 */
function checkCommonMistakes(baseValue, translatedValue, key) {
  const issues = [];
  
  // Check for untranslated English words in non-English locales
  const englishWords = ['the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'have', 'has', 'had'];
  const words = translatedValue.toLowerCase().split(/\s+/);
  
  const untranslatedWords = words.filter(word => 
    englishWords.includes(word.replace(/[^a-z]/g, ''))
  );
  
  if (untranslatedWords.length > 0) {
    issues.push({
      type: 'possible_untranslated',
      words: untranslatedWords,
      severity: 'warning'
    });
  }
  
  return issues;
}

/**
 * Run quality checks on a translation pair
 */
function runQualityChecks(baseValue, translatedValue, key, locale) {
  const issues = [];
  
  if (typeof baseValue !== 'string' || typeof translatedValue !== 'string') {
    return issues;
  }
  
  // Skip TODO check for base locale
  if (locale !== BASE_LOCALE) {
    const todoCheck = checkTodoPlaceholder(translatedValue, key);
    if (todoCheck) issues.push(todoCheck);
  }
  
  // Skip other checks if it's a TODO placeholder
  if (translatedValue.includes('[TODO:')) {
    return issues;
  }
  
  // Run all quality checks
  const checks = [
    checkPlaceholderConsistency,
    checkHtmlTagConsistency,
    checkLengthVariance,
    checkPunctuationConsistency
  ];
  
  checks.forEach(checkFn => {
    const result = checkFn(baseValue, translatedValue, key);
    if (result) issues.push(result);
  });
  
  // Add common mistakes check
  if (locale !== BASE_LOCALE) {
    const mistakes = checkCommonMistakes(baseValue, translatedValue, key);
    issues.push(...mistakes);
  }
  
  return issues;
}

/**
 * Analyze translation file quality
 */
function analyzeTranslationFile(locale, filename) {
  const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE, `${filename}.json`);
  const localeFilePath = path.join(LOCALES_DIR, locale, `${filename}.json`);
  
  if (!fs.existsSync(baseFilePath) || !fs.existsSync(localeFilePath)) {
    return { issues: [], stats: { total: 0, errors: 0, warnings: 0, info: 0 } };
  }
  
  const baseData = loadJsonFile(baseFilePath);
  const localeData = loadJsonFile(localeFilePath);
  
  if (!baseData || !localeData) {
    return { issues: [], stats: { total: 0, errors: 0, warnings: 0, info: 0 } };
  }
  
  const baseKeys = getNestedKeys(baseData);
  const allIssues = [];
  const stats = { total: baseKeys.length, errors: 0, warnings: 0, info: 0 };
  
  baseKeys.forEach(key => {
    const baseValue = getNestedValue(baseData, key);
    const translatedValue = getNestedValue(localeData, key);
    
    if (baseValue && translatedValue) {
      const issues = runQualityChecks(baseValue, translatedValue, key, locale);
      
      issues.forEach(issue => {
        issue.key = key;
        issue.baseValue = baseValue;
        issue.translatedValue = translatedValue;
        allIssues.push(issue);
        
        // Update stats
        stats[issue.severity]++;
      });
    }
  });
  
  return { issues: allIssues, stats };
}

/**
 * Generate quality report for a locale
 */
function generateQualityReport(locale) {
  console.log(chalk.blue.bold(`\n🔍 Quality Analysis: ${locale.toUpperCase()}`));
  
  const baseFiles = fs.readdirSync(path.join(LOCALES_DIR, BASE_LOCALE))
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
  
  let totalStats = { total: 0, errors: 0, warnings: 0, info: 0 };
  let allIssues = [];
  
  baseFiles.forEach(filename => {
    const { issues, stats } = analyzeTranslationFile(locale, filename);
    
    totalStats.total += stats.total;
    totalStats.errors += stats.errors;
    totalStats.warnings += stats.warnings;
    totalStats.info += stats.info;
    
    if (issues.length > 0) {
      console.log(chalk.cyan(`\n  📄 ${filename}.json:`));
      
      const groupedIssues = {};
      issues.forEach(issue => {
        if (!groupedIssues[issue.type]) {
          groupedIssues[issue.type] = [];
        }
        groupedIssues[issue.type].push(issue);
      });
      
      Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
        const color = typeIssues[0].severity === 'error' ? chalk.red : 
                     typeIssues[0].severity === 'warning' ? chalk.yellow : chalk.blue;
        
        console.log(color(`    ${getIssueIcon(typeIssues[0].severity)} ${getIssueDescription(type)} (${typeIssues.length})`));
        
        typeIssues.slice(0, 3).forEach(issue => {
          console.log(color(`      ${issue.key}`));
          if (issue.type === 'placeholder_mismatch') {
            console.log(color(`        Base: ${JSON.stringify(issue.base)}`));
            console.log(color(`        Translation: ${JSON.stringify(issue.translated)}`));
          }
        });
        
        if (typeIssues.length > 3) {
          console.log(color(`      ... and ${typeIssues.length - 3} more`));
        }
      });
    } else {
      console.log(chalk.green(`  ✅ ${filename}.json: Perfect quality!`));
    }
    
    allIssues.push(...issues);
  });
  
  // Locale summary
  const qualityScore = totalStats.total > 0 ? 
    ((totalStats.total - totalStats.errors - totalStats.warnings) / totalStats.total * 100).toFixed(1) : 100;
  
  console.log(chalk.blue(`\n  📊 ${locale.toUpperCase()} Quality Summary:`));
  console.log(`    🔍 Keys analyzed: ${totalStats.total}`);
  console.log(`    ❌ Errors: ${totalStats.errors}`);
  console.log(`    ⚠️  Warnings: ${totalStats.warnings}`);
  console.log(`    ℹ️  Info: ${totalStats.info}`);
  console.log(`    🏆 Quality Score: ${qualityScore}%`);
  
  return { stats: totalStats, qualityScore: parseFloat(qualityScore), issues: allIssues };
}

/**
 * Get issue icon based on severity
 */
function getIssueIcon(severity) {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️ ';
    case 'info': return 'ℹ️ ';
    default: return '❓';
  }
}

/**
 * Get human-readable issue description
 */
function getIssueDescription(type) {
  const descriptions = {
    placeholder_mismatch: 'Placeholder variables mismatch',
    html_tag_mismatch: 'HTML tags mismatch',
    extreme_length_variance: 'Extreme length difference',
    punctuation_inconsistency: 'Punctuation inconsistency',
    todo_placeholder: 'TODO placeholder',
    possible_untranslated: 'Possibly untranslated words'
  };
  
  return descriptions[type] || type;
}

/**
 * Main quality check function
 */
function main() {
  console.log(chalk.green.bold('🔍 BuildBoss Translation Quality Checker\n'));
  console.log(`📍 Base locale: ${BASE_LOCALE.toUpperCase()}`);
  console.log(`🌐 Analyzing locales: ${SUPPORTED_LOCALES.filter(l => l !== BASE_LOCALE).join(', ').toUpperCase()}\n`);
  
  const results = {};
  let overallStats = { total: 0, errors: 0, warnings: 0, info: 0 };
  
  SUPPORTED_LOCALES.filter(locale => locale !== BASE_LOCALE).forEach(locale => {
    const result = generateQualityReport(locale);
    results[locale] = result;
    
    overallStats.total += result.stats.total;
    overallStats.errors += result.stats.errors;
    overallStats.warnings += result.stats.warnings;
    overallStats.info += result.stats.info;
  });
  
  // Overall summary
  const overallQuality = overallStats.total > 0 ? 
    ((overallStats.total - overallStats.errors - overallStats.warnings) / overallStats.total * 100).toFixed(1) : 100;
  
  console.log(chalk.green.bold('\n🎯 OVERALL QUALITY SUMMARY:'));
  console.log(`📊 Total analysis:`);
  console.log(`  🔍 Keys analyzed: ${overallStats.total}`);
  console.log(`  ❌ Errors: ${overallStats.errors}`);
  console.log(`  ⚠️  Warnings: ${overallStats.warnings}`);
  console.log(`  ℹ️  Info: ${overallStats.info}`);
  console.log(`\n🏆 Overall Quality Score: ${overallQuality}%`);
  
  // Quality recommendations
  if (overallStats.errors > 0) {
    console.log(chalk.red('\n🚨 Critical Issues Found:'));
    console.log('  - Fix placeholder variable mismatches');
    console.log('  - Correct HTML tag inconsistencies');
  }
  
  if (overallStats.warnings > 0) {
    console.log(chalk.yellow('\n⚠️  Quality Improvements:'));
    console.log('  - Review extreme length differences');
    console.log('  - Check punctuation consistency');
    console.log('  - Verify possibly untranslated words');
  }
  
  if (overallStats.info > 0) {
    console.log(chalk.blue('\n📝 TODO Items:'));
    console.log(`  - ${overallStats.info} placeholder translations need completion`);
  }
  
  console.log(chalk.cyan('\n📚 Available Commands:'));
  console.log('  npm run i18n:validate     - Basic validation');
  console.log('  npm run i18n:quality      - Detailed quality check');
  console.log('  npm run i18n:sync         - Sync missing keys');
  
  // Exit with appropriate code
  process.exit(overallStats.errors > 0 ? 1 : 0);
}

// Run the quality check
main(); 
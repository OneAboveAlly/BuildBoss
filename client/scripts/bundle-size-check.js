#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * 
 * This script analyzes the built bundle files and provides:
 * - Total bundle size
 * - Individual chunk sizes
 * - Size warnings and recommendations
 * - Historical comparison (if available)
 * - Asset type breakdown
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DIST_DIR = path.join(__dirname, '../dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const SIZE_WARNINGS = {
  totalBundle: 1024 * 1024, // 1MB warning threshold
  individualChunk: 512 * 1024, // 512KB warning threshold
  criticalChunk: 250 * 1024   // 250KB critical threshold
};

// Color constants for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get file size statistics
 */
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      formattedSize: formatBytes(stats.size),
      isLarge: stats.size > SIZE_WARNINGS.individualChunk,
      isCritical: stats.size > SIZE_WARNINGS.criticalChunk
    };
  } catch (error) {
    return null;
  }
}

/**
 * Analyze assets directory
 */
function analyzeAssets() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log(`${colors.red}❌ Assets directory not found: ${ASSETS_DIR}${colors.reset}`);
    console.log(`${colors.yellow}💡 Run "npm run build" first to generate the bundle${colors.reset}`);
    return null;
  }

  const files = fs.readdirSync(ASSETS_DIR);
  const analysis = {
    totalSize: 0,
    totalFiles: 0,
    chunks: [],
    assets: {
      js: [],
      css: [],
      images: [],
      other: []
    },
    warnings: []
  };

  files.forEach(filename => {
    const filePath = path.join(ASSETS_DIR, filename);
    const stats = getFileStats(filePath);
    
    if (!stats) return;

    analysis.totalSize += stats.size;
    analysis.totalFiles++;

    const fileInfo = {
      name: filename,
      path: filePath,
      ...stats
    };

    // Categorize files
    if (filename.endsWith('.js')) {
      analysis.assets.js.push(fileInfo);
      
      // Identify chunk types
      if (filename.includes('vendor')) {
        fileInfo.type = 'vendor';
      } else if (filename.includes('sentry')) {
        fileInfo.type = 'sentry';
      } else if (filename.includes('router')) {
        fileInfo.type = 'router';
      } else if (filename.includes('charts')) {
        fileInfo.type = 'charts';
      } else if (filename.includes('ui')) {
        fileInfo.type = 'ui';
      } else if (filename.includes('i18n')) {
        fileInfo.type = 'i18n';
      } else if (filename.includes('utils')) {
        fileInfo.type = 'utils';
      } else if (filename.includes('maps')) {
        fileInfo.type = 'maps';
      } else if (filename.includes('index')) {
        fileInfo.type = 'main';
      } else {
        fileInfo.type = 'lazy-page';
      }
      
      analysis.chunks.push(fileInfo);
      
      // Check for size warnings
      if (stats.size > SIZE_WARNINGS.individualChunk) {
        analysis.warnings.push({
          type: 'large-chunk',
          file: filename,
          size: stats.formattedSize,
          message: `Large chunk detected: ${filename} (${stats.formattedSize})`
        });
      }
    } else if (filename.endsWith('.css')) {
      analysis.assets.css.push(fileInfo);
    } else if (filename.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
      analysis.assets.images.push(fileInfo);
    } else {
      analysis.assets.other.push(fileInfo);
    }
  });

  // Check total size warning
  if (analysis.totalSize > SIZE_WARNINGS.totalBundle) {
    analysis.warnings.push({
      type: 'large-total',
      size: formatBytes(analysis.totalSize),
      message: `Total bundle size is large: ${formatBytes(analysis.totalSize)}`
    });
  }

  return analysis;
}

/**
 * Display analysis results
 */
function displayResults(analysis) {
  if (!analysis) return;

  console.log(`\n${colors.bright}${colors.blue}📦 Bundle Size Analysis${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);

  // Overview
  console.log(`${colors.bright}📊 Overview:${colors.reset}`);
  console.log(`   Total Size: ${colors.green}${formatBytes(analysis.totalSize)}${colors.reset}`);
  console.log(`   Total Files: ${colors.green}${analysis.totalFiles}${colors.reset}`);
  console.log(`   JavaScript Chunks: ${colors.green}${analysis.chunks.length}${colors.reset}\n`);

  // JavaScript Chunks Analysis
  if (analysis.chunks.length > 0) {
    console.log(`${colors.bright}🧩 JavaScript Chunks:${colors.reset}`);
    
    // Sort chunks by size (largest first)
    const sortedChunks = [...analysis.chunks].sort((a, b) => b.size - a.size);
    
    sortedChunks.forEach(chunk => {
      const sizeColor = chunk.isLarge ? colors.red : 
                       chunk.isCritical ? colors.yellow : colors.green;
      const typeColor = colors.magenta;
      
      console.log(`   ${sizeColor}${chunk.formattedSize.padEnd(12)}${colors.reset} ${typeColor}[${chunk.type || 'unknown'}]${colors.reset} ${chunk.name}`);
    });
    console.log();
  }

  // Assets Breakdown
  console.log(`${colors.bright}📁 Assets Breakdown:${colors.reset}`);
  
  const jsSize = analysis.assets.js.reduce((sum, file) => sum + file.size, 0);
  const cssSize = analysis.assets.css.reduce((sum, file) => sum + file.size, 0);
  const imageSize = analysis.assets.images.reduce((sum, file) => sum + file.size, 0);
  const otherSize = analysis.assets.other.reduce((sum, file) => sum + file.size, 0);
  
  console.log(`   JavaScript: ${colors.green}${formatBytes(jsSize)}${colors.reset} (${analysis.assets.js.length} files)`);
  console.log(`   CSS: ${colors.green}${formatBytes(cssSize)}${colors.reset} (${analysis.assets.css.length} files)`);
  console.log(`   Images: ${colors.green}${formatBytes(imageSize)}${colors.reset} (${analysis.assets.images.length} files)`);
  console.log(`   Other: ${colors.green}${formatBytes(otherSize)}${colors.reset} (${analysis.assets.other.length} files)\n`);

  // Warnings
  if (analysis.warnings.length > 0) {
    console.log(`${colors.bright}⚠️  Warnings:${colors.reset}`);
    analysis.warnings.forEach(warning => {
      const warningColor = warning.type === 'large-total' ? colors.red : colors.yellow;
      console.log(`   ${warningColor}${warning.message}${colors.reset}`);
    });
    console.log();
  }

  // Recommendations
  console.log(`${colors.bright}💡 Recommendations:${colors.reset}`);
  
  if (analysis.totalSize > SIZE_WARNINGS.totalBundle) {
    console.log(`   ${colors.yellow}• Consider code splitting for better performance${colors.reset}`);
    console.log(`   ${colors.yellow}• Review large dependencies and consider alternatives${colors.reset}`);
  }
  
  const largeChunks = analysis.chunks.filter(chunk => chunk.isLarge);
  if (largeChunks.length > 0) {
    console.log(`   ${colors.yellow}• Break down large chunks: ${largeChunks.map(c => c.name).join(', ')}${colors.reset}`);
  }
  
  if (analysis.assets.images.length > 0) {
    const totalImageSize = analysis.assets.images.reduce((sum, img) => sum + img.size, 0);
    if (totalImageSize > 100 * 1024) { // 100KB
      console.log(`   ${colors.yellow}• Consider image optimization (current: ${formatBytes(totalImageSize)})${colors.reset}`);
    }
  }
  
  if (analysis.warnings.length === 0) {
    console.log(`   ${colors.green}✅ Bundle size looks good!${colors.reset}`);
  }
  
  console.log();

  // Performance Tips
  console.log(`${colors.bright}🚀 Performance Tips:${colors.reset}`);
  console.log(`   ${colors.cyan}• Use "npm run analyze" to see interactive bundle visualization${colors.reset}`);
  console.log(`   ${colors.cyan}• Enable gzip compression on your server (can reduce size by ~70%)${colors.reset}`);
  console.log(`   ${colors.cyan}• Consider implementing tree shaking for unused code elimination${colors.reset}`);
  console.log(`   ${colors.cyan}• Use lazy loading for non-critical routes and components${colors.reset}`);
  console.log();
}

/**
 * Save analysis to JSON file for historical comparison
 */
function saveAnalysis(analysis) {
  if (!analysis) return;

  const analysisFile = path.join(__dirname, '../bundle-analysis.json');
  const timestamp = new Date().toISOString();
  
  const analysisData = {
    timestamp,
    totalSize: analysis.totalSize,
    totalFiles: analysis.totalFiles,
    chunks: analysis.chunks.map(chunk => ({
      name: chunk.name,
      size: chunk.size,
      type: chunk.type
    })),
    assets: {
      js: analysis.assets.js.length,
      css: analysis.assets.css.length,
      images: analysis.assets.images.length,
      other: analysis.assets.other.length
    },
    warnings: analysis.warnings.length
  };

  try {
    let history = [];
    if (fs.existsSync(analysisFile)) {
      const existingData = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));
      history = existingData.history || [];
    }

    history.push(analysisData);
    
    // Keep only last 10 analyses
    if (history.length > 10) {
      history = history.slice(-10);
    }

    fs.writeFileSync(analysisFile, JSON.stringify({ 
      lastAnalysis: analysisData,
      history 
    }, null, 2));

    console.log(`${colors.green}📊 Analysis saved to bundle-analysis.json${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Could not save analysis: ${error.message}${colors.reset}`);
  }
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bright}${colors.blue}🔍 Analyzing bundle size...${colors.reset}\n`);

  const analysis = analyzeAssets();
  displayResults(analysis);
  saveAnalysis(analysis);

  // Exit with error code if there are critical warnings
  const criticalWarnings = analysis?.warnings.filter(w => w.type === 'large-total') || [];
  if (criticalWarnings.length > 0) {
    console.log(`${colors.red}❌ Critical size warnings detected${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Bundle analysis complete${colors.reset}`);
}

// Run the analysis
main(); 
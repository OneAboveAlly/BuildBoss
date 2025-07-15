#!/usr/bin/env node

/**
 * Metrics Monitor Script
 * 
 * This script provides real-time monitoring of application metrics:
 * - HTTP requests and response times
 * - Database queries and performance
 * - Error rates and system health
 * - Business metrics (users, projects, etc.)
 * - System resource usage
 */

const axios = require('axios');
const { logger } = require('../config/logger');

// Configuration
const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const METRICS_ENDPOINT = `${BASE_URL}/api/metrics/health`;
const SUMMARY_ENDPOINT = `${BASE_URL}/api/metrics/summary`;
const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL || '5000', 10); // 5 seconds
const MAX_HISTORY = 50; // Keep last 50 data points

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

// Storage for historical data
const metricsHistory = [];
let isMonitoring = false;

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds
 */
function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * Clear console and move cursor to top
 */
function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0f');
}

/**
 * Get status color based on value and thresholds
 */
function getStatusColor(value, goodThreshold, warningThreshold) {
  if (value <= goodThreshold) return colors.green;
  if (value <= warningThreshold) return colors.yellow;
  return colors.red;
}

/**
 * Fetch metrics from the server
 */
async function fetchMetrics() {
  try {
    const response = await axios.get(METRICS_ENDPOINT, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch metrics', {
      error: error.message,
      endpoint: METRICS_ENDPOINT
    });
    return null;
  }
}

/**
 * Display current metrics
 */
function displayMetrics(metrics) {
  if (!metrics) {
    console.log(`${colors.red}❌ Unable to fetch metrics${colors.reset}`);
    return;
  }

  const timestamp = new Date().toLocaleTimeString();
  const uptime = formatDuration(metrics.uptime * 1000);
  
  // Header
  console.log(`${colors.bright}${colors.blue}📊 BuildBoss Metrics Monitor${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`Time: ${timestamp} | Uptime: ${uptime} | Status: ${getStatusColor(
    metrics.status === 'healthy' ? 0 : 1, 0, 0
  )}${metrics.status.toUpperCase()}${colors.reset}`);
  console.log();

  // HTTP Metrics
  console.log(`${colors.bright}🌐 HTTP Performance:${colors.reset}`);
  const activeColor = getStatusColor(metrics.metrics.activeRequests, 10, 50);
  const errorColor = getStatusColor(metrics.metrics.errorRate, 5, 20);
  const responseColor = getStatusColor(metrics.metrics.avgResponseTime, 100, 500);
  
  console.log(`   Active Requests: ${activeColor}${metrics.metrics.activeRequests}${colors.reset}`);
  console.log(`   Total Requests: ${colors.green}${metrics.metrics.totalRequests}${colors.reset}`);
  console.log(`   Error Count: ${errorColor}${metrics.metrics.errorRate}${colors.reset}`);
  console.log(`   Avg Response Time: ${responseColor}${Math.round(metrics.metrics.avgResponseTime * 1000)}ms${colors.reset}`);
  console.log();

  // Database Metrics
  console.log(`${colors.bright}🗄️  Database Performance:${colors.reset}`);
  const dbColor = getStatusColor(metrics.metrics.databaseQueries, 1000, 5000);
  console.log(`   Total Queries: ${dbColor}${metrics.metrics.databaseQueries}${colors.reset}`);
  console.log();

  // Memory Metrics
  console.log(`${colors.bright}💾 Memory Usage:${colors.reset}`);
  const rssColor = getStatusColor(metrics.metrics.memoryUsage.rss, 200 * 1024 * 1024, 500 * 1024 * 1024);
  const heapColor = getStatusColor(metrics.metrics.memoryUsage.heapUsed, 100 * 1024 * 1024, 300 * 1024 * 1024);
  
  console.log(`   RSS: ${rssColor}${formatBytes(metrics.metrics.memoryUsage.rss)}${colors.reset}`);
  console.log(`   Heap Used: ${heapColor}${formatBytes(metrics.metrics.memoryUsage.heapUsed)}${colors.reset}`);
  console.log(`   Heap Total: ${colors.cyan}${formatBytes(metrics.metrics.memoryUsage.heapTotal)}${colors.reset}`);
  console.log();

  // Historical comparison
  if (metricsHistory.length > 1) {
    const previous = metricsHistory[metricsHistory.length - 2];
    const current = metrics;
    
    console.log(`${colors.bright}📈 Trends (since last check):${colors.reset}`);
    
    const requestDiff = current.metrics.totalRequests - previous.metrics.totalRequests;
    const errorDiff = current.metrics.errorRate - previous.metrics.errorRate;
    const memoryDiff = current.metrics.memoryUsage.heapUsed - previous.metrics.memoryUsage.heapUsed;
    
    const requestTrend = requestDiff > 0 ? `${colors.green}+${requestDiff}${colors.reset}` : `${colors.gray}0${colors.reset}`;
    const errorTrend = errorDiff > 0 ? `${colors.red}+${errorDiff}${colors.reset}` : `${colors.green}0${colors.reset}`;
    const memoryTrend = memoryDiff > 0 ? `${colors.yellow}+${formatBytes(memoryDiff)}${colors.reset}` : `${colors.green}${formatBytes(memoryDiff)}${colors.reset}`;
    
    console.log(`   Requests: ${requestTrend}`);
    console.log(`   Errors: ${errorTrend}`);
    console.log(`   Memory: ${memoryTrend}`);
    console.log();
  }

  // System Info
  console.log(`${colors.bright}⚙️  System:${colors.reset}`);
  console.log(`   Environment: ${colors.cyan}${metrics.environment}${colors.reset}`);
  console.log(`   Version: ${colors.cyan}${metrics.version}${colors.reset}`);
  console.log();

  // Instructions
  console.log(`${colors.bright}Controls:${colors.reset}`);
  console.log(`   ${colors.cyan}Ctrl+C${colors.reset} - Stop monitoring`);
  console.log(`   ${colors.cyan}${MONITOR_INTERVAL / 1000}s${colors.reset} - Refresh interval`);
  
  // Store metrics in history
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.shift();
  }
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  if (isMonitoring) {
    console.log('Monitoring is already running');
    return;
  }

  isMonitoring = true;
  
  console.log(`${colors.bright}${colors.blue}Starting BuildBoss Metrics Monitor...${colors.reset}`);
  console.log(`Endpoint: ${METRICS_ENDPOINT}`);
  console.log(`Interval: ${MONITOR_INTERVAL / 1000} seconds\n`);

  // Initial fetch
  const initialMetrics = await fetchMetrics();
  if (!initialMetrics) {
    console.log(`${colors.red}❌ Cannot connect to metrics endpoint. Is the server running?${colors.reset}`);
    process.exit(1);
  }

  const monitorInterval = setInterval(async () => {
    if (!isMonitoring) {
      clearInterval(monitorInterval);
      return;
    }

    clearScreen();
    const metrics = await fetchMetrics();
    displayMetrics(metrics);
  }, MONITOR_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Stopping metrics monitor...${colors.reset}`);
    isMonitoring = false;
    clearInterval(monitorInterval);
    process.exit(0);
  });

  // Display initial metrics
  clearScreen();
  displayMetrics(initialMetrics);
}

/**
 * Test metrics endpoint connectivity
 */
async function testConnection() {
  console.log(`${colors.blue}Testing connection to metrics endpoint...${colors.reset}`);
  
  try {
    const metrics = await fetchMetrics();
    if (metrics) {
      console.log(`${colors.green}✅ Connection successful${colors.reset}`);
      console.log(`Server status: ${metrics.status}`);
      console.log(`Uptime: ${formatDuration(metrics.uptime * 1000)}`);
      console.log(`Environment: ${metrics.environment}`);
      console.log(`Version: ${metrics.version}`);
    } else {
      console.log(`${colors.red}❌ Connection failed${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Connection error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`${colors.bright}BuildBoss Metrics Monitor${colors.reset}`);
  console.log('');
  console.log('Usage:');
  console.log(`  ${colors.cyan}node metrics-monitor.js${colors.reset}          - Start monitoring`);
  console.log(`  ${colors.cyan}node metrics-monitor.js test${colors.reset}     - Test connection`);
  console.log(`  ${colors.cyan}node metrics-monitor.js help${colors.reset}     - Show this help`);
  console.log('');
  console.log('Environment Variables:');
  console.log(`  ${colors.cyan}SERVER_URL${colors.reset}          - Server base URL (default: http://localhost:5000)`);
  console.log(`  ${colors.cyan}MONITOR_INTERVAL${colors.reset}    - Refresh interval in ms (default: 5000)`);
  console.log('');
  console.log('Examples:');
  console.log(`  ${colors.cyan}SERVER_URL=http://production.com:5000 node metrics-monitor.js${colors.reset}`);
  console.log(`  ${colors.cyan}MONITOR_INTERVAL=10000 node metrics-monitor.js${colors.reset}`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'test':
    testConnection();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    startMonitoring();
    break;
} 
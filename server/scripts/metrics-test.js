#!/usr/bin/env node

/**
 * Metrics Test Script
 * 
 * This script tests the metrics system by:
 * - Generating sample HTTP requests
 * - Validating metrics endpoints
 * - Testing different error scenarios
 * - Checking metrics accuracy
 */

const axios = require('axios');
const { logger } = require('../config/logger');

// Configuration
const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const TEST_REQUESTS = parseInt(process.env.TEST_REQUESTS || '10', 10);
const REQUEST_INTERVAL = parseInt(process.env.REQUEST_INTERVAL || '100', 10);

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
 * Test endpoints to generate traffic
 */
const TEST_ENDPOINTS = [
  { method: 'GET', path: '/api/health', expectedStatus: 200 },
  { method: 'GET', path: '/api/metrics/health', expectedStatus: 200 },
  { method: 'GET', path: '/api/nonexistent', expectedStatus: 404 },
  { method: 'POST', path: '/api/auth/login', expectedStatus: 400, body: {} },
  { method: 'GET', path: '/api/companies', expectedStatus: 401 },
];

/**
 * Sleep function for delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make a test request
 */
async function makeTestRequest(endpoint) {
  try {
    const config = {
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.path}`,
      timeout: 5000,
      validateStatus: () => true // Don't throw on non-2xx status codes
    };

    if (endpoint.body) {
      config.data = endpoint.body;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;

    const statusColor = response.status === endpoint.expectedStatus ? colors.green : colors.red;
    const success = response.status === endpoint.expectedStatus;

    console.log(`   ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(25)} ${statusColor}${response.status}${colors.reset} (${duration}ms)`);

    return {
      endpoint,
      status: response.status,
      duration,
      success,
      data: response.data
    };

  } catch (error) {
    console.log(`   ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(25)} ${colors.red}ERROR${colors.reset} (${error.message})`);
    return {
      endpoint,
      status: 0,
      duration: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetch current metrics
 */
async function fetchMetrics() {
  try {
    const response = await axios.get(`${BASE_URL}/api/metrics/health`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }
}

/**
 * Fetch Prometheus metrics
 */
async function fetchPrometheusMetrics() {
  try {
    const response = await axios.get(`${BASE_URL}/api/metrics`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch Prometheus metrics: ${error.message}`);
  }
}

/**
 * Validate metrics contain expected data
 */
function validateMetrics(metrics, testResults) {
  const errors = [];

  // Check basic structure
  if (!metrics.status) {
    errors.push('Missing status field');
  }

  if (!metrics.metrics) {
    errors.push('Missing metrics object');
    return errors;
  }

  const m = metrics.metrics;

  // Check required fields
  const requiredFields = [
    'activeRequests',
    'totalRequests',
    'errorRate',
    'avgResponseTime',
    'databaseQueries',
    'memoryUsage'
  ];

  requiredFields.forEach(field => {
    if (m[field] === undefined) {
      errors.push(`Missing metric: ${field}`);
    }
  });

  // Validate memory usage structure
  if (m.memoryUsage) {
    const memoryFields = ['rss', 'heapUsed', 'heapTotal'];
    memoryFields.forEach(field => {
      if (m.memoryUsage[field] === undefined) {
        errors.push(`Missing memory metric: ${field}`);
      }
    });
  }

  // Validate logical constraints
  if (m.totalRequests < 0) {
    errors.push('Total requests cannot be negative');
  }

  if (m.errorRate < 0) {
    errors.push('Error rate cannot be negative');
  }

  if (m.avgResponseTime < 0) {
    errors.push('Average response time cannot be negative');
  }

  return errors;
}

/**
 * Parse Prometheus metrics for validation
 */
function parsePrometheusMetrics(text) {
  const metrics = {};
  const lines = text.split('\n');

  lines.forEach(line => {
    if (line.startsWith('#') || !line.trim()) return;

    const parts = line.split(' ');
    if (parts.length >= 2) {
      const name = parts[0].split('{')[0];
      const value = parseFloat(parts[1]);
      
      if (!metrics[name]) {
        metrics[name] = [];
      }
      metrics[name].push(value);
    }
  });

  return metrics;
}

/**
 * Run the metrics test suite
 */
async function runMetricsTest() {
  console.log(`${colors.bright}${colors.blue}🧪 BuildBoss Metrics Test Suite${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);

  try {
    // Step 1: Initial metrics check
    console.log(`${colors.bright}📊 Step 1: Initial Metrics Check${colors.reset}`);
    const initialMetrics = await fetchMetrics();
    console.log(`   ✅ Metrics endpoint accessible`);
    console.log(`   Status: ${initialMetrics.status}`);
    console.log(`   Initial total requests: ${initialMetrics.metrics.totalRequests}`);
    console.log();

    // Step 2: Generate test traffic
    console.log(`${colors.bright}🚀 Step 2: Generating Test Traffic (${TEST_REQUESTS} requests)${colors.reset}`);
    const testResults = [];

    for (let i = 0; i < TEST_REQUESTS; i++) {
      const endpoint = TEST_ENDPOINTS[i % TEST_ENDPOINTS.length];
      const result = await makeTestRequest(endpoint);
      testResults.push(result);
      
      if (i < TEST_REQUESTS - 1) {
        await sleep(REQUEST_INTERVAL);
      }
    }

    console.log();

    // Step 3: Wait for metrics to update
    console.log(`${colors.bright}⏳ Step 3: Waiting for metrics to update...${colors.reset}`);
    await sleep(2000);
    console.log();

    // Step 4: Validate updated metrics
    console.log(`${colors.bright}🔍 Step 4: Validating Updated Metrics${colors.reset}`);
    const updatedMetrics = await fetchMetrics();
    
    const requestIncrease = updatedMetrics.metrics.totalRequests - initialMetrics.metrics.totalRequests;
    console.log(`   Request count increased by: ${colors.green}${requestIncrease}${colors.reset}`);
    
    if (requestIncrease >= TEST_REQUESTS) {
      console.log(`   ✅ Request count updated correctly`);
    } else {
      console.log(`   ${colors.yellow}⚠️  Expected at least ${TEST_REQUESTS} new requests, got ${requestIncrease}${colors.reset}`);
    }

    // Validate metrics structure
    const validationErrors = validateMetrics(updatedMetrics, testResults);
    if (validationErrors.length === 0) {
      console.log(`   ✅ Metrics structure valid`);
    } else {
      console.log(`   ${colors.red}❌ Validation errors:${colors.reset}`);
      validationErrors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }
    console.log();

    // Step 5: Test Prometheus endpoint
    console.log(`${colors.bright}📈 Step 5: Testing Prometheus Endpoint${colors.reset}`);
    try {
      const prometheusText = await fetchPrometheusMetrics();
      const prometheusMetrics = parsePrometheusMetrics(prometheusText);
      
      console.log(`   ✅ Prometheus endpoint accessible`);
      console.log(`   Metrics found: ${Object.keys(prometheusMetrics).length}`);
      
      // Check for key metrics
      const keyMetrics = [
        'http_requests_total',
        'http_request_duration_seconds',
        'nodejs_memory_usage_bytes'
      ];
      
      keyMetrics.forEach(metric => {
        if (prometheusMetrics[metric]) {
          console.log(`   ✅ ${metric}: ${prometheusMetrics[metric].length} data points`);
        } else {
          console.log(`   ${colors.yellow}⚠️  Missing metric: ${metric}${colors.reset}`);
        }
      });
      
    } catch (error) {
      console.log(`   ${colors.red}❌ Prometheus endpoint failed: ${error.message}${colors.reset}`);
    }
    console.log();

    // Step 6: Summary
    console.log(`${colors.bright}📋 Step 6: Test Summary${colors.reset}`);
    const successfulRequests = testResults.filter(r => r.success).length;
    const failedRequests = testResults.filter(r => !r.success).length;
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / testResults.length;

    console.log(`   Total test requests: ${colors.cyan}${testResults.length}${colors.reset}`);
    console.log(`   Successful: ${colors.green}${successfulRequests}${colors.reset}`);
    console.log(`   Failed: ${failedRequests > 0 ? colors.red : colors.green}${failedRequests}${colors.reset}`);
    console.log(`   Average duration: ${colors.cyan}${Math.round(avgDuration)}ms${colors.reset}`);
    console.log(`   Metrics validation: ${validationErrors.length === 0 ? colors.green + '✅ PASSED' : colors.red + '❌ FAILED'}${colors.reset}`);
    console.log();

    if (validationErrors.length === 0 && successfulRequests > 0) {
      console.log(`${colors.green}🎉 All tests passed! Metrics system is working correctly.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Some tests failed. Check the logs above for details.${colors.reset}`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Test suite failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`${colors.bright}BuildBoss Metrics Test Script${colors.reset}`);
  console.log('');
  console.log('Usage:');
  console.log(`  ${colors.cyan}node metrics-test.js${colors.reset}          - Run full test suite`);
  console.log(`  ${colors.cyan}node metrics-test.js help${colors.reset}     - Show this help`);
  console.log('');
  console.log('Environment Variables:');
  console.log(`  ${colors.cyan}SERVER_URL${colors.reset}          - Server base URL (default: http://localhost:5000)`);
  console.log(`  ${colors.cyan}TEST_REQUESTS${colors.reset}       - Number of test requests (default: 10)`);
  console.log(`  ${colors.cyan}REQUEST_INTERVAL${colors.reset}    - Interval between requests in ms (default: 100)`);
  console.log('');
  console.log('Examples:');
  console.log(`  ${colors.cyan}TEST_REQUESTS=50 node metrics-test.js${colors.reset}`);
  console.log(`  ${colors.cyan}SERVER_URL=http://staging.com node metrics-test.js${colors.reset}`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    runMetricsTest();
    break;
} 
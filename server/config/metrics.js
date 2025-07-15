/**
 * Application Metrics Configuration
 *
 * This module sets up Prometheus metrics for monitoring:
 * - HTTP request metrics (duration, count, errors)
 * - Database operation metrics
 * - Business logic metrics (users, projects, tasks)
 * - System metrics (memory, CPU, event loop)
 * - Custom application metrics
 */

const promClient = require('prom-client');
const { logger } = require('./logger');

// Create a new registry for our metrics
const register = new promClient.Registry();

// Set default labels
register.setDefaultLabels({
  app: 'buildboss-api',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development'
});

// Collect default Node.js metrics only if not already collected
if (!promClient.register.getSingleMetric('nodejs_version_info')) {
  promClient.collectDefaultMetrics({ register });
}

// ======================
// HTTP REQUEST METRICS
// ======================

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10, 30],
  registers: [register]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestsActive = new promClient.Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests',
  registers: [register]
});

// ======================
// DATABASE METRICS
// ======================

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
  registers: [register]
});

const databaseQueriesTotal = new promClient.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: [register]
});

const databaseConnectionsActive = new promClient.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register]
});

const databaseConnectionPoolSize = new promClient.Gauge({
  name: 'database_connection_pool_size',
  help: 'Size of database connection pool',
  registers: [register]
});

// ======================
// BUSINESS METRICS
// ======================

const usersTotal = new promClient.Gauge({
  name: 'users_total',
  help: 'Total number of registered users',
  labelNames: ['status', 'role'],
  registers: [register]
});

const companiesTotal = new promClient.Gauge({
  name: 'companies_total',
  help: 'Total number of companies',
  labelNames: ['status', 'subscription_type'],
  registers: [register]
});

const projectsTotal = new promClient.Gauge({
  name: 'projects_total',
  help: 'Total number of projects',
  labelNames: ['status', 'priority'],
  registers: [register]
});

const tasksTotal = new promClient.Gauge({
  name: 'tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status', 'priority'],
  registers: [register]
});

const materialsTotal = new promClient.Gauge({
  name: 'materials_total',
  help: 'Total number of materials',
  labelNames: ['status', 'category'],
  registers: [register]
});

const jobsTotal = new promClient.Gauge({
  name: 'jobs_total',
  help: 'Total number of job listings',
  labelNames: ['status', 'type'],
  registers: [register]
});

// ======================
// AUTH & SECURITY METRICS
// ======================

const authAttemptsTotal = new promClient.Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status', 'method'],
  registers: [register]
});

const rateLimitHitsTotal = new promClient.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'ip_type'],
  registers: [register]
});

const securityEventsTotal = new promClient.Counter({
  name: 'security_events_total',
  help: 'Total number of security events',
  labelNames: ['type', 'severity', 'source'],
  registers: [register]
});

// ======================
// APPLICATION METRICS
// ======================

const apiResponseTime = new promClient.Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time in seconds',
  labelNames: ['endpoint', 'method'],
  buckets: [0.1, 0.2, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const errorRate = new promClient.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity', 'module'],
  registers: [register]
});

const notificationsTotal = new promClient.Counter({
  name: 'notifications_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'channel', 'status'],
  registers: [register]
});

const uploadsTotal = new promClient.Counter({
  name: 'file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['type', 'status', 'size_category'],
  registers: [register]
});

// ======================
// PERFORMANCE METRICS
// ======================

const memoryUsage = new promClient.Gauge({
  name: 'buildboss_memory_usage_bytes',
  help: 'BuildBoss specific memory usage in bytes',
  labelNames: ['type'],
  registers: [register]
});

const _eventLoopLag = new promClient.Gauge({
  name: 'buildboss_eventloop_lag_seconds',
  help: 'BuildBoss event loop lag in seconds',
  registers: [register]
});

const activeHandles = new promClient.Gauge({
  name: 'buildboss_active_handles_total',
  help: 'Number of active handles in BuildBoss',
  registers: [register]
});

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Record HTTP request metrics
 */
function recordHttpRequest(method, route, statusCode, duration) {
  try {
    const labels = { method, route, status_code: statusCode };
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);

    logger.debug('HTTP metrics recorded', { method, route, statusCode, duration });
  } catch (error) {
    logger.error('Failed to record HTTP metrics', { error: error.message });
  }
}

/**
 * Record database query metrics
 */
function recordDatabaseQuery(operation, table, status, duration) {
  try {
    const labels = { operation, table, status };
    databaseQueryDuration.observe(labels, duration);
    databaseQueriesTotal.inc(labels);

    logger.debug('Database metrics recorded', { operation, table, status, duration });
  } catch (error) {
    logger.error('Failed to record database metrics', { error: error.message });
  }
}

/**
 * Record authentication attempt
 */
function recordAuthAttempt(type, status, method = 'password') {
  try {
    authAttemptsTotal.inc({ type, status, method });
    logger.debug('Auth metrics recorded', { type, status, method });
  } catch (error) {
    logger.error('Failed to record auth metrics', { error: error.message });
  }
}

/**
 * Record rate limit hit
 */
function recordRateLimitHit(endpoint, ipType = 'unknown') {
  try {
    rateLimitHitsTotal.inc({ endpoint, ip_type: ipType });
    logger.debug('Rate limit metrics recorded', { endpoint, ipType });
  } catch (error) {
    logger.error('Failed to record rate limit metrics', { error: error.message });
  }
}

/**
 * Record security event
 */
function recordSecurityEvent(type, severity, source) {
  try {
    securityEventsTotal.inc({ type, severity, source });
    logger.warn('Security event recorded', { type, severity, source });
  } catch (error) {
    logger.error('Failed to record security metrics', { error: error.message });
  }
}

/**
 * Record application error
 */
function recordError(type, severity, module) {
  try {
    errorRate.inc({ type, severity, module });
    logger.debug('Error metrics recorded', { type, severity, module });
  } catch (error) {
    logger.error('Failed to record error metrics', { error: error.message });
  }
}

/**
 * Update business metrics (called periodically)
 */
async function updateBusinessMetrics(prisma) {
  try {
    // Users metrics - use existing fields
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    userCounts.forEach(({ role, _count }) => {
      usersTotal.set({ status: 'active', role }, _count.id);
    });

    // Companies metrics - just count total for now since status field doesn't exist in schema
    const totalCompanies = await prisma.company.count();
    companiesTotal.set({ status: 'active', subscription_type: 'basic' }, totalCompanies);

    // Projects metrics
    const projectCounts = await prisma.project.groupBy({
      by: ['status', 'priority'],
      _count: { id: true }
    });

    projectCounts.forEach(({ status, priority, _count }) => {
      projectsTotal.set({ status, priority }, _count.id);
    });

    // Tasks metrics
    const taskCounts = await prisma.task.groupBy({
      by: ['status', 'priority'],
      _count: { id: true }
    });

    taskCounts.forEach(({ status, priority, _count }) => {
      tasksTotal.set({ status, priority }, _count.id);
    });

    logger.debug('Business metrics updated successfully');
  } catch (error) {
    logger.error('Failed to update business metrics', { error: error.message });
  }
}

/**
 * Update system metrics
 */
function updateSystemMetrics() {
  try {
    const usage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, usage.rss);
    memoryUsage.set({ type: 'heapTotal' }, usage.heapTotal);
    memoryUsage.set({ type: 'heapUsed' }, usage.heapUsed);
    memoryUsage.set({ type: 'external' }, usage.external);

    activeHandles.set(process._getActiveHandles().length);

    logger.debug('System metrics updated');
  } catch (error) {
    logger.error('Failed to update system metrics', { error: error.message });
  }
}

/**
 * Start metrics collection interval
 */
function startMetricsCollection(prisma) {
  // Update business metrics every 5 minutes
  setInterval(() => {
    updateBusinessMetrics(prisma);
  }, 5 * 60 * 1000);

  // Update system metrics every 30 seconds
  setInterval(() => {
    updateSystemMetrics();
  }, 30 * 1000);

  // Initial update
  updateBusinessMetrics(prisma);
  updateSystemMetrics();

  logger.info('Metrics collection started');
}

module.exports = {
  register,

  // Metric recording functions
  recordHttpRequest,
  recordDatabaseQuery,
  recordAuthAttempt,
  recordRateLimitHit,
  recordSecurityEvent,
  recordError,

  // Gauge functions
  httpRequestsActive,
  databaseConnectionsActive,
  databaseConnectionPoolSize,

  // Metric update functions
  updateBusinessMetrics,
  updateSystemMetrics,
  startMetricsCollection,

  // Individual metrics (for custom use)
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    databaseQueryDuration,
    databaseQueriesTotal,
    usersTotal,
    companiesTotal,
    projectsTotal,
    tasksTotal,
    materialsTotal,
    jobsTotal,
    authAttemptsTotal,
    rateLimitHitsTotal,
    securityEventsTotal,
    apiResponseTime,
    errorRate,
    notificationsTotal,
    uploadsTotal
  }
};

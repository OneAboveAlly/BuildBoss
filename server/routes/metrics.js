/**
 * Metrics Routes
 * 
 * Endpoints for exposing application metrics:
 * - /metrics - Prometheus format metrics
 * - /metrics/summary - Human-readable summary
 * - /metrics/health - Health check with metrics
 */

const express = require('express');
const { register, updateSystemMetrics } = require('../config/metrics');
const logger = require('../config/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Prometheus metrics endpoint
 * GET /api/metrics
 * 
 * Returns metrics in Prometheus format for scraping
 */
router.get('/', async (req, res) => {
  try {
    // Update system metrics before serving
    updateSystemMetrics();
    
    // Set appropriate headers for Prometheus
    res.set('Content-Type', register.contentType);
    
    // Get metrics in Prometheus format
    const metrics = await register.metrics();
    
    res.send(metrics);
    
    logger.debug('Metrics served', {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      metricsLength: metrics.length
    });
    
  } catch (error) {
    logger.error('Failed to serve metrics', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Failed to generate metrics',
      message: 'Internal server error'
    });
  }
});

/**
 * Human-readable metrics summary
 * GET /api/metrics/summary
 * 
 * Requires authentication
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    // Update system metrics
    updateSystemMetrics();
    
    // Get all metrics
    const metricsData = await register.getMetricsAsJSON();
    
    // Group metrics by category
    const summary = {
      timestamp: new Date().toISOString(),
      server: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version
      },
      http: {},
      database: {},
      business: {},
      system: {},
      security: {}
    };
    
    // Process metrics
    metricsData.forEach(metric => {
      const { name, help, type, values } = metric;
      
      // HTTP metrics
      if (name.startsWith('http_')) {
        summary.http[name] = {
          help,
          type,
          values: values.slice(0, 10) // Limit to first 10 values
        };
      }
      // Database metrics
      else if (name.startsWith('database_')) {
        summary.database[name] = {
          help,
          type,
          values: values.slice(0, 10)
        };
      }
      // Business metrics
      else if (['users_total', 'companies_total', 'projects_total', 'tasks_total', 'materials_total', 'jobs_total'].includes(name)) {
        summary.business[name] = {
          help,
          type,
          values: values.slice(0, 10)
        };
      }
      // System metrics
      else if (name.startsWith('nodejs_') || name.startsWith('process_')) {
        summary.system[name] = {
          help,
          type,
          values: values.slice(0, 5)
        };
      }
      // Security metrics
      else if (name.includes('auth_') || name.includes('rate_limit') || name.includes('security_')) {
        summary.security[name] = {
          help,
          type,
          values: values.slice(0, 10)
        };
      }
    });
    
    res.json(summary);
    
    logger.info('Metrics summary served', {
      userId: req.user.id,
      ip: req.ip,
      metricsCount: metricsData.length
    });
    
  } catch (error) {
    logger.error('Failed to serve metrics summary', {
      error: error.message,
      userId: req.user?.id
    });
    
    res.status(500).json({
      error: 'Failed to generate metrics summary',
      message: 'Internal server error'
    });
  }
});

/**
 * Health check with key metrics
 * GET /api/metrics/health
 * 
 * Public endpoint with basic health information
 */
router.get('/health', async (req, res) => {
  try {
    // Update system metrics
    updateSystemMetrics();
    
    // Get key metrics
    const metricsData = await register.getMetricsAsJSON();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      metrics: {
        activeRequests: 0,
        totalRequests: 0,
        errorRate: 0,
        avgResponseTime: 0,
        databaseQueries: 0,
        memoryUsage: {
          rss: 0,
          heapUsed: 0,
          heapTotal: 0
        }
      }
    };
    
    // Extract key metrics
    metricsData.forEach(metric => {
      const { name, values } = metric;
      
      switch (name) {
        case 'http_requests_active':
          if (values.length > 0) {
            health.metrics.activeRequests = values[0].value;
          }
          break;
          
        case 'http_requests_total':
          health.metrics.totalRequests = values.reduce((sum, v) => sum + v.value, 0);
          break;
          
        case 'application_errors_total':
          health.metrics.errorRate = values.reduce((sum, v) => sum + v.value, 0);
          break;
          
        case 'http_request_duration_seconds':
          if (values.length > 0) {
            const durations = values.map(v => v.value);
            health.metrics.avgResponseTime = durations.reduce((sum, v) => sum + v, 0) / durations.length;
          }
          break;
          
        case 'database_queries_total':
          health.metrics.databaseQueries = values.reduce((sum, v) => sum + v.value, 0);
          break;
          
        case 'nodejs_memory_usage_bytes':
          values.forEach(v => {
            if (v.labels && v.labels.type) {
              health.metrics.memoryUsage[v.labels.type] = v.value;
            }
          });
          break;
      }
    });
    
    // Determine health status
    if (health.metrics.activeRequests > 100 || 
        health.metrics.errorRate > 10 || 
        health.metrics.memoryUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
      health.status = 'degraded';
    }
    
    res.json(health);
    
    logger.debug('Health metrics served', {
      status: health.status,
      activeRequests: health.metrics.activeRequests,
      errorRate: health.metrics.errorRate
    });
    
  } catch (error) {
    logger.error('Failed to serve health metrics', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'unhealthy',
      error: 'Failed to generate health metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Reset metrics (admin only)
 * POST /api/metrics/reset
 * 
 * Requires admin authentication
 */
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }
    
    // Clear the registry
    register.clear();
    
    // Re-register default metrics
    const promClient = require('prom-client');
    promClient.collectDefaultMetrics({ register });
    
    logger.warn('Metrics registry reset', {
      userId: req.user.id,
      userEmail: req.user.email,
      ip: req.ip
    });
    
    res.json({
      message: 'Metrics registry reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to reset metrics', {
      error: error.message,
      userId: req.user?.id
    });
    
    res.status(500).json({
      error: 'Failed to reset metrics',
      message: 'Internal server error'
    });
  }
});

/**
 * Custom metric recording endpoint (admin only)
 * POST /api/metrics/custom
 * 
 * Body: { name, type, value, labels }
 */
router.post('/custom', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }
    
    const { name, type, value, labels = {} } = req.body;
    
    if (!name || !type || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'type', 'value']
      });
    }
    
    // Get metrics object
    const { metrics } = require('../config/metrics');
    
    // Record custom metric based on type
    if (type === 'counter' && metrics[name] && typeof metrics[name].inc === 'function') {
      metrics[name].inc(labels, value);
    } else if (type === 'gauge' && metrics[name] && typeof metrics[name].set === 'function') {
      metrics[name].set(labels, value);
    } else if (type === 'histogram' && metrics[name] && typeof metrics[name].observe === 'function') {
      metrics[name].observe(labels, value);
    } else {
      return res.status(400).json({
        error: 'Invalid metric type or metric not found',
        message: `Metric '${name}' of type '${type}' is not available`
      });
    }
    
    logger.info('Custom metric recorded', {
      name,
      type,
      value,
      labels,
      userId: req.user.id
    });
    
    res.json({
      message: 'Custom metric recorded successfully',
      metric: { name, type, value, labels },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to record custom metric', {
      error: error.message,
      userId: req.user?.id,
      body: req.body
    });
    
    res.status(500).json({
      error: 'Failed to record custom metric',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 
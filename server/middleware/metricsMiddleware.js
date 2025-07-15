/**
 * Metrics Middleware
 *
 * Express middleware for automatic collection of HTTP request metrics:
 * - Request duration
 * - Request count by method/route/status
 * - Active requests gauge
 * - Error tracking
 */

const {
  recordHttpRequest,
  httpRequestsActive,
  recordError
} = require('../config/metrics');
const { logger } = require('../config/logger');

/**
 * Extract route pattern from request
 */
function getRoutePattern(req) {
  // Try to get the route pattern from Express route
  if (req.route && req.route.path) {
    return req.route.path;
  }

  // Try to get from matched route
  if (req.baseUrl && req.route) {
    return req.baseUrl + req.route.path;
  }

  // Fallback to pathname with parameter normalization
  let path = req.pathname || req.path || req.url;

  // Normalize common patterns
  path = path
    .replace(/\/\d+/g, '/:id')           // Replace numeric IDs
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
    .replace(/\/[a-f0-9]{24}/g, '/:objectId') // Replace MongoDB ObjectIds
    .replace(/\?.*$/, '');               // Remove query parameters

  return path;
}

/**
 * Determine if IP is internal/external
 */
function getIpType(ip) {
  if (!ip) return 'unknown';

  // Local/internal IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') ||
      ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'internal';
  }

  return 'external';
}

/**
 * HTTP Metrics Middleware
 */
function metricsMiddleware(req, res, next) {
  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Increment active requests
  httpRequestsActive.inc();

  // Store start time for duration calculation
  req.metricsStartTime = startTime;

  // Enhanced request info
  const requestInfo = {
    method: req.method,
    route: getRoutePattern(req),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    companyId: req.user?.companyId
  };

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Decrement active requests
    httpRequestsActive.dec();

    // Calculate duration
    const hrTimeDiff = process.hrtime(startHrTime);
    const duration = hrTimeDiff[0] + hrTimeDiff[1] / 1e9; // Convert to seconds

    // Record metrics
    try {
      recordHttpRequest(
        requestInfo.method,
        requestInfo.route,
        res.statusCode,
        duration
      );

      // Log request details
      const logData = {
        method: requestInfo.method,
        route: requestInfo.route,
        statusCode: res.statusCode,
        duration: Math.round(duration * 1000), // ms for logging
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        userId: requestInfo.userId,
        companyId: requestInfo.companyId
      };

      if (res.statusCode >= 400) {
        if (res.statusCode >= 500) {
          logger.error('HTTP request failed', logData);
          recordError('http_error', 'error', 'http_middleware');
        } else {
          logger.warn('HTTP client error', logData);
          recordError('http_client_error', 'warning', 'http_middleware');
        }
      } else {
        logger.debug('HTTP request completed', logData);
      }

    } catch (error) {
      logger.error('Failed to record HTTP metrics', {
        error: error.message,
        request: requestInfo
      });
    }

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Error handling middleware with metrics
 */
function errorMetricsMiddleware(err, req, res, next) {
  // Record error metrics
  try {
    const errorInfo = {
      type: err.name || 'UnknownError',
      severity: 'error',
      module: 'error_handler',
      route: getRoutePattern(req),
      method: req.method,
      statusCode: err.statusCode || 500,
      userId: req.user?.id,
      companyId: req.user?.companyId
    };

    recordError(errorInfo.type, errorInfo.severity, errorInfo.module);

    logger.error('Application error captured', {
      error: err.message,
      stack: err.stack,
      ...errorInfo
    });

  } catch (metricsError) {
    logger.error('Failed to record error metrics', {
      originalError: err.message,
      metricsError: metricsError.message
    });
  }

  next(err);
}

/**
 * Database query metrics wrapper
 */
function wrapDatabaseQuery(operation, table) {
  return async function(queryFunction) {
    const startTime = process.hrtime();
    let status = 'success';

    try {
      const result = await queryFunction();
      return result;
    } catch (error) {
      status = 'error';
      throw error;
    } finally {
      try {
        const hrTimeDiff = process.hrtime(startTime);
        const duration = hrTimeDiff[0] + hrTimeDiff[1] / 1e9;

        const { recordDatabaseQuery } = require('../config/metrics');
        recordDatabaseQuery(operation, table, status, duration);

      } catch (metricsError) {
        logger.error('Failed to record database metrics', {
          error: metricsError.message,
          operation,
          table
        });
      }
    }
  };
}

/**
 * Prisma middleware for automatic query metrics
 */
function createPrismaMiddleware() {
  return async (params, next) => {
    const startTime = process.hrtime();
    let status = 'success';

    try {
      const result = await next(params);
      return result;
    } catch (error) {
      status = 'error';
      throw error;
    } finally {
      try {
        const hrTimeDiff = process.hrtime(startTime);
        const duration = hrTimeDiff[0] + hrTimeDiff[1] / 1e9;

        const { recordDatabaseQuery } = require('../config/metrics');
        recordDatabaseQuery(
          params.action,
          params.model || 'unknown',
          status,
          duration
        );

      } catch (metricsError) {
        logger.error('Failed to record Prisma metrics', {
          error: metricsError.message,
          action: params.action,
          model: params.model
        });
      }
    }
  };
}

/**
 * Rate limit metrics middleware
 */
function rateLimitMetricsMiddleware(req, res, next) {
  // Override rate limit handler to capture metrics
  const originalRateLimit = res.rateLimit;

  if (originalRateLimit && originalRateLimit.remaining === 0) {
    try {
      const { recordRateLimitHit } = require('../config/metrics');
      const route = getRoutePattern(req);
      const ipType = getIpType(req.ip);

      recordRateLimitHit(route, ipType);

      logger.warn('Rate limit hit', {
        route,
        ip: req.ip,
        ipType,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });

    } catch (error) {
      logger.error('Failed to record rate limit metrics', {
        error: error.message
      });
    }
  }

  next();
}

module.exports = {
  metricsMiddleware,
  errorMetricsMiddleware,
  wrapDatabaseQuery,
  createPrismaMiddleware,
  rateLimitMetricsMiddleware,
  getRoutePattern,
  getIpType
};

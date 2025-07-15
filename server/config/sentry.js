const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry error tracking and performance monitoring
 */
function initSentry() {
  // Only initialize Sentry if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not provided, error tracking disabled');
    return;
  }

  // Import logger after Sentry init to avoid circular dependencies
  const { logger } = require('./logger');

  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || 'unknown',
    serverName: process.env.SERVER_NAME || 'buildboss-api',

    // Integrations
    integrations: [
      // Default integrations
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.prismaIntegration(),

      // Performance profiling (only in production)
      ...(process.env.NODE_ENV === 'production' ? [nodeProfilingIntegration()] : [])
    ],

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Configure which errors to send
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Don't send certain types of errors in development
      if (process.env.NODE_ENV === 'development') {
        // Skip validation errors in development
        if (error?.name === 'ValidationError') {
          return null;
        }

        // Skip rate limit errors in development
        if (error?.status === 429) {
          return null;
        }
      }

      // Log error details for debugging
      if (logger) {
        logger.error('Sending error to Sentry', {
          errorName: error?.name,
          errorMessage: error?.message,
          fingerprint: event.fingerprint,
          level: event.level
        });
      }

      return event;
    },

    // Enhanced error context
    initialScope: {
      tags: {
        component: 'api',
        version: process.env.npm_package_version || 'unknown'
      },
      extra: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    },

    // Custom options
    attachStacktrace: true,
    sendDefaultPii: false, // Don't send personally identifiable information

    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',

    // Set maximum breadcrumbs
    maxBreadcrumbs: 50
  });

  if (logger) {
    logger.info('Sentry initialized', {
      environment: process.env.NODE_ENV,
      dsn: process.env.SENTRY_DSN ? 'configured' : 'missing'
    });
  } else {
    console.log('Sentry initialized successfully');
  }
}

/**
 * Express middleware for Sentry request handling
 */
function sentryRequestHandler() {
  if (!process.env.SENTRY_DSN) {
    // Return no-op middleware when Sentry is not configured
    return (req, res, next) => next();
  }
  
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'role'],
    ip: false, // Don't track IP addresses for privacy
    request: ['method', 'url', 'headers.user-agent']
  });
}

/**
 * Express error handler for Sentry
 */
function sentryErrorHandler() {
  if (!process.env.SENTRY_DSN) {
    // Return no-op middleware when Sentry is not configured
    return (err, req, res, next) => next(err);
  }
  
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Handle all 4xx and 5xx errors
      return error.status >= 400;
    }
  });
}

/**
 * Capture custom error with additional context
 */
function captureError(error, context = {}) {
  Sentry.withScope((scope) => {
    // Add custom context
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        role: context.user.role
      });
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context.level) {
      scope.setLevel(context.level);
    }

    if (context.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture custom message with context
 */
function captureMessage(message, level = 'info', context = {}) {
  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        role: context.user.role
      });
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Add breadcrumb for tracking user actions
 */
function addBreadcrumb(message, category = 'action', level = 'info', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * Wrap async function with error handling
 */
function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Add request context to error
      captureError(error, {
        user: req.user,
        tags: {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent')
        },
        extra: {
          body: req.body,
          params: req.params,
          query: req.query
        }
      });
      next(error);
    });
  };
}

/**
 * Close Sentry and flush remaining events
 */
async function closeSentry() {
  try {
    await Sentry.close(2000); // Wait max 2 seconds
    console.log('Sentry closed gracefully');
  } catch (error) {
    console.error('Error closing Sentry', error);
  }
}

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryErrorHandler,
  captureError,
  captureMessage,
  addBreadcrumb,
  wrapAsync,
  closeSentry,
  Sentry // Export Sentry instance for advanced usage
};

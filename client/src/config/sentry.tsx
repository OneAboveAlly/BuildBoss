import * as Sentry from '@sentry/react';
import { createBrowserRouter } from 'react-router-dom';

/**
 * Initialize Sentry for React frontend
 */
export function initSentry() {
  // Only initialize Sentry if DSN is provided
  if (!import.meta.env.VITE_SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN === '') {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    
    // Environment configuration
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || 'unknown',
    
    // Integrations
    integrations: [
      // Browser tracing integration for React
      Sentry.browserTracingIntegration(),
      
      // Replay integration for debugging
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true, // Mask sensitive inputs
      }),
      
      // Feedback integration
      Sentry.feedbackIntegration({
        colorScheme: 'light',
        showBranding: false,
        autoInject: false, // We'll manually control when to show feedback
      }),
    ],
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    
    // Enhanced error context
    initialScope: {
      tags: {
        component: 'frontend',
        framework: 'react',
        bundler: 'vite'
      },
      extra: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    },
    
    // Configure which errors to send
    beforeSend(event, hint) {
      const error = hint.originalException as Error | undefined;
      
      // Don't send certain types of errors in development
      if (import.meta.env.MODE === 'development') {
        // Skip chunk loading errors in development
        if (error?.name === 'ChunkLoadError') {
          return null;
        }
        
        // Skip React DevTools errors
        if (error?.stack?.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
          return null;
        }
      }
      
      // Filter out network errors that are user-related
      if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
        // Only send if it's not a user connectivity issue
        if (!navigator.onLine) {
          return null;
        }
      }
      
      // Don't send errors from browser extensions
      if (error?.stack?.includes('extension://') || error?.stack?.includes('moz-extension://')) {
        return null;
      }
      
      return event;
    },
    
    // Custom options
    attachStacktrace: true,
    sendDefaultPii: false, // Don't send personally identifiable information
    
    // Debug mode for development
    debug: import.meta.env.MODE === 'development',
    
    // Set maximum breadcrumbs
    maxBreadcrumbs: 100,
    
    // Session tracking is enabled by default
  });

  console.info('Sentry initialized for frontend', {
    environment: import.meta.env.MODE,
    dsn: import.meta.env.VITE_SENTRY_DSN ? 'configured' : 'missing'
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: { id: string; email: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture custom error with context
 */
export function captureError(error: Error, context: Record<string, any> = {}) {
  Sentry.withScope((scope) => {
    // Add custom context
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, String(value));
      });
    }
    
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    if (context.level) {
      scope.setLevel(context.level as Sentry.SeverityLevel);
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
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context: Record<string, any> = {}) {
  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, String(value));
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
export function addBreadcrumb(message: string, category = 'action', level: Sentry.SeverityLevel = 'info', data: Record<string, any> = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * Create Sentry-wrapped error boundary
 */
export function createSentryErrorBoundary(Component: React.ComponentType<any>) {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-secondary-900 mb-2">Coś poszło nie tak</h2>
            <p className="text-secondary-600 mb-4">
              Wystąpił nieoczekiwany błąd. Zostaliśmy o tym powiadomieni i pracujemy nad rozwiązaniem.
            </p>
            <button
              onClick={resetError}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    ),
    showDialog: import.meta.env.MODE === 'development',
  });
}

/**
 * Performance monitoring for API calls
 */
export function wrapApiCall<T extends (...args: any[]) => Promise<any>>(fn: T, operationName: string): T {
  return ((...args: Parameters<T>) => {
    addBreadcrumb(`API call: ${operationName}`, 'http', 'info', {
      operation: operationName,
      args: args.slice(0, 2) // Don't log all args for privacy
    });
    
    return fn(...args)
      .then(result => {
        addBreadcrumb(`API success: ${operationName}`, 'http', 'info');
        return result;
      })
      .catch(error => {
        captureError(error, {
          tags: { operationName },
          extra: { args: args.slice(0, 2) }
        });
        throw error;
      });
  }) as T;
}

/**
 * Track navigation for performance monitoring
 */
export function trackNavigation(name: string, op = 'navigation') {
  addBreadcrumb(`Navigation: ${name}`, 'navigation', 'info', { operation: op });
}

// Re-export Sentry for advanced usage
export { Sentry }; 
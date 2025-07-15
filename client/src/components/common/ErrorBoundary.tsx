import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import * as Sentry from '@sentry/react';

declare global {
  interface Window {
    Sentry?: typeof Sentry;
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Ignoruj błędy związane z systemem aktualizacji i PWA
    if (
      error.message.includes('Service Worker') ||
      error.message.includes('update') ||
      error.message.includes('cache') ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('abort')
    ) {
      console.warn('Ignoring update/PWA related error:', error.message);
      return;
    }
    
    // Log to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-100 mb-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
              </div>
              
              <h1 className="text-xl font-semibold text-secondary-900 mb-2">
                Coś poszło nie tak
              </h1>
              
              <p className="text-secondary-600 mb-6">
                Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub skontaktuj się z pomocą techniczną.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-secondary-100 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs font-mono text-secondary-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  className="flex-1"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Spróbuj ponownie
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Odśwież stronę
                </Button>
              </div>
              
              <p className="text-xs text-secondary-500 mt-4">
                Jeśli problem się powtarza, skontaktuj się z nami.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 
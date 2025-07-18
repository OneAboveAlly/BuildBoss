import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation('auth');
    const { t: tCommon } = useTranslation('common');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // Handle URL parameters and messages
    useEffect(() => {
      const error = searchParams.get('error');
      const message = searchParams.get('message');
      
      if (error === 'google_auth_failed') {
        setError(t('errors.google_auth_failed'));
      } else if (error === 'auth_callback_failed') {
        setError(t('errors.auth_callback_failed'));
      } else if (message === 'registration_success') {
        setSuccess(t('messages.registration_success'));
      } else if (message === 'email_confirmed') {
        setSuccess(t('messages.email_confirmed'));
      }
    }, [searchParams, t]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      // Nowa obsługa bez try/catch
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        // Provide user-friendly error messages
        let friendlyMessage = result.message || t('errors.login_failed');
        if (friendlyMessage.includes('Nieprawidłowy email lub hasło') || 
            friendlyMessage.includes('invalid') || 
            friendlyMessage.includes('unauthorized') ||
            friendlyMessage.includes('401')) {
          friendlyMessage = 'Nieprawidłowy email lub hasło. Sprawdź dane i spróbuj ponownie.';
        } else if (friendlyMessage.includes('429') || friendlyMessage.includes('Too Many Requests')) {
          friendlyMessage = 'Zbyt wiele prób logowania. Poczekaj kilka minut i spróbuj ponownie.';
        } else if (friendlyMessage.includes('network') || friendlyMessage.includes('połączenia')) {
          friendlyMessage = 'Brak połączenia z serwerem. Sprawdź połączenie internetowe.';
        } else if (friendlyMessage.includes('500') || friendlyMessage.includes('server')) {
          friendlyMessage = 'Błąd serwera. Spróbuj ponownie za chwilę.';
        } else if (!friendlyMessage.includes('Nieprawidłowy') && !friendlyMessage.includes('Zbyt wiele')) {
          // If it's a generic error, show the specific message from server
          friendlyMessage = friendlyMessage;
        }
        setError(friendlyMessage);
      }
      setLoading(false);
    };

    return (
      <div className="min-h-screen flex">
        {/* Left side - Login Form */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2 mb-8">
                <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
                <span className="text-2xl font-bold text-secondary-900">
                  Site<span className="text-primary-600">Boss</span>
                </span>
              </Link>
              
              <h2 className="text-3xl font-bold text-secondary-900 mb-2">
                {t('login.welcome_back')}
              </h2>
              <p className="text-secondary-600">
                {t('login.please_sign_in')}
              </p>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className={`border-l-4 p-4 rounded-lg ${
                error.includes('Nieprawidłowy email lub hasło') ? 'bg-red-50 border-red-400' :
                error.includes('429') || error.includes('Too Many Requests') ? 'bg-orange-50 border-orange-400' :
                error.includes('network') || error.includes('połączenia') ? 'bg-blue-50 border-blue-400' :
                error.includes('server') || error.includes('500') ? 'bg-yellow-50 border-yellow-400' :
                'bg-red-50 border-red-400'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className={`h-5 w-5 ${
                      error.includes('Nieprawidłowy email lub hasło') ? 'text-red-400' :
                      error.includes('429') || error.includes('Too Many Requests') ? 'text-orange-400' :
                      error.includes('network') || error.includes('połączenia') ? 'text-blue-400' :
                      error.includes('server') || error.includes('500') ? 'text-yellow-400' :
                      'text-red-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${
                      error.includes('Nieprawidłowy email lub hasło') ? 'text-red-700' :
                      error.includes('429') || error.includes('Too Many Requests') ? 'text-orange-700' :
                      error.includes('network') || error.includes('połączenia') ? 'text-blue-700' :
                      error.includes('server') || error.includes('500') ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {error}
                    </p>
                    {error.includes('Nieprawidłowy email lub hasło') && (
                      <p className="mt-2 text-sm text-red-600">
                        💡 <Link to="/register" className="underline font-medium">Załóż nowe konto</Link> lub sprawdź poprawność danych.
                      </p>
                    )}
                    {(error.includes('429') || error.includes('Too Many Requests')) && (
                      <p className="mt-2 text-sm text-orange-600">
                        ⏱️ To zabezpieczenie przed atakami. Poczekaj kilka minut.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-secondary-300 rounded-lg placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder={t('placeholders.enter_email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-secondary-300 rounded-lg placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder={t('placeholders.enter_password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-700">
                    {t('login.remember_me')}
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                    {t('login.forgot_password')}
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('login.logging_in')}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {t('login.login_button')}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </div>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-secondary-500">{t('login.or')}</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={() => authService.googleAuth()}
                className="w-full flex justify-center items-center py-3 px-4 border border-secondary-300 rounded-lg shadow-sm bg-white text-sm font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('login.continue_with_google')}
              </button>
            </form>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-sm text-secondary-600">
                {t('login.no_account')}{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                  {t('login.create_account')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Hero Image/Benefits */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center bg-gradient-to-br from-primary-50 to-primary-100 px-12">
          <div className="max-w-md text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary-600 mb-1">250+</div>
                  <div className="text-sm text-secondary-600">{t('stats.companies')}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 mb-1">5,000+</div>
                  <div className="text-sm text-secondary-600">{t('stats.projects')}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600 mb-1">25,000+</div>
                  <div className="text-sm text-secondary-600">{t('stats.tasks')}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600 mb-1">99.9%</div>
                  <div className="text-sm text-secondary-600">{t('stats.uptime')}</div>
                </div>
              </div>
              <div className="text-sm text-secondary-600">
                {t('stats.real_time')}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-secondary-900 mb-4">
              {t('hero.title')}
            </h3>
            <p className="text-secondary-600 mb-6">
              {t('hero.description')}
            </p>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-secondary-700 text-sm">{t('features.project_planning')}</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-secondary-700 text-sm">{t('features.team_management')}</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-secondary-700 text-sm">{t('features.invoices_finance')}</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-secondary-700 text-sm">{t('features.reports_analytics')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default LoginPage; 
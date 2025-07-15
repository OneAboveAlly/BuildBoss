import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { t: tForms } = useTranslation('forms');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
    acceptMarketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError(t('register.validation.first_name_required'));
      return false;
    }
    if (!formData.lastName.trim()) {
      setError(t('register.validation.last_name_required'));
      return false;
    }
    if (!formData.email.trim()) {
      setError(t('errors.email_required'));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t('errors.password_too_short'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwords_dont_match'));
      return false;
    }
    if (!formData.acceptTerms) {
      setError(t('errors.terms_required'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration with data:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        hasPassword: !!formData.password
      });
      
      await register(formData.email, formData.password, formData.firstName, formData.lastName);
      navigate('/login?message=registration_success');
    } catch (err) {
      console.error('Registration failed:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.registration_failed');
      
      // Add specific error guidance
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('już istnieje')) {
        friendlyMessage = 'Ten adres email jest już używany. Spróbuj się zalogować lub użyj innego adresu email.';
      } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        friendlyMessage = 'Zbyt wiele prób rejestracji. Poczekaj kilka minut i spróbuj ponownie.';
      } else if (errorMessage.includes('validation') || errorMessage.includes('walidacji')) {
        friendlyMessage = 'Dane formularza są nieprawidłowe. Sprawdź wszystkie pola i spróbuj ponownie.';
      } else if (errorMessage.includes('network') || errorMessage.includes('połączenia')) {
        friendlyMessage = 'Brak połączenia z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.';
      }
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = [
    t('register.password_strength.very_weak'),
    t('register.password_strength.weak'), 
    t('register.password_strength.medium'),
    t('register.password_strength.good'),
    t('register.password_strength.very_strong')
  ];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Image/Benefits */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center bg-gradient-to-br from-primary-50 to-primary-100 px-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-primary-100 rounded-full p-4">
                  <ClockIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                {t('register.benefits.trial_period')}
              </h3>
              <p className="text-secondary-600 text-sm">
                {t('register.benefits.trial_description')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-green-100 rounded-full p-4">
                  <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                {t('register.benefits.secure_reliable')}
              </h3>
              <p className="text-secondary-600 text-sm">
                {t('register.benefits.secure_description')}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-orange-100 rounded-full p-4">
                  <CreditCardIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">
                {t('register.benefits.no_commitment')}
              </h3>
              <p className="text-secondary-600 text-sm">
                {t('register.benefits.no_commitment_description')}
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">
              {t('register.social_proof.title')}
            </h2>
            <p className="text-secondary-600">
              {t('register.social_proof.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
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
              {t('register.welcome')}
            </h2>
            <p className="text-secondary-600">
              {t('register.subtitle_trial')}
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className={`border-l-4 p-4 rounded-lg ${
              error.includes('już istnieje') ? 'bg-yellow-50 border-yellow-400' :
              error.includes('429') || error.includes('Too Many Requests') ? 'bg-orange-50 border-orange-400' :
              error.includes('network') || error.includes('połączenia') ? 'bg-blue-50 border-blue-400' :
              'bg-red-50 border-red-400'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {error.includes('już istnieje') ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  ) : error.includes('429') || error.includes('Too Many Requests') ? (
                    <ClockIcon className="h-5 w-5 text-orange-400" />
                  ) : error.includes('network') || error.includes('połączenia') ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${
                    error.includes('już istnieje') ? 'text-yellow-700' :
                    error.includes('429') || error.includes('Too Many Requests') ? 'text-orange-700' :
                    error.includes('network') || error.includes('połączenia') ? 'text-blue-700' :
                    'text-red-700'
                  }`}>
                    {error}
                  </p>
                  {error.includes('już istnieje') && (
                    <p className="mt-2 text-sm text-yellow-600">
                      💡 <Link to="/login" className="underline font-medium">Przejdź do logowania</Link> lub użyj innego adresu email.
                    </p>
                  )}
                  {(error.includes('429') || error.includes('Too Many Requests')) && (
                    <p className="mt-2 text-sm text-orange-600">
                      ⏱️ Poczekaj kilka minut i spróbuj ponownie. To zabezpieczenie przed atakami.
                    </p>
                  )}
                  {(error.includes('network') || error.includes('połączenia')) && (
                    <p className="mt-2 text-sm text-blue-600">
                      🔌 Sprawdź połączenie internetowe i status serwera.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('register.first_name')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-secondary-300 rounded-lg placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder={t('register.placeholders.first_name')}
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 mb-2">
                  {t('register.last_name')} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-secondary-300 rounded-lg placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder={t('register.placeholders.last_name')}
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                {t('register.email')} *
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
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                {t('register.password')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-secondary-300 rounded-lg placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder={t('register.placeholders.password')}
                  value={formData.password}
                  onChange={handleChange}
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-secondary-600">{t('register.password_strength.label')}:</span>
                    <span className={`text-xs font-medium ${passwordStrength < 3 ? 'text-red-600' : passwordStrength < 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {strengthLabels[passwordStrength - 1] || strengthLabels[0]}
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${strengthColors[passwordStrength - 1] || 'bg-red-500'}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                {t('register.confirm_password')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-secondary-300 rounded-lg placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder={t('register.placeholders.confirm_password')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Marketing Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded mt-1"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
                <label htmlFor="acceptTerms" className="ml-3 block text-sm text-secondary-700">
                  {t('register.accept_terms_part1')}{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-500 font-medium">
                    {t('register.terms_link')}
                  </a>{' '}
                  {t('register.accept_terms_part2')}{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-500 font-medium">
                    {t('register.privacy_link')}
                  </a>{' '}
                  *
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="acceptMarketing"
                  name="acceptMarketing"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded mt-1"
                  checked={formData.acceptMarketing}
                  onChange={handleChange}
                />
                <label htmlFor="acceptMarketing" className="ml-3 block text-sm text-secondary-700">
                  {t('register.marketing_consent')}
                </label>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('register.creating_account')}
                </div>
              ) : (
                <div className="flex items-center">
                  {t('register.create_free_account')}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </div>
              )}
            </button>

            {/* Trial info */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-primary-900">
                    {t('register.trial_info.title')}
                  </p>
                  <p className="text-xs text-primary-700">
                    {t('register.trial_info.description')}
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Sign in link */}
          <div className="text-center">
            <p className="text-sm text-secondary-600">
              {t('register.already_have_account')}{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                {t('register.sign_in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 
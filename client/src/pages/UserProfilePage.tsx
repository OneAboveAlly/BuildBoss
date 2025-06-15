import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, UpdateProfileRequest } from '../types';
import { userService } from '../services/userService';
import { Button } from '../components/ui/Button';
import Breadcrumbs from '../components/ui/Breadcrumbs';

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatar: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await userService.getProfile();
      setProfile(profileData);
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        avatar: profileData.avatar || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Błąd podczas ładowania profilu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updateData: UpdateProfileRequest = {
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        avatar: formData.avatar.trim() || undefined
      };

      const updatedProfile = await userService.updateProfile(updateData);
      setProfile(updatedProfile);
      setSuccessMessage('Profil został zaktualizowany pomyślnie');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Błąd podczas aktualizacji profilu');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (successMessage) setSuccessMessage(null);
    if (error) setError(null);
  };

  const getUserDisplayName = () => {
    if (!profile) return '';
    if (profile.firstName || profile.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return profile.email;
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      SUPERADMIN: { label: 'Super Admin', class: 'bg-purple-100 text-purple-800' },
      BOSS: { label: 'Szef', class: 'bg-blue-100 text-blue-800' },
      WORKER: { label: 'Pracownik', class: 'bg-green-100 text-green-800' }
    };
    
    const badge = badges[role as keyof typeof badges];
    return badge ? (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
        {badge.label}
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-secondary-600">Ładowanie profilu...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Nie udało się załadować profilu</div>
          <div className="space-x-3">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Powrót do dashboardu
            </Button>
            <Button onClick={loadProfile}>
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profil użytkownika', current: true }
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 mb-6">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={getUserDisplayName()}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 font-bold text-3xl">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-secondary-900">
                  {getUserDisplayName()}
                </h1>
                <p className="text-secondary-600 mt-1">{profile.email}</p>
                <div className="flex items-center space-x-3 mt-3">
                  {getRoleBadge(profile.role)}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile.isEmailConfirmed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {profile.isEmailConfirmed ? 'Email potwierdzony' : 'Email niepotwierdzony'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">
                Edytuj profil
              </h2>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Imię
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Wprowadź swoje imię"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nazwisko
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Wprowadź swoje nazwisko"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  URL avatara
                </label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => handleInputChange('avatar', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-sm text-secondary-500 mt-1">
                  Podaj URL do swojego zdjęcia profilowego
                </p>
              </div>

              <div className="border-t border-secondary-200 pt-6">
                <h3 className="text-lg font-medium text-secondary-900 mb-4">
                  Informacje o koncie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md bg-secondary-50 text-secondary-500 cursor-not-allowed"
                    />
                    <p className="text-sm text-secondary-500 mt-1">
                      Email nie może być zmieniony
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Data utworzenia konta
                    </label>
                    <input
                      type="text"
                      value={new Date(profile.createdAt).toLocaleDateString()}
                      disabled
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md bg-secondary-50 text-secondary-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={saving}
                >
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                >
                  Zapisz zmiany
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 
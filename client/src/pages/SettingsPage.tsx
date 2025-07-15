import React from 'react';
// Placeholdery do rozwoju
const UserProfilePageContent = () => <div>Edytuj dane profilu (imię, nazwisko, avatar, email, rola, status emaila)</div>;
const ChangePasswordSection = () => <div>Zmiana hasła (jeśli nie Google)</div>;
const NotificationSettings = () => <div>Preferencje powiadomień (email, push, itp.)</div>;
const SubscriptionSummary = () => <div>Skrót subskrypcji (plan, status, link do szczegółów)</div>;
import PrivacySettings from '../components/legal/PrivacySettings';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">Ustawienia konta</h1>
        {/* Dane profilu */}
        <section className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <UserProfilePageContent />
        </section>
        {/* Zmiana hasła */}
        <section className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <ChangePasswordSection />
        </section>
        {/* Preferencje powiadomień */}
        <section className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <NotificationSettings />
        </section>
        {/* Prywatność i zgody */}
        <section className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <PrivacySettings />
        </section>
        {/* Skrót subskrypcji */}
        <section className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <SubscriptionSummary />
        </section>
      </div>
    </div>
  );
};

export default SettingsPage; 
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/Toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import PageLoader from './components/ui/PageLoader';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PWAInstaller from './components/common/PWAInstaller';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AutoRefresh } from './components/common/AutoRefresh';
import { UpdateNotification } from './components/common/UpdateNotification';
import { lazyWithPreload, preloadOnIdle } from './utils/lazyLoading';
import i18n from './i18n';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';


// Enhanced lazy loaded components with preloading
const HomePage = lazyWithPreload(() => import('./pages/HomePage'), 'HomePage');
const LoginPage = lazyWithPreload(() => import('./pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyWithPreload(() => import('./pages/auth/RegisterPage'), 'RegisterPage');
const AuthCallbackPage = lazyWithPreload(() => import('./pages/auth/AuthCallbackPage'), 'AuthCallbackPage');
const ConfirmEmailPage = lazyWithPreload(() => import('./pages/auth/ConfirmEmailPage'), 'ConfirmEmailPage');
const DashboardPage = lazyWithPreload(() => import('./pages/DashboardPage'), 'DashboardPage');
const CompanyDetailPage = lazyWithPreload(() => import('./pages/CompanyDetailPage'), 'CompanyDetailPage');
const CompaniesPage = lazyWithPreload(() => import('./pages/CompaniesPage'), 'CompaniesPage');
const UserProfilePage = lazyWithPreload(() => import('./pages/UserProfilePage'), 'UserProfilePage');
const ProjectsPage = lazyWithPreload(() => import('./pages/ProjectsPage'), 'ProjectsPage');
const ProjectDetailPage = lazyWithPreload(() => import('./pages/ProjectDetailPage'), 'ProjectDetailPage');
const CreateProjectPage = lazyWithPreload(() => import('./pages/CreateProjectPage'), 'CreateProjectPage');
const TasksPage = lazyWithPreload(() => import('./pages/TasksPage'), 'TasksPage');
const MaterialsPage = lazyWithPreload(() => import('./pages/MaterialsPage'), 'MaterialsPage');
const JobsPage = lazyWithPreload(() => import('./pages/JobsPage'), 'JobsPage');
const JobDetailPage = lazyWithPreload(() => import('./pages/JobDetailPage'), 'JobDetailPage');
const CreateJobPage = lazyWithPreload(() => import('./pages/CreateJobPage'), 'CreateJobPage');
const MessagesPage = lazyWithPreload(() => import('./pages/MessagesPage'), 'MessagesPage');
const PricingPage = lazyWithPreload(() => import('./pages/PricingPage'), 'PricingPage');
const SubscriptionPage = lazyWithPreload(() => import('./pages/SubscriptionPage'), 'SubscriptionPage');
const SubscriptionSuccessPage = lazyWithPreload(() => import('./pages/SubscriptionSuccessPage'), 'SubscriptionSuccessPage');
const SubscriptionCancelPage = lazyWithPreload(() => import('./pages/SubscriptionCancelPage'), 'SubscriptionCancelPage');
const NotificationsPage = lazyWithPreload(() => import('./pages/NotificationsPage'), 'NotificationsPage');
const AnalyticsPage = lazyWithPreload(() => import('./pages/AnalyticsPage'), 'AnalyticsPage');
const ReportsPage = lazyWithPreload(() => import('./pages/ReportsPage'), 'ReportsPage');
const SearchPage = lazyWithPreload(() => import('./pages/SearchPage'), 'SearchPage');

// Legal pages
const PrivacyPage = lazyWithPreload(() => import('./pages/legal/PrivacyPage'), 'PrivacyPage');
const TermsPage = lazyWithPreload(() => import('./pages/legal/TermsPage'), 'TermsPage');
const GdprPage = lazyWithPreload(() => import('./pages/legal/GdprPage'), 'GdprPage');

// Career page
const CareerPage = lazyWithPreload(() => import('./pages/CareerPage'), 'CareerPage');

// Admin secret plans page
const AdminSecretPlansPage = lazyWithPreload(() => import('./pages/AdminSecretPlansPage'), 'AdminSecretPlansPage');

// Settings page
const SettingsPage = lazyWithPreload(() => import('./pages/SettingsPage'), 'SettingsPage');

// Export components for use in other parts of the app (e.g., navigation preloading)
export {
  HomePage,
  LoginPage,
  RegisterPage,
  AuthCallbackPage,
  ConfirmEmailPage,
  DashboardPage,
  CompanyDetailPage,
  CompaniesPage,
  UserProfilePage,
  ProjectsPage,
  ProjectDetailPage,
  CreateProjectPage,
  TasksPage,
  MaterialsPage,
  JobsPage,
  JobDetailPage,
  CreateJobPage,
  MessagesPage,
  PricingPage,
  SubscriptionPage,
  SubscriptionSuccessPage,
  SubscriptionCancelPage,
  NotificationsPage,
  AnalyticsPage,
  ReportsPage,
  SearchPage,
  PrivacyPage,
  TermsPage,
  GdprPage,
  CareerPage,
  AdminSecretPlansPage,
  SettingsPage
};

function App() {
  const [i18nReady, setI18nReady] = useState(false);

  // Wait for i18n to be ready
  useEffect(() => {
    const checkI18nReady = () => {
      if (i18n.isInitialized) {
        setI18nReady(true);
      } else {
        i18n.on('initialized', () => {
          setI18nReady(true);
        });
      }
    };
    
    checkI18nReady();
  }, []);

  // Preload common components when app becomes idle
  useEffect(() => {
    preloadOnIdle([
      'DashboardPage',
      'UserProfilePage',
      'NotificationsPage',
      'ProjectsPage',
      'CompaniesPage'
    ]);
  }, []);

  // Global error handler for update-related errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Ignoruj błędy związane z systemem aktualizacji i PWA
      if (
        event.message.includes('Service Worker') ||
        event.message.includes('update') ||
        event.message.includes('cache') ||
        event.message.includes('fetch') ||
        event.message.includes('network') ||
        event.message.includes('timeout') ||
        event.message.includes('abort')
      ) {
        console.warn('Ignoring update/PWA related global error:', event.message);
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  // Show loading until i18n is ready
  if (!i18nReady) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <UnreadMessagesProvider>
          <Router>
            <div className="min-h-screen bg-secondary-50">
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/company" element={
                  <ProtectedRoute>
                    <Layout>
                      <CompaniesPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/companies/:id" element={
                  <ProtectedRoute>
                    <Layout>
                      <CompanyDetailPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Layout>
                      <UserProfilePage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/projects/new" element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateProjectPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectDetailPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute>
                    <Layout>
                      <TasksPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/materials" element={
                  <ProtectedRoute>
                    <Layout>
                      <MaterialsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* ETAP 8 - Jobs & Work Requests */}
                {/* Publiczne oglądanie ofert pracy - layout automatycznie dostosowany w komponencie */}
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                {/* Tworzenie ofert tylko dla zalogowanych */}
                <Route path="/jobs/create" element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateJobPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* ETAP 9 - Messages */}
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Layout>
                      <MessagesPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* ETAP 10 - Subscriptions & Payments */}
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/subscription" element={
                  <ProtectedRoute>
                    <Layout>
                      <SubscriptionPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
                <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
                
                {/* ETAP 11 - Notifications */}
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Layout>
                      <NotificationsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* ETAP 15 - Analytics */}
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Layout>
                      <AnalyticsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* ETAP 15B - Reports */}
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* ETAP 15C - Search */}
                <Route path="/search" element={
                  <ProtectedRoute>
                    <Layout>
                      <SearchPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* Legal pages - public routes */}
                <Route path="/legal/privacy" element={<PrivacyPage />} />
                <Route path="/legal/terms" element={<TermsPage />} />
                <Route path="/legal/gdpr" element={<GdprPage />} />
                
                {/* Career page - public route */}
                <Route path="/career" element={<CareerPage />} />
                
                {/* Tajny panel admina do zarządzania planami */}
                <Route path="/super-secret-4dmin-PLANS-2024" element={<AdminSecretPlansPage />} />

                
                {/* 404 */}
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-secondary-900 mb-4">404</h1>
                      <p className="text-secondary-600">Strona nie została znaleziona</p>
                    </div>
                  </div>
                } />
              </Routes>
            </Suspense>
            <Toaster />
            <HotToaster position="top-right" />
            {!import.meta.env.DEV && <PWAInstaller />}
            {!import.meta.env.DEV && <UpdateNotification />}
          </div>
        </Router>
      </UnreadMessagesProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/Toaster';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import ConfirmEmailPage from './pages/auth/ConfirmEmailPage';
import DashboardPage from './pages/DashboardPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import MaterialsPage from './pages/MaterialsPage';
import JobsPage from './pages/JobsPage';
import MessagesPage from './pages/MessagesPage';
import PricingPage from './pages/PricingPage';
import SubscriptionPage from './pages/SubscriptionPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import SubscriptionCancelPage from './pages/SubscriptionCancelPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './i18n/config';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-secondary-50">
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
            <Route path="/projects" element={
              <ProtectedRoute>
                <Layout>
                  <ProjectsPage />
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
            <Route path="/materials" element={
              <ProtectedRoute>
                <Layout>
                  <MaterialsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* ETAP 8 - Jobs & Work Requests */}
            <Route path="/jobs" element={
              <Layout>
                <JobsPage />
              </Layout>
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
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

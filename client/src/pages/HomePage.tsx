import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { FeatureCard } from '../components/ui/FeatureCard';
import { PricingCard } from '../components/ui/PricingCard';
import { TestimonialCard } from '../components/ui/TestimonialCard';
import { Footer } from '../components/ui/Footer';
import RotatingTextSwitcher from '../components/ui/RotatingTextSwitcher';
import CountUp from '../components/ui/CountUp';
import InteractiveCard from '../components/ui/InteractiveCard';
import SectionTitleCard from '../components/ui/SectionTitleCard';
import { jobService } from '../services/jobService';
import { subscriptionService } from '../services/subscriptionService';
import type { JobOffer } from '../types/job';
import type { SubscriptionPlan } from '../types/subscription';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS } from '../types/job';
import {
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  BellIcon,
  MapPinIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  CheckIcon,
  StarIcon,
  ArrowRightIcon,
  PlayIcon,
  PhoneIcon,
  EnvelopeIcon,
  Bars3Icon,
  XMarkIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const { t, ready, i18n } = useTranslation('homepage');
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recentJobs, setRecentJobs] = useState<JobOffer[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Przekieruj zalogowanych użytkowników do dashboardu
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Pobieranie najnowszych ogłoszeń o pracę
  useEffect(() => {
    const fetchRecentJobs = async () => {
      try {
        setIsLoadingJobs(true);
        const response = await jobService.getJobs({
          limit: 3,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
        setRecentJobs(response.jobs || []);
      } catch (error) {
        console.error('Error fetching recent jobs:', error);
        // W przypadku błędu pozostawiamy pustą tablicę
        setRecentJobs([]);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchRecentJobs();
  }, []);

  // Pobieranie planów subskrypcji
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const plansData = await subscriptionService.getPlans();
        console.log('📋 Pobrano plany z API:', plansData.length);
        plansData.forEach(plan => {
          console.log(`   - ${plan.displayName} (${plan.name}) - ${(plan.price / 100).toFixed(2)} ${plan.currency}`);
        });
        // Pokazujemy tylko 3 plany na homepage (bez FREE)
        const filteredPlans = plansData.filter(plan => plan.name.toLowerCase() !== 'free').slice(0, 3);
        console.log('📋 Filtrowane plany dla homepage:', filteredPlans.length);
        setPlans(filteredPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    // Pobierz plany tylko raz przy montowaniu komponentu
    if (plans.length === 0) {
      fetchPlans();
    }
  }, [plans.length]);



  // Show loading state if translations aren't ready or user is being redirected
  if (!ready || (loading && user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: ClipboardDocumentListIcon,
      title: t('features.project_management.title'),
      description: t('features.project_management.description'),
      color: 'text-blue-600'
    },
    {
      icon: UsersIcon,
      title: t('features.team_management.title'),
      description: t('features.team_management.description'),
      color: 'text-green-600'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: t('features.materials_tools.title'),
      description: t('features.materials_tools.description'),
      color: 'text-orange-600'
    },
    {
      icon: CurrencyDollarIcon,
      title: t('features.invoices_payments.title'),
      description: t('features.invoices_payments.description'),
      color: 'text-purple-600'
    },
    {
      icon: ChartBarIcon,
      title: t('features.reports_analytics.title'),
      description: t('features.reports_analytics.description'),
      color: 'text-indigo-600'
    },
    {
      icon: BellIcon,
      title: t('features.notifications.title'),
      description: t('features.notifications.description'),
      color: 'text-red-600'
    }
  ];

  const stats = [
    { number: 250, label: t('stats.companies'), suffix: '+' },
    { number: 5000, label: t('stats.projects'), suffix: '+' },
    { number: 25000, label: t('stats.tasks'), suffix: '+' },
    { number: 99.9, label: t('stats.uptime'), suffix: '%' }
  ];

  const testimonials = [
    {
      name: t('testimonials.clients.kowalski.name'),
      company: t('testimonials.clients.kowalski.company'),
      role: t('testimonials.clients.kowalski.role'),
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      quote: t('testimonials.clients.kowalski.quote'),
      rating: 5
    },
    {
      name: t('testimonials.clients.nowak.name'),
      company: t('testimonials.clients.nowak.company'),
      role: t('testimonials.clients.nowak.role'),
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
      quote: t('testimonials.clients.nowak.quote'),
      rating: 5
    },
    {
      name: t('testimonials.clients.wisniewski.name'),
      company: t('testimonials.clients.wisniewski.company'),
      role: t('testimonials.clients.wisniewski.role'),
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      quote: t('testimonials.clients.wisniewski.quote'),
      rating: 5
    }
  ];

  // Funkcja do formatowania daty
  const formatJobDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return t('jobs.posted_today', { defaultValue: 'dzisiaj' });
    } else if (diffDays <= 7) {
      return t('jobs.posted_days_ago', { days: diffDays, defaultValue: `${diffDays} dni temu` });
    } else {
      return jobService.formatDate(dateString);
    }
  };

  // Funkcja do obcięcia opisu
  const truncateDescription = (description: string, maxLength: number = 120) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-neutral-200/50 z-50 shadow-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <BuildingOffice2Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
                    Build<span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">Boss</span>
                  </span>
                  <p className="text-xs text-secondary-500 font-medium">Professional</p>
                </div>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/jobs"
                className="relative bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center group"
              >
                <span className="mr-2"></span>
                {t('navigation.jobs')}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative">🔥</span>
                </span>
              </Link>
              <a href="#features" className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-all duration-300 font-medium">
                {t('navigation.features')}
              </a>
              <a href="#pricing" className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-all duration-300 font-medium">
                {t('navigation.pricing')}
              </a>
              <a href="#testimonials" className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-all duration-300 font-medium">
                {t('navigation.testimonials')}
              </a>
              {!user && (
                <>
              <Link
                to="/login"
                className="text-secondary-600 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-all duration-300 font-medium"
              >
                {t('navigation.login')}
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary-500/25 transform hover:scale-105"
              >
                {t('navigation.register')}
              </Link>
                </>
              )}
              {user && (
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary-500/25 transform hover:scale-105"
                >
                  Przejdź do aplikacji
                </Link>
              )}
              {/* Language Selector - maksymalnie po prawej */}
              <div className="ml-4">
                <LanguageSelector compact={true} showLabel={false} />
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              <LanguageSelector compact={true} showLabel={false} />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-secondary-600 hover:text-secondary-900 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-lg border-t border-white/20 animate-slide-down">
          <div className="px-4 py-6 space-y-6">
            {/* Language Selector - maksymalnie po prawej */}
            <div className="flex justify-end">
              <LanguageSelector compact={true} showLabel={true} />
            </div>
            
            <div className="space-y-2">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block text-secondary-700 hover:text-primary-600 font-medium py-3 px-4 rounded-lg hover:bg-primary-50 transition-all">
                {t('navigation.features')}
              </a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="block text-secondary-700 hover:text-primary-600 font-medium py-3 px-4 rounded-lg hover:bg-primary-50 transition-all">
                {t('navigation.pricing')}
              </a>
              <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="block text-secondary-700 hover:text-primary-600 font-medium py-3 px-4 rounded-lg hover:bg-primary-50 transition-all">
                {t('navigation.testimonials')}
              </a>
              <Link to="/jobs" onClick={() => setIsMobileMenuOpen(false)} className="block bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg text-center relative overflow-hidden">
                <span className="mr-2"></span>
                {t('navigation.jobs')}
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center animate-pulse">
                  🔥
                </span>
              </Link>
            </div>

            <div className="border-t border-white/20 pt-6 space-y-3">
              {!user ? (
                <>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 text-secondary-700 hover:text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-all"
              >
                {t('auth.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t('auth.register')}
              </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Przejdź do aplikacji
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-white via-primary-50/50 to-neutral-100/50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-300/10 to-accent-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-300/10 to-primary-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
          {/* Construction-themed decorations */}
          <div className="absolute top-20 right-20 text-6xl opacity-5 animate-float">🏗️</div>
          <div className="absolute bottom-20 left-20 text-4xl opacity-5 animate-bounce">🔨</div>
          <div className="absolute top-1/2 left-1/4 text-5xl opacity-5 animate-pulse">⚡</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 relative">
          <div className="text-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 leading-tight md:leading-tight lg:leading-tight mb-4">
                {t('hero.title')}
                <span className="block mt-2">
                  <RotatingTextSwitcher />
                </span>
              </h1>
            </div>
            <p className="mt-8 text-lg md:text-xl text-neutral-600 max-w-4xl mx-auto leading-relaxed md:leading-relaxed lg:leading-relaxed animate-slide-up px-4">
              {t('hero.subtitle')}
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              {!user ? (
                <>
              <Link
                to="/register"
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary-500/25 flex items-center justify-center transform hover:scale-105 group"
              >
                {t('hero.cta_primary')}
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="bg-white/90 backdrop-blur-sm hover:bg-white text-neutral-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-neutral-200 hover:border-primary-300 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 group">
                <PlayIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                {t('hero.cta_secondary')}
              </button>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary-500/25 flex items-center justify-center transform hover:scale-105 group"
                >
                  Przejdź do aplikacji
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            <p className="mt-6 text-sm text-neutral-500 animate-fade-in">
              {t('hero.features_short')}
            </p>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative animate-slide-up">
            <div className="flex justify-center">
              {/* Dashboard preview */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20 max-w-4xl w-full">
                <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="p-8 bg-gradient-to-br from-white via-white to-primary-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-secondary-900">Aktywne projekty</h3>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">12</span>
                      </div>
                      <div className="w-full bg-secondary-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-3 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-secondary-900">Zespół</h3>
                        <span className="text-2xl font-bold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">48</span>
                      </div>
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-8 h-8 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full border-2 border-white shadow-sm"></div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-secondary-900">Przychody</h3>
                        <span className="text-2xl font-bold bg-gradient-to-r from-warning-600 to-warning-700 bg-clip-text text-transparent">156k</span>
                      </div>
                      <div className="text-sm text-success-600 font-medium">↗ +12% w tym miesiącu</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Construction illustration */}
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop&crop=center" 
                  alt="Construction management illustration"
                  className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl animate-float"
                />
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce-subtle">
                  🚀 Nowoczesne
                </div>
                <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce-subtle">
                  ⚡ Szybkie
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  <CountUp
                    from={0}
                    to={stat.number}
                    separator=","
                    direction="up"
                    duration={2}
                    delay={index * 0.2}
                    className="count-up-text"
                  />
                  {stat.suffix}
                </div>
                <div className="text-neutral-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Job-themed decorations */}
        <div className="absolute top-16 left-16 text-5xl opacity-5 animate-bounce">💼</div>
        <div className="absolute bottom-16 right-16 text-4xl opacity-5 animate-pulse">👷</div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <SectionTitleCard
                title="Szukasz pracy w budownictwie?"
                subtitle="Znajdź wymarzoną pracę w najlepszych firmach"
                icon={<BriefcaseIcon className="h-8 w-8" />}
              />
            </div>
            <p className="text-lg md:text-xl text-secondary-600 max-w-4xl mx-auto leading-relaxed px-4">
              {t('jobs.section_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {isLoadingJobs ? (
              // Loading skeleton
              [...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            ) : recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <Link 
                  key={job.id} 
                  to={`/jobs/${job.id}`}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <BuildingOffice2Icon className="w-4 h-4 mr-2" />
                        <span className="font-medium">{job.company.name}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        <span>{job.city}, {job.voivodeship}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-semibold">
                        {jobService.formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                      </div>
                      <div className="text-gray-400 text-sm">{formatJobDate(job.createdAt)}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {truncateDescription(job.description)}
                  </p>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {JOB_CATEGORIES[job.category] || job.category}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {JOB_TYPES[job.type] || job.type}
                    </span>
                    {job.experience && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        {EXPERIENCE_LEVELS[job.experience] || job.experience}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              // Fallback message when no jobs available
              <div className="col-span-3 text-center py-12">
                <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('jobs.no_jobs_available', { defaultValue: 'Brak dostępnych ogłoszeń' })}
                </h3>
                <p className="text-gray-500">
                  {t('jobs.no_jobs_description', { defaultValue: 'Sprawdź ponownie później lub dodaj własne ogłoszenie.' })}
                </p>
                <Link
                  to="/create-job"
                  className="inline-flex items-center mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('jobs.add_job', { defaultValue: 'Dodaj ogłoszenie' })}
                  <ArrowRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link
              to="/jobs"
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {t('jobs.cta_button')}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-white to-neutral-50 relative overflow-hidden">
        {/* Construction decorations */}
        <div className="absolute top-10 right-10 text-4xl opacity-5 animate-spin-slow">⚙️</div>
        <div className="absolute bottom-10 left-10 text-3xl opacity-5 animate-pulse">🏠</div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <SectionTitleCard
                title="Wszystko czego potrzebujesz"
                subtitle="Kompleksowe narzędzia dla firm budowlanych"
                icon={<WrenchScrewdriverIcon className="h-8 w-8" />}
              />
            </div>
            <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed px-4">
              Prosto, szybko i profesjonalnie – zarządzaj projektami jak nigdy wcześniej.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 justify-items-center max-w-6xl mx-auto">
            {/* Feature 1 */}
            <InteractiveCard
              title="Zarządzanie projektami"
              subtitle="Twórz, monitoruj i realizuj projekty budowlane z pełną kontrolą nad postępem i budżetem"
              icon={<ClipboardDocumentListIcon className="h-8 w-8" />}
              gradient="from-blue-500 via-blue-600 to-blue-700"
            />
            {/* Feature 2 */}
            <InteractiveCard
              title="Zarządzanie zespołem"
              subtitle="Przydzielaj zadania, monitoruj pracę i komunikuj się z zespołem w jednym miejscu"
              icon={<UsersIcon className="h-8 w-8" />}
              gradient="from-green-500 via-green-600 to-green-700"
            />
            {/* Feature 3 */}
            <InteractiveCard
              title="Materiały i narzędzia"
              subtitle="Zarządzaj magazynem, zamówieniami i dostępnością materiałów oraz sprzętu"
              icon={<WrenchScrewdriverIcon className="h-8 w-8" />}
              gradient="from-orange-500 via-orange-600 to-orange-700"
            />
            {/* Feature 4 */}
            <InteractiveCard
              title="Faktury i płatności"
              subtitle="Wystawiaj faktury, kontroluj płatności i rozliczaj projekty bez zbędnych formalności"
              icon={<CurrencyDollarIcon className="h-8 w-8" />}
              gradient="from-purple-500 via-purple-600 to-purple-700"
            />
            {/* Feature 5 */}
            <InteractiveCard
              title="Raporty i analityka"
              subtitle="Analizuj wyniki, generuj raporty i podejmuj trafne decyzje biznesowe"
              icon={<ChartBarIcon className="h-8 w-8" />}
              gradient="from-indigo-500 via-indigo-600 to-indigo-700"
            />
            {/* Feature 6 */}
            <InteractiveCard
              title="Powiadomienia"
              subtitle="Bądź na bieżąco z najważniejszymi wydarzeniami i terminami w firmie"
              icon={<BellIcon className="h-8 w-8" />}
              gradient="from-yellow-500 via-yellow-600 to-yellow-700"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <SectionTitleCard
                  title="Wybierz plan dopasowany do Twojej firmy"
                  subtitle="14-dniowy okres próbny za darmo"
                  icon={<CurrencyDollarIcon className="h-8 w-8" />}
                />
              </div>
              <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed px-4">
                Bez zobowiązań. Anuluj w każdej chwili.
              </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                popular={plan.name.toLowerCase() === 'pro'}
                delay={index * 200}
                showFeatures={false}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-neutral-600 mb-4">
              {t('pricing.need_more')} <Link to="/pricing" className="text-primary-600 hover:text-primary-700 font-medium">{t('pricing.view_full_pricing')}</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-white to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <SectionTitleCard
                title="⭐ Co mówią nasi klienci"
                subtitle="Sprawdź opinie firm budowlanych"
                icon={<StarIcon className="h-8 w-8" />}
              />
            </div>
            <p className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed px-4">
              Dołącz do setek zadowolonych firm, które już używają BuildBoss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                company={testimonial.company}
                role={testimonial.role}
                image={testimonial.image}
                quote={testimonial.quote}
                rating={testimonial.rating}
                delay={index * 150}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {t('cta.ready_title')}
              </h2>
              <p className="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed max-w-2xl">
                {t('cta.ready_description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="bg-white hover:bg-gray-50 text-primary-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center justify-center group"
                >
                  {t('cta.start_trial')}
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href={`mailto:${t('footer.contact.email')}`}
                  className="border-2 border-white hover:bg-white hover:text-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 inline-flex items-center justify-center group transform hover:scale-105"
                >
                  <EnvelopeIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  {t('cta.contact_us')}
                </a>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-6 text-primary-100 text-sm">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  14-dniowy okres próbny
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🔒</span>
                  Bezpieczne płatności
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📞</span>
                  Wsparcie 24/7
                </div>
              </div>
            </div>
            
            {/* Right side - Illustration */}
            <div className="flex justify-center lg:justify-end">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop&crop=center" 
                alt="Success illustration"
                className="w-full max-w-md h-auto rounded-2xl shadow-2xl animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage; 
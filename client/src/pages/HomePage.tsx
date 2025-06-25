import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/common/LanguageSelector';
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
  XMarkIcon
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const { t } = useTranslation('homepage');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { number: '500+', label: t('stats.companies') },
    { number: '10,000+', label: t('stats.projects') },
    { number: '50,000+', label: t('stats.tasks') },
    { number: '99.9%', label: t('stats.uptime') }
  ];

  const testimonials = [
    {
      name: t('testimonials.clients.kowalski.name'),
      company: t('testimonials.clients.kowalski.company'),
      role: t('testimonials.clients.kowalski.role'),
      image: '👨‍💼',
      quote: t('testimonials.clients.kowalski.quote'),
      rating: 5
    },
    {
      name: t('testimonials.clients.nowak.name'),
      company: t('testimonials.clients.nowak.company'),
      role: t('testimonials.clients.nowak.role'),
      image: '👩‍💼',
      quote: t('testimonials.clients.nowak.quote'),
      rating: 5
    },
    {
      name: t('testimonials.clients.wisniewski.name'),
      company: t('testimonials.clients.wisniewski.company'),
      role: t('testimonials.clients.wisniewski.role'),
      image: '👨‍🔧',
      quote: t('testimonials.clients.wisniewski.quote'),
      rating: 5
    }
  ];

  const sampleJobs = [
    {
      title: t('jobs.sample_jobs.mason.title'),
      company: t('jobs.sample_jobs.mason.company'),
      location: t('jobs.sample_jobs.mason.location'),
      salary: t('jobs.sample_jobs.mason.salary'),
      posted: t('jobs.sample_jobs.mason.posted'),
      description: t('jobs.sample_jobs.mason.description'),
      tags: [
        t('jobs.sample_jobs.mason.tags.0'),
        t('jobs.sample_jobs.mason.tags.1')
      ]
    },
    {
      title: t('jobs.sample_jobs.electrician.title'),
      company: t('jobs.sample_jobs.electrician.company'),
      location: t('jobs.sample_jobs.electrician.location'),
      salary: t('jobs.sample_jobs.electrician.salary'),
      posted: t('jobs.sample_jobs.electrician.posted'),
      description: t('jobs.sample_jobs.electrician.description'),
      tags: [
        t('jobs.sample_jobs.electrician.tags.0'),
        t('jobs.sample_jobs.electrician.tags.1')
      ]
    },
    {
      title: t('jobs.sample_jobs.foreman.title'),
      company: t('jobs.sample_jobs.foreman.company'),
      location: t('jobs.sample_jobs.foreman.location'),
      salary: t('jobs.sample_jobs.foreman.salary'),
      posted: t('jobs.sample_jobs.foreman.posted'),
      description: t('jobs.sample_jobs.foreman.description'),
      tags: [
        t('jobs.sample_jobs.foreman.tags.0'),
        t('jobs.sample_jobs.foreman.tags.1')
      ]
    }
  ];

  const pricingPlans = [
    {
      name: t('pricing.plans.basic.name'),
      price: '29',
      description: t('pricing.plans.basic.description'),
      features: [
        t('pricing.plans.basic.features.0'),
        t('pricing.plans.basic.features.1'),
        t('pricing.plans.basic.features.2'),
        t('pricing.plans.basic.features.3'),
        t('pricing.plans.basic.features.4')
      ],
      popular: false,
      color: 'blue'
    },
    {
      name: t('pricing.plans.pro.name'),
      price: '79',
      description: t('pricing.plans.pro.description'),
      features: [
        t('pricing.plans.pro.features.0'),
        t('pricing.plans.pro.features.1'),
        t('pricing.plans.pro.features.2'),
        t('pricing.plans.pro.features.3'),
        t('pricing.plans.pro.features.4'),
        t('pricing.plans.pro.features.5')
      ],
      popular: true,
      color: 'green'
    },
    {
      name: t('pricing.plans.enterprise.name'),
      price: '199',
      description: t('pricing.plans.enterprise.description'),
      features: [
        t('pricing.plans.enterprise.features.0'),
        t('pricing.plans.enterprise.features.1'),
        t('pricing.plans.enterprise.features.2'),
        t('pricing.plans.enterprise.features.3'),
        t('pricing.plans.enterprise.features.4'),
        t('pricing.plans.enterprise.features.5')
      ],
      popular: false,
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-secondary-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
                <span className="text-2xl font-bold text-secondary-900">
                  Site<span className="text-primary-600">Boss</span>
                </span>
              </Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/jobs"
                className="text-secondary-600 hover:text-secondary-900 transition-colors font-medium"
              >
                {t('navigation.jobs')}
              </Link>
              <a href="#features" className="text-secondary-600 hover:text-secondary-900 transition-colors">
                {t('navigation.features')}
              </a>
              <a href="#pricing" className="text-secondary-600 hover:text-secondary-900 transition-colors">
                {t('navigation.pricing')}
              </a>
              <a href="#testimonials" className="text-secondary-600 hover:text-secondary-900 transition-colors">
                {t('navigation.testimonials')}
              </a>
              <LanguageSelector />
              <Link
                to="/login"
                className="text-secondary-600 hover:text-secondary-900 transition-colors"
              >
                {t('navigation.login')}
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {t('navigation.register')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 leading-tight">
              {t('hero.title')}
              <span className="block text-primary-600">{t('hero.title_highlight')}</span>
            </h1>
            <p className="mt-6 text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {t('hero.cta_primary')}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button className="bg-white hover:bg-secondary-50 text-secondary-700 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-secondary-200 transition-all duration-200 flex items-center justify-center">
                <PlayIcon className="mr-2 h-5 w-5" />
                {t('hero.cta_secondary')}
              </button>
            </div>

            <p className="mt-4 text-sm text-secondary-500">
              {t('hero.features_short')}
            </p>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="bg-secondary-900 rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-800 p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="p-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-secondary-900">Aktywne projekty</h3>
                      <span className="text-2xl font-bold text-primary-600">12</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-secondary-900">Zespół</h3>
                      <span className="text-2xl font-bold text-green-600">48</span>
                    </div>
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-8 h-8 bg-secondary-300 rounded-full border-2 border-white"></div>
                      ))}
                    </div>
                  </div>
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-secondary-900">Przychody</h3>
                      <span className="text-2xl font-bold text-orange-600">156k</span>
                    </div>
                    <div className="text-sm text-green-600">↗ +12% w tym miesiącu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-secondary-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              {t('jobs.section_title')}
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              {t('jobs.section_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {sampleJobs.map((job, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <BuildingOffice2Icon className="w-4 h-4 mr-2" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600 font-semibold">
                      {job.salary}
                    </div>
                    <div className="text-gray-400 text-sm">{job.posted}</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {job.description}
                </p>
                <div className="flex space-x-2">
                  {job.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className={`px-2 py-1 text-xs rounded-full ${
                      tagIndex === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-8 hover:shadow-lg transition-shadow duration-200">
                <div className={`inline-flex p-3 rounded-lg bg-opacity-10 mb-4 ${feature.color.replace('text-', 'bg-')}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors"
            >
{t('features.view_all')}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              {t('pricing_section.title')}
            </h2>
            <p className="text-xl text-secondary-600">
              {t('pricing_section.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`card relative ${plan.popular ? 'ring-2 ring-primary-600 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {t('pricing_section.most_popular')}
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2">{plan.name}</h3>
                  <p className="text-secondary-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-secondary-900">{plan.price} zł</span>
                    <span className="text-secondary-600">{t('pricing_section.period')}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-secondary-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register"
                    className={`w-full block text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900'
                    }`}
                  >
                    {t('pricing_section.start_trial_button')}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-secondary-600 mb-4">
{t('pricing.need_more')} <Link to="/pricing" className="text-primary-600 hover:text-primary-700 font-medium">{t('pricing.view_full_pricing')}</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-secondary-600">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-secondary-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center">
                  <div className="text-3xl mr-3">{testimonial.image}</div>
                  <div>
                    <div className="font-semibold text-secondary-900">{testimonial.name}</div>
                    <div className="text-sm text-secondary-600">{testimonial.role}</div>
                    <div className="text-sm text-secondary-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t('cta.ready_title')}
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            {t('cta.ready_description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white hover:bg-secondary-50 text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              {t('cta.start_trial')}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <a
              href={`mailto:${t('footer.contact.email')}`}
              className="border-2 border-white hover:bg-white hover:text-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              <EnvelopeIcon className="mr-2 h-5 w-5" />
              {t('cta.contact_us')}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BuildingOffice2Icon className="h-8 w-8 text-primary-400" />
                <span className="text-2xl font-bold">
                  Site<span className="text-primary-400">Boss</span>
                </span>
              </div>
              <p className="text-secondary-300 mb-6 max-w-md">
                {t('footer.description')}
              </p>
              <div className="flex space-x-4">
                <a href={`mailto:${t('footer.contact.email')}`} className="text-secondary-300 hover:text-white transition-colors">
                  <EnvelopeIcon className="h-6 w-6" />
                </a>
                <a href={`tel:${t('footer.contact.phone')}`} className="text-secondary-300 hover:text-white transition-colors">
                  <PhoneIcon className="h-6 w-6" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#features" className="hover:text-white transition-colors">{t('footer.links.features')}</a></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">{t('footer.links.pricing')}</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.integrations')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.api')}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.blog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.career')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.contact')}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-secondary-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-400 text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-secondary-400 hover:text-white text-sm transition-colors">{t('footer.privacy_policy')}</a>
              <a href="#" className="text-secondary-400 hover:text-white text-sm transition-colors">{t('footer.terms')}</a>
              <a href="#" className="text-secondary-400 hover:text-white text-sm transition-colors">{t('footer.cookies')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 
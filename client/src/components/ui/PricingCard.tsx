import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPlan } from '../../types/subscription';

interface PricingCardProps {
  plan: SubscriptionPlan;
  popular?: boolean;
  delay?: number;
  showFeatures?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  popular = false,
  delay = 0,
  showFeatures = true
}) => {
  const { t } = useTranslation();

  const formatLimit = (limit: number, label: string): string => {
    if (limit === -1) return `∞ ${label}`;
    return `${limit} ${label}`;
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return 'from-gray-500 to-gray-600';
      case 'basic':
        return 'from-blue-500 to-blue-600';
      case 'pro':
        return 'from-green-500 to-green-600';
      case 'enterprise':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanBadge = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free':
        return { text: 'Darmowy', color: 'bg-gray-500' };
      case 'basic':
        return { text: 'Podstawowy', color: 'bg-blue-500' };
      case 'pro':
        return { text: 'Najpopularniejszy', color: 'bg-green-500' };
      case 'enterprise':
        return { text: 'Enterprise', color: 'bg-purple-500' };
      default:
        return { text: 'Plan', color: 'bg-gray-500' };
    }
  };

  const badge = getPlanBadge(plan.name);

  return (
    <div 
      className={`relative group transition-all duration-500 hover:scale-105 ${
        popular ? 'transform scale-105' : ''
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
            🏆 {badge.text}
          </span>
        </div>
      )}
      
      {/* Card */}
      <div className={`relative bg-white rounded-2xl p-8 shadow-xl border-2 transition-all duration-500 hover:shadow-2xl overflow-hidden ${
        popular 
          ? 'border-green-500 shadow-green-500/20' 
          : 'border-neutral-200 hover:border-neutral-300'
      }`}>
        
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${getPlanColor(plan.name).split('-')[1]}-50/30 to-${getPlanColor(plan.name).split('-')[1]}-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.displayName}</h3>
            <p className="text-neutral-600 mb-6">{plan.description}</p>
            
            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <span className="text-5xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                  {plan.price === 0 ? '0' : (plan.price / 100).toFixed(0)}
                </span>
                <span className="text-xl text-neutral-600 ml-2">zł</span>
              </div>
              <p className="text-neutral-500 text-sm">/miesiąc</p>
            </div>
          </div>
          
          {/* Features */}
          {showFeatures && (
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CheckIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-neutral-700 leading-relaxed">
                  {formatLimit(plan.maxCompanies, 'firma')}
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CheckIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-neutral-700 leading-relaxed">
                  {formatLimit(plan.maxProjects, 'projektów')}
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CheckIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-neutral-700 leading-relaxed">
                  {formatLimit(plan.maxWorkers, 'pracowników')}
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CheckIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-neutral-700 leading-relaxed">
                  {formatLimit(plan.maxJobOffers, 'ogłoszeń o pracę')}
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CheckIcon className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-neutral-700 leading-relaxed">
                  {formatLimit(plan.maxStorageGB, 'GB przestrzeni')}
                </span>
              </li>
              
              {/* Premium features */}
              {plan.hasAdvancedReports && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-neutral-700 leading-relaxed font-medium">
                    📊 Zaawansowane raporty
                  </span>
                </li>
              )}
              {plan.hasApiAccess && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-neutral-700 leading-relaxed font-medium">
                    🔌 Dostęp do API
                  </span>
                </li>
              )}
              {plan.hasPrioritySupport && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-neutral-700 leading-relaxed font-medium">
                    ⚡ Wsparcie priorytetowe
                  </span>
                </li>
              )}
              {plan.hasCustomBranding && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-neutral-700 leading-relaxed font-medium">
                    🎨 Własny branding
                  </span>
                </li>
              )}
              {plan.hasTeamManagement && (
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-neutral-700 leading-relaxed font-medium">
                    👥 Zarządzanie zespołem
                  </span>
                </li>
              )}
            </ul>
          )}
          
          {/* CTA Button */}
          <Link
            to={plan.price === 0 ? "/register" : "/pricing"}
            className={`w-full block text-center py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
              popular
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl'
                : plan.price === 0
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-neutral-100 to-neutral-200 hover:from-neutral-200 hover:to-neutral-300 text-neutral-900 border-2 border-neutral-300 hover:border-neutral-400'
            }`}
          >
            {plan.price === 0 ? 'Rozpocznij za darmo' : popular ? 'Rozpocznij teraz' : 'Wybierz plan'}
          </Link>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-r from-blue-400 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
      </div>
    </div>
  );
}; 
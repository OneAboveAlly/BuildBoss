import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color: string;
  delay?: number;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  color,
  delay = 0
}) => {
  return (
    <div 
      className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-50/50 to-${color}-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {icon && (
            <div className={`p-2 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
              {icon}
            </div>
          )}
        </div>
        
        {/* Value */}
        <div className="mb-2">
          <span className={`text-3xl font-bold bg-gradient-to-r from-${color}-600 to-${color}-800 bg-clip-text text-transparent`}>
            {value}
          </span>
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-gray-600 text-sm mb-3">{subtitle}</p>
        )}
        
        {/* Change indicator */}
        {change && (
          <div className="flex items-center">
            {change.isPositive ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              change.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {change.isPositive ? '+' : ''}{change.value}%
            </span>
            <span className="text-gray-500 text-sm ml-1">vs poprzedni miesiąc</span>
          </div>
        )}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
    </div>
  );
}; 
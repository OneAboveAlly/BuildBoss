import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface TestimonialCardProps {
  name: string;
  company: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
  delay?: number;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  company,
  role,
  image,
  quote,
  rating,
  delay = 0
}) => {
  return (
    <div 
      className="group relative bg-white rounded-2xl p-8 shadow-xl border border-neutral-100 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-accent-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Rating */}
        <div className="flex items-center mb-6">
          {[...Array(rating)].map((_, i) => (
            <StarIcon key={i} className="h-5 w-5 text-warning-400 fill-current" />
          ))}
          <span className="ml-2 text-sm text-neutral-500">({rating}/5)</span>
        </div>
        
        {/* Quote */}
        <blockquote className="text-neutral-700 mb-8 italic leading-relaxed text-lg relative">
          <span className="absolute -top-2 -left-2 text-4xl text-primary-200 group-hover:text-primary-300 transition-colors">"</span>
          {quote}
          <span className="absolute -bottom-2 -right-2 text-4xl text-primary-200 group-hover:text-primary-300 transition-colors">"</span>
        </blockquote>
        
        {/* Author */}
        <div className="flex items-center">
          <div className="mr-4 rounded-full w-16 h-16 overflow-hidden shadow-lg ring-2 ring-white">
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
              }}
            />
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-lg">{name}</div>
            <div className="text-neutral-600 font-medium">{role}</div>
            <div className="text-neutral-500 text-sm">{company}</div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-r from-success-400 to-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
    </div>
  );
}; 
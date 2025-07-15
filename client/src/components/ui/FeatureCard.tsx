import React from 'react';
import type { ComponentType, SVGProps } from 'react';

interface FeatureCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  color: string;
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  delay = 0
}) => {
  // Map feature titles to relevant images
  const getFeatureImage = (title: string) => {
    const imageMap: { [key: string]: string } = {
      'Zarządzanie projektami': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
      'Zarządzanie zespołem': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop',
      'Materiały i narzędzia': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=200&fit=crop',
      'Faktury i płatności': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop',
      'Raporty i analityka': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
      'Powiadomienia': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
    };
    return imageMap[title] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop';
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl p-8 shadow-lg border border-neutral-100 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-50/50 to-${color}-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Feature image */}
      <div className="relative z-10 mb-6">
        <div className="w-full h-32 rounded-xl overflow-hidden shadow-lg">
          <img 
            src={getFeatureImage(title)}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </div>
      
      {/* Icon container */}
      <div className="relative z-10">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 mb-4`}>
          <Icon className={`h-6 w-6 text-white`} />
        </div>
        
        {/* Content */}
        <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-neutral-800 transition-colors">
          {title}
        </h3>
        <p className="text-neutral-600 leading-relaxed group-hover:text-neutral-700 transition-colors">
          {description}
        </p>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute bottom-4 left-4 w-1 h-1 bg-gradient-to-r from-success-400 to-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
    </div>
  );
}; 
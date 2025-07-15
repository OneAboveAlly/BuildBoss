import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  onClick,
  variant = 'default',
  hover = true
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantClasses = {
    default: 'bg-white border border-secondary-200 shadow-card',
    glass: 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-glass',
    gradient: 'bg-gradient-to-br from-white via-primary-50/30 to-accent-50/30 border border-white/40 shadow-elegant',
    elevated: 'bg-white border border-secondary-100 shadow-elegant'
  };

  const hoverClasses = hover ? (onClick ? 'hover:shadow-card-hover hover:scale-[1.02] cursor-pointer' : 'hover:shadow-card-hover') : '';

  return (
    <div 
      className={`rounded-xl transition-all duration-300 ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = ''
}) => {
  return (
    <h3 className={`text-lg font-semibold text-secondary-900 ${className}`}>
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`text-secondary-600 ${className}`}>
      {children}
    </div>
  );
}; 
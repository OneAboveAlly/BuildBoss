import React from 'react';

interface SectionTitleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

const SectionTitleCard: React.FC<SectionTitleCardProps> = ({
  title,
  subtitle,
  icon,
  className = ""
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Construction-themed background */}
      <div className="relative bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-1 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl px-8 py-6 relative overflow-hidden">
          {/* Construction pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-2 text-yellow-400 text-2xl">🏗️</div>
            <div className="absolute top-2 right-2 text-orange-400 text-xl">⚡</div>
            <div className="absolute bottom-2 left-2 text-yellow-400 text-lg">🔨</div>
            <div className="absolute bottom-2 right-2 text-orange-400 text-xl">⚙️</div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center">
            {icon && (
              <div className="flex justify-center mb-3">
                <div className="text-amber-400 transform hover:scale-110 transition-transform duration-300">
                  {icon}
                </div>
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {title}
            </h3>
            
            {subtitle && (
              <p className="text-neutral-300 text-sm font-medium">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Construction warning stripes */}
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 transform rotate-45"></div>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-xl -z-10 animate-pulse-slow"></div>
    </div>
  );
};

export default SectionTitleCard; 
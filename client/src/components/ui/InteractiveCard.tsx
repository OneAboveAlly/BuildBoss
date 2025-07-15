import React from 'react';

interface InteractiveCardProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  gradient?: string;
  className?: string;
}

const InteractiveCard: React.FC<InteractiveCardProps> = ({
  title,
  subtitle,
  icon,
  gradient = "from-blue-500 via-purple-500 to-yellow-400",
  className = ""
}) => {
  return (
    <div className={`relative w-64 h-80 transition-all duration-200 hover:scale-105 ${className}`}>
      <div className="absolute inset-0 z-0 flex justify-center items-center rounded-2xl transition-all duration-700 bg-gradient-to-br bg-opacity-90 shadow-2xl hover:brightness-110 group">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl transition-all duration-700`}></div>
        
        {/* Blur effect behind */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-2xl opacity-30 transition-all duration-200 group-hover:opacity-80 -z-10`}></div>
        
        {/* Grid overlay for hover tracking */}
        <div className="absolute inset-0 z-50 grid grid-cols-5 grid-rows-5 gap-0 rounded-2xl overflow-hidden">
          {Array.from({ length: 25 }, (_, i) => (
            <div
              key={i}
              className="w-full h-full cursor-pointer transition-all duration-125 ease-in-out hover:transform"
              style={{
                transform: `perspective(800px) rotateX(${Math.floor(i / 5) * 10 - 20}deg) rotateY(${(i % 5) * 5 - 10}deg)`
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget.closest('.group');
                if (card) {
                  const row = Math.floor(i / 5);
                  const col = i % 5;
                  const rotateX = (row - 2) * 8;
                  const rotateY = (col - 2) * 8;
                  (card as HTMLElement).style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                }
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget.closest('.group');
                if (card) {
                  (card as HTMLElement).style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.05)';
                }
              }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center text-white p-6 h-full flex flex-col justify-center">
          {/* Icon - always visible */}
          {icon && (
            <div className="mb-4 flex justify-center transform scale-150 group-hover:scale-125 transition-transform duration-300">
              {icon}
            </div>
          )}
          
          {/* Title - always visible */}
          <div className="text-lg font-bold mb-4 opacity-100 transition-opacity duration-300">
            {title}
          </div>
          
          {/* Subtitle - appears on hover */}
          <div className="text-sm text-white/90 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 leading-relaxed">
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCard; 
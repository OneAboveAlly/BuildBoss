import React from 'react';
import RotatingText from './RotatingText';

const RotatingTextUA: React.FC = () => {
  const texts = [
    'як професіонал',
    'з точністю',
    'з пристрастю',
    'з досвідом',
    'з інноваціями'
  ];

  return (
    <RotatingText
      texts={texts}
      mainClassName="px-2 sm:px-2 md:px-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
      staggerFrom="last"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-120%" }}
      staggerDuration={0.025}
      splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
      transition={{ type: "spring", damping: 30, stiffness: 400 }}
      rotationInterval={4000}
      splitBy="none"
    />
  );
};

export default RotatingTextUA; 
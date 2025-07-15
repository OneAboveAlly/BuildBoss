import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RotatingTextPL from './RotatingTextPL';
import RotatingTextEN from './RotatingTextEN';
import RotatingTextDE from './RotatingTextDE';
import RotatingTextUA from './RotatingTextUA';

const RotatingTextSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Nasłuchuj na zmiany języka
  useEffect(() => {
    const handleLanguageChange = (newLanguage: string) => {
      console.log('RotatingTextSwitcher: Language changed to:', newLanguage);
      setCurrentLanguage(newLanguage);
    };

    const handleWindowLanguageChange = () => {
      console.log('RotatingTextSwitcher: Window language change detected');
      setCurrentLanguage(i18n.language);
    };

    // Nasłuchuj na zdarzenie languageChanged z i18n
    i18n.on('languageChanged', handleLanguageChange);
    
    // Nasłuchuj na zdarzenie languagechange z okna
    window.addEventListener('languagechange', handleWindowLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languagechange', handleWindowLanguageChange);
    };
  }, [i18n]);

  // Renderuj odpowiedni komponent na podstawie języka
  const renderRotatingText = () => {
    console.log('RotatingTextSwitcher: Rendering for language:', currentLanguage);
    
    switch (currentLanguage) {
      case 'pl':
        return <RotatingTextPL key="pl" />;
      case 'en':
        return <RotatingTextEN key="en" />;
      case 'de':
        return <RotatingTextDE key="de" />;
      case 'ua':
        return <RotatingTextUA key="ua" />;
      default:
        // Fallback do polskiego
        return <RotatingTextPL key="pl-fallback" />;
    }
  };

  return (
    <div className="rotating-text-switcher">
      {renderRotatingText()}
    </div>
  );
};

export default RotatingTextSwitcher; 
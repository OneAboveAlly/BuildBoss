import React from 'react';
import { useTranslation } from 'react-i18next';

interface LocalizedCurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  showSymbol?: boolean;
  compact?: boolean;
}

const LocalizedCurrencyDisplay: React.FC<LocalizedCurrencyDisplayProps> = ({
  amount,
  currency,
  className = '',
  showSymbol = true,
  compact = false
}) => {
  const { i18n } = useTranslation();

  // Mapowanie języków na waluty domyślne
  const defaultCurrencyMap = {
    pl: 'PLN',
    de: 'EUR',
    en: 'USD',
    ua: 'UAH'
  };

  // Mapowanie języków na locale dla formatowania
  const localeMap = {
    pl: 'pl-PL',
    de: 'de-DE',
    en: 'en-US',
    ua: 'uk-UA'
  };

  const currentCurrency = currency || defaultCurrencyMap[i18n.language as keyof typeof defaultCurrencyMap] || 'PLN';
  const currentLocale = localeMap[i18n.language as keyof typeof localeMap] || 'pl-PL';

  // Formatowanie liczby według locale
  const formatCurrency = (value: number): string => {
    try {
      if (compact && Math.abs(value) >= 1000) {
        // Kompaktowe formatowanie dla dużych liczb
        const formatter = new Intl.NumberFormat(currentLocale, {
          style: 'currency',
          currency: currentCurrency,
          notation: 'compact',
          compactDisplay: 'short'
        });
        return formatter.format(value);
      } else {
        // Standardowe formatowanie
        const formatter = new Intl.NumberFormat(currentLocale, {
          style: showSymbol ? 'currency' : 'decimal',
          currency: showSymbol ? currentCurrency : undefined,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        
        const formatted = formatter.format(value);
        
        // Jeśli nie pokazujemy symbolu, ale chcemy dodać kod waluty
        if (!showSymbol) {
          return `${formatted} ${currentCurrency}`;
        }
        
        return formatted;
      }
    } catch (error) {
      // Fallback na podstawowe formatowanie
      return `${value.toFixed(2)} ${currentCurrency}`;
    }
  };

  // Określenie koloru na podstawie wartości
  const getAmountColor = (value: number): string => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-900 dark:text-gray-100';
  };

  const formattedAmount = formatCurrency(amount);
  const colorClass = getAmountColor(amount);

  return (
    <span className={`font-medium ${colorClass} ${className}`}>
      {formattedAmount}
    </span>
  );
};

export default LocalizedCurrencyDisplay; 
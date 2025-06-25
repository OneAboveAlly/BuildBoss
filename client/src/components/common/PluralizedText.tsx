import React from 'react';
import { useTranslation } from 'react-i18next';

interface PluralizedTextProps {
  count: number;
  singular: string;
  plural?: string;
  few?: string; // Dla języków z formą "few" (2-4 w polskim)
  many?: string; // Dla języków z formą "many" (5+ w polskim)
  zero?: string; // Opcjonalna forma dla zera
  className?: string;
  showCount?: boolean;
}

const PluralizedText: React.FC<PluralizedTextProps> = ({
  count,
  singular,
  plural,
  few,
  many,
  zero,
  className = '',
  showCount = true
}) => {
  const { i18n } = useTranslation();

  // Funkcja do określenia formy pluralnej dla różnych języków
  const getPluralForm = (count: number, language: string): string => {
    const absCount = Math.abs(count);

    // Jeśli mamy specjalną formę dla zera
    if (count === 0 && zero) {
      return zero;
    }

    switch (language) {
      case 'pl': // Polski
        if (absCount === 1) return singular;
        if (absCount >= 2 && absCount <= 4) return few || plural || singular;
        return many || plural || singular;

      case 'de': // Niemiecki
        return absCount === 1 ? singular : (plural || singular);

      case 'en': // Angielski
        return absCount === 1 ? singular : (plural || singular);

      case 'ua': // Ukraiński (podobnie jak polski)
        if (absCount === 1) return singular;
        if (absCount >= 2 && absCount <= 4) return few || plural || singular;
        return many || plural || singular;

      default:
        return absCount === 1 ? singular : (plural || singular);
    }
  };

  // Automatyczne generowanie form pluralnych dla podstawowych przypadków
  const generatePluralForms = (singular: string, language: string) => {
    switch (language) {
      case 'pl':
        // Podstawowe reguły dla polskiego
        if (singular.endsWith('e')) {
          return {
            few: singular.slice(0, -1) + 'a',
            many: singular.slice(0, -1) + ''
          };
        }
        if (singular.endsWith('a')) {
          return {
            few: singular.slice(0, -1) + 'y',
            many: singular.slice(0, -1) + ''
          };
        }
        return {
          few: singular + 'a',
          many: singular + 'ów'
        };

      case 'de':
        // Podstawowe reguły dla niemieckiego
        if (singular.endsWith('e')) {
          return { plural: singular + 'n' };
        }
        return { plural: singular + 'e' };

      case 'en':
        // Podstawowe reguły dla angielskiego
        if (singular.endsWith('s') || singular.endsWith('x') || singular.endsWith('z') || 
            singular.endsWith('ch') || singular.endsWith('sh')) {
          return { plural: singular + 'es' };
        }
        if (singular.endsWith('y') && !'aeiou'.includes(singular[singular.length - 2])) {
          return { plural: singular.slice(0, -1) + 'ies' };
        }
        return { plural: singular + 's' };

      case 'ua':
        // Podstawowe reguły dla ukraińskiego (uproszczone)
        return {
          few: singular + 'а',
          many: singular + 'ів'
        };

      default:
        return { plural: singular + 's' };
    }
  };

  // Jeśli nie podano form pluralnych, spróbuj je wygenerować
  const autoForms = !plural && !few && !many ? generatePluralForms(singular, i18n.language) : {};
  
  const finalFew = few || (autoForms as any).few;
  const finalMany = many || (autoForms as any).many;
  const finalPlural = plural || (autoForms as any).plural;

  const selectedForm = getPluralForm(count, i18n.language);
  const finalText = selectedForm === singular ? singular :
                   selectedForm === finalFew ? finalFew :
                   selectedForm === finalMany ? finalMany :
                   selectedForm === finalPlural ? finalPlural :
                   selectedForm === zero ? zero :
                   selectedForm;

  return (
    <span className={className}>
      {showCount && `${count} `}{finalText}
    </span>
  );
};

// Hook do użycia pluralizacji bez komponentu
export const usePluralization = () => {
  const { i18n } = useTranslation();

  const pluralize = (
    count: number,
    singular: string,
    plural?: string,
    few?: string,
    many?: string,
    zero?: string
  ): string => {
    const absCount = Math.abs(count);

    if (count === 0 && zero) return zero;

    switch (i18n.language) {
      case 'pl':
        if (absCount === 1) return singular;
        if (absCount >= 2 && absCount <= 4) return few || plural || singular;
        return many || plural || singular;

      case 'de':
        return absCount === 1 ? singular : (plural || singular);

      case 'en':
        return absCount === 1 ? singular : (plural || singular);

      case 'ua':
        if (absCount === 1) return singular;
        if (absCount >= 2 && absCount <= 4) return few || plural || singular;
        return many || plural || singular;

      default:
        return absCount === 1 ? singular : (plural || singular);
    }
  };

  return { pluralize };
};

export default PluralizedText; 
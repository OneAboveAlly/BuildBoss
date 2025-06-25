import React from 'react';
import { useTranslation } from 'react-i18next';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  showLinks?: boolean;
  className?: string;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  checked,
  onChange,
  required = true,
  error,
  showLinks = true,
  className = ''
}) => {
  const { t } = useTranslation('legal');

  const handleLinkClick = (type: 'terms' | 'privacy') => {
    // Open in new window/tab
    const url = type === 'terms' ? '/terms' : '/privacy';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="terms-checkbox"
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={`
              h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500
              ${error ? 'border-red-300' : 'border-gray-300'}
            `}
            required={required}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms-checkbox" className="text-gray-700">
            {showLinks ? (
              <span>
                {t('terms.accept')}{' '}
                <button
                  type="button"
                  onClick={() => handleLinkClick('terms')}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  {t('documents.terms')}
                </button>
                {' '}i{' '}
                <button
                  type="button"
                  onClick={() => handleLinkClick('privacy')}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  {t('documents.privacy')}
                </button>
                {required && <span className="text-red-500 ml-1">*</span>}
              </span>
            ) : (
              <span>
                {t('terms.accept')}
                {required && <span className="text-red-500 ml-1">*</span>}
              </span>
            )}
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center text-sm text-red-600">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {!checked && required && (
        <p className="text-xs text-gray-500">
          {t('terms.accept_required')}
        </p>
      )}
    </div>
  );
};

export default TermsCheckbox; 
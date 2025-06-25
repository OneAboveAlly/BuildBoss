import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay with animation */}
        <div 
          className="fixed inset-0 transition-opacity duration-300 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel with animation */}
        <div 
          className={`
            inline-block w-full ${sizeClasses[size]} 
            my-4 sm:my-8 overflow-hidden text-left align-middle 
            transition-all duration-300 transform 
            bg-white shadow-2xl rounded-2xl
            animate-in zoom-in-95 fade-in duration-300
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 bg-white rounded-t-2xl">
            <h3 
              id="modal-title"
              className="text-xl font-bold text-secondary-900"
            >
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
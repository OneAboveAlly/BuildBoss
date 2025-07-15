import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sesja wygasła">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-warning-100 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
        </div>
        
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Twoja sesja wygasła
        </h3>
        
        <p className="text-sm text-secondary-500 mb-6">
          Ze względów bezpieczeństwa, Twoja sesja została zakończona. 
          Zaloguj się ponownie, aby kontynuować korzystanie z aplikacji.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={onLogin}
            className="flex-1 sm:flex-none"
          >
            Zaloguj się ponownie
          </Button>
          
          <a href="/" className="flex-1 sm:flex-none">
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Przejdź do strony głównej
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
}; 
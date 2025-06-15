import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

const ConfirmEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Nieprawidłowy token potwierdzenia');
      return;
    }

    authService.confirmEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email został pomyślnie potwierdzony!');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message || 'Błąd podczas potwierdzania email');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-secondary-900">
                Potwierdzanie email...
              </h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Email potwierdzony!
              </h2>
              <p className="text-secondary-600 mb-6">
                {message}
              </p>
              <Link
                to="/login"
                className="btn-primary inline-block"
              >
                Przejdź do logowania
              </Link>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-900 mb-2">
                Błąd potwierdzenia
              </h2>
              <p className="text-secondary-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="btn-primary inline-block w-full"
                >
                  Przejdź do logowania
                </Link>
                <Link
                  to="/register"
                  className="btn-secondary inline-block w-full"
                >
                  Zarejestruj się ponownie
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmailPage; 
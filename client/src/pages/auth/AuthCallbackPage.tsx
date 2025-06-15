import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Save token and redirect to dashboard
      localStorage.setItem('token', token);
      
      // Get user data using authService
      authService.getMe(token)
        .then(() => {
          // Token is valid, redirect to dashboard
          // The AuthContext will pick up the token from localStorage
          navigate('/dashboard');
        })
        .catch(() => {
          setError('Błąd podczas autoryzacji');
          setTimeout(() => {
            navigate('/login?error=auth_callback_failed');
          }, 2000);
        });
    } else {
      navigate('/login?error=auth_callback_failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-secondary-600">
          {error || 'Finalizowanie logowania...'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage; 
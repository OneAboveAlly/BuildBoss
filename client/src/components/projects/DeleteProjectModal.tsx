import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { authService } from '../../services/authService';
import { projectService } from '../../services/projectService';
import type { ProjectWithStats } from '../../types';
import { 
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';

interface DeleteProjectModalProps {
  project: ProjectWithStats | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;
    
    if (confirmationText !== project.name) {
      setError('Nazwa projektu nie jest poprawna');
      return;
    }

    if (!password.trim()) {
      setError('Hasło jest wymagane');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify password first
      await authService.verifyPassword(password);
      
      // Delete project
      await projectService.deleteProject(project.id);
      
      // Success
      handleClose();
      onDeleted();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      if (err.message?.includes('Password') || err.message?.includes('hasło')) {
        setError('Nieprawidłowe hasło');
      } else {
        setError('Błąd podczas usuwania projektu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmationText('');
    setShowPassword(false);
    setError('');
    setLoading(false);
    onClose();
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Usuń projekt">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm text-secondary-600">
            Ta operacja jest nieodwracalna
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-red-800 mb-2">Ostrzeżenie!</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Wszystkie zadania w tym projekcie zostaną usunięte</li>
            <li>• Wszystkie materiały przypisane do projektu zostaną usunięte</li>
            <li>• Historia i raporty związane z projektem będą niedostępne</li>
            <li>• Tej operacji nie można cofnąć</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project name confirmation */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Aby potwierdzić, wpisz nazwę projektu: <span className="font-semibold text-red-600">{project.name}</span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Wpisz: ${project.name}`}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Wprowadź swoje hasło aby potwierdzić
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wprowadź hasło"
                className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-secondary-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={loading || confirmationText !== project.name || !password.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Usuwanie...' : 'Usuń projekt'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}; 
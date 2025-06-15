import React, { useState, useEffect } from 'react';
import type { UserSearchResult, InviteWorkerRequest } from '../../types';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface InviteWorkerFormProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const InviteWorkerForm: React.FC<InviteWorkerFormProps> = ({
  companyId,
  onSuccess,
  onCancel
}) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchEmail.trim().length >= 3) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchEmail]);

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      setSearchError(null);
      const results = await userService.searchUsers(searchEmail, companyId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchError('Błąd podczas wyszukiwania użytkowników');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: UserSearchResult) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setIsInviting(true);
      
      // Prepare invitations
      const invitations: InviteWorkerRequest[] = selectedUsers.map(user => ({
        email: user.email,
        position: '',
        canEdit: false,
        canView: true,
        canManageFinance: false
      }));

      // Send bulk invite
      const result = await companyService.bulkInviteWorkers(companyId, { invitations });
      
      if (result.errors.length > 0) {
        console.warn('Some invitations failed:', result.errors);
      }

      onSuccess();
    } catch (error) {
      console.error('Error inviting workers:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const getUserDisplayName = (user: UserSearchResult) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  const getStatusBadge = (user: UserSearchResult) => {
    if (user.isInCompany) {
      const statusLabels = {
        INVITED: { label: 'Zaproszony', class: 'bg-yellow-100 text-yellow-800' },
        ACTIVE: { label: 'Aktywny', class: 'bg-green-100 text-green-800' },
        INACTIVE: { label: 'Nieaktywny', class: 'bg-gray-100 text-gray-800' },
        LEFT: { label: 'Opuścił', class: 'bg-red-100 text-red-800' }
      };
      
      const status = statusLabels[user.companyStatus as keyof typeof statusLabels];
      if (status) {
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.class}`}>
            {status.label}
          </span>
        );
      }
    }
    return null;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="Zaproś pracowników"
      size="lg"
    >
      <div className="space-y-6">
        {/* Search input */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Wyszukaj użytkowników po emailu
          </label>
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Wprowadź email użytkownika..."
          />
          {searchError && (
            <p className="text-red-600 text-sm mt-1">{searchError}</p>
          )}
        </div>

        {/* Search results */}
        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-secondary-600">Wyszukiwanie...</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-secondary-700 mb-3">
              Wyniki wyszukiwania ({searchResults.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.find(u => u.id === user.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  } ${user.isInCompany ? 'opacity-60' : ''}`}
                  onClick={() => !user.isInCompany && handleSelectUser(user)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={getUserDisplayName(user)}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-600 font-semibold">
                          {getUserDisplayName(user).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-secondary-900">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-sm text-secondary-600">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(user)}
                    {!user.isInCompany && (
                      <input
                        type="checkbox"
                        checked={selectedUsers.find(u => u.id === user.id) !== undefined}
                        onChange={() => handleSelectUser(user)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-secondary-700 mb-3">
              Wybrani użytkownicy ({selectedUsers.length})
            </h3>
            <div className="space-y-2">
              {selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {getUserDisplayName(user).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-secondary-900">
                        {getUserDisplayName(user)}
                      </div>
                      <div className="text-sm text-secondary-600">{user.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectUser(user)}
                  >
                    Usuń
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isInviting}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleInvite}
            loading={isInviting}
            disabled={selectedUsers.length === 0}
          >
            Zaproś ({selectedUsers.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InviteWorkerForm; 
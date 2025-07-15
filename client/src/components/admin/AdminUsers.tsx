import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { adminUserService, type AdminUser, type AdminUserDetails, type AdminUserStats } from '../../services/adminUserService';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldExclamationIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface AdminUsersProps {
  onBack: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onBack }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    subscription: ''
  });
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '',
    isEmailConfirmed: false
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    planId: '',
    trialEndDate: '',
    endDate: '',
    status: ''
  });
  const [stats, setStats] = useState<AdminUserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    premiumUsers: 0,
    usersByRole: {},
    usersByPlan: {}
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load users when filters, search, or pagination changes
  useEffect(() => {
    loadUsers();
  }, [debouncedSearchQuery, filters, pagination.page]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminUserService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        role: filters.role || undefined,
        status: filters.status || undefined,
        subscription: filters.subscription || undefined,
        search: debouncedSearchQuery || undefined
      });
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Błąd podczas ładowania użytkowników:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, debouncedSearchQuery]);

  const loadStats = async () => {
    try {
      const statsData = await adminUserService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Błąd podczas ładowania statystyk:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Ładowanie użytkowników...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            ← Powrót
          </Button>
          <h1 className="text-2xl font-bold">Zarządzanie Użytkownikami</h1>
        </div>
        <Button>
          Eksportuj dane
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Wszyscy użytkownicy</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600">Aktywni (30 dni)</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.premiumUsers}</div>
            <div className="text-sm text-gray-600">Premium</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.newUsersThisMonth}</div>
            <div className="text-sm text-gray-600">Nowi (miesiąc)</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Wyszukaj po email, imieniu, nazwisku lub firmie..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Wszystkie role</option>
              <option value="WORKER">Pracownik</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Wszystkie statusy</option>
              <option value="confirmed">Potwierdzone</option>
              <option value="unconfirmed">Niepotwierdzone</option>
            </select>
            <select
              value={filters.subscription}
              onChange={(e) => handleFilterChange('subscription', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Wszystkie plany</option>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
              <option value="none">Brak subskrypcji</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              Brak użytkowników spełniających kryteria
            </div>
          </Card>
        ) : (
          <>
            {users.map((user) => (
              <Card
                key={user.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={async () => {
                  try {
                    const userDetails = await adminUserService.getUser(user.id);
                    setSelectedUser(userDetails.user);
                    setShowUserModal(true);
                  } catch (error) {
                    console.error('Błąd podczas pobierania szczegółów użytkownika:', error);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {user.companies.map((company) => (
                          <Badge key={company.id} variant="secondary">
                            <BuildingOffice2Icon className="w-3 h-3 mr-1" />
                            {company.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={user.isEmailConfirmed ? 'success' : 'warning'}>
                        {user.isEmailConfirmed ? 'Potwierdzone' : 'Niepotwierdzone'}
                      </Badge>
                      {user.subscription && (
                        <Badge variant={user.subscription.planName === 'Premium' ? 'danger' : 'secondary'}>
                          {user.subscription.planName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Dołączył: {formatDate(user.createdAt)}
                    </p>
                    {user.lastLoginAt && (
                      <p className="text-sm text-gray-500">
                        Ostatnie logowanie: {formatDate(user.lastLoginAt)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Card>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Pokazano {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} z {pagination.total} użytkowników
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                      Poprzednia
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                                                     <Button
                             key={pageNum}
                             variant={pagination.page === pageNum ? 'primary' : 'outline'}
                             size="sm"
                             onClick={() => handlePageChange(pageNum)}
                             className="w-8 h-8 p-0"
                           >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Następna
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          title={`Użytkownik: ${selectedUser.firstName} ${selectedUser.lastName}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Informacje podstawowe</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                  <div><span className="font-medium">Rola:</span> {selectedUser.role}</div>
                  <div><span className="font-medium">Status email:</span> 
                    <Badge variant={selectedUser.isEmailConfirmed ? 'success' : 'warning'} className="ml-2">
                      {selectedUser.isEmailConfirmed ? 'Potwierdzone' : 'Niepotwierdzone'}
                    </Badge>
                  </div>
                  <div><span className="font-medium">Data rejestracji:</span> {formatDate(selectedUser.createdAt)}</div>
                  {selectedUser.lastLoginAt && (
                    <div><span className="font-medium">Ostatnie logowanie:</span> {formatDate(selectedUser.lastLoginAt)}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Subskrypcja</h4>
                {selectedUser.subscription ? (
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Plan:</span> {selectedUser.subscription.planName}</div>
                    <div><span className="font-medium">Status:</span> {selectedUser.subscription.status}</div>
                    {selectedUser.subscription.endDate && (
                      <div><span className="font-medium">Data końca:</span> {formatDate(selectedUser.subscription.endDate)}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Brak aktywnej subskrypcji</p>
                )}
              </div>
            </div>

            {/* Companies */}
            <div>
              <h4 className="font-semibold mb-2">Firmy</h4>
              <div className="space-y-2">
                {selectedUser.companies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <BuildingOffice2Icon className="w-4 h-4 text-gray-600" />
                    <span>{company.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h4 className="font-semibold mb-2">Statystyki</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">{selectedUser.stats.projectsCount}</div>
                  <div className="text-sm text-gray-600">Projektów</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">{selectedUser.stats.tasksCount}</div>
                  <div className="text-sm text-gray-600">Zadań</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-lg font-bold text-purple-600">{formatCurrency(selectedUser.stats.totalSpent)}</div>
                  <div className="text-sm text-gray-600">Wydane</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingUser(selectedUser);
                  setEditForm({
                    firstName: selectedUser.firstName || '',
                    lastName: selectedUser.lastName || '',
                    role: selectedUser.role,
                    isEmailConfirmed: selectedUser.isEmailConfirmed
                  });
                  setSubscriptionForm({
                    planId: selectedUser.subscription?.plan?.id || '',
                    trialEndDate: '',
                    endDate: selectedUser.subscription?.endDate ? 
                      new Date(selectedUser.subscription.endDate).toISOString().split('T')[0] : '',
                    status: selectedUser.subscription?.status || ''
                  });
                  setShowUserModal(false);
                  setShowEditModal(true);
                }}
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edytuj użytkownika
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowUserModal(false);
                  setShowDeleteModal(true);
                }}
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Usuń użytkownika
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          title={`Edytuj użytkownika: ${editingUser.firstName} ${editingUser.lastName}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-semibold mb-4">Informacje podstawowe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imię
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwisko
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rola
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="WORKER">Pracownik</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status email
                  </label>
                  <select
                    value={editForm.isEmailConfirmed ? 'confirmed' : 'unconfirmed'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isEmailConfirmed: e.target.value === 'confirmed' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="confirmed">Potwierdzone</option>
                    <option value="unconfirmed">Niepotwierdzone</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div>
              <h4 className="font-semibold mb-4">Subskrypcja</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan
                  </label>
                  <select
                    value={subscriptionForm.planId}
                    onChange={(e) => setSubscriptionForm(prev => ({ ...prev, planId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Wybierz plan</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={subscriptionForm.status}
                    onChange={(e) => setSubscriptionForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">Aktywna</option>
                    <option value="INACTIVE">Nieaktywna</option>
                    <option value="CANCELLED">Anulowana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data końca
                  </label>
                  <input
                    type="date"
                    value={subscriptionForm.endDate}
                    onChange={(e) => setSubscriptionForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
              >
                Anuluj
              </Button>
              <Button 
                size="sm"
                onClick={async () => {
                  try {
                    // Aktualizuj dane użytkownika
                    await adminUserService.updateUser(editingUser.id, {
                      firstName: editForm.firstName,
                      lastName: editForm.lastName,
                      role: editForm.role,
                      isEmailConfirmed: editForm.isEmailConfirmed
                    });

                    // Aktualizuj subskrypcję
                    if (subscriptionForm.planId || subscriptionForm.status || subscriptionForm.endDate) {
                      await adminUserService.updateUserSubscription(editingUser.id, {
                        planId: subscriptionForm.planId || undefined,
                        status: subscriptionForm.status || undefined,
                        endDate: subscriptionForm.endDate || undefined
                      });
                    }

                    setShowEditModal(false);
                    setEditingUser(null);
                    loadUsers(); // Odśwież listę
                    loadStats(); // Odśwież statystyki
                  } catch (error) {
                    console.error('Błąd podczas aktualizacji użytkownika:', error);
                  }
                }}
              >
                Zapisz zmiany
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Modal */}
      {selectedUser && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          title="Potwierdź usunięcie użytkownika"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Czy na pewno chcesz usunąć użytkownika <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})?
            </p>
            <p className="text-sm text-red-600">
              Ta operacja jest nieodwracalna. Wszystkie dane użytkownika zostaną usunięte.
            </p>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Anuluj
              </Button>
              <Button 
                variant="danger" 
                size="sm"
                onClick={async () => {
                  try {
                    await adminUserService.deleteUser(selectedUser.id);
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                    loadUsers(); // Odśwież listę
                    loadStats(); // Odśwież statystyki
                  } catch (error) {
                    console.error('Błąd podczas usuwania użytkownika:', error);
                  }
                }}
              >
                Usuń użytkownika
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}; 
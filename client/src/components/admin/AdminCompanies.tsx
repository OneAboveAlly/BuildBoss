import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import {
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  UsersIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  nip?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  workers: Array<{
    id: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    status: string;
    position?: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  stats: {
    totalWorkers: number;
    activeWorkers: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
  };
}

interface AdminCompaniesProps {
  onBack: () => void;
}

export const AdminCompanies: React.FC<AdminCompaniesProps> = ({ onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    size: ''
  });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    totalWorkers: 0,
    totalProjects: 0
  });

  useEffect(() => {
    loadCompanies();
    loadStats();
  }, [filters]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      // TODO: Zastąp rzeczywistymi API calls
      const mockCompanies: Company[] = [
        {
          id: '1',
          name: 'Kowalski Construction',
          nip: '1234567890',
          address: 'ul. Budowlana 15, 00-001 Warszawa',
          phone: '+48 123 456 789',
          email: 'kontakt@kowalski-construction.pl',
          website: 'https://kowalski-construction.pl',
          description: 'Firma budowlana specjalizująca się w budownictwie mieszkaniowym',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-07-09T14:20:00Z',
          createdBy: {
            id: '1',
            email: 'jan.kowalski@example.com',
            firstName: 'Jan',
            lastName: 'Kowalski'
          },
          workers: [
            {
              id: '1',
              user: {
                id: '1',
                email: 'jan.kowalski@example.com',
                firstName: 'Jan',
                lastName: 'Kowalski'
              },
              status: 'ACTIVE',
              position: 'Właściciel'
            },
            {
              id: '2',
              user: {
                id: '2',
                email: 'anna.nowak@example.com',
                firstName: 'Anna',
                lastName: 'Nowak'
              },
              status: 'ACTIVE',
              position: 'Kierownik projektu'
            }
          ],
          projects: [
            {
              id: '1',
              name: 'Osiedle Zielone Wzgórze',
              status: 'IN_PROGRESS'
            },
            {
              id: '2',
              name: 'Centrum Handlowe Plaza',
              status: 'COMPLETED'
            }
          ],
          stats: {
            totalWorkers: 2,
            activeWorkers: 2,
            totalProjects: 2,
            activeProjects: 1,
            completedProjects: 1
          }
        },
        {
          id: '2',
          name: 'Nowak Building',
          nip: '0987654321',
          address: 'ul. Architektów 8, 30-001 Kraków',
          phone: '+48 987 654 321',
          email: 'biuro@nowak-building.pl',
          website: 'https://nowak-building.pl',
          description: 'Firma architektoniczno-budowlana',
          createdAt: '2024-02-20T09:15:00Z',
          updatedAt: '2024-07-08T16:45:00Z',
          createdBy: {
            id: '3',
            email: 'anna.nowak@example.com',
            firstName: 'Anna',
            lastName: 'Nowak'
          },
          workers: [
            {
              id: '3',
              user: {
                id: '3',
                email: 'anna.nowak@example.com',
                firstName: 'Anna',
                lastName: 'Nowak'
              },
              status: 'ACTIVE',
              position: 'Dyrektor'
            }
          ],
          projects: [
            {
              id: '3',
              name: 'Biurowiec Business Center',
              status: 'PLANNING'
            }
          ],
          stats: {
            totalWorkers: 1,
            activeWorkers: 1,
            totalProjects: 1,
            activeProjects: 0,
            completedProjects: 0
          }
        }
      ];
      setCompanies(mockCompanies);
    } catch (error) {
      console.error('Błąd podczas ładowania firm:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Zastąp rzeczywistymi API calls
      setStats({
        totalCompanies: 156,
        activeCompanies: 134,
        totalWorkers: 892,
        totalProjects: 423
      });
    } catch (error) {
      console.error('Błąd podczas ładowania statystyk:', error);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.nip?.includes(searchQuery) ||
                         company.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && company.stats.activeWorkers > 0) ||
      (filters.status === 'inactive' && company.stats.activeWorkers === 0);
    
    const matchesSize = !filters.size || 
      (filters.size === 'small' && company.stats.totalWorkers <= 5) ||
      (filters.size === 'medium' && company.stats.totalWorkers > 5 && company.stats.totalWorkers <= 20) ||
      (filters.size === 'large' && company.stats.totalWorkers > 20);

    return matchesSearch && matchesStatus && matchesSize;
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Ładowanie firm...</div>
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
          <h1 className="text-2xl font-bold">Zarządzanie Firmami</h1>
        </div>
        <Button>
          Dodaj firmę
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCompanies}</div>
            <div className="text-sm text-gray-600">Wszystkie firmy</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeCompanies}</div>
            <div className="text-sm text-gray-600">Aktywne</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalWorkers}</div>
            <div className="text-sm text-gray-600">Pracownicy</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalProjects}</div>
            <div className="text-sm text-gray-600">Projekty</div>
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
                placeholder="Wyszukaj po nazwie, NIP, email lub adresie..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Wszystkie statusy</option>
              <option value="active">Aktywne</option>
              <option value="inactive">Nieaktywne</option>
            </select>
            <select
              value={filters.size}
              onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Wszystkie rozmiary</option>
              <option value="small">Małe (≤5 pracowników)</option>
              <option value="medium">Średnie (6-20 pracowników)</option>
              <option value="large">Duże ({'>'}20 pracowników)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              Brak firm spełniających kryteria
            </div>
          </Card>
        ) : (
          filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedCompany(company);
                setShowCompanyModal(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      {company.nip && (
                        <span>NIP: {company.nip}</span>
                      )}
                      {company.email && (
                        <span className="flex items-center">
                          <EnvelopeIcon className="w-3 h-3 mr-1" />
                          {company.email}
                        </span>
                      )}
                      {company.phone && (
                        <span className="flex items-center">
                          <PhoneIcon className="w-3 h-3 mr-1" />
                          {company.phone}
                        </span>
                      )}
                    </div>
                    {company.address && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        {company.address}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={company.stats.activeWorkers > 0 ? 'success' : 'warning'}>
                      {company.stats.activeWorkers > 0 ? 'Aktywna' : 'Nieaktywna'}
                    </Badge>
                    <Badge variant="secondary">
                      {company.stats.totalWorkers} pracowników
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>Projekty: {company.stats.totalProjects}</div>
                    <div>Utworzona: {formatDate(company.createdAt)}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <Modal
          isOpen={showCompanyModal}
          onClose={() => {
            setShowCompanyModal(false);
            setSelectedCompany(null);
          }}
          title={`Firma: ${selectedCompany.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Informacje podstawowe</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Nazwa:</span> {selectedCompany.name}</div>
                  {selectedCompany.nip && (
                    <div><span className="font-medium">NIP:</span> {selectedCompany.nip}</div>
                  )}
                  {selectedCompany.email && (
                    <div><span className="font-medium">Email:</span> {selectedCompany.email}</div>
                  )}
                  {selectedCompany.phone && (
                    <div><span className="font-medium">Telefon:</span> {selectedCompany.phone}</div>
                  )}
                  {selectedCompany.website && (
                    <div><span className="font-medium">Strona:</span> 
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        {selectedCompany.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Adres</h4>
                {selectedCompany.address ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <MapPinIcon className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                      <span>{selectedCompany.address}</span>
                    </div>
                    {selectedCompany.latitude && selectedCompany.longitude && (
                      <div className="text-xs text-gray-500">
                        Współrzędne: {selectedCompany.latitude}, {selectedCompany.longitude}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Brak adresu</p>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedCompany.description && (
              <div>
                <h4 className="font-semibold mb-2">Opis</h4>
                <p className="text-sm text-gray-600">{selectedCompany.description}</p>
              </div>
            )}

            {/* Statistics */}
            <div>
              <h4 className="font-semibold mb-2">Statystyki</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">{selectedCompany.stats.totalWorkers}</div>
                  <div className="text-sm text-gray-600">Pracowników</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">{selectedCompany.stats.totalProjects}</div>
                  <div className="text-sm text-gray-600">Projektów</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-lg font-bold text-purple-600">{selectedCompany.stats.completedProjects}</div>
                  <div className="text-sm text-gray-600">Ukończonych</div>
                </div>
              </div>
            </div>

            {/* Workers */}
            <div>
              <h4 className="font-semibold mb-2">Pracownicy</h4>
              <div className="space-y-2">
                {selectedCompany.workers.map((worker) => (
                  <div key={worker.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{worker.user.firstName} {worker.user.lastName}</div>
                      <div className="text-sm text-gray-600">{worker.user.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant={worker.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {worker.status}
                      </Badge>
                      {worker.position && (
                        <div className="text-sm text-gray-500 mt-1">{worker.position}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h4 className="font-semibold mb-2">Projekty</h4>
              <div className="space-y-2">
                {selectedCompany.projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant={project.status === 'COMPLETED' ? 'success' : project.status === 'IN_PROGRESS' ? 'warning' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" size="sm">
                Edytuj firmę
              </Button>
              <Button variant="outline" size="sm">
                Wyślij wiadomość
              </Button>
              <Button variant="outline" size="sm">
                Zablokuj firmę
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}; 
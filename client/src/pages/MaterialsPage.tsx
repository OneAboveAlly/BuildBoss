import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { materialService } from '../services/materialService';
import { companyService } from '../services/companyService';
import { projectService } from '../services/projectService';
import type { Material, MaterialFilters } from '../types/material';
import type { Company, Project } from '../types';
import MaterialCard from '../components/materials/MaterialCard';
import MaterialForm from '../components/materials/MaterialForm';
import StockAlerts from '../components/materials/StockAlerts';
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filtry
  const [filters, setFilters] = useState<MaterialFilters>({
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Ładowanie danych
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadMaterials();
      loadCategories();
      loadLowStockAlerts();
      loadProjects();
    }
  }, [selectedCompany, filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const companiesData = await companyService.getUserCompanies();
      setCompanies(companiesData);
      
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (err) {
      setError('Błąd podczas ładowania danych');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    if (!selectedCompany) return;
    
    try {
      const materialsData = await materialService.getMaterials({
        ...filters,
        companyId: selectedCompany,
        search: searchTerm || undefined
      });
      setMaterials(materialsData);
    } catch (err) {
      setError('Błąd podczas ładowania materiałów');
      console.error('Error loading materials:', err);
    }
  };

  const loadCategories = async () => {
    if (!selectedCompany) return;
    
    try {
      const categoriesData = await materialService.getCategories(selectedCompany);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadLowStockAlerts = async () => {
    if (!selectedCompany) return;
    
    try {
      const alertsData = await materialService.getLowStockMaterials(selectedCompany);
      setLowStockMaterials(alertsData);
    } catch (err) {
      console.error('Error loading low stock alerts:', err);
    }
  };

  const loadProjects = async () => {
    if (!selectedCompany) return;
    
    try {
      const projectsData = await projectService.getProjects({ companyId: selectedCompany });
      setProjects(projectsData);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleCreateMaterial = async (data: any) => {
    try {
      await materialService.createMaterial({
        ...data,
        companyId: selectedCompany
      });
      setShowForm(false);
      loadMaterials();
      loadLowStockAlerts();
    } catch (err) {
      console.error('Error creating material:', err);
      throw err;
    }
  };

  const handleUpdateMaterial = async (id: string, data: any) => {
    try {
      await materialService.updateMaterial(id, data);
      setEditingMaterial(null);
      loadMaterials();
      loadLowStockAlerts();
    } catch (err) {
      console.error('Error updating material:', err);
      throw err;
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten materiał?')) return;
    
    try {
      await materialService.deleteMaterial(id);
      loadMaterials();
      loadLowStockAlerts();
    } catch (err) {
      console.error('Error deleting material:', err);
      setError('Błąd podczas usuwania materiału');
    }
  };

  const handleQuantityUpdate = async (id: string, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set') => {
    try {
      await materialService.updateQuantity(id, { quantity, operation });
      loadMaterials();
      loadLowStockAlerts();
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Błąd podczas aktualizacji ilości');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleFilterChange = (key: keyof MaterialFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'name',
      sortOrder: 'asc'
    });
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Magazyn</h1>
              <p className="mt-2 text-gray-600">
                Zarządzaj materiałami budowlanymi i śledź stan magazynowy
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              {lowStockMaterials.length > 0 && (
                <button
                  onClick={() => setShowAlerts(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Alerty ({lowStockMaterials.length})
                </button>
              )}
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Dodaj materiał
              </button>
            </div>
          </div>
        </div>

        {/* Company Selector */}
        {companies.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wybierz firmę
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj materiałów..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            {/* View Mode and Filters */}
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtry
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategoria
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Wszystkie</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Projekt
                  </label>
                  <select
                    value={filters.projectId || ''}
                    onChange={(e) => handleFilterChange('projectId', e.target.value || undefined)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Wszystkie</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sortuj według
                  </label>
                  <select
                    value={filters.sortBy || 'name'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="name">Nazwa</option>
                    <option value="quantity">Ilość</option>
                    <option value="category">Kategoria</option>
                    <option value="createdAt">Data utworzenia</option>
                    <option value="updatedAt">Ostatnia aktualizacja</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kierunek
                  </label>
                  <select
                    value={filters.sortOrder || 'asc'}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="asc">Rosnąco</option>
                    <option value="desc">Malejąco</option>
                  </select>
                </div>
              </div>

              {/* Low Stock Filter */}
              <div className="mt-4 flex items-center">
                <input
                  id="lowStock"
                  type="checkbox"
                  checked={filters.lowStock || false}
                  onChange={(e) => handleFilterChange('lowStock', e.target.checked || undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lowStock" className="ml-2 block text-sm text-gray-900">
                  Pokaż tylko materiały z niskim stanem
                </label>
              </div>

              {/* Clear Filters */}
              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Wyczyść filtry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Materials List */}
        {materials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {selectedCompany ? 'Brak materiałów do wyświetlenia' : 'Wybierz firmę aby zobaczyć materiały'}
            </div>
            {selectedCompany && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Dodaj pierwszy materiał
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                viewMode={viewMode}
                onEdit={() => setEditingMaterial(material)}
                onDelete={() => handleDeleteMaterial(material.id)}
                onQuantityUpdate={(quantity, operation) => 
                  handleQuantityUpdate(material.id, quantity, operation)
                }
              />
            ))}
          </div>
        )}

        {/* Modals */}
        {showForm && (
          <MaterialForm
            onSubmit={handleCreateMaterial}
            onCancel={() => setShowForm(false)}
            companies={companies}
            projects={projects.filter(p => p.companyId === selectedCompany)}
            defaultCompanyId={selectedCompany}
          />
        )}

        {editingMaterial && (
          <MaterialForm
            material={editingMaterial}
            onSubmit={(data) => handleUpdateMaterial(editingMaterial.id, data)}
            onCancel={() => setEditingMaterial(null)}
            companies={companies}
            projects={projects.filter(p => p.companyId === editingMaterial.companyId)}
          />
        )}

        {showAlerts && (
          <StockAlerts
            materials={lowStockMaterials}
            onClose={() => setShowAlerts(false)}
            onQuantityUpdate={handleQuantityUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default MaterialsPage; 
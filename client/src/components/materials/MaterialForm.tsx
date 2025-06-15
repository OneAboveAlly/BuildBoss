import React, { useState, useEffect } from 'react';
import type { Material, CreateMaterialData, UpdateMaterialData } from '../../types/material';
import type { Company, Project } from '../../types';
import { MATERIAL_UNITS, MATERIAL_CATEGORIES } from '../../types/material';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MaterialFormProps {
  material?: Material;
  onSubmit: (data: CreateMaterialData | UpdateMaterialData) => Promise<void>;
  onCancel: () => void;
  companies: Company[];
  projects: Project[];
  defaultCompanyId?: string;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  material,
  onSubmit,
  onCancel,
  companies,
  projects,
  defaultCompanyId
}) => {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    description: material?.description || '',
    category: material?.category || '',
    unit: material?.unit || 'szt',
    quantity: material?.quantity?.toString() || '0',
    minQuantity: material?.minQuantity?.toString() || '',
    price: material?.price?.toString() || '',
    supplier: material?.supplier || '',
    location: material?.location || '',
    barcode: material?.barcode || '',
    notes: material?.notes || '',
    companyId: material?.companyId || defaultCompanyId || '',
    projectId: material?.projectId || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const isEditing = !!material;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Firma jest wymagana';
    }

    if (formData.quantity && isNaN(parseFloat(formData.quantity))) {
      newErrors.quantity = 'Ilość musi być liczbą';
    }

    if (formData.minQuantity && isNaN(parseFloat(formData.minQuantity))) {
      newErrors.minQuantity = 'Minimalna ilość musi być liczbą';
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Cena musi być liczbą';
    }

    if (parseFloat(formData.quantity) < 0) {
      newErrors.quantity = 'Ilość nie może być ujemna';
    }

    if (formData.minQuantity && parseFloat(formData.minQuantity) < 0) {
      newErrors.minQuantity = 'Minimalna ilość nie może być ujemna';
    }

    if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = 'Cena nie może być ujemna';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category || undefined,
        unit: formData.unit,
        quantity: parseFloat(formData.quantity) || 0,
        minQuantity: formData.minQuantity ? parseFloat(formData.minQuantity) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        supplier: formData.supplier.trim() || undefined,
        location: formData.location.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        projectId: formData.projectId || undefined
      };

      if (!isEditing) {
        (submitData as CreateMaterialData).companyId = formData.companyId;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Wystąpił błąd podczas zapisywania materiału' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edytuj materiał' : 'Dodaj nowy materiał'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa materiału *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="np. Cement Portland CEM I 42,5R"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Wybierz kategorię</option>
                {MATERIAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jednostka miary
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {MATERIAL_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ilość
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
            </div>

            {/* Min Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimalna ilość (alert)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => handleInputChange('minQuantity', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.minQuantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Próg alertu o niskim stanie"
              />
              {errors.minQuantity && <p className="mt-1 text-sm text-red-600">{errors.minQuantity}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cena za jednostkę (PLN)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dostawca
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="np. Budmat Sp. z o.o."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokalizacja w magazynie
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="np. Hala A, Regał 3, Półka 2"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kod kreskowy
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="np. 1234567890123"
              />
            </div>

            {/* Company */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma *
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => handleInputChange('companyId', e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.companyId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Wybierz firmę</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.companyId && <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>}
              </div>
            )}

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projekt (opcjonalnie)
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleInputChange('projectId', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Brak przypisania</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dodatkowe informacje o materiale..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notatki
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dodatkowe notatki..."
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="text-red-600 text-sm">{errors.submit}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Zapisywanie...' : (isEditing ? 'Zapisz zmiany' : 'Dodaj materiał')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm; 
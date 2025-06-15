import React, { useState } from 'react';
import type { Material } from '../../types/material';
import { useAuth } from '../../contexts/AuthContext';
import {
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MinusIcon,
  BuildingOfficeIcon,
  FolderIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface MaterialCardProps {
  material: Material;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDelete: () => void;
  onQuantityUpdate: (quantity: number, operation: 'set' | 'add' | 'subtract') => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  viewMode,
  onEdit,
  onDelete,
  onQuantityUpdate
}) => {
  const { user } = useAuth();
  const [quantityInput, setQuantityInput] = useState('');
  const [showQuantityForm, setShowQuantityForm] = useState(false);

  // Sprawdź uprawnienia
  const canEdit = user?.role === 'SUPERADMIN' || 
                  material.createdById === user?.id ||
                  // TODO: Sprawdź uprawnienia w firmie
                  true;

  const handleQuantitySubmit = (operation: 'set' | 'add' | 'subtract') => {
    const quantity = parseFloat(quantityInput);
    if (isNaN(quantity) || quantity < 0) return;
    
    onQuantityUpdate(quantity, operation);
    setQuantityInput('');
    setShowQuantityForm(false);
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(price);
  };

  const getStockStatusColor = () => {
    if (material.isLowStock) return 'text-red-600 bg-red-50';
    if (material.quantity === 0) return 'text-gray-600 bg-gray-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusText = () => {
    if (material.quantity === 0) return 'Brak w magazynie';
    if (material.isLowStock) return 'Niski stan';
    return 'Dostępny';
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            {/* Name and Description */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900">{material.name}</h3>
              {material.description && (
                <p className="text-sm text-gray-600 mt-1">{material.description}</p>
              )}
              {material.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  {material.category}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {material.quantity} {material.unit}
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor()}`}>
                {material.isLowStock && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                {getStockStatusText()}
              </div>
            </div>

            {/* Location and Project */}
            <div>
              {material.location && (
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {material.location}
                </div>
              )}
              {material.project && (
                <div className="flex items-center text-sm text-gray-600">
                  <FolderIcon className="h-4 w-4 mr-1" />
                  {material.project.name}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="text-center">
              {material.price && (
                <div className="text-lg font-medium text-gray-900">
                  {formatPrice(material.price)}/{material.unit}
                </div>
              )}
              {material.supplier && (
                <div className="text-sm text-gray-600 mt-1">
                  {material.supplier}
                </div>
              )}
            </div>

            {/* Min Quantity */}
            <div className="text-center">
              {material.minQuantity && (
                <div className="text-sm text-gray-600">
                  Min: {material.minQuantity} {material.unit}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setShowQuantityForm(!showQuantityForm)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Aktualizuj ilość"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                title="Edytuj"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Usuń"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quantity Update Form */}
        {showQuantityForm && canEdit && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                placeholder="Ilość"
                className="block w-24 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => handleQuantitySubmit('set')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Ustaw
              </button>
              <button
                onClick={() => handleQuantitySubmit('add')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
              >
                Dodaj
              </button>
              <button
                onClick={() => handleQuantitySubmit('subtract')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                Odejmij
              </button>
              <button
                onClick={() => setShowQuantityForm(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 truncate">{material.name}</h3>
            {material.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                {material.category}
              </span>
            )}
          </div>
          {canEdit && (
            <div className="flex space-x-1 ml-2">
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Edytuj"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Usuń"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        {material.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{material.description}</p>
        )}

        {/* Quantity */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-900">
            {material.quantity}
          </div>
          <div className="text-sm text-gray-600">{material.unit}</div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStockStatusColor()}`}>
            {material.isLowStock && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
            {getStockStatusText()}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {material.location && (
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{material.location}</span>
            </div>
          )}
          
          {material.project && (
            <div className="flex items-center text-gray-600">
              <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{material.project.name}</span>
            </div>
          )}

          {material.price && (
            <div className="flex items-center text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{formatPrice(material.price)}/{material.unit}</span>
            </div>
          )}

          {material.supplier && (
            <div className="flex items-center text-gray-600">
              <BuildingOfficeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{material.supplier}</span>
            </div>
          )}

          {material.minQuantity && (
            <div className="text-gray-600">
              Minimum: {material.minQuantity} {material.unit}
            </div>
          )}
        </div>

        {/* Quantity Actions */}
        {canEdit && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {!showQuantityForm ? (
              <button
                onClick={() => setShowQuantityForm(true)}
                className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Aktualizuj ilość
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  placeholder="Ilość"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuantitySubmit('set')}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Ustaw
                  </button>
                  <button
                    onClick={() => handleQuantitySubmit('add')}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Dodaj
                  </button>
                  <button
                    onClick={() => handleQuantitySubmit('subtract')}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Odejmij
                  </button>
                </div>
                <button
                  onClick={() => setShowQuantityForm(false)}
                  className="w-full px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center">
          <UserIcon className="h-3 w-3 mr-1" />
          {material.createdBy.firstName} {material.createdBy.lastName}
        </div>
      </div>
    </div>
  );
};

export default MaterialCard; 
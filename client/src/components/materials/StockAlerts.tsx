import React, { useState } from 'react';
import type { Material } from '../../types/material';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MinusIcon,
  MapPinIcon,
  FolderIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface StockAlertsProps {
  materials: Material[];
  onClose: () => void;
  onQuantityUpdate: (id: string, quantity: number, operation: 'set' | 'add' | 'subtract') => void;
}

const StockAlerts: React.FC<StockAlertsProps> = ({
  materials,
  onClose,
  onQuantityUpdate
}) => {
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

  const handleQuantityChange = (materialId: string, value: string) => {
    setQuantityInputs(prev => ({ ...prev, [materialId]: value }));
  };

  const handleQuantitySubmit = (materialId: string, operation: 'set' | 'add' | 'subtract') => {
    const quantity = parseFloat(quantityInputs[materialId] || '0');
    if (isNaN(quantity) || quantity < 0) return;
    
    onQuantityUpdate(materialId, quantity, operation);
    setQuantityInputs(prev => ({ ...prev, [materialId]: '' }));
  };

  const getAlertLevel = (material: Material) => {
    if (material.quantity === 0) return 'critical';
    if (material.minQuantity && material.quantity <= material.minQuantity * 0.5) return 'critical';
    return 'warning';
  };

  const getAlertColor = (level: 'critical' | 'warning') => {
    return level === 'critical' 
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-orange-50 border-orange-200 text-orange-800';
  };

  const getAlertIcon = (level: 'critical' | 'warning') => {
    return level === 'critical' ? 'text-red-500' : 'text-orange-500';
  };

  if (materials.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Alerty magazynowe</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center py-8">
            <div className="text-green-600 text-lg mb-2">✅ Wszystko w porządku!</div>
            <p className="text-gray-600">Brak materiałów z niskim stanem magazynowym.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Alerty magazynowe ({materials.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Alert Summary */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-orange-800">
                Uwaga! Materiały wymagają uzupełnienia
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                Znaleziono {materials.length} materiałów z niskim stanem magazynowym. 
                Rozważ uzupełnienie zapasów aby uniknąć opóźnień w projektach.
              </p>
            </div>
          </div>
        </div>

        {/* Materials List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {materials.map((material) => {
            const alertLevel = getAlertLevel(material);
            const alertColor = getAlertColor(alertLevel);
            const alertIconColor = getAlertIcon(alertLevel);

            return (
              <div
                key={material.id}
                className={`border rounded-lg p-4 ${alertColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Material Header */}
                    <div className="flex items-start mb-3">
                      <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 mr-3 ${alertIconColor}`} />
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {material.name}
                        </h4>
                        {material.category && (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mt-1">
                            {material.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Aktualny stan</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {material.quantity} {material.unit}
                        </div>
                        {material.quantity === 0 && (
                          <div className="text-sm text-red-600 font-medium">
                            Brak w magazynie!
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Minimum</div>
                        <div className="text-lg font-medium text-gray-900">
                          {material.minQuantity || 'Nie ustawiono'} {material.minQuantity && material.unit}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600">Potrzeba uzupełnić</div>
                        <div className="text-lg font-medium text-red-600">
                          {material.minQuantity 
                            ? Math.max(0, material.minQuantity - material.quantity)
                            : '?'
                          } {material.minQuantity && material.unit}
                        </div>
                      </div>
                    </div>

                    {/* Material Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      {material.location && (
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {material.location}
                        </div>
                      )}
                      
                      {material.project && (
                        <div className="flex items-center">
                          <FolderIcon className="h-4 w-4 mr-1" />
                          {material.project.name}
                        </div>
                      )}

                      {material.supplier && (
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                          {material.supplier}
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={quantityInputs[material.id] || ''}
                          onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                          placeholder="Ilość"
                          className="block w-24 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                        <button
                          onClick={() => handleQuantitySubmit(material.id, 'add')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Dodaj
                        </button>
                        <button
                          onClick={() => handleQuantitySubmit(material.id, 'set')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Ustaw
                        </button>
                        {material.minQuantity && (
                          <button
                            onClick={() => {
                              setQuantityInputs(prev => ({ 
                                ...prev, 
                                [material.id]: material.minQuantity!.toString() 
                              }));
                              handleQuantitySubmit(material.id, 'set');
                            }}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Ustaw minimum
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            💡 Tip: Ustaw minimalne ilości dla materiałów aby otrzymywać alerty przed wyczerpaniem zapasów
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAlerts; 
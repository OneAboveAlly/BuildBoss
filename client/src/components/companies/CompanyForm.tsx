import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { AddressAutocomplete, type AddressData } from '../common/AddressAutocomplete';
import {
  BuildingOffice2Icon,
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { CompanyWithDetails, CreateCompanyRequest } from '../../types';

interface CompanyFormProps {
  company?: CompanyWithDetails;
  onSubmit: (data: CreateCompanyRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface InputFieldProps {
  icon: React.ComponentType<any>;
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  rows?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
  icon: Icon, 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  required = false,
  rows,
  value,
  onChange,
  error
}) => {
  const hasError = !!error;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="flex items-center text-sm font-medium text-secondary-700">
        <Icon className="w-4 h-4 mr-2 text-secondary-500" />
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {rows ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            className={`
              w-full px-4 py-3 pl-4 pr-10
              border-2 rounded-xl
              bg-white
              placeholder-secondary-400
              text-secondary-900
              transition-all duration-200
              focus:outline-none focus:ring-4
              ${hasError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-100 hover:border-secondary-300'
              }
            `}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className={`
              w-full px-4 py-3 pl-4 pr-10
              border-2 rounded-xl
              bg-white
              placeholder-secondary-400
              text-secondary-900
              transition-all duration-200
              focus:outline-none focus:ring-4
              ${hasError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                : 'border-secondary-200 focus:border-primary-500 focus:ring-primary-100 hover:border-secondary-300'
              }
            `}
            placeholder={placeholder}
          />
        )}
        {/* Status icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {hasError ? (
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
          ) : value && !hasError ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          ) : null}
        </div>
      </div>
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600">
          <ExclamationCircleIcon className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    name: company?.name || '',
    nip: company?.nip || '',
    address: company?.address || '',
    latitude: company?.latitude,
    longitude: company?.longitude,
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
    description: company?.description || ''
  });
  
  const [addressData, setAddressData] = useState<AddressData>({
    address: company?.address || '',
    city: company?.address ? company.address.split(',').pop()?.trim() || '' : '',
    voivodeship: 'mazowieckie', // domyślne
    country: 'Polska',
    latitude: company?.latitude,
    longitude: company?.longitude
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressChange = (newAddressData: AddressData) => {
    setAddressData(newAddressData);
    setFormData(prev => ({
      ...prev,
      address: newAddressData.address,
      latitude: newAddressData.latitude,
      longitude: newAddressData.longitude
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa firmy jest wymagana';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nazwa firmy musi mieć co najmniej 2 znaki';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Podaj prawidłowy adres email';
    }

    if (formData.nip && !/^\d{10}$/.test(formData.nip.replace(/[-\s]/g, ''))) {
      newErrors.nip = 'NIP musi składać się z 10 cyfr';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        nip: formData.nip?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        description: formData.description?.trim() || undefined
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="bg-white">
      {/* Header with illustration */}
      <div className="text-center mb-8 p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <BuildingOffice2Icon className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-xl font-bold text-secondary-900 mb-2">
          {company ? 'Edytuj dane firmy' : 'Utwórz nową firmę'}
        </h3>
        <p className="text-secondary-600">
          {company 
            ? 'Zaktualizuj informacje o swojej firmie' 
            : 'Wprowadź podstawowe informacje o swojej firmie budowlanej'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Podstawowe informacje */}
        <div className="space-y-6">
          <div className="border-l-4 border-primary-500 pl-4">
            <h4 className="text-lg font-semibold text-secondary-900 mb-1">Podstawowe informacje</h4>
            <p className="text-sm text-secondary-600">Dane podstawowe firmy</p>
          </div>

          <InputField
            icon={BuildingOffice2Icon}
            label="Nazwa firmy"
            name="name"
            placeholder="np. BudMaster Sp. z o.o."
            required
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />

          <InputField
            icon={IdentificationIcon}
            label="NIP"
            name="nip"
            placeholder="1234567890"
            value={formData.nip || ''}
            onChange={handleChange}
            error={errors.nip}
          />
        </div>

        {/* Dane kontaktowe */}
        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-lg font-semibold text-secondary-900 mb-1">Dane kontaktowe</h4>
            <p className="text-sm text-secondary-600">Sposoby kontaktu z firmą</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              icon={EnvelopeIcon}
              label="Email"
              name="email"
              type="email"
              placeholder="kontakt@firma.pl"
              value={formData.email || ''}
              onChange={handleChange}
              error={errors.email}
            />

            <InputField
              icon={PhoneIcon}
              label="Telefon"
              name="phone"
              type="tel"
              placeholder="+48 123 456 789"
              value={formData.phone || ''}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-secondary-700">
              <MapPinIcon className="w-4 h-4 mr-2 text-secondary-500" />
              Adres firmy
            </label>
            <AddressAutocomplete
              value={addressData}
              onChange={handleAddressChange}
              placeholder="Wpisz adres siedziby firmy..."
              label=""
              showFullAddress={true}
            />
            {addressData.latitude && addressData.longitude && (
              <div className="text-sm text-green-600 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Adres został znaleziony na mapie</span>
              </div>
            )}
          </div>

          <InputField
            icon={GlobeAltIcon}
            label="Strona internetowa"
            name="website"
            type="url"
            placeholder="https://www.firma.pl"
            value={formData.website || ''}
            onChange={handleChange}
          />
        </div>

        {/* Dodatkowe informacje */}
        <div className="space-y-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-lg font-semibold text-secondary-900 mb-1">Dodatkowe informacje</h4>
            <p className="text-sm text-secondary-600">Opcjonalny opis firmy</p>
          </div>

          <InputField
            icon={DocumentTextIcon}
            label="Opis firmy"
            name="description"
            placeholder="Krótki opis działalności firmy..."
            rows={4}
            value={formData.description || ''}
            onChange={handleChange}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-secondary-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            className="order-1 sm:order-2"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Tworzenie...
              </span>
            ) : (
              <span className="flex items-center">
                <BuildingOffice2Icon className="w-4 h-4 mr-2" />
                {company ? 'Zapisz zmiany' : 'Utwórz firmę'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
 
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import type { CompanyWithDetails, CreateCompanyRequest } from '../../types';

interface CompanyFormProps {
  company?: CompanyWithDetails;
  onSubmit: (data: CreateCompanyRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

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
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
    description: company?.description || ''
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nazwa firmy */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nazwa firmy *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Wprowadź nazwę firmy"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* NIP */}
      <div>
        <label htmlFor="nip" className="block text-sm font-medium text-gray-700 mb-1">
          NIP
        </label>
        <input
          type="text"
          id="nip"
          name="nip"
          value={formData.nip}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.nip ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="1234567890"
        />
        {errors.nip && (
          <p className="mt-1 text-sm text-red-600">{errors.nip}</p>
        )}
      </div>

      {/* Email i Telefon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="firma@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+48 123 456 789"
          />
        </div>
      </div>

      {/* Adres */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Adres
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ul. Przykładowa 123, 00-000 Warszawa"
        />
      </div>

      {/* Strona internetowa */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
          Strona internetowa
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://www.example.com"
        />
      </div>

      {/* Opis */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Opis
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Krótki opis firmy..."
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {company ? 'Zapisz zmiany' : 'Utwórz firmę'}
        </Button>
      </div>
    </form>
  );
};
 
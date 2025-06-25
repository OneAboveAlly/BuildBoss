import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { AddressAutocomplete, type AddressData } from '../common/AddressAutocomplete';
import { companyService } from '../../services/companyService';
import type { 
  CreateJobOfferData, 
  JobOffer
} from '../../types/job';
import { 
  JobCategory, 
  JobType, 
  ExperienceLevel 
} from '../../types/job';
import type { CompanyWithDetails } from '../../types';
import { 
  JOB_CATEGORIES, 
  JOB_TYPES, 
  EXPERIENCE_LEVELS 
} from '../../types/job';

interface JobOfferFormProps {
  jobOffer?: JobOffer;
  onSubmit: (data: CreateJobOfferData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const JobOfferForm: React.FC<JobOfferFormProps> = ({
  jobOffer,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [formData, setFormData] = useState<CreateJobOfferData>({
    title: jobOffer?.title || '',
    description: jobOffer?.description || '',
    category: jobOffer?.category || JobCategory.CONSTRUCTION_WORKER,
    type: jobOffer?.type || JobType.FULL_TIME,
    voivodeship: jobOffer?.voivodeship || '',
    city: jobOffer?.city || '',
    address: jobOffer?.address || '',
    latitude: jobOffer?.latitude,
    longitude: jobOffer?.longitude,
    salaryMin: jobOffer?.salaryMin || undefined,
    salaryMax: jobOffer?.salaryMax || undefined,
    currency: jobOffer?.currency || 'PLN',
    experience: jobOffer?.experience || ExperienceLevel.JUNIOR,
    requirements: jobOffer?.requirements || '',
    benefits: jobOffer?.benefits || '',
    contactEmail: jobOffer?.contactEmail || '',
    contactPhone: jobOffer?.contactPhone || '',
    isPublic: jobOffer?.isPublic ?? true,
    companyId: jobOffer?.company.id || ''
  });
  
  const [useCompanyAddress, setUseCompanyAddress] = useState(false);
  const [addressData, setAddressData] = useState<AddressData>({
    address: jobOffer?.address || '',
    city: jobOffer?.city || '',
    voivodeship: jobOffer?.voivodeship || '',
    country: 'Polska',
    latitude: jobOffer?.latitude,
    longitude: jobOffer?.longitude
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getCompanies();
      setCompanies(companiesData);
      
      // Jeśli nie ma wybranej firmy i istnieją firmy, wybierz pierwszą
      if (!formData.companyId && companiesData.length > 0) {
        setFormData(prev => ({ ...prev, companyId: companiesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleCompanyAddressToggle = () => {
    if (!useCompanyAddress) {
      // Znajdź wybraną firmę i użyj jej adresu
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      if (selectedCompany && selectedCompany.address) {
        const newAddressData: AddressData = {
          address: selectedCompany.address,
          city: selectedCompany.address.split(',').pop()?.trim() || '',
          voivodeship: 'mazowieckie', // domyślne
          country: 'Polska',
          latitude: selectedCompany.latitude,
          longitude: selectedCompany.longitude
        };
        setAddressData(newAddressData);
        updateFormFromAddress(newAddressData);
        setUseCompanyAddress(true);
      }
    } else {
      setUseCompanyAddress(false);
    }
  };

  const updateFormFromAddress = (newAddressData: AddressData) => {
    setFormData(prev => ({
      ...prev,
      address: newAddressData.address,
      city: newAddressData.city,
      voivodeship: newAddressData.voivodeship,
      latitude: newAddressData.latitude,
      longitude: newAddressData.longitude
    }));
  };

  const handleAddressChange = (newAddressData: AddressData) => {
    setAddressData(newAddressData);
    updateFormFromAddress(newAddressData);
    // Jeśli użytkownik ręcznie zmienił adres, wyłącz opcję "użyj adresu firmy"
    if (useCompanyAddress) {
      setUseCompanyAddress(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tytuł jest wymagany';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Opis jest wymagany';
    }

    if (!formData.companyId) {
      newErrors.companyId = 'Wybór firmy jest wymagany';
    }

    if (!formData.voivodeship) {
      newErrors.voivodeship = 'Województwo jest wymagane';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Miasto jest wymagane';
    }

    if (formData.salaryMin && formData.salaryMax && formData.salaryMin > formData.salaryMax) {
      newErrors.salaryMax = 'Maksymalne wynagrodzenie nie może być mniejsze od minimalnego';
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
      await onSubmit(formData);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      if (error.response?.data?.error) {
        setErrors({ submit: error.response.data.error });
      }
    }
  };

  const handleInputChange = (field: keyof CreateJobOfferData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Podstawowe informacje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Firma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firma *
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => handleInputChange('companyId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.companyId ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={!!jobOffer} // Nie można zmieniać firmy przy edycji
            >
              <option value="">Wybierz firmę</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="text-red-600 text-sm mt-1">{errors.companyId}</p>
            )}
          </div>

          {/* Tytuł */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tytuł stanowiska *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="np. Murarz - budowa domów jednorodzinnych"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Kategoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as JobCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(JOB_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Typ pracy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ pracy
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as JobType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(JOB_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Doświadczenie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wymagane doświadczenie
            </label>
            <select
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value as ExperienceLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(EXPERIENCE_LEVELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opis stanowiska</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opis pracy *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Opisz szczegółowo zakres obowiązków, warunki pracy..."
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Wymagania */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wymagania
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="Określ wymagania dotyczące kwalifikacji, doświadczenia, uprawnień..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Benefity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oferujemy
            </label>
            <textarea
              value={formData.benefits}
              onChange={(e) => handleInputChange('benefits', e.target.value)}
              placeholder="Opisz benefity, dodatki, możliwości rozwoju..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lokalizacja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opcja użycia adresu firmy */}
          {formData.companyId && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="useCompanyAddress"
                checked={useCompanyAddress}
                onChange={handleCompanyAddressToggle}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="useCompanyAddress" className="text-sm text-gray-700">
                Użyj adresu firmy
              </label>
            </div>
          )}

          {/* Wyszukiwarka adresów */}
          <AddressAutocomplete
            value={addressData}
            onChange={handleAddressChange}
            placeholder="Wpisz miasto lub adres pracy..."
            required
            error={errors.city || errors.voivodeship}
            label="Lokalizacja pracy"
            showFullAddress={true}
          />
          
          {/* Dodatkowe informacje o lokalizacji */}
          {addressData.latitude && addressData.longitude && (
            <div className="text-sm text-green-600 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Lokalizacja została znaleziona na mapie</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wynagrodzenie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Minimalne wynagrodzenie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Od (PLN)
              </label>
              <input
                type="number"
                value={formData.salaryMin || ''}
                onChange={(e) => handleInputChange('salaryMin', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="3000"
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Maksymalne wynagrodzenie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do (PLN)
              </label>
              <input
                type="number"
                value={formData.salaryMax || ''}
                onChange={(e) => handleInputChange('salaryMax', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="5000"
                min="0"
                step="100"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.salaryMax ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.salaryMax && (
                <p className="text-red-600 text-sm mt-1">{errors.salaryMax}</p>
              )}
            </div>

            {/* Waluta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waluta
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email kontaktowy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email kontaktowy
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="rekrutacja@firma.pl"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Telefon kontaktowy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon kontaktowy
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              placeholder="+48 123 456 789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Widoczność publiczna */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Ogłoszenie widoczne publicznie
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Przyciski akcji */}
      <div className="flex justify-end space-x-4">
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
          disabled={loading}
          className="bg-primary-600 hover:bg-primary-700"
        >
          {loading ? 'Zapisywanie...' : (jobOffer ? 'Zaktualizuj ogłoszenie' : 'Utwórz ogłoszenie')}
        </Button>
      </div>
    </form>
  );
};
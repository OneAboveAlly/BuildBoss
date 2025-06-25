import React, { useState, useEffect } from 'react';
import {
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { tagService, type Tag, type CreateTagData, type UpdateTagData } from '../../services/tagService';
import { companyService } from '../../services/companyService';
import { useAuth } from '../../contexts/AuthContext';

interface Company {
  id: string;
  name: string;
}

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTagCreated?: (tag: Tag) => void;
  onTagUpdated?: (tag: Tag) => void;
  onTagDeleted?: (tagId: string) => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  isOpen,
  onClose,
  onTagCreated,
  onTagUpdated,
  onTagDeleted
}) => {
  const { user } = useAuth();
  
  // State
  const [tags, setTags] = useState<Tag[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });
  
  // Delete confirmation
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  // Load tags when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadTags();
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      const companiesData = await companyService.getUserCompanies();
      setCompanies(companiesData);
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setError('Błąd podczas ładowania firm');
    }
  };

  const loadTags = async () => {
    if (!selectedCompany) return;
    
    try {
      setLoading(true);
      const tagsData = await tagService.getTags(selectedCompany);
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading tags:', error);
      setError('Błąd podczas ładowania tagów');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !formData.name.trim()) return;

    try {
      setLoading(true);
      const tagData: CreateTagData = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim() || undefined,
        companyId: selectedCompany
      };

      const newTag = await tagService.createTag(tagData);
      setTags(prev => [...prev, newTag]);
      setShowCreateForm(false);
      setFormData({ name: '', color: '#3B82F6', description: '' });
      onTagCreated?.(newTag);
    } catch (error: any) {
      console.error('Error creating tag:', error);
      setError(error.response?.data?.error || 'Błąd podczas tworzenia tagu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !formData.name.trim()) return;

    try {
      setLoading(true);
      const updateData: UpdateTagData = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim() || undefined
      };

      const updatedTag = await tagService.updateTag(editingTag.id, updateData);
      setTags(prev => prev.map(tag => tag.id === editingTag.id ? updatedTag : tag));
      setEditingTag(null);
      setFormData({ name: '', color: '#3B82F6', description: '' });
      onTagUpdated?.(updatedTag);
    } catch (error: any) {
      console.error('Error updating tag:', error);
      setError(error.response?.data?.error || 'Błąd podczas aktualizacji tagu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    try {
      setLoading(true);
      await tagService.deleteTag(tag.id);
      setTags(prev => prev.filter(t => t.id !== tag.id));
      setDeletingTag(null);
      onTagDeleted?.(tag.id);
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      setError(error.response?.data?.error || 'Błąd podczas usuwania tagu');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || ''
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setShowCreateForm(false);
    setFormData({ name: '', color: '#3B82F6', description: '' });
  };

  const availableColors = tagService.getAvailableColors();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <TagIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Zarządzanie tagami
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Company Selector */}
          {companies.length > 1 && (
            <div className="p-6 border-b border-gray-200">
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

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Create/Edit Form */}
            {(showCreateForm || editingTag) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingTag ? 'Edytuj tag' : 'Utwórz nowy tag'}
                </h3>
                
                <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nazwa tagu *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="np. Pilne, Backend, Klient A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kolor
                      </label>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: formData.color }}
                        />
                        <select
                          value={formData.color}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          {availableColors.map(color => (
                            <option key={color.value} value={color.value}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opis (opcjonalny)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Krótki opis zastosowania tagu"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.name.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Zapisywanie...' : editingTag ? 'Zaktualizuj' : 'Utwórz'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Tag Button */}
            {!showCreateForm && !editingTag && (
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Dodaj nowy tag
                </button>
              </div>
            )}

            {/* Tags List */}
            {loading && tags.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Ładowanie tagów...</span>
              </div>
            ) : tags.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        </div>
                        
                        {tag.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {tag.description}
                          </p>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          {tagService.getUsageSummary(tag)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => startEdit(tag)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Edytuj tag"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTag(tag)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Usuń tag"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedCompany ? (
              <div className="text-center py-8 text-gray-500">
                <TagIcon className="w-12 h-12 mx-auto mb-2" />
                <p>Brak tagów w tej firmie</p>
                <p className="text-sm">Utwórz pierwszy tag, aby rozpocząć organizację</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Wybierz firmę, aby zarządzać tagami</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Usuń tag
                  </h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Czy na pewno chcesz usunąć tag "{deletingTag.name}"?
                  {deletingTag.usage && deletingTag.usage > 0 && (
                    <span className="block mt-2 text-red-600 font-medium">
                      Tag jest używany w {deletingTag.usage} elementach i nie może zostać usunięty.
                    </span>
                  )}
                </p>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setDeletingTag(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Anuluj
                  </button>
                  {(!deletingTag.usage || deletingTag.usage === 0) && (
                    <button
                      onClick={() => handleDeleteTag(deletingTag)}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Usuwanie...' : 'Usuń'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
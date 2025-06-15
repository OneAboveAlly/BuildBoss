import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { CompanyWithDetails } from '../../types';

interface CompanyCardProps {
  company: CompanyWithDetails;
  onView: (company: CompanyWithDetails) => void;
  onEdit?: (company: CompanyWithDetails) => void;
  onDelete?: (company: CompanyWithDetails) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onView,
  onEdit,
  onDelete
}) => {
  const canEdit = company.userPermissions.canEdit;
  const isOwner = company.userRole === 'OWNER';

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onView(company)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {company.logo && (
                <img 
                  src={company.logo} 
                  alt={`${company.name} logo`}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              {company.name}
              <span className={`px-2 py-1 text-xs rounded-full ${
                isOwner 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isOwner ? 'Właściciel' : 'Pracownik'}
              </span>
            </CardTitle>
            {company.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {company.description}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(company)}
                title="Edytuj firmę"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            
            {isOwner && onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(company)}
                title="Usuń firmę"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Pracownicy:</span>
            <span className="ml-2">{company._count.workers}</span>
          </div>
          
          {company.nip && (
            <div>
              <span className="font-medium text-gray-700">NIP:</span>
              <span className="ml-2">{company.nip}</span>
            </div>
          )}
          
          {company.email && (
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2">{company.email}</span>
            </div>
          )}
          
          {company.phone && (
            <div>
              <span className="font-medium text-gray-700">Telefon:</span>
              <span className="ml-2">{company.phone}</span>
            </div>
          )}
        </div>

        {company.address && (
          <div className="mt-3 text-sm">
            <span className="font-medium text-gray-700">Adres:</span>
            <span className="ml-2">{company.address}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Utworzono: {new Date(company.createdAt).toLocaleDateString('pl-PL')}</span>
          <span>Właściciel: {company.createdBy.firstName} {company.createdBy.lastName}</span>
        </div>
      </CardContent>
    </Card>
  );
}; 
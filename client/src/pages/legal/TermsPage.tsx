import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalDocumentViewer from '../../components/legal/LegalDocumentViewer';

const TermsPage: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <LegalDocumentViewer
        type="terms"
        language={i18n.language}
        showPrint={true}
        showSearch={true}
      />
    </div>
  );
};

export default TermsPage; 
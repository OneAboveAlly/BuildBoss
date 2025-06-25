import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalDocumentViewer from '../../components/legal/LegalDocumentViewer';

const PrivacyPage: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <LegalDocumentViewer
        type="privacy"
        language={i18n.language}
        showPrint={true}
        showSearch={true}
      />
    </div>
  );
};

export default PrivacyPage; 
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LegalDocumentViewerProps {
  type: 'terms' | 'privacy' | 'gdpr';
  language?: string;
  showSearch?: boolean;
  showPrint?: boolean;
  className?: string;
}

interface DocumentData {
  content: string;
  language: string;
  type: string;
  lastModified: string;
}

const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  type,
  language,
  showSearch = true,
  showPrint = true,
  className = ''
}) => {
  const { t, i18n } = useTranslation('legal');
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number>(0);

  const currentLanguage = language || i18n.language || 'pl';

  useEffect(() => {
    fetchDocument();
  }, [type, currentLanguage]);

  useEffect(() => {
    if (document && searchTerm) {
      performSearch();
    } else {
      clearSearch();
    }
  }, [searchTerm, document]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/legal/${type}/${currentLanguage}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setDocument(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch document');
      }
    } catch (err) {
      console.error('Error fetching legal document:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = () => {
    if (!document || !searchTerm.trim()) {
      setSearchResults(0);
      return;
    }

    const content = document.content.toLowerCase();
    const term = searchTerm.toLowerCase();
    const matches = (content.match(new RegExp(term, 'g')) || []).length;
    setSearchResults(matches);

    // Highlight search results in the document
    highlightSearchResults();
  };

  const highlightSearchResults = () => {
    const contentElement = window.document.getElementById('document-content');
    if (!contentElement || !searchTerm.trim()) return;

    // Remove existing highlights
    clearSearch();

    const walker = window.document.createTreeWalker(
      contentElement,
      NodeFilter.SHOW_TEXT
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      if (!parent) return;

      const text = textNode.textContent || '';
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      
      if (regex.test(text)) {
        const highlightedHTML = text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
        const wrapper = window.document.createElement('span');
        wrapper.innerHTML = highlightedHTML;
        parent.replaceChild(wrapper, textNode);
      }
    });
  };

  const clearSearch = () => {
    const contentElement = window.document.getElementById('document-content');
    if (!contentElement) return;

    const marks = contentElement.querySelectorAll('mark');
    marks.forEach((mark: Element) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(window.document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
  };

  const handlePrint = () => {
    const printContent = document?.content || '';
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${t(`documents.${type}`)}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
              h1, h2, h3 { color: #333; }
              h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
              h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              p { margin-bottom: 15px; }
              ul, ol { margin-bottom: 15px; }
              li { margin-bottom: 5px; }
              .header { text-align: center; margin-bottom: 30px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${t(`documents.${type}`)}</h1>
              <p>${t('documents.last_updated')}: ${new Date(document?.lastModified || '').toLocaleDateString()}</p>
            </div>
            <div>${markdownToHtml(printContent)}</div>
            <div class="footer">
              <p>© 2025 SiteBoss. ${t('footer.copyright')}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const markdownToHtml = (markdown: string): string => {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/gim, '<p>$1</p>')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">{t('documents.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{t('documents.error')}</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={fetchDocument}
            className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-gray-500">{t('documents.not_found')}</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header with controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t(`documents.${type}`)}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('documents.last_updated')}: {new Date(document.lastModified).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {showPrint && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {t('documents.print')}
              </button>
            )}
            
            <button
              onClick={scrollToTop}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              {t('navigation.back_to_top')}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('documents.search')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600">
                {searchResults > 0 
                  ? `${searchResults} ${searchResults === 1 ? 'wynik' : 'wyników'} dla "${searchTerm}"`
                  : t('documents.no_results')
                }
              </p>
            )}
          </div>
        )}
      </div>

      {/* Document content */}
      <div className="bg-white shadow-sm rounded-lg">
        <div 
          id="document-content"
          className="prose prose-lg max-w-none p-8"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(document.content) }}
        />
      </div>
    </div>
  );
};

export default LegalDocumentViewer; 
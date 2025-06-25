const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// Supported languages
const SUPPORTED_LANGUAGES = ['pl', 'de', 'en', 'ua'];
const DEFAULT_LANGUAGE = 'pl';

// Helper function to validate language
const validateLanguage = (lang) => {
  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
};

// Helper function to read legal document
const readLegalDocument = async (type, lang) => {
  try {
    const validLang = validateLanguage(lang);
    const filePath = path.join(__dirname, '..', 'legal', type, `${type}-${validLang}.md`);
    
    // Check if file exists
    await fs.access(filePath);
    const content = await fs.readFile(filePath, 'utf8');
    
    return {
      success: true,
      content,
      language: validLang,
      type,
      lastModified: (await fs.stat(filePath)).mtime
    };
  } catch (error) {
    // If specific language file doesn't exist, try default language
    if (lang !== DEFAULT_LANGUAGE) {
      return readLegalDocument(type, DEFAULT_LANGUAGE);
    }
    
    throw new Error(`Legal document not found: ${type}-${lang}`);
  }
};

// GET /api/legal/terms/:lang - Get Terms of Service
router.get('/terms/:lang?', async (req, res) => {
  try {
    const lang = req.params.lang || DEFAULT_LANGUAGE;
    const document = await readLegalDocument('terms', lang);
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(404).json({
      success: false,
      message: 'Terms of Service not found',
      error: error.message
    });
  }
});

// GET /api/legal/privacy/:lang - Get Privacy Policy
router.get('/privacy/:lang?', async (req, res) => {
  try {
    const lang = req.params.lang || DEFAULT_LANGUAGE;
    const document = await readLegalDocument('privacy', lang);
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    res.status(404).json({
      success: false,
      message: 'Privacy Policy not found',
      error: error.message
    });
  }
});

// GET /api/legal/gdpr/:lang - Get GDPR Information
router.get('/gdpr/:lang?', async (req, res) => {
  try {
    const lang = req.params.lang || DEFAULT_LANGUAGE;
    const document = await readLegalDocument('gdpr', lang);
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching GDPR information:', error);
    res.status(404).json({
      success: false,
      message: 'GDPR Information not found',
      error: error.message
    });
  }
});

// GET /api/legal/languages - Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      supported: SUPPORTED_LANGUAGES,
      default: DEFAULT_LANGUAGE,
      languages: {
        pl: { name: 'Polski', nativeName: 'Polski', flag: '🇵🇱' },
        de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
        en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
        ua: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' }
      }
    }
  });
});

// GET /api/legal/all/:lang - Get all legal documents for a language
router.get('/all/:lang?', async (req, res) => {
  try {
    const lang = req.params.lang || DEFAULT_LANGUAGE;
    
    const [terms, privacy, gdpr] = await Promise.all([
      readLegalDocument('terms', lang),
      readLegalDocument('privacy', lang),
      readLegalDocument('gdpr', lang)
    ]);
    
    res.json({
      success: true,
      data: {
        language: lang,
        documents: {
          terms,
          privacy,
          gdpr
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all legal documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching legal documents',
      error: error.message
    });
  }
});

// GET /api/legal/status - Get status of all legal documents
router.get('/status', async (req, res) => {
  try {
    const status = {};
    
    for (const lang of SUPPORTED_LANGUAGES) {
      status[lang] = {};
      
      for (const type of ['terms', 'privacy', 'gdpr']) {
        try {
          const filePath = path.join(__dirname, '..', 'legal', type, `${type}-${lang}.md`);
          const stats = await fs.stat(filePath);
          status[lang][type] = {
            exists: true,
            lastModified: stats.mtime,
            size: stats.size
          };
        } catch (error) {
          status[lang][type] = {
            exists: false,
            error: 'File not found'
          };
        }
      }
    }
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error checking legal documents status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking legal documents status',
      error: error.message
    });
  }
});

module.exports = router; 
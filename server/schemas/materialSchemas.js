const Joi = require('joi');

// Schemat tworzenia materiału
const createMaterialSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nazwa materiału musi mieć co najmniej 2 znaki',
      'string.max': 'Nazwa materiału nie może być dłuższa niż 100 znaków',
      'any.required': 'Nazwa materiału jest wymagana'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Opis materiału nie może być dłuższy niż 500 znaków'
    }),
  unit: Joi.string()
    .valid('PIECE', 'KG', 'M', 'M2', 'M3', 'L', 'SET', 'PACK', 'BOX', 'OTHER')
    .required()
    .messages({
      'any.only': 'Jednostka musi być jedną z: PIECE, KG, M, M2, M3, L, SET, PACK, BOX, OTHER',
      'any.required': 'Jednostka jest wymagana'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Kategoria nie może być dłuższa niż 50 znaków'
    }),
  supplier: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Nazwa dostawcy nie może być dłuższa niż 100 znaków'
    }),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Cena musi być liczbą dodatnią'
    }),
  currentStock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Stan magazynowy musi być liczbą dodatnią'
    }),
  minStock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Minimalny stan musi być liczbą dodatnią'
    }),
  companyId: Joi.string()
    .required()
    .messages({
      'any.required': 'ID firmy jest wymagane'
    })
});

// Schemat aktualizacji materiału
const updateMaterialSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Nazwa materiału musi mieć co najmniej 2 znaki',
      'string.max': 'Nazwa materiału nie może być dłuższa niż 100 znaków'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Opis materiału nie może być dłuższy niż 500 znaków'
    }),
  unit: Joi.string()
    .valid('PIECE', 'KG', 'M', 'M2', 'M3', 'L', 'SET', 'PACK', 'BOX', 'OTHER')
    .optional()
    .messages({
      'any.only': 'Jednostka musi być jedną z: PIECE, KG, M, M2, M3, L, SET, PACK, BOX, OTHER'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Kategoria nie może być dłuższa niż 50 znaków'
    }),
  supplier: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Nazwa dostawcy nie może być dłuższa niż 100 znaków'
    }),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Cena musi być liczbą dodatnią'
    }),
  currentStock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Stan magazynowy musi być liczbą dodatnią'
    }),
  minStock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Minimalny stan musi być liczbą dodatnią'
    })
});

// Schemat aktualizacji stanu magazynowego
const updateStockSchema = Joi.object({
  quantity: Joi.number()
    .required()
    .messages({
      'any.required': 'Ilość jest wymagana',
      'number.base': 'Ilość musi być liczbą'
    }),
  type: Joi.string()
    .valid('ADD', 'SUBTRACT', 'SET')
    .required()
    .messages({
      'any.only': 'Typ operacji musi być jednym z: ADD, SUBTRACT, SET',
      'any.required': 'Typ operacji jest wymagany'
    }),
  reason: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Powód nie może być dłuższy niż 200 znaków'
    })
});

// Schemat filtrów materiałów
const materialFiltersSchema = Joi.object({
  companyId: Joi.string().optional(),
  category: Joi.string().optional(),
  supplier: Joi.string().optional(),
  lowStock: Joi.boolean().optional(),
  search: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Wyszukiwanie nie może być dłuższe niż 100 znaków'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
});

module.exports = {
  createMaterialSchema,
  updateMaterialSchema,
  updateStockSchema,
  materialFiltersSchema
};

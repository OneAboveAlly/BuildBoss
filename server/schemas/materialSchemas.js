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
    .valid('szt', 'kg', 'm', 'm2', 'm3', 'l', 't', 'op', 'pkt', 'mb')
    .required()
    .messages({
      'any.only': 'Jednostka musi być jedną z: szt, kg, m, m2, m3, l, t, op, pkt, mb',
      'any.required': 'Jednostka jest wymagana'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Kategoria nie może być dłuższa niż 50 znaków'
    }),
  quantity: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Ilość musi być liczbą nieujemną'
    }),
  minQuantity: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Minimalna ilość musi być liczbą nieujemną'
    }),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Cena musi być liczbą dodatnią'
    }),
  supplier: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Nazwa dostawcy nie może być dłuższa niż 100 znaków'
    }),
  location: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Lokalizacja nie może być dłuższa niż 200 znaków'
    }),
  barcode: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Kod kreskowy nie może być dłuższy niż 50 znaków'
    }),
  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Notatki nie mogą być dłuższe niż 1000 znaków'
    }),
  companyId: Joi.string()
    .required()
    .messages({
      'any.required': 'ID firmy jest wymagane'
    }),
  projectId: Joi.string()
    .optional()
    .messages({
      'string.base': 'ID projektu musi być ciągiem znaków'
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
    .valid('szt', 'kg', 'm', 'm2', 'm3', 'l', 't', 'op', 'pkt', 'mb')
    .optional()
    .messages({
      'any.only': 'Jednostka musi być jedną z: szt, kg, m, m2, m3, l, t, op, pkt, mb'
    }),
  category: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Kategoria nie może być dłuższa niż 50 znaków'
    }),
  quantity: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Ilość musi być liczbą nieujemną'
    }),
  minQuantity: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Minimalna ilość musi być liczbą nieujemną'
    }),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Cena musi być liczbą dodatnią'
    }),
  supplier: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Nazwa dostawcy nie może być dłuższa niż 100 znaków'
    }),
  location: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Lokalizacja nie może być dłuższa niż 200 znaków'
    }),
  barcode: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Kod kreskowy nie może być dłuższy niż 50 znaków'
    }),
  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Notatki nie mogą być dłuższe niż 1000 znaków'
    }),
  projectId: Joi.string()
    .optional()
    .messages({
      'string.base': 'ID projektu musi być ciągiem znaków'
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
  operation: Joi.string()
    .valid('add', 'subtract', 'set')
    .default('set')
    .optional()
    .messages({
      'any.only': 'Operacja musi być jedną z: add, subtract, set'
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
  sortBy: Joi.string()
    .valid('name', 'category', 'quantity', 'price', 'createdAt')
    .default('name')
    .optional()
    .messages({
      'any.only': 'Sortowanie musi być jednym z: name, category, quantity, price, createdAt'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .optional()
    .messages({
      'any.only': 'Kolejność sortowania musi być asc lub desc'
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

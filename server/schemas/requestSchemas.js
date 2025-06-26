const Joi = require('joi');

// Lista kategorii pracy
const WORK_CATEGORIES = [
  'CONSTRUCTION', 'RENOVATION', 'REPAIR', 'INSTALLATION', 'MAINTENANCE',
  'DEMOLITION', 'LANDSCAPING', 'CLEANING', 'PAINTING', 'ELECTRICAL',
  'PLUMBING', 'ROOFING', 'FLOORING', 'WINDOWS_DOORS', 'OTHER'
];

// Lista województw
const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
];

// Schemat tworzenia zlecenia pracy
const createRequestSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Tytuł zlecenia jest wymagany',
      'string.min': 'Tytuł musi mieć minimum 5 znaków',
      'string.max': 'Tytuł może mieć maksimum 200 znaków',
      'any.required': 'Tytuł zlecenia jest wymagany'
    }),

  description: Joi.string()
    .min(20)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Opis zlecenia jest wymagany',
      'string.min': 'Opis musi mieć minimum 20 znaków',
      'string.max': 'Opis może mieć maksimum 5000 znaków',
      'any.required': 'Opis zlecenia jest wymagany'
    }),

  category: Joi.string()
    .valid(...WORK_CATEGORIES)
    .required()
    .messages({
      'any.only': 'Nieprawidłowa kategoria pracy',
      'any.required': 'Kategoria pracy jest wymagana'
    }),

  type: Joi.string()
    .valid('ONE_TIME', 'RECURRING', 'URGENT', 'PROJECT', 'MAINTENANCE')
    .default('ONE_TIME')
    .messages({
      'any.only': 'Nieprawidłowy typ zlecenia'
    }),

  voivodeship: Joi.string()
    .valid(...VOIVODESHIPS)
    .required()
    .messages({
      'any.only': 'Nieprawidłowe województwo',
      'any.required': 'Województwo jest wymagane'
    }),

  city: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Miasto jest wymagane',
      'string.min': 'Nazwa miasta musi mieć minimum 2 znaki',
      'string.max': 'Nazwa miasta może mieć maksimum 100 znaków',
      'any.required': 'Miasto jest wymagane'
    }),

  address: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Adres może mieć maksimum 500 znaków'
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .allow(null)
    .messages({
      'number.min': 'Szerokość geograficzna musi być między -90 a 90',
      'number.max': 'Szerokość geograficzna musi być między -90 a 90'
    }),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .allow(null)
    .messages({
      'number.min': 'Długość geograficzna musi być między -180 a 180',
      'number.max': 'Długość geograficzna musi być między -180 a 180'
    }),

  budgetMin: Joi.number()
    .min(0)
    .max(10000000)
    .allow(null)
    .messages({
      'number.min': 'Minimalny budżet nie może być ujemny',
      'number.max': 'Minimalny budżet jest zbyt wysoki'
    }),

  budgetMax: Joi.number()
    .min(0)
    .max(10000000)
    .allow(null)
    .when('budgetMin', {
      is: Joi.number().required(),
      then: Joi.number().min(Joi.ref('budgetMin')),
      otherwise: Joi.number()
    })
    .messages({
      'number.min': 'Maksymalny budżet nie może być mniejszy niż minimalny',
      'number.max': 'Maksymalny budżet jest zbyt wysoki'
    }),

  currency: Joi.string()
    .valid('PLN', 'EUR', 'USD', 'GBP')
    .default('PLN')
    .messages({
      'any.only': 'Nieprawidłowa waluta'
    }),

  deadline: Joi.date()
    .min('now')
    .allow(null)
    .messages({
      'date.min': 'Termin realizacji nie może być z przeszłości'
    }),

  requirements: Joi.array()
    .items(Joi.string().max(300))
    .max(30)
    .default([])
    .messages({
      'array.max': 'Maksymalnie 30 wymagań',
      'string.max': 'Każde wymaganie może mieć maksimum 300 znaków'
    }),

  materials: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(0),
        unit: Joi.string(),
        description: Joi.string().max(500)
      })
    )
    .max(50)
    .default([])
    .messages({
      'array.max': 'Maksymalnie 50 materiałów'
    }),

  contactEmail: Joi.string()
    .email()
    .max(255)
    .allow('')
    .messages({
      'string.email': 'Nieprawidłowy format adresu email',
      'string.max': 'Email może mieć maksimum 255 znaków'
    }),

  contactPhone: Joi.string()
    .pattern(/^[+]?[0-9\s-()]{9,20}$/)
    .allow('')
    .messages({
      'string.pattern.base': 'Nieprawidłowy format numeru telefonu'
    }),

  isPublic: Joi.boolean()
    .default(true),

  expiresAt: Joi.date()
    .min('now')
    .allow(null)
    .messages({
      'date.min': 'Data wygaśnięcia nie może być z przeszłości'
    }),

  companyId: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Nieprawidłowe ID firmy'
    })
});

// Schemat aktualizacji zlecenia
const updateRequestSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .messages({
      'string.min': 'Tytuł musi mieć minimum 5 znaków',
      'string.max': 'Tytuł może mieć maksimum 200 znaków'
    }),

  description: Joi.string()
    .min(20)
    .max(5000)
    .messages({
      'string.min': 'Opis musi mieć minimum 20 znaków',
      'string.max': 'Opis może mieć maksimum 5000 znaków'
    }),

  category: Joi.string()
    .valid(...WORK_CATEGORIES)
    .messages({
      'any.only': 'Nieprawidłowa kategoria pracy'
    }),

  type: Joi.string()
    .valid('ONE_TIME', 'RECURRING', 'URGENT', 'PROJECT', 'MAINTENANCE')
    .messages({
      'any.only': 'Nieprawidłowy typ zlecenia'
    }),

  voivodeship: Joi.string()
    .valid(...VOIVODESHIPS)
    .messages({
      'any.only': 'Nieprawidłowe województwo'
    }),

  city: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Nazwa miasta musi mieć minimum 2 znaki',
      'string.max': 'Nazwa miasta może mieć maksimum 100 znaków'
    }),

  address: Joi.string()
    .max(500)
    .allow(''),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .allow(null),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .allow(null),

  budgetMin: Joi.number()
    .min(0)
    .max(10000000)
    .allow(null),

  budgetMax: Joi.number()
    .min(0)
    .max(10000000)
    .allow(null)
    .when('budgetMin', {
      is: Joi.number().required(),
      then: Joi.number().min(Joi.ref('budgetMin')),
      otherwise: Joi.number()
    }),

  currency: Joi.string()
    .valid('PLN', 'EUR', 'USD', 'GBP'),

  deadline: Joi.date()
    .min('now')
    .allow(null),

  requirements: Joi.array()
    .items(Joi.string().max(300))
    .max(30),

  materials: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(0),
        unit: Joi.string(),
        description: Joi.string().max(500)
      })
    )
    .max(50),

  contactEmail: Joi.string()
    .email()
    .max(255)
    .allow(''),

  contactPhone: Joi.string()
    .pattern(/^[+]?[0-9\s-()]{9,20}$/)
    .allow(''),

  isActive: Joi.boolean(),

  isPublic: Joi.boolean(),

  expiresAt: Joi.date()
    .min('now')
    .allow(null)
});

// Schemat filtrów dla wyszukiwania zleceń
const requestFiltersSchema = Joi.object({
  category: Joi.string()
    .valid(...WORK_CATEGORIES),

  voivodeship: Joi.string()
    .valid(...VOIVODESHIPS),

  city: Joi.string()
    .max(100),

  type: Joi.string()
    .valid('ONE_TIME', 'RECURRING', 'URGENT', 'PROJECT', 'MAINTENANCE'),

  budgetMin: Joi.number()
    .min(0)
    .max(10000000),

  budgetMax: Joi.number()
    .min(0)
    .max(10000000),

  search: Joi.string()
    .max(200),

  sortBy: Joi.string()
    .valid('createdAt', 'title', 'budgetMin', 'budgetMax', 'deadline', 'city')
    .default('createdAt'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

// Schemat filtrów dla "moich zleceń"
const myRequestFiltersSchema = Joi.object({
  companyId: Joi.string()
    .uuid(),

  status: Joi.string()
    .valid('all', 'active', 'inactive')
    .default('all'),

  sortBy: Joi.string()
    .valid('createdAt', 'title', 'deadline', 'budgetMax')
    .default('createdAt'),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

module.exports = {
  createRequestSchema,
  updateRequestSchema,
  requestFiltersSchema,
  myRequestFiltersSchema,
  WORK_CATEGORIES,
  VOIVODESHIPS
};

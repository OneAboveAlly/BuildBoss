const Joi = require('joi');

// Lista kategorii pracy
const JOB_CATEGORIES = [
  'CONSTRUCTION_WORKER', 'ELECTRICIAN', 'PLUMBER', 'PAINTER', 'CARPENTER',
  'MASON', 'ROOFER', 'TILER', 'FOREMAN', 'ARCHITECT', 'ENGINEER',
  'HEAVY_EQUIPMENT', 'LANDSCAPING', 'DEMOLITION', 'OTHER'
];

// Lista województw
const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
];

// Schemat tworzenia ogłoszenia o pracę
const createJobSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Tytuł ogłoszenia jest wymagany',
      'string.min': 'Tytuł musi mieć minimum 5 znaków',
      'string.max': 'Tytuł może mieć maksimum 200 znaków',
      'any.required': 'Tytuł ogłoszenia jest wymagany'
    }),

  description: Joi.string()
    .min(20)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Opis stanowiska jest wymagany',
      'string.min': 'Opis musi mieć minimum 20 znaków',
      'string.max': 'Opis może mieć maksimum 5000 znaków',
      'any.required': 'Opis stanowiska jest wymagany'
    }),

  category: Joi.string()
    .valid(...JOB_CATEGORIES)
    .required()
    .messages({
      'any.only': 'Nieprawidłowa kategoria zawodu',
      'any.required': 'Kategoria zawodu jest wymagana'
    }),

  type: Joi.string()
    .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE')
    .default('FULL_TIME')
    .messages({
      'any.only': 'Nieprawidłowy typ zatrudnienia'
    }),

  country: Joi.string()
    .default('Polska')
    .messages({
      'string.base': 'Kraj musi być tekstem'
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

  salaryMin: Joi.number()
    .min(0)
    .max(1000000)
    .allow(null)
    .messages({
      'number.min': 'Minimalne wynagrodzenie nie może być ujemne',
      'number.max': 'Minimalne wynagrodzenie jest zbyt wysokie'
    }),

  salaryMax: Joi.number()
    .min(0)
    .max(1000000)
    .allow(null)
    .when('salaryMin', {
      is: Joi.number().required(),
      then: Joi.number().min(Joi.ref('salaryMin')),
      otherwise: Joi.number()
    })
    .messages({
      'number.min': 'Maksymalne wynagrodzenie nie może być mniejsze niż minimalne',
      'number.max': 'Maksymalne wynagrodzenie jest zbyt wysokie'
    }),

  currency: Joi.string()
    .valid('PLN', 'EUR', 'USD', 'GBP')
    .default('PLN')
    .messages({
      'any.only': 'Nieprawidłowa waluta'
    }),

  experience: Joi.string()
    .valid('JUNIOR', 'MID', 'SENIOR', 'EXPERT')
    .required()
    .messages({
      'any.only': 'Nieprawidłowy poziom doświadczenia',
      'any.required': 'Poziom doświadczenia jest wymagany'
    }),

  requirements: Joi.string()
    .max(2000)
    .allow('')
    .messages({
      'string.max': 'Wymagania mogą mieć maksimum 2000 znaków'
    }),

  benefits: Joi.string()
    .max(2000)
    .allow('')
    .messages({
      'string.max': 'Korzyści mogą mieć maksimum 2000 znaków'
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
    .pattern(/^(\+48)?[0-9\s()-]{8,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Numer telefonu musi być prawidłowy (8-15 znaków, może zawierać +48, cyfry, spacje, nawiasy i myślniki)'
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
    .pattern(/^c[a-z0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Nieprawidłowe ID firmy',
      'any.required': 'ID firmy jest wymagane'
    })
});

// Schemat aktualizacji ogłoszenia
const updateJobSchema = Joi.object({
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
    .valid(...JOB_CATEGORIES)
    .messages({
      'any.only': 'Nieprawidłowa kategoria zawodu'
    }),

  type: Joi.string()
    .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE')
    .messages({
      'any.only': 'Nieprawidłowy typ zatrudnienia'
    }),

  country: Joi.string()
    .messages({
      'string.base': 'Kraj musi być tekstem'
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
    .allow('')
    .messages({
      'string.max': 'Adres może mieć maksimum 500 znaków'
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .allow(null),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .allow(null),

  salaryMin: Joi.number()
    .min(0)
    .max(1000000)
    .allow(null),

  salaryMax: Joi.number()
    .min(0)
    .max(1000000)
    .allow(null)
    .when('salaryMin', {
      is: Joi.number().required(),
      then: Joi.number().min(Joi.ref('salaryMin')),
      otherwise: Joi.number()
    }),

  currency: Joi.string()
    .valid('PLN', 'EUR', 'USD', 'GBP'),

  experience: Joi.string()
    .valid('JUNIOR', 'MID', 'SENIOR', 'EXPERT')
    .allow(null),

  requirements: Joi.string()
    .max(2000)
    .allow(''),

  benefits: Joi.string()
    .max(2000)
    .allow(''),

  contactEmail: Joi.string()
    .email()
    .max(255)
    .allow(''),

  contactPhone: Joi.string()
    .pattern(/^(\+48)?[0-9\s()-]{8,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Numer telefonu musi być prawidłowy (8-15 znaków, może zawierać +48, cyfry, spacje, nawiasy i myślniki)'
    }),

  isActive: Joi.boolean(),

  isPublic: Joi.boolean(),

  expiresAt: Joi.date()
    .min('now')
    .allow(null),

  companyId: Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .messages({
      'string.pattern.base': 'Nieprawidłowe ID firmy'
    })
});

// Schemat filtrów dla wyszukiwania ofert
const jobFiltersSchema = Joi.object({
  category: Joi.string()
    .valid(...JOB_CATEGORIES),

  voivodeship: Joi.string()
    .valid(...VOIVODESHIPS),

  city: Joi.string()
    .max(100),

  type: Joi.string()
    .valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE'),

  experience: Joi.string()
    .valid('JUNIOR', 'MID', 'SENIOR', 'EXPERT'),

  salaryMin: Joi.number()
    .min(0)
    .max(1000000),

  salaryMax: Joi.number()
    .min(0)
    .max(1000000),

  search: Joi.string()
    .max(200),

  sortBy: Joi.string()
    .valid('createdAt', 'title', 'salaryMin', 'salaryMax', 'city')
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
    .default(20),

  isPublic: Joi.boolean()
    .default(true)
});

// Schemat aplikowania na ofertę
const applyJobSchema = Joi.object({
  message: Joi.string()
    .min(10)
    .max(2000)
    .allow('')
    .messages({
      'string.min': 'Wiadomość musi mieć minimum 10 znaków',
      'string.max': 'Wiadomość może mieć maksimum 2000 znaków'
    }),

  cvUrl: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Nieprawidłowy URL do CV'
    }),

  portfolioUrl: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Nieprawidłowy URL do portfolio'
    }),

  expectedSalary: Joi.number()
    .min(0)
    .max(1000000)
    .allow(null)
    .messages({
      'number.min': 'Oczekiwane wynagrodzenie nie może być ujemne',
      'number.max': 'Oczekiwane wynagrodzenie jest zbyt wysokie'
    }),

  availableFrom: Joi.date()
    .allow(null)
    .messages({
      'date.base': 'Nieprawidłowa data dostępności'
    })
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  jobFiltersSchema,
  applyJobSchema,
  JOB_CATEGORIES,
  VOIVODESHIPS
};

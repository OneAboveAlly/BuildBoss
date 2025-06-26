const Joi = require('joi');

// Schemat ID (dla parametrów URL) - obsługuje zarówno UUID jak i alfanumeryczne ID
const idSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$|^[a-zA-Z0-9]+$/)
    .required()
    .messages({
      'string.pattern.base': 'ID musi być w formacie UUID lub zawierać tylko litery i cyfry',
      'any.required': 'ID jest wymagane'
    })
});

// Schemat paginacji
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Numer strony musi być liczbą całkowitą',
      'number.min': 'Numer strony musi być większy od 0'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.integer': 'Limit musi być liczbą całkowitą',
      'number.min': 'Limit musi być większy od 0',
      'number.max': 'Limit nie może być większy niż 100'
    }),
  search: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Wyszukiwanie nie może być dłuższe niż 100 znaków'
    })
});

// Schemat sortowania
const sortSchema = Joi.object({
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'name', 'title', 'email')
    .default('createdAt')
    .messages({
      'any.only': 'Nieprawidłowe pole sortowania'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Kolejność sortowania musi być "asc" lub "desc"'
    })
});

// Schemat daty
const dateSchema = Joi.alternatives().try(
  Joi.date().iso(),
  Joi.string().isoDate()
).messages({
  'alternatives.match': 'Data musi być w formacie ISO'
});

// Schemat email
const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': 'Podaj prawidłowy adres email',
    'any.required': 'Email jest wymagany'
  });

// Schemat telefonu (opcjonalny format polski)
const phoneSchema = Joi.string()
  .pattern(/^(\+48)?[\s-]?[0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{3}$/)
  .optional()
  .messages({
    'string.pattern.base': 'Podaj prawidłowy numer telefonu (format: +48 123 456 789)'
  });

// Schemat URL
const urlSchema = Joi.string()
  .uri()
  .optional()
  .messages({
    'string.uri': 'Podaj prawidłowy adres URL'
  });

// Schemat NIP
const nipSchema = Joi.string()
  .pattern(/^[0-9]{10}$/)
  .optional()
  .messages({
    'string.pattern.base': 'NIP musi składać się z 10 cyfr'
  });

module.exports = {
  idSchema,
  paginationSchema,
  sortSchema,
  dateSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  nipSchema
};

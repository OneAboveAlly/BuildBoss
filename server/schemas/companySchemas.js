const Joi = require('joi');
const { emailSchema, phoneSchema, urlSchema, nipSchema } = require('./commonSchemas');

// Schemat tworzenia firmy
const createCompanySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nazwa firmy musi mieć co najmniej 2 znaki',
      'string.max': 'Nazwa firmy nie może być dłuższa niż 100 znaków',
      'any.required': 'Nazwa firmy jest wymagana'
    }),
  nip: nipSchema,
  address: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Adres nie może być dłuższy niż 200 znaków'
    }),
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .messages({
      'number.min': 'Szerokość geograficzna musi być między -90 a 90',
      'number.max': 'Szerokość geograficzna musi być między -90 a 90'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Długość geograficzna musi być między -180 a 180',
      'number.max': 'Długość geograficzna musi być między -180 a 180'
    }),
  phone: phoneSchema,
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Podaj prawidłowy adres email firmy'
    }),
  website: urlSchema,
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Opis firmy nie może być dłuższy niż 500 znaków'
    })
});

// Schemat aktualizacji firmy (wszystkie pola opcjonalne)
const updateCompanySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Nazwa firmy musi mieć co najmniej 2 znaki',
      'string.max': 'Nazwa firmy nie może być dłuższa niż 100 znaków'
    }),
  nip: nipSchema,
  address: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Adres nie może być dłuższy niż 200 znaków'
    }),
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .messages({
      'number.min': 'Szerokość geograficzna musi być między -90 a 90',
      'number.max': 'Szerokość geograficzna musi być między -90 a 90'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Długość geograficzna musi być między -180 a 180',
      'number.max': 'Długość geograficzna musi być między -180 a 180'
    }),
  phone: phoneSchema,
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Podaj prawidłowy adres email firmy'
    }),
  website: urlSchema,
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Opis firmy nie może być dłuższy niż 500 znaków'
    })
});

// Schemat zapraszania pracownika
const inviteWorkerSchema = Joi.object({
  email: emailSchema,
  position: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Stanowisko nie może być dłuższe niż 100 znaków'
    }),
  canEdit: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'canEdit musi być wartością logiczną'
    }),
  canView: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'canView musi być wartością logiczną'
    }),
  canManageFinance: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'canManageFinance musi być wartością logiczną'
    })
});

// Schemat aktualizacji pracownika
const updateWorkerSchema = Joi.object({
  position: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Stanowisko nie może być dłuższe niż 100 znaków'
    }),
  canEdit: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'canEdit musi być wartością logiczną'
    }),
  canView: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'canView musi być wartością logiczną'
    }),
  canManageFinance: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'canManageFinance musi być wartością logiczną'
    }),
  status: Joi.string()
    .valid('INVITED', 'ACTIVE', 'INACTIVE', 'LEFT')
    .optional()
    .messages({
      'any.only': 'Status musi być jednym z: INVITED, ACTIVE, INACTIVE, LEFT'
    })
});

// Schemat wyszukiwania użytkowników
const searchUsersSchema = Joi.object({
  query: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Zapytanie musi mieć co najmniej 2 znaki',
      'string.max': 'Zapytanie nie może być dłuższe niż 100 znaków',
      'any.required': 'Zapytanie wyszukiwania jest wymagane'
    })
});

module.exports = {
  createCompanySchema,
  updateCompanySchema,
  inviteWorkerSchema,
  updateWorkerSchema,
  searchUsersSchema
}; 
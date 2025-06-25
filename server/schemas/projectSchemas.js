const Joi = require('joi');
const { dateSchema, emailSchema, phoneSchema } = require('./commonSchemas');

// Schemat tworzenia projektu
const createProjectSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nazwa projektu musi mieć co najmniej 2 znaki',
      'string.max': 'Nazwa projektu nie może być dłuższa niż 100 znaków',
      'any.required': 'Nazwa projektu jest wymagana'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Opis projektu nie może być dłuższy niż 1000 znaków'
    }),
  companyId: Joi.string()
    .required()
    .messages({
      'any.required': 'ID firmy jest wymagane'
    }),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    .default('MEDIUM')
    .messages({
      'any.only': 'Priorytet musi być jednym z: LOW, MEDIUM, HIGH, URGENT'
    }),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  deadline: dateSchema.optional(),
  budget: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Budżet musi być liczbą dodatnią'
    }),
  location: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Lokalizacja nie może być dłuższa niż 200 znaków'
    }),
  clientName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Nazwa klienta nie może być dłuższa niż 100 znaków'
    }),
  clientEmail: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Podaj prawidłowy adres email klienta'
    }),
  clientPhone: phoneSchema
});

// Schemat aktualizacji projektu
const updateProjectSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Nazwa projektu musi mieć co najmniej 2 znaki',
      'string.max': 'Nazwa projektu nie może być dłuższa niż 100 znaków'
    }),
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Opis projektu nie może być dłuższy niż 1000 znaków'
    }),
  status: Joi.string()
    .valid('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED')
    .optional()
    .messages({
      'any.only': 'Status musi być jednym z: PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED'
    }),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    .optional()
    .messages({
      'any.only': 'Priorytet musi być jednym z: LOW, MEDIUM, HIGH, URGENT'
    }),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  deadline: dateSchema.optional(),
  budget: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Budżet musi być liczbą dodatnią'
    }),
  location: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Lokalizacja nie może być dłuższa niż 200 znaków'
    }),
  clientName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Nazwa klienta nie może być dłuższa niż 100 znaków'
    }),
  clientEmail: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Podaj prawidłowy adres email klienta'
    }),
  clientPhone: phoneSchema
});

module.exports = {
  createProjectSchema,
  updateProjectSchema
}; 
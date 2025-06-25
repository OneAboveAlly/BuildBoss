const Joi = require('joi');
const { dateSchema } = require('./commonSchemas');

// Schemat tworzenia zadania
const createTaskSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Tytuł zadania musi mieć co najmniej 2 znaki',
      'string.max': 'Tytuł zadania nie może być dłuższy niż 200 znaków',
      'any.required': 'Tytuł zadania jest wymagany'
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Opis zadania nie może być dłuższy niż 2000 znaków'
    }),
  projectId: Joi.string()
    .required()
    .messages({
      'any.required': 'ID projektu jest wymagane'
    }),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    .default('MEDIUM')
    .messages({
      'any.only': 'Priorytet musi być jednym z: LOW, MEDIUM, HIGH, URGENT'
    }),
  assignedToId: Joi.string()
    .optional()
    .messages({
      'string.base': 'ID przypisanego użytkownika musi być tekstem'
    }),
  startDate: dateSchema.optional(),
  dueDate: dateSchema.optional(),
  estimatedHours: Joi.number()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Szacowane godziny muszą być liczbą dodatnią',
      'number.max': 'Szacowane godziny nie mogą przekraczać 1000'
    })
});

// Schemat aktualizacji zadania
const updateTaskSchema = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Tytuł zadania musi mieć co najmniej 2 znaki',
      'string.max': 'Tytuł zadania nie może być dłuższy niż 200 znaków'
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Opis zadania nie może być dłuższy niż 2000 znaków'
    }),
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED')
    .optional()
    .messages({
      'any.only': 'Status musi być jednym z: TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED'
    }),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    .optional()
    .messages({
      'any.only': 'Priorytet musi być jednym z: LOW, MEDIUM, HIGH, URGENT'
    }),
  assignedToId: Joi.string()
    .optional()
    .allow(null)
    .messages({
      'string.base': 'ID przypisanego użytkownika musi być tekstem'
    }),
  startDate: dateSchema.optional(),
  dueDate: dateSchema.optional(),
  estimatedHours: Joi.number()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Szacowane godziny muszą być liczbą dodatnią',
      'number.max': 'Szacowane godziny nie mogą przekraczać 1000'
    }),
  actualHours: Joi.number()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Rzeczywiste godziny muszą być liczbą dodatnią',
      'number.max': 'Rzeczywiste godziny nie mogą przekraczać 1000'
    })
});

// Schemat aktualizacji statusu zadania
const updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED')
    .required()
    .messages({
      'any.only': 'Status musi być jednym z: TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED',
      'any.required': 'Status jest wymagany'
    })
});

// Schemat filtrów zadań
const taskFiltersSchema = Joi.object({
  projectId: Joi.string().optional(),
  companyId: Joi.string().optional(),
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED')
    .optional(),
  priority: Joi.string()
    .valid('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    .optional(),
  assignedToId: Joi.string().optional(),
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
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskFiltersSchema
}; 
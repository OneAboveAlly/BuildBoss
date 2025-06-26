const Joi = require('joi');

// Schemat tworzenia wiadomości
const createMessageSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Treść wiadomości jest wymagana',
      'string.min': 'Treść wiadomości nie może być pusta',
      'string.max': 'Treść wiadomości może mieć maksimum 5000 znaków',
      'any.required': 'Treść wiadomości jest wymagana'
    }),

  receiverId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Nieprawidłowe ID odbiorcy',
      'any.required': 'ID odbiorcy jest wymagane'
    }),

  type: Joi.string()
    .valid('DIRECT', 'NOTIFICATION', 'SYSTEM')
    .default('DIRECT')
    .messages({
      'any.only': 'Nieprawidłowy typ wiadomości'
    }),

  priority: Joi.string()
    .valid('LOW', 'NORMAL', 'HIGH', 'URGENT')
    .default('NORMAL')
    .messages({
      'any.only': 'Nieprawidłowy priorytet wiadomości'
    }),

  subject: Joi.string()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Temat może mieć maksimum 200 znaków'
    }),

  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().required(),
        url: Joi.string().uri().required(),
        size: Joi.number().integer().min(1),
        mimeType: Joi.string()
      })
    )
    .max(10)
    .default([])
    .messages({
      'array.max': 'Maksymalnie 10 załączników'
    }),

  relatedEntityType: Joi.string()
    .valid('PROJECT', 'TASK', 'COMPANY', 'JOB', 'MATERIAL')
    .allow(null),

  relatedEntityId: Joi.string()
    .uuid()
    .allow(null)
    .when('relatedEntityType', {
      is: Joi.string().required(),
      then: Joi.required(),
      otherwise: Joi.allow(null)
    })
    .messages({
      'string.guid': 'Nieprawidłowe ID powiązanej encji'
    })
});

// Schemat oznaczania wiadomości jako przeczytane
const markAsReadSchema = Joi.object({
  messageIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(100)
    .default([])
    .messages({
      'array.min': 'Minimum jedna wiadomość do oznaczenia',
      'array.max': 'Maksymalnie 100 wiadomości na raz',
      'string.guid': 'Nieprawidłowe ID wiadomości'
    })
});

// Schemat filtrów wiadomości
const messageFiltersSchema = Joi.object({
  type: Joi.string()
    .valid('DIRECT', 'NOTIFICATION', 'SYSTEM'),

  priority: Joi.string()
    .valid('LOW', 'NORMAL', 'HIGH', 'URGENT'),

  isRead: Joi.boolean(),

  senderId: Joi.string()
    .uuid(),

  receiverId: Joi.string()
    .uuid(),

  relatedEntityType: Joi.string()
    .valid('PROJECT', 'TASK', 'COMPANY', 'JOB', 'MATERIAL'),

  relatedEntityId: Joi.string()
    .uuid(),

  search: Joi.string()
    .max(200),

  dateFrom: Joi.date(),

  dateTo: Joi.date()
    .when('dateFrom', {
      is: Joi.date().required(),
      then: Joi.date().min(Joi.ref('dateFrom')),
      otherwise: Joi.date()
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'priority', 'subject', 'senderName')
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

// Schemat oznaczania wątku jako przeczytany
const markThreadAsReadSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Nieprawidłowe ID użytkownika',
      'any.required': 'ID użytkownika jest wymagane'
    })
});

module.exports = {
  createMessageSchema,
  markAsReadSchema,
  messageFiltersSchema,
  markThreadAsReadSchema
};

const Joi = require('joi');

// Schemat filtrów dla powiadomień
const notificationFiltersSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Numer strony musi być większy niż 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit musi być większy niż 0',
      'number.max': 'Limit może być maksymalnie 100'
    }),

  unreadOnly: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'unreadOnly może być tylko "true" lub "false"'
    })
});

// Schemat do testowania powiadomień (development only)
const testNotificationSchema = Joi.object({
  type: Joi.string()
    .valid(
      'TASK_ASSIGNED', 'TASK_COMPLETED', 'MESSAGE_RECEIVED',
      'MATERIAL_LOW', 'SYSTEM_UPDATE', 'COMPANY_INVITE',
      'PROJECT_UPDATE', 'DEADLINE_REMINDER'
    )
    .default('SYSTEM_UPDATE')
    .messages({
      'any.only': 'Nieprawidłowy typ powiadomienia'
    }),

  title: Joi.string()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Tytuł jest wymagany',
      'string.max': 'Tytuł może mieć maksymalnie 200 znaków'
    }),

  message: Joi.string()
    .min(1)
    .max(1000)
    .messages({
      'string.empty': 'Treść wiadomości jest wymagana',
      'string.max': 'Treść może mieć maksymalnie 1000 znaków'
    }),

  data: Joi.object()
    .unknown(true)
    .default({})
    .messages({
      'object.base': 'Dane muszą być obiektem'
    })
});

// Schemat walidacji dla oznaczania konwersacji jako przeczytanej w messages
const markThreadAsReadSchema = Joi.object({
  otherUserId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Nieprawidłowe ID użytkownika',
      'any.required': 'ID użytkownika jest wymagane'
    }),

  jobOfferId: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Nieprawidłowe ID oferty pracy'
    }),

  workRequestId: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Nieprawidłowe ID zlecenia'
    })
});

module.exports = {
  notificationFiltersSchema,
  testNotificationSchema,
  markThreadAsReadSchema
};

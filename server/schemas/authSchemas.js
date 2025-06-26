const Joi = require('joi');

// Schemat rejestracji
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Podaj prawidłowy adres email',
      'any.required': 'Email jest wymagany'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Hasło musi mieć co najmniej 8 znaków',
      'string.pattern.base': 'Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę',
      'any.required': 'Hasło jest wymagane'
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Imię musi mieć co najmniej 2 znaki',
      'string.max': 'Imię nie może być dłuższe niż 50 znaków'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Nazwisko musi mieć co najmniej 2 znaki',
      'string.max': 'Nazwisko nie może być dłuższe niż 50 znaków'
    })
});

// Schemat logowania
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Podaj prawidłowy adres email',
      'any.required': 'Email jest wymagany'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Hasło jest wymagane'
    })
});

// Schemat resetowania hasła
const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Podaj prawidłowy adres email',
      'any.required': 'Email jest wymagany'
    })
});

// Schemat nowego hasła
const newPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token jest wymagany'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Hasło musi mieć co najmniej 8 znaków',
      'string.pattern.base': 'Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę',
      'any.required': 'Hasło jest wymagane'
    })
});

// Schemat potwierdzenia email
const confirmEmailSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token potwierdzający jest wymagany'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  newPasswordSchema,
  confirmEmailSchema
};

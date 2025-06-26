const _Joi = require('joi');

// Middleware do walidacji
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Błędy walidacji danych',
        errors: validationErrors
      });
    }

    next();
  };
};

// Middleware do walidacji parametrów URL
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Błędy walidacji parametrów',
        errors: validationErrors
      });
    }

    next();
  };
};

// Middleware do walidacji query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Błędy walidacji zapytania',
        errors: validationErrors
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateParams,
  validateQuery
};

const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Request Validation Middleware
 * Validates incoming request data using Joi schemas
 */

/**
 * Validation schemas
 */
const schemas = {
  // Login validation schema
  login: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 50 characters',
        'any.required': 'Username is required'
      }),
    password: Joi.string()
      .min(8)
      .max(100)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 100 characters',
        'any.required': 'Password is required'
      })
  }),

  // Mobile number validation schema
  mobileNumber: Joi.object({
    mobileNumber: Joi.string()
      .pattern(/^\+?[0-9]{10,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Mobile number must be 10-15 digits, optionally with + prefix',
        'any.required': 'Mobile number is required'
      })
  }),

  // OTP history query validation schema
  otpHistory: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
  }),

  // User creation validation schema
  createUser: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 50 characters',
        'any.required': 'Username is required'
      }),
    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 100 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase letters and numbers',
        'any.required': 'Password is required'
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Email must be a valid email address'
      }),
    role: Joi.string()
      .valid('admin', 'user')
      .default('user')
      .messages({
        'any.only': 'Role must be either admin or user'
      })
  }),

  // User update validation schema
  updateUser: Joi.object({
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Email must be a valid email address'
      }),
    role: Joi.string()
      .valid('admin', 'user')
      .optional()
      .messages({
        'any.only': 'Role must be either admin or user'
      }),
    is_active: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'is_active must be a boolean value'
      })
  })
};

/**
 * Validate request body against a schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 * @returns {Function} Express middleware function
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const data = req[property];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: details
        }
      });
    }

    // Replace the property with validated and sanitized data
    req[property] = value;
    next();
  };
}

/**
 * Validate request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateBody(schema) {
  return validate(schema, 'body');
}

/**
 * Validate request query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateQuery(schema) {
  return validate(schema, 'query');
}

/**
 * Validate request parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
function validateParams(schema) {
  return validate(schema, 'params');
}

/**
 * Sanitize input to prevent XSS
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = value
          .replace(/[<>]/g, '')
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

/**
 * Sanitization middleware
 * @param {string} property - Request property to sanitize (body, query, params)
 * @returns {Function} Express middleware function
 */
function sanitize(property = 'body') {
  return (req, res, next) => {
    if (req[property]) {
      req[property] = sanitizeObject(req[property]);
    }
    next();
  };
}

module.exports = {
  schemas,
  validate,
  validateBody,
  validateQuery,
  validateParams,
  sanitize,
  sanitizeObject
};

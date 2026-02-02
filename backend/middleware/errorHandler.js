/**
 * Global Error Handler Middleware
 * Catches and formats all errors in a consistent manner
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes and their corresponding HTTP status codes
 */
const ERROR_CODES = {
  // Authentication errors (4xx)
  INVALID_CREDENTIALS: { statusCode: 401, message: 'Invalid username or password' },
  NO_TOKEN: { statusCode: 401, message: 'Authentication token is required' },
  TOKEN_EXPIRED: { statusCode: 401, message: 'Authentication token has expired' },
  INVALID_TOKEN: { statusCode: 401, message: 'Invalid authentication token' },
  UNAUTHORIZED: { statusCode: 401, message: 'Authentication required' },
  
  // Authorization errors (4xx)
  FORBIDDEN: { statusCode: 403, message: 'Insufficient permissions' },
  ACCOUNT_INACTIVE: { statusCode: 403, message: 'Account is inactive' },
  ACCOUNT_LOCKED: { statusCode: 423, message: 'Account is temporarily locked. Please try again later.' },
  
  // Validation errors (4xx)
  VALIDATION_ERROR: { statusCode: 400, message: 'Validation failed' },
  INVALID_INPUT: { statusCode: 400, message: 'Invalid input provided' },
  MISSING_FIELD: { statusCode: 400, message: 'Required field is missing' },
  
  // Not found errors (4xx)
  USER_NOT_FOUND: { statusCode: 404, message: 'User not found' },
  OTP_NOT_FOUND: { statusCode: 404, message: 'OTP not found' },
  RESOURCE_NOT_FOUND: { statusCode: 404, message: 'Resource not found' },
  
  // Rate limiting errors (4xx)
  RATE_LIMIT_EXCEEDED: { statusCode: 429, message: 'Too many requests. Please try again later.' },
  
  // Server errors (5xx)
  INTERNAL_ERROR: { statusCode: 500, message: 'Internal server error' },
  DATABASE_ERROR: { statusCode: 500, message: 'Database error occurred' },
  SERVICE_UNAVAILABLE: { statusCode: 503, message: 'Service temporarily unavailable' }
};

/**
 * Get error details from error code
 * @param {string} code - Error code
 * @returns {Object} Error details
 */
function getErrorDetails(code) {
  return ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
}

/**
 * Handle database errors
 * @param {Error} error - Database error
 * @returns {Object} Formatted error response
 */
function handleDatabaseError(error) {
  console.error('Database error:', error);

  // Check for specific database errors
  if (error.code === 'ER_DUP_ENTRY') {
    const match = error.message.match(/for key '(.+?)'/);
    const field = match ? match[1] : 'field';
    return {
      statusCode: 409,
      code: 'DUPLICATE_ENTRY',
      message: `A record with this ${field} already exists`
    };
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      statusCode: 400,
      code: 'INVALID_REFERENCE',
      message: 'Referenced record does not exist'
    };
  }

  return {
    statusCode: 500,
    code: 'DATABASE_ERROR',
    message: 'Database error occurred'
  };
}

/**
 * Handle JWT errors
 * @param {Error} error - JWT error
 * @returns {Object} Formatted error response
 */
function handleJWTError(error) {
  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    };
  }

  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error'
  };
}

/**
 * Handle validation errors
 * @param {Error} error - Validation error
 * @returns {Object} Formatted error response
 */
function handleValidationError(error) {
  const details = error.details || [];
  const fields = details.map(detail => ({
    field: detail.path ? detail.path.join('.') : 'unknown',
    message: detail.message
  }));

  return {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: fields
  };
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  let errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  };

  // Handle AppError instances
  if (err instanceof AppError) {
    errorResponse.error.code = err.code;
    errorResponse.error.message = err.message;
    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle database errors
  if (err.code && err.code.startsWith('ER_')) {
    const dbError = handleDatabaseError(err);
    errorResponse.error.code = dbError.code;
    errorResponse.error.message = dbError.message;
    return res.status(dbError.statusCode).json(errorResponse);
  }

  // Handle JWT errors
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    const jwtError = handleJWTError(err);
    errorResponse.error.code = jwtError.code;
    errorResponse.error.message = jwtError.message;
    return res.status(jwtError.statusCode).json(errorResponse);
  }

  // Handle validation errors (Joi)
  if (err.isJoi) {
    const validationError = handleValidationError(err);
    errorResponse.error.code = validationError.code;
    errorResponse.error.message = validationError.message;
    if (validationError.details) {
      errorResponse.error.details = validationError.details;
    }
    return res.status(validationError.statusCode).json(errorResponse);
  }

  // Handle rate limit errors
  if (err.name === 'RateLimitError') {
    errorResponse.error.code = 'RATE_LIMIT_EXCEEDED';
    errorResponse.error.message = 'Too many requests. Please try again later.';
    return res.status(429).json(errorResponse);
  }

  // Default error response
  return res.status(500).json(errorResponse);
}

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  ERROR_CODES,
  getErrorDetails,
  errorHandler,
  notFoundHandler,
  asyncHandler
};

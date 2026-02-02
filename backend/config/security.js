require('dotenv').config();

/**
 * Security Configuration
 * Centralized security settings for the application
 */

// Account Lockout Settings
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
const LOCKOUT_DURATION_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES, 10) || 15;

// Rate Limiting Settings
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 5;

// Password Settings
const BCRYPT_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

// Token Settings
const TOKEN_PREFIX = 'Bearer ';

// CORS Settings
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000'];

// Security Headers
const HELMET_CONFIG = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
};

/**
 * Get lockout expiration timestamp
 * @returns {Date} Lockout expiration date
 */
function getLockoutExpiration() {
  const lockoutDate = new Date();
  lockoutDate.setMinutes(lockoutDate.getMinutes() + LOCKOUT_DURATION_MINUTES);
  return lockoutDate;
}

/**
 * Check if account is locked
 * @param {Date|null} lockedUntil - Lock expiration timestamp
 * @returns {boolean} True if account is locked
 */
function isAccountLocked(lockedUntil) {
  if (!lockedUntil) return false;
  return new Date(lockedUntil) > new Date();
}

/**
 * Check if lockout has expired
 * @param {Date|null} lockedUntil - Lock expiration timestamp
 * @returns {boolean} True if lockout has expired
 */
function hasLockoutExpired(lockedUntil) {
  if (!lockedUntil) return true;
  return new Date(lockedUntil) <= new Date();
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validate mobile number format
 * @param {string} mobileNumber - Mobile number to validate
 * @returns {boolean} True if valid
 */
function isValidMobileNumber(mobileNumber) {
  // Accept 10-15 digit numbers, optionally with + prefix
  const mobileRegex = /^\+?[0-9]{10,15}$/;
  return mobileRegex.test(mobileNumber);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
function isValidUsername(username) {
  // Alphanumeric with underscores, 3-50 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
function validatePasswordStrength(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase letters and numbers'
    };
  }

  return {
    isValid: true,
    message: 'Password is strong'
  };
}

/**
 * Mask sensitive data for logging
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of characters to keep visible
 * @returns {string} Masked data
 */
function maskSensitiveData(data, visibleChars = 4) {
  if (!data || typeof data !== 'string') return '***';
  if (data.length <= visibleChars) return '***';
  return data.substring(0, visibleChars) + '***';
}

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
  return req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    'unknown';
}

/**
 * Get user agent from request
 * @param {Object} req - Express request object
 * @returns {string} User agent string
 */
function getUserAgent(req) {
  return req.get('user-agent') || 'unknown';
}

module.exports = {
  // Account Lockout
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  getLockoutExpiration,
  isAccountLocked,
  hasLockoutExpired,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,

  // Password
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  validatePasswordStrength,

  // Token
  TOKEN_PREFIX,

  // CORS
  CORS_ORIGINS,

  // Security Headers
  HELMET_CONFIG,

  // Utilities
  sanitizeInput,
  isValidMobileNumber,
  isValidUsername,
  maskSensitiveData,
  getClientIp,
  getUserAgent
};

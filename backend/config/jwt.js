const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * JWT Configuration
 * Handles JWT token generation and verification
 */

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Generate a JWT token for a user
 * @param {Object} payload - Token payload (user data)
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Get token expiration time in seconds
 * @returns {number} Expiration time in seconds
 */
function getTokenExpirationSeconds() {
  const expiresIn = JWT_EXPIRES_IN;
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    return 3600; // Default 1 hour
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };
  
  return value * (multipliers[unit] || 3600);
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  verifyToken,
  decodeToken,
  getTokenExpirationSeconds
};

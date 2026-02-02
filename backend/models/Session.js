const db = require('../config/database');

/**
 * Session Model
 * Handles session-related database operations for JWT token management
 */

/**
 * Create a new session
 * @param {Object} sessionData - Session data
 * @param {number} sessionData.userId - User ID
 * @param {string} sessionData.token - JWT token
 * @param {Date} sessionData.expiresAt - Expiration timestamp
 * @param {string} sessionData.ipAddress - Client IP address (optional)
 * @param {string} sessionData.userAgent - User agent string (optional)
 * @returns {Promise<number>} New session ID
 */
async function create(sessionData) {
  const { userId, token, expiresAt, ipAddress, userAgent } = sessionData;

  const sql = `
    INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `;

  return await db.insert(sql, [userId, token, expiresAt, ipAddress, userAgent]);
}

/**
 * Find session by token
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} Session object or null
 */
async function findByToken(token) {
  const sql = `
    SELECT id, user_id, token, ip_address, user_agent, 
           expires_at, created_at, revoked_at
    FROM sessions
    WHERE token = ?
  `;
  return await db.queryOne(sql, [token]);
}

/**
 * Find session by ID
 * @param {number} sessionId - Session ID
 * @returns {Promise<Object|null>} Session object or null
 */
async function findById(sessionId) {
  const sql = `
    SELECT id, user_id, token, ip_address, user_agent, 
           expires_at, created_at, revoked_at
    FROM sessions
    WHERE id = ?
  `;
  return await db.queryOne(sql, [sessionId]);
}

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of session objects
 */
async function findActiveByUserId(userId) {
  const sql = `
    SELECT id, user_id, token, ip_address, user_agent, 
           expires_at, created_at, revoked_at
    FROM sessions
    WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
    ORDER BY created_at DESC
  `;
  return await db.query(sql, [userId]);
}

/**
 * Get all sessions for a user (including revoked)
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Sessions and pagination info
 */
async function findByUserId(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM sessions
    WHERE user_id = ?
  `;
  const [{ total }] = await db.query(countSql, [userId]);

  const sql = `
    SELECT id, user_id, token, ip_address, user_agent, 
           expires_at, created_at, revoked_at
    FROM sessions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const sessions = await db.query(sql, [userId, limit, offset]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Revoke a session
 * @param {number} sessionId - Session ID
 * @returns {Promise<number>} Number of affected rows
 */
async function revoke(sessionId) {
  const sql = `
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE id = ?
  `;
  return await db.update(sql, [sessionId]);
}

/**
 * Revoke session by token
 * @param {string} token - JWT token
 * @returns {Promise<number>} Number of affected rows
 */
async function revokeByToken(token) {
  const sql = `
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE token = ?
  `;
  return await db.update(sql, [token]);
}

/**
 * Revoke all sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function revokeAllByUserId(userId) {
  const sql = `
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE user_id = ? AND revoked_at IS NULL
  `;
  return await db.update(sql, [userId]);
}

/**
 * Revoke all sessions except the current one
 * @param {number} userId - User ID
 * @param {string} currentToken - Current session token
 * @returns {Promise<number>} Number of affected rows
 */
async function revokeAllExceptCurrent(userId, currentToken) {
  const sql = `
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE user_id = ? AND token != ? AND revoked_at IS NULL
  `;
  return await db.update(sql, [userId, currentToken]);
}

/**
 * Check if session is valid
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if session is valid
 */
async function isValid(token) {
  const session = await findByToken(token);
  
  if (!session) {
    return false;
  }

  // Check if session is revoked
  if (session.revoked_at) {
    return false;
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Update session last accessed time
 * @param {number} sessionId - Session ID
 * @returns {Promise<number>} Number of affected rows
 */
async function updateLastAccessed(sessionId) {
  const sql = `
    UPDATE sessions
    SET last_accessed_at = NOW()
    WHERE id = ?
  `;
  return await db.update(sql, [sessionId]);
}

/**
 * Delete expired sessions
 * @returns {Promise<number>} Number of affected rows
 */
async function deleteExpired() {
  const sql = `
    DELETE FROM sessions
    WHERE expires_at < NOW()
  `;
  return await db.remove(sql);
}

/**
 * Delete revoked sessions older than specified days
 * @param {number} days - Number of days
 * @returns {Promise<number>} Number of affected rows
 */
async function deleteRevokedOlderThan(days) {
  const sql = `
    DELETE FROM sessions
    WHERE revoked_at IS NOT NULL 
      AND revoked_at < DATE_SUB(NOW(), INTERVAL ? DAY)
  `;
  return await db.remove(sql, [days]);
}

/**
 * Get session statistics
 * @returns {Promise<Object>} Session statistics
 */
async function getStatistics() {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN revoked_at IS NULL AND expires_at > NOW() THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END) as revoked,
      SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired,
      COUNT(DISTINCT user_id) as unique_users
    FROM sessions
  `;
  return await db.queryOne(sql);
}

/**
 * Get all sessions with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Sessions and pagination info
 */
async function getAll(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = 'SELECT COUNT(*) as total FROM sessions';
  const [{ total }] = await db.query(countSql);

  const sql = `
    SELECT s.id, s.user_id, s.ip_address, s.user_agent, 
           s.expires_at, s.created_at, s.revoked_at,
           u.username
    FROM sessions s
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const sessions = await db.query(sql, [limit, offset]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  create,
  findByToken,
  findById,
  findActiveByUserId,
  findByUserId,
  revoke,
  revokeByToken,
  revokeAllByUserId,
  revokeAllExceptCurrent,
  isValid,
  updateLastAccessed,
  deleteExpired,
  deleteRevokedOlderThan,
  getStatistics,
  getAll
};

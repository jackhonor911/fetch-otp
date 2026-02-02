const bcrypt = require('bcrypt');
const db = require('../config/database');
const { BCRYPT_SALT_ROUNDS, MAX_LOGIN_ATTEMPTS, getLockoutExpiration } = require('../config/security');

/**
 * User Model
 * Handles user-related database operations
 */

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null
 */
async function findByUsername(username) {
  const sql = `
    SELECT id, username, password_hash, email, role, is_active, 
           failed_login_attempts, locked_until, created_at, updated_at
    FROM users
    WHERE username = ?
  `;
  return await db.queryOne(sql, [username]);
}

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findById(id) {
  const sql = `
    SELECT id, username, email, role, is_active, 
           failed_login_attempts, locked_until, created_at, updated_at
    FROM users
    WHERE id = ?
  `;
  return await db.queryOne(sql, [id]);
}

/**
 * Find user by email
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} User object or null
 */
async function findByEmail(email) {
  const sql = `
    SELECT id, username, password_hash, email, role, is_active, 
           failed_login_attempts, locked_until, created_at, updated_at
    FROM users
    WHERE email = ?
  `;
  return await db.queryOne(sql, [email]);
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.username - Username
 * @param {string} userData.password - Plain text password
 * @param {string} userData.email - Email (optional)
 * @param {string} userData.role - User role (default: 'user')
 * @returns {Promise<number>} New user ID
 */
async function create(userData) {
  const { username, password, email, role = 'user' } = userData;

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const sql = `
    INSERT INTO users (username, password_hash, email, role)
    VALUES (?, ?, ?, ?)
  `;

  return await db.insert(sql, [username, passwordHash, email, role]);
}

/**
 * Verify user password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Update user's last login timestamp
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function updateLastLogin(userId) {
  const sql = `
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = ?
  `;
  return await db.update(sql, [userId]);
}

/**
 * Increment failed login attempts
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user data
 */
async function incrementFailedAttempts(userId) {
  const sql = `
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = ?
  `;
  await db.update(sql, [userId]);

  // Get updated user data
  const user = await findById(userId);
  
  // Lock account if max attempts reached
  if (user && user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS) {
    await lockAccount(userId);
    return await findById(userId);
  }

  return user;
}

/**
 * Reset failed login attempts
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function resetFailedAttempts(userId) {
  const sql = `
    UPDATE users
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE id = ?
  `;
  return await db.update(sql, [userId]);
}

/**
 * Lock user account
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function lockAccount(userId) {
  const lockedUntil = getLockoutExpiration();
  const sql = `
    UPDATE users
    SET locked_until = ?
    WHERE id = ?
  `;
  return await db.update(sql, [lockedUntil, userId]);
}

/**
 * Unlock user account
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function unlockAccount(userId) {
  const sql = `
    UPDATE users
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE id = ?
  `;
  return await db.update(sql, [userId]);
}

/**
 * Update user email
 * @param {number} userId - User ID
 * @param {string} email - New email
 * @returns {Promise<number>} Number of affected rows
 */
async function updateEmail(userId, email) {
  const sql = `
    UPDATE users
    SET email = ?
    WHERE id = ?
  `;
  return await db.update(sql, [email, userId]);
}

/**
 * Update user role
 * @param {number} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<number>} Number of affected rows
 */
async function updateRole(userId, role) {
  const sql = `
    UPDATE users
    SET role = ?
    WHERE id = ?
  `;
  return await db.update(sql, [role, userId]);
}

/**
 * Activate user account
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function activate(userId) {
  const sql = `
    UPDATE users
    SET is_active = TRUE
    WHERE id = ?
  `;
  return await db.update(sql, [userId]);
}

/**
 * Deactivate user account
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function deactivate(userId) {
  const sql = `
    UPDATE users
    SET is_active = FALSE
    WHERE id = ?
  `;
  return await db.update(sql, [userId]);
}

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} newPassword - New plain text password
 * @returns {Promise<number>} Number of affected rows
 */
async function changePassword(userId, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  const sql = `
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
  `;
  return await db.update(sql, [passwordHash, userId]);
}

/**
 * Get all users with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Users and pagination info
 */
async function getAll(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = 'SELECT COUNT(*) as total FROM users';
  const [{ total }] = await db.query(countSql);

  const sql = `
    SELECT id, username, email, role, is_active, 
           failed_login_attempts, locked_until, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const users = await db.query(sql, [limit, offset]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Delete user by ID
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of affected rows
 */
async function deleteById(userId) {
  const sql = 'DELETE FROM users WHERE id = ?';
  return await db.remove(sql, [userId]);
}

module.exports = {
  findByUsername,
  findById,
  findByEmail,
  create,
  verifyPassword,
  updateLastLogin,
  incrementFailedAttempts,
  resetFailedAttempts,
  lockAccount,
  unlockAccount,
  updateEmail,
  updateRole,
  activate,
  deactivate,
  changePassword,
  getAll,
  deleteById
};

const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const { generateToken, getTokenExpirationSeconds } = require('../config/jwt');
const { isAccountLocked, getClientIp, getUserAgent } = require('../config/security');
const { AppError } = require('../middleware/errorHandler');

/**
 * Authentication Service
 * Handles authentication business logic
 */

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Plain text password
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Login result with token and user info
 */
async function login(username, password, req) {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Find user by username
  const user = await User.findByUsername(username);

  if (!user) {
    // Log failed attempt
    await AuditLog.create({
      userId: null,
      action: 'login',
      resource: 'auth',
      details: { username, reason: 'user_not_found' },
      ipAddress,
      status: 'failure'
    });

    throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check if account is active
  if (!user.is_active) {
    await AuditLog.create({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      details: { username, reason: 'account_inactive' },
      ipAddress,
      status: 'failure'
    });

    throw new AppError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
  }

  // Check if account is locked
  if (isAccountLocked(user.locked_until)) {
    await AuditLog.create({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      details: { username, reason: 'account_locked' },
      ipAddress,
      status: 'failure'
    });

    throw new AppError('Account is temporarily locked. Please try again later.', 423, 'ACCOUNT_LOCKED');
  }

  // Verify password
  const isPasswordValid = await User.verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    // Increment failed attempts
    const updatedUser = await User.incrementFailedAttempts(user.id);

    // Log failed attempt
    await AuditLog.create({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      details: { 
        username, 
        failedAttempts: updatedUser.failed_login_attempts,
        isLocked: !!updatedUser.locked_until
      },
      ipAddress,
      status: 'failure'
    });

    throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
  }

  // Reset failed attempts on successful login
  await User.resetFailedAttempts(user.id);

  // Update last login
  await User.updateLastLogin(user.id);

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role
  });

  // Calculate token expiration
  const expiresIn = getTokenExpirationSeconds();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  // Create session
  await Session.create({
    userId: user.id,
    token,
    expiresAt,
    ipAddress,
    userAgent
  });

  // Log successful login
  await AuditLog.create({
    userId: user.id,
    action: 'login',
    resource: 'auth',
    details: { username },
    ipAddress,
    status: 'success'
  });

  // Return user info (without sensitive data)
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    expiresIn
  };
}

/**
 * Logout user
 * @param {number} userId - User ID
 * @param {string} token - JWT token
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
async function logout(userId, token, req) {
  const ipAddress = getClientIp(req);

  // Revoke session
  await Session.revokeByToken(token);

  // Log logout
  await AuditLog.create({
    userId,
    action: 'logout',
    resource: 'auth',
    details: {},
    ipAddress,
    status: 'success'
  });
}

/**
 * Get current user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User object
 */
async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

/**
 * Refresh token
 * @param {string} currentToken - Current JWT token
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} New token and expiration
 */
async function refreshToken(currentToken, req) {
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Check if session is valid
  const isValid = await Session.isValid(currentToken);

  if (!isValid) {
    throw new AppError('Invalid or expired session', 401, 'INVALID_TOKEN');
  }

  // Get session to extract user ID
  const session = await Session.findByToken(currentToken);

  if (!session) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }

  // Get user
  const user = await User.findById(session.user_id);

  if (!user || !user.is_active) {
    throw new AppError('User not found or inactive', 401, 'INVALID_TOKEN');
  }

  // Revoke old session
  await Session.revoke(session.id);

  // Generate new token
  const newToken = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role
  });

  // Calculate token expiration
  const expiresIn = getTokenExpirationSeconds();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  // Create new session
  await Session.create({
    userId: user.id,
    token: newToken,
    expiresAt,
    ipAddress,
    userAgent
  });

  // Log token refresh
  await AuditLog.create({
    userId: user.id,
    action: 'token_refresh',
    resource: 'auth',
    details: {},
    ipAddress,
    status: 'success'
  });

  return {
    token: newToken,
    expiresIn
  };
}

/**
 * Change password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
async function changePassword(userId, currentPassword, newPassword, req) {
  const ipAddress = getClientIp(req);

  // Get user with password hash
  const user = await User.findByUsername((await User.findById(userId)).username);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Verify current password
  const isPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);

  if (!isPasswordValid) {
    await AuditLog.create({
      userId: user.id,
      action: 'password_change',
      resource: 'auth',
      details: { reason: 'invalid_current_password' },
      ipAddress,
      status: 'failure'
    });

    throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
  }

  // Change password
  await User.changePassword(userId, newPassword);

  // Revoke all sessions (force re-login)
  await Session.revokeAllByUserId(userId);

  // Log password change
  await AuditLog.create({
    userId: user.id,
    action: 'password_change',
    resource: 'auth',
    details: {},
    ipAddress,
    status: 'success'
  });
}

module.exports = {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword
};

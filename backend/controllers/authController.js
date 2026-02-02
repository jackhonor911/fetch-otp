const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */

/**
 * Login controller
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const result = await authService.login(username, password, req);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Logout controller
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.substring(7);
  
  await authService.logout(req.user.id, token, req);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Get current user controller
 * GET /api/v1/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Refresh token controller
 * POST /api/v1/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.substring(7);
  
  const result = await authService.refreshToken(token, req);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Change password controller
 * POST /api/v1/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(req.user.id, currentPassword, newPassword, req);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword
};

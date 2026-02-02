const Otp = require('../models/Otp');
const AuditLog = require('../models/AuditLog');
const { getClientIp } = require('../config/security');
const { AppError } = require('../middleware/errorHandler');

/**
 * OTP Service
 * Handles OTP-related business logic
 */

/**
 * Get latest OTP for a mobile number
 * @param {string} mobileNumber - Mobile number
 * @param {Object} req - Express request object
 * @returns {Promise<Object|null>} Latest OTP or null
 */
async function getLatestOtp(mobileNumber, req) {
  const ipAddress = getClientIp(req);

  // Get latest OTP
  const otp = await Otp.findLatestByMobileNumber(mobileNumber);

  if (!otp) {
    // Log failed fetch
    await AuditLog.create({
      userId: req.user ? req.user.id : null,
      action: 'otp_fetch',
      resource: 'otp',
      details: { mobileNumber, reason: 'not_found' },
      ipAddress,
      status: 'failure'
    });

    return null;
  }

  // Log successful fetch
  await AuditLog.create({
    userId: req.user ? req.user.id : null,
    action: 'otp_fetch',
    resource: 'otp',
    details: { mobileNumber, otpId: otp.id },
    ipAddress,
    status: 'success'
  });

  return {
    id: otp.id,
    mobileNumber: otp.mobile_number,
    otpCode: otp.otp_code,
    createdAt: otp.created_at,
    expiresAt: otp.expires_at,
    isUsed: otp.is_used,
    usedAt: otp.used_at
  };
}

/**
 * Get OTP history for a mobile number
 * @param {string} mobileNumber - Mobile number
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} OTP history with pagination
 */
async function getOtpHistory(mobileNumber, page, limit, req) {
  const ipAddress = getClientIp(req);

  // Get OTP history
  const result = await Otp.getHistoryByMobileNumber(mobileNumber, page, limit);

  // Transform OTP data
  const transformedOtps = result.otps.map(otp => ({
    id: otp.id,
    mobileNumber: otp.mobile_number,
    otpCode: otp.otp_code,
    createdAt: otp.created_at,
    expiresAt: otp.expires_at,
    isUsed: otp.is_used,
    usedAt: otp.used_at
  }));

  // Log fetch
  await AuditLog.create({
    userId: req.user ? req.user.id : null,
    action: 'otp_history_fetch',
    resource: 'otp',
    details: { mobileNumber, page, limit, count: result.otps.length },
    ipAddress,
    status: 'success'
  });

  return {
    otps: transformedOtps,
    pagination: result.pagination
  };
}

/**
 * Get OTP statistics
 * @returns {Promise<Object>} OTP statistics
 */
async function getStatistics() {
  const stats = await Otp.getStatistics();

  return {
    total: stats.total,
    used: stats.used,
    unused: stats.unused,
    expired: stats.expired,
    uniqueMobileNumbers: stats.unique_mobile_numbers
  };
}

/**
 * Get all OTPs with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} OTPs with pagination
 */
async function getAllOtps(page, limit) {
  const result = await Otp.getAll(page, limit);

  // Transform OTP data
  const transformedOtps = result.otps.map(otp => ({
    id: otp.id,
    mobileNumber: otp.mobile_number,
    otpCode: otp.otp_code,
    createdAt: otp.created_at,
    expiresAt: otp.expires_at,
    isUsed: otp.is_used,
    usedAt: otp.used_at
  }));

  return {
    otps: transformedOtps,
    pagination: result.pagination
  };
}

/**
 * Get OTPs by date range
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} OTPs with pagination
 */
async function getOtpsByDateRange(startDate, endDate, page, limit) {
  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format', 400, 'INVALID_INPUT');
  }

  if (start > end) {
    throw new AppError('Start date must be before end date', 400, 'INVALID_INPUT');
  }

  const result = await Otp.getByDateRange(start, end, page, limit);

  // Transform OTP data
  const transformedOtps = result.otps.map(otp => ({
    id: otp.id,
    mobileNumber: otp.mobile_number,
    otpCode: otp.otp_code,
    createdAt: otp.created_at,
    expiresAt: otp.expires_at,
    isUsed: otp.is_used,
    usedAt: otp.used_at
  }));

  return {
    otps: transformedOtps,
    pagination: result.pagination
  };
}

/**
 * Create a new OTP record
 * @param {Object} otpData - OTP data
 * @param {string} otpData.mobileNumber - Mobile number
 * @param {string} otpData.otpCode - OTP code
 * @param {Date|null} otpData.expiresAt - Expiration timestamp (optional)
 * @param {Object} req - Express request object
 * @returns {Promise<number>} New OTP ID
 */
async function createOtp(otpData, req) {
  const ipAddress = getClientIp(req);

  const otpId = await Otp.create(otpData);

  // Log creation
  await AuditLog.create({
    userId: req.user ? req.user.id : null,
    action: 'otp_create',
    resource: 'otp',
    details: { mobileNumber: otpData.mobileNumber, otpId },
    ipAddress,
    status: 'success'
  });

  return otpId;
}

/**
 * Mark OTP as used
 * @param {number} otpId - OTP ID
 * @param {Object} req - Express request object
 * @returns {Promise<number>} Number of affected rows
 */
async function markOtpAsUsed(otpId, req) {
  const ipAddress = getClientIp(req);

  const affectedRows = await Otp.markAsUsed(otpId);

  // Log usage
  await AuditLog.create({
    userId: req.user ? req.user.id : null,
    action: 'otp_use',
    resource: 'otp',
    details: { otpId },
    ipAddress,
    status: 'success'
  });

  return affectedRows;
}

module.exports = {
  getLatestOtp,
  getOtpHistory,
  getStatistics,
  getAllOtps,
  getOtpsByDateRange,
  createOtp,
  markOtpAsUsed
};

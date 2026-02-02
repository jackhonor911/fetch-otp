const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateParams, validateQuery } = require('../middleware/validator');
const { schemas } = require('../middleware/validator');

/**
 * OTP Routes
 * Base path: /api/v1/otp
 */

/**
 * @route   GET /api/v1/otp/latest/:mobileNumber
 * @desc    Get latest OTP for a mobile number
 * @access  Private
 */
router.get(
  '/latest/:mobileNumber',
  authenticate,
  validateParams(schemas.mobileNumber),
  otpController.getLatestOtp
);

/**
 * @route   GET /api/v1/otp/history/:mobileNumber
 * @desc    Get paginated OTP history for a mobile number
 * @access  Private
 */
router.get(
  '/history/:mobileNumber',
  authenticate,
  validateParams(schemas.mobileNumber),
  validateQuery(schemas.otpHistory),
  otpController.getOtpHistory
);

/**
 * @route   GET /api/v1/otp/statistics
 * @desc    Get OTP statistics
 * @access  Private (Admin only)
 */
router.get(
  '/statistics',
  authenticate,
  authorize('admin'),
  otpController.getOtpStatistics
);

/**
 * @route   GET /api/v1/otp/all
 * @desc    Get all OTPs with pagination
 * @access  Private (Admin only)
 */
router.get(
  '/all',
  authenticate,
  authorize('admin'),
  validateQuery(schemas.otpHistory),
  otpController.getAllOtps
);

/**
 * @route   GET /api/v1/otp/by-date
 * @desc    Get OTPs by date range
 * @access  Private (Admin only)
 */
router.get(
  '/by-date',
  authenticate,
  authorize('admin'),
  otpController.getOtpsByDateRange
);

module.exports = router;

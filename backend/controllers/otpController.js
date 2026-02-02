const otpService = require('../services/otpService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * OTP Controller
 * Handles OTP-related HTTP requests
 */

/**
 * Get latest OTP for a mobile number
 * GET /api/v1/otp/latest/:mobileNumber
 */
const getLatestOtp = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.params;

  const otp = await otpService.getLatestOtp(mobileNumber, req);

  if (!otp) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'OTP_NOT_FOUND',
        message: 'No OTP found for this mobile number'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: otp
  });
});

/**
 * Get OTP history for a mobile number
 * GET /api/v1/otp/history/:mobileNumber
 */
const getOtpHistory = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const result = await otpService.getOtpHistory(mobileNumber, page, limit, req);

  res.status(200).json({
    success: true,
    data: result.otps,
    pagination: result.pagination
  });
});

/**
 * Get OTP statistics
 * GET /api/v1/otp/statistics
 */
const getOtpStatistics = asyncHandler(async (req, res) => {
  const statistics = await otpService.getStatistics();

  res.status(200).json({
    success: true,
    data: statistics
  });
});

/**
 * Get all OTPs (admin only)
 * GET /api/v1/otp/all
 */
const getAllOtps = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await otpService.getAllOtps(page, limit);

  res.status(200).json({
    success: true,
    data: result.otps,
    pagination: result.pagination
  });
});

/**
 * Get OTPs by date range (admin only)
 * GET /api/v1/otp/by-date
 */
const getOtpsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 20 } = req.query;

  const result = await otpService.getOtpsByDateRange(startDate, endDate, page, limit);

  res.status(200).json({
    success: true,
    data: result.otps,
    pagination: result.pagination
  });
});

module.exports = {
  getLatestOtp,
  getOtpHistory,
  getOtpStatistics,
  getAllOtps,
  getOtpsByDateRange
};

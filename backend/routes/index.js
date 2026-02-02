const express = require('express');
const router = express.Router();

/**
 * Route Aggregator
 * Combines all route modules
 */

const authRoutes = require('./auth');
const otpRoutes = require('./otp');

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);

module.exports = router;

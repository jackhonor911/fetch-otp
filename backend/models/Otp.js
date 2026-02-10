const axios = require('axios');
const db = require('../config/database');
const { getOtpApiUrl } = require('../config/envConfig');

/**
 * Find latest OTP for a mobile number from external API
 * @param {string} mobileNumber - Mobile number
 * @param {string} [role] - User role for environment-specific URL selection
 * @returns {Promise<Object|null>} OTP object or null
 */
async function findLatestByMobileNumber(mobileNumber, role) {
  try {
    const apiBase = getOtpApiUrl(role);
    // Ensure we don't double up on query params if already present, though here we append ?mobile=
    const url = apiBase.includes('?') ? `${apiBase}&mobile=${mobileNumber}` : `${apiBase}?mobile=${mobileNumber}`;
    const response = await axios.get(url, {
      headers: {
        'x-api-key': process.env.OTP_API_KEY || 'random_string'
      }
    });

    const data = response.data;

    if (data && data.code === 200 && data.status === 1) {
      return {
        mobile_number: mobileNumber,
        otp_code: data.data,
        created_at: new Date().toISOString(), // Use current time as API doesn't provide it
        expires_at: new Date(Date.now() + 5 * 60000).toISOString(), // Assume 5 min expiry
        is_used: 0,
        used_at: null
      };
    }
    return null;
  } catch (error) {
    console.error('OTP API fetch error:', error.message);
    return null;
  }
}

/**
 * Find OTP by ID from local database
 * @param {number} id - OTP ID
 * @returns {Promise<Object|null>} OTP object or null
 */
async function findById(id) {
  const sql = `
    SELECT id, mobile_number, otp_code, created_at, expires_at, is_used, used_at
    FROM otps
    WHERE id = ?
  `;
  return await db.queryOne(sql, [id]);
}

/**
 * Get OTP history for a mobile number (Currently limited to latest via API)
 * @param {string} mobileNumber - Mobile number
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} OTPs and pagination info
 */
async function getHistoryByMobileNumber(mobileNumber, page = 1, limit = 20, role) {
  // Since the provided API only returns the latest OTP, history will show that
  const latest = await findLatestByMobileNumber(mobileNumber, role);
  const otps = latest ? [latest] : [];

  return {
    otps,
    pagination: {
      page,
      limit,
      total: otps.length,
      totalPages: 1
    }
  };
}


/**
 * Create a new OTP record
 * @param {Object} otpData - OTP data
 * @param {string} otpData.mobileNumber - Mobile number
 * @param {string} otpData.otpCode - OTP code
 * @param {Date|null} otpData.expiresAt - Expiration timestamp (optional)
 * @returns {Promise<number>} New OTP ID
 */
async function create(otpData) {
  const { mobileNumber, otpCode, expiresAt } = otpData;

  const sql = `
    INSERT INTO otps (mobile_number, otp_code, expires_at)
    VALUES (?, ?, ?)
  `;

  return await db.insert(sql, [mobileNumber, otpCode, expiresAt || null]);
}

/**
 * Mark OTP as used
 * @param {number} otpId - OTP ID
 * @returns {Promise<number>} Number of affected rows
 */
async function markAsUsed(otpId) {
  const sql = `
    UPDATE otps
    SET is_used = TRUE, used_at = NOW()
    WHERE id = ?
  `;
  return await db.update(sql, [otpId]);
}

/**
 * Get all OTPs with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} OTPs and pagination info
 */
async function getAll(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = 'SELECT COUNT(*) as total FROM otps';
  const [{ total }] = await db.query(countSql);

  const sql = `
    SELECT id, mobile_number, otp_code, created_at, expires_at, is_used, used_at
    FROM otps
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const otps = await db.query(sql, [limit, offset]);

  return {
    otps,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get OTPs by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} OTPs and pagination info
 */
async function getByDateRange(startDate, endDate, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM otps
    WHERE created_at BETWEEN ? AND ?
  `;
  const [{ total }] = await db.query(countSql, [startDate, endDate]);

  const sql = `
    SELECT id, mobile_number, otp_code, created_at, expires_at, is_used, used_at
    FROM otps
    WHERE created_at BETWEEN ? AND ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const otps = await db.query(sql, [startDate, endDate, limit, offset]);

  return {
    otps,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get unused OTPs
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} OTPs and pagination info
 */
async function getUnused(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = 'SELECT COUNT(*) as total FROM otps WHERE is_used = FALSE';
  const [{ total }] = await db.query(countSql);

  const sql = `
    SELECT id, mobile_number, otp_code, created_at, expires_at, is_used, used_at
    FROM otps
    WHERE is_used = FALSE
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const otps = await db.query(sql, [limit, offset]);

  return {
    otps,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get expired OTPs
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} OTPs and pagination info
 */
async function getExpired(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM otps
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
  `;
  const [{ total }] = await db.query(countSql);

  const sql = `
    SELECT id, mobile_number, otp_code, created_at, expires_at, is_used, used_at
    FROM otps
    WHERE expires_at IS NOT NULL AND expires_at < NOW()
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const otps = await db.query(sql, [limit, offset]);

  return {
    otps,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Delete OTP by ID
 * @param {number} otpId - OTP ID
 * @returns {Promise<number>} Number of affected rows
 */
async function deleteById(otpId) {
  const sql = 'DELETE FROM otps WHERE id = ?';
  return await db.remove(sql, [otpId]);
}

/**
 * Delete OTPs older than specified days
 * @param {number} days - Number of days
 * @returns {Promise<number>} Number of affected rows
 */
async function deleteOlderThan(days) {
  const sql = `
    DELETE FROM otps
    WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
  `;
  return await db.remove(sql, [days]);
}

/**
 * Get OTP statistics
 * @returns {Promise<Object>} OTP statistics
 */
async function getStatistics() {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used,
      SUM(CASE WHEN is_used = FALSE THEN 1 ELSE 0 END) as unused,
      SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 1 ELSE 0 END) as expired,
      COUNT(DISTINCT mobile_number) as unique_mobile_numbers
    FROM otps
  `;
  return await db.queryOne(sql);
}

module.exports = {
  findLatestByMobileNumber,
  findById,
  getHistoryByMobileNumber,
  create,
  markAsUsed,
  getAll,
  getByDateRange,
  getUnused,
  getExpired,
  deleteById,
  deleteOlderThan,
  getStatistics
};

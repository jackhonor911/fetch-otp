const db = require('../config/database');

/**
 * Audit Log Model
 * Handles audit trail for security and compliance
 */

/**
 * Create an audit log entry
 * @param {Object} logData - Audit log data
 * @param {number|null} logData.userId - User ID (nullable)
 * @param {string} logData.action - Action performed
 * @param {string|null} logData.resource - Resource affected (optional)
 * @param {Object|null} logData.details - Additional details as JSON (optional)
 * @param {string|null} logData.ipAddress - Client IP address (optional)
 * @param {string} logData.status - Status: 'success' or 'failure'
 * @returns {Promise<number>} New audit log ID
 */
async function create(logData) {
  const { userId, action, resource, details, ipAddress, status = 'success' } = logData;

  const sql = `
    INSERT INTO audit_log (user_id, action, resource, details, ip_address, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const detailsJson = details ? JSON.stringify(details) : null;
  return await db.insert(sql, [userId, action, resource, detailsJson, ipAddress, status]);
}

/**
 * Get audit logs by user ID
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Audit logs and pagination info
 */
async function findByUserId(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM audit_log
    WHERE user_id = ?
  `;
  const [{ total }] = await db.query(countSql, [userId]);

  const sql = `
    SELECT id, user_id, action, resource, details, ip_address, status, created_at
    FROM audit_log
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const logs = await db.query(sql, [userId, limit, offset]);

  // Parse JSON details
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));

  return {
    logs: parsedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get audit logs by action
 * @param {string} action - Action type
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Audit logs and pagination info
 */
async function findByAction(action, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM audit_log
    WHERE action = ?
  `;
  const [{ total }] = await db.query(countSql, [action]);

  const sql = `
    SELECT id, user_id, action, resource, details, ip_address, status, created_at
    FROM audit_log
    WHERE action = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const logs = await db.query(sql, [action, limit, offset]);

  // Parse JSON details
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));

  return {
    logs: parsedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get audit logs by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Audit logs and pagination info
 */
async function findByDateRange(startDate, endDate, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM audit_log
    WHERE created_at BETWEEN ? AND ?
  `;
  const [{ total }] = await db.query(countSql, [startDate, endDate]);

  const sql = `
    SELECT id, user_id, action, resource, details, ip_address, status, created_at
    FROM audit_log
    WHERE created_at BETWEEN ? AND ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const logs = await db.query(sql, [startDate, endDate, limit, offset]);

  // Parse JSON details
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));

  return {
    logs: parsedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get all audit logs with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Audit logs and pagination info
 */
async function getAll(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = 'SELECT COUNT(*) as total FROM audit_log';
  const [{ total }] = await db.query(countSql);

  const sql = `
    SELECT al.id, al.user_id, al.action, al.resource, al.details, 
           al.ip_address, al.status, al.created_at,
           u.username
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const logs = await db.query(sql, [limit, offset]);

  // Parse JSON details
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));

  return {
    logs: parsedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get audit logs by status
 * @param {string} status - Status: 'success' or 'failure'
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Audit logs and pagination info
 */
async function findByStatus(status, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM audit_log
    WHERE status = ?
  `;
  const [{ total }] = await db.query(countSql, [status]);

  const sql = `
    SELECT id, user_id, action, resource, details, ip_address, status, created_at
    FROM audit_log
    WHERE status = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const logs = await db.query(sql, [status, limit, offset]);

  // Parse JSON details
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));

  return {
    logs: parsedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get failed login attempts for a user
 * @param {number} userId - User ID
 * @param {number} hours - Number of hours to look back
 * @returns {Promise<number>} Count of failed login attempts
 */
async function getFailedLoginAttempts(userId, hours = 1) {
  const sql = `
    SELECT COUNT(*) as count
    FROM audit_log
    WHERE user_id = ? 
      AND action = 'login'
      AND status = 'failure'
      AND created_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
  `;
  const result = await db.queryOne(sql, [userId, hours]);
  return result ? result.count : 0;
}

/**
 * Get audit log statistics
 * @returns {Promise<Object>} Audit log statistics
 */
async function getStatistics() {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) as failed,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT ip_address) as unique_ips
    FROM audit_log
  `;
  return await db.queryOne(sql);
}

/**
 * Get recent audit logs
 * @param {number} limit - Number of logs to return
 * @returns {Promise<Array>} Array of recent audit logs
 */
async function getRecent(limit = 50) {
  const sql = `
    SELECT al.id, al.user_id, al.action, al.resource, al.details, 
           al.ip_address, al.status, al.created_at,
           u.username
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `;
  const logs = await db.query(sql, [limit]);

  // Parse JSON details
  return logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));
}

/**
 * Delete audit logs older than specified days
 * @param {number} days - Number of days
 * @returns {Promise<number>} Number of affected rows
 */
async function deleteOlderThan(days) {
  const sql = `
    DELETE FROM audit_log
    WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
  `;
  return await db.remove(sql, [days]);
}

/**
 * Get audit logs by IP address
 * @param {string} ipAddress - IP address
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Audit logs and pagination info
 */
async function findByIpAddress(ipAddress, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const countSql = `
    SELECT COUNT(*) as total
    FROM audit_log
    WHERE ip_address = ?
  `;
  const [{ total }] = await db.query(countSql, [ipAddress]);

  const sql = `
    SELECT id, user_id, action, resource, details, ip_address, status, created_at
    FROM audit_log
    WHERE ip_address = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const logs = await db.query(sql, [ipAddress, limit, offset]);

  // Parse JSON details
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));

  return {
    logs: parsedLogs,
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
  findByUserId,
  findByAction,
  findByDateRange,
  getAll,
  findByStatus,
  getFailedLoginAttempts,
  getStatistics,
  getRecent,
  deleteOlderThan,
  findByIpAddress
};

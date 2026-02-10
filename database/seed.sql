-- ============================================================================
-- OTP Fetch Application - Database Seed Data
-- Database: dsa
-- ============================================================================

USE dsa;

-- ============================================================================
-- Seed: users table
-- Default admin user with username 'admin' and password 'SecurePass123!'
-- Password hashed using bcrypt with 12 salt rounds
-- ============================================================================
INSERT INTO users (username, password_hash, email, role, is_active, failed_login_attempts, locked_until)
VALUES (
    'admin',
    '$2b$12$VKFl6jpeBE2OPMV3oKZ6aO/XD2nIckpOWWYihfAbJjHPjf2SimwlO',
    'admin@example.com',
    'admin',
    TRUE,
    0,
    NULL
) ON DUPLICATE KEY UPDATE username=username;

-- ============================================================================
-- Seed: Environment-specific users
-- One user per environment, all with password 'SecurePass123!'
-- Same bcrypt hash as admin user
-- ============================================================================
INSERT INTO users (username, password_hash, email, role, is_active, failed_login_attempts, locked_until)
VALUES (
    'local_user',
    '$2b$12$VKFl6jpeBE2OPMV3oKZ6aO/XD2nIckpOWWYihfAbJjHPjf2SimwlO',
    'local@example.com',
    'local',
    TRUE,
    0,
    NULL
) ON DUPLICATE KEY UPDATE username=username;

INSERT INTO users (username, password_hash, email, role, is_active, failed_login_attempts, locked_until)
VALUES (
    'qa_user',
    '$2b$12$VKFl6jpeBE2OPMV3oKZ6aO/XD2nIckpOWWYihfAbJjHPjf2SimwlO',
    'qa@example.com',
    'qa',
    TRUE,
    0,
    NULL
) ON DUPLICATE KEY UPDATE username=username;

INSERT INTO users (username, password_hash, email, role, is_active, failed_login_attempts, locked_until)
VALUES (
    'uat_user',
    '$2b$12$VKFl6jpeBE2OPMV3oKZ6aO/XD2nIckpOWWYihfAbJjHPjf2SimwlO',
    'uat@example.com',
    'uat',
    TRUE,
    0,
    NULL
) ON DUPLICATE KEY UPDATE username=username;

INSERT INTO users (username, password_hash, email, role, is_active, failed_login_attempts, locked_until)
VALUES (
    'beta_user',
    '$2b$12$VKFl6jpeBE2OPMV3oKZ6aO/XD2nIckpOWWYihfAbJjHPjf2SimwlO',
    'beta@example.com',
    'beta',
    TRUE,
    0,
    NULL
) ON DUPLICATE KEY UPDATE username=username;

INSERT INTO users (username, password_hash, email, role, is_active, failed_login_attempts, locked_until)
VALUES (
    'prod_user',
    '$2b$12$VKFl6jpeBE2OPMV3oKZ6aO/XD2nIckpOWWYihfAbJjHPjf2SimwlO',
    'prod@example.com',
    'prod',
    TRUE,
    0,
    NULL
) ON DUPLICATE KEY UPDATE username=username;

-- ============================================================================
-- Seed: otps table
-- Sample OTP records for testing
-- ============================================================================

-- Recent unused OTPs
INSERT INTO otps (mobile_number, otp_code, created_at, expires_at, is_used, used_at) VALUES
('+919876543210', '123456', NOW() - INTERVAL 5 MINUTE, NOW() + INTERVAL 10 MINUTE, FALSE, NULL),
('+919876543211', '789012', NOW() - INTERVAL 3 MINUTE, NOW() + INTERVAL 12 MINUTE, FALSE, NULL),
('+919876543212', '345678', NOW() - INTERVAL 1 MINUTE, NOW() + INTERVAL 14 MINUTE, FALSE, NULL),
('+919876543213', '901234', NOW(), NOW() + INTERVAL 15 MINUTE, FALSE, NULL),
('+919876543214', '567890', NOW(), NOW() + INTERVAL 15 MINUTE, FALSE, NULL);

-- Used OTPs
INSERT INTO otps (mobile_number, otp_code, created_at, expires_at, is_used, used_at) VALUES
('+919876543215', '234567', NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 15 MINUTE, TRUE, NOW() - INTERVAL 20 MINUTE),
('+919876543216', '890123', NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 45 MINUTE, TRUE, NOW() - INTERVAL 50 MINUTE),
('+919876543217', '456789', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 105 MINUTE, TRUE, NOW() - INTERVAL 110 MINUTE);

-- Expired OTPs
INSERT INTO otps (mobile_number, otp_code, created_at, expires_at, is_used, used_at) VALUES
('+919876543218', '012345', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, FALSE, NULL),
('+919876543219', '678901', NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR, FALSE, NULL);

-- ============================================================================
-- Seed: sessions table
-- Sample session records for testing
-- ============================================================================
INSERT INTO sessions (user_id, token, expires_at, created_at, revoked_at) VALUES
(1, 'sample_token_abc123def456', NOW() + INTERVAL 1 HOUR, NOW() - INTERVAL 30 MINUTE, NULL),
(1, 'sample_token_xyz789ghi012', NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 10 MINUTE);

-- ============================================================================
-- Seed: audit_log table
-- Sample audit log entries for testing
-- ============================================================================
INSERT INTO audit_log (user_id, action, ip_address, user_agent, details) VALUES
(1, 'login', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"success": true}'),
(1, 'otp_fetch', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"mobile_number": "+919876543210"}'),
(1, 'logout', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"success": true}'),
(NULL, 'login_failed', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', '{"username": "unknown"}');

-- ============================================================================
-- Seed Summary
-- ============================================================================
-- Users: 6 (1 admin + 5 environment users: local, qa, uat, beta, prod)
-- OTPs: 10 records (5 unused, 3 used, 2 expired)
-- Sessions: 2 records (1 active, 1 revoked)
-- Audit Logs: 4 records
-- ============================================================================


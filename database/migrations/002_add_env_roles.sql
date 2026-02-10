-- ============================================================================
-- Migration: 002_add_env_roles
-- Description: Add environment-specific roles for role-based URL selection
-- ============================================================================

USE dsa;

-- Expand the role ENUM to include environment-specific roles
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'local', 'qa', 'uat', 'beta', 'prod') DEFAULT 'user';

-- Track migration
INSERT IGNORE INTO schema_migrations (version) VALUES ('002_add_env_roles');

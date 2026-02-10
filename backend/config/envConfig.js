/**
 * Environment Configuration
 * Maps user roles to environment-specific OTP API URLs
 */

// Role to environment URL key mapping
const ROLE_ENV_MAP = {
    local: 'OTP_API_URL_LOCAL',
    qa: 'OTP_API_URL_QA',
    uat: 'OTP_API_URL_UAT',
    beta: 'OTP_API_URL_BETA',
    prod: 'OTP_API_URL_PROD'
};

// Default fallback URL
const DEFAULT_OTP_URL = 'http://localhost:8282/api/v4/public/latest';

/**
 * Get the OTP API URL based on user role
 * Fallback chain: role-specific env var → OTP_API_BASE_URL → hardcoded default
 * @param {string} role - User role (local, qa, uat, beta, prod, admin, user)
 * @returns {string} OTP API base URL
 */
function getOtpApiUrl(role) {
    // Check if role has a specific env key mapped
    const envKey = ROLE_ENV_MAP[role];

    if (envKey && process.env[envKey]) {
        return process.env[envKey];
    }

    // Fallback to legacy single URL (backward compat for admin/user roles)
    return process.env.OTP_API_BASE_URL || DEFAULT_OTP_URL;
}

/**
 * Get the environment display name for a role
 * @param {string} role - User role
 * @returns {string} Human-readable environment name
 */
function getEnvironmentName(role) {
    const names = {
        local: 'Local',
        qa: 'QA',
        uat: 'UAT',
        beta: 'BETA',
        prod: 'PROD',
        admin: 'Default',
        user: 'Default'
    };
    return names[role] || 'Default';
}

module.exports = {
    getOtpApiUrl,
    getEnvironmentName,
    ROLE_ENV_MAP
};

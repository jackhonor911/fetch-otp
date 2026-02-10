/**
 * API Configuration
 */
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'auth_token';
const USER_ROLE_KEY = 'user_role';

/**
 * API Helper Class
 * Handles all HTTP requests to the backend
 */
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get the stored JWT token from localStorage
     */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Store JWT token in localStorage
     */
    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    /**
     * Clear JWT token from localStorage
     */
    clearToken() {
        localStorage.removeItem(TOKEN_KEY);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Make an HTTP request with proper headers and error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add Authorization header if token exists
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized - token expired or invalid
            if (response.status === 401) {
                this.clearToken();
                window.location.reload();
                throw new Error('Session expired. Please login again.');
            }

            // Parse JSON response
            const data = await response.json();

            // Handle API errors
            if (!response.ok) {
                let errorMessage = 'Request failed';
                if (data.message) {
                    errorMessage = data.message;
                } else if (data.error) {
                    errorMessage = typeof data.error === 'object' ? (data.error.message || 'Error occurred') : data.error;
                }
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            // Re-throw the error for the caller to handle
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}

/**
 * AuthService Class
 * Handles authentication operations
 */
class AuthService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Login with username and password
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @returns {Promise<Object>} - Returns { token, user }
     */
    async login(username, password) {
        const response = await this.apiClient.post('/auth/login', {
            username,
            password
        });

        // Store the JWT token and user role
        if (response.data && response.data.token) {
            this.apiClient.setToken(response.data.token);
        }
        if (response.data && response.data.user && response.data.user.role) {
            localStorage.setItem(USER_ROLE_KEY, response.data.user.role);
        }

        return response.data;
    }

    /**
     * Logout the current user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await this.apiClient.post('/auth/logout', {});
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error.message);
        } finally {
            // Always clear the token and role
            this.apiClient.clearToken();
            localStorage.removeItem(USER_ROLE_KEY);
        }
    }

    /**
     * Get current user information
     * @returns {Promise<Object>} - Returns user object
     */
    async getCurrentUser() {
        return this.apiClient.get('/auth/me');
    }
}

/**
 * OtpService Class
 * Handles OTP retrieval operations
 */
class OtpService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Get the latest OTP for a mobile number
     * @param {string} mobileNumber - The mobile number to fetch OTP for
     * @returns {Promise<Object>} - Returns OTP data
     */
    async getLatestOtp(mobileNumber) {
        if (!mobileNumber || mobileNumber.trim().length === 0) {
            throw new Error('Please enter a valid mobile number.');
        }

        const response = await this.apiClient.get(`/otp/latest/${encodeURIComponent(mobileNumber)}`);

        // Map backend fields to what UI expects
        const rawData = response.data;
        return {
            mobile: rawData.mobileNumber,
            otp: rawData.otpCode,
            receivedAt: rawData.createdAt,
            expiresAt: rawData.expiresAt,
            isUsed: rawData.isUsed
        };
    }

    /**
     * Get paginated OTP history for a mobile number
     * @param {string} mobileNumber - The mobile number to fetch history for
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Items per page (default: 10)
     * @returns {Promise<Object>} - Returns paginated OTP history
     */
    async getOtpHistory(mobileNumber, page = 1, limit = 10) {
        const response = await this.apiClient.get(
            `/otp/history/${encodeURIComponent(mobileNumber)}?page=${page}&limit=${limit}`
        );
        return response.data;
    }
}

/**
 * UI Controller
 * Handles DOM manipulation, events, and state updates
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize API Client and Services
    const apiClient = new ApiClient(API_BASE_URL);
    const authService = new AuthService(apiClient);
    const otpService = new OtpService(apiClient);

    // DOM Elements
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');

    const mobileInput = document.getElementById('mobileNumber');
    const getOtpBtn = document.getElementById('get-otp-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const otpResult = document.getElementById('otp-result');
    const resultMobile = document.getElementById('result-mobile');
    const otpCodeEl = document.getElementById('otp-code');
    const otpTimeEl = document.getElementById('otp-time');
    const envBadge = document.getElementById('env-badge');

    // Check for existing session on page load
    checkExistingSession();

    /**
     * Check if user has a valid session and redirect accordingly
     */
    async function checkExistingSession() {
        if (apiClient.isAuthenticated()) {
            try {
                // Verify token is still valid by fetching current user
                await authService.getCurrentUser();
                switchView('dashboard');
                updateEnvBadge();
            } catch (error) {
                // Token is invalid, clear it and show login
                apiClient.clearToken();
                switchView('login');
            }
        } else {
            switchView('login');
        }
    }

    /**
     * Switch between login and dashboard views
     * @param {string} viewName - 'login' or 'dashboard'
     */
    function switchView(viewName) {
        if (viewName === 'dashboard') {
            loginView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
        } else {
            dashboardView.classList.add('hidden');
            loginView.classList.remove('hidden');
        }
    }

    /**
     * Environment name mapping and badge colors
     */
    const ENV_CONFIG = {
        local: { label: 'LOCAL', color: '#6b7280' },
        qa: { label: 'QA', color: '#8b5cf6' },
        uat: { label: 'UAT', color: '#f59e0b' },
        beta: { label: 'BETA', color: '#3b82f6' },
        prod: { label: 'PROD', color: '#ef4444' },
        admin: { label: 'DEFAULT', color: '#6b7280' },
        user: { label: 'DEFAULT', color: '#6b7280' }
    };

    /**
     * Update the environment badge based on stored user role
     */
    function updateEnvBadge() {
        const role = localStorage.getItem(USER_ROLE_KEY);
        if (role && envBadge) {
            const config = ENV_CONFIG[role] || ENV_CONFIG['local'];
            envBadge.textContent = `Environment: ${config.label}`;
            envBadge.style.backgroundColor = config.color;
            envBadge.classList.remove('hidden');
        }
    }

    /**
     * Set loading state on a button
     * @param {HTMLElement} btnElement - The button element
     * @param {boolean} isLoading - Whether to show loading state
     * @param {string} text - Text to display
     */
    function setLoading(btnElement, isLoading, text) {
        if (isLoading) {
            btnElement.disabled = true;
            // Add spinner
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            btnElement.innerHTML = '';
            btnElement.appendChild(spinner);
            const span = document.createElement('span');
            span.textContent = text;
            btnElement.appendChild(span);
        } else {
            btnElement.disabled = false;
            btnElement.textContent = text;
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'error', or 'info'
     */
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icon based on type
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        } else {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `${iconSvg}<div class="toast-content">${message}</div>`;
        container.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date string
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // --- Event Listeners ---

    /**
     * Login Form Submit Handler
     */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = loginForm.username.value.trim();
        const password = loginForm.password.value;

        if (!username || !password) {
            showToast('Please enter both username and password', 'error');
            return;
        }

        setLoading(loginBtn, true, 'Authenticating...');

        try {
            const response = await authService.login(username, password);
            showToast('Login successful', 'success');
            switchView('dashboard');
            updateEnvBadge();
            loginForm.reset();
        } catch (error) {
            showToast(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            setLoading(loginBtn, false, 'Login');
        }
    });

    /**
     * Get OTP Button Click Handler
     */
    getOtpBtn.addEventListener('click', async () => {
        const mobile = mobileInput.value.trim();

        // Reset previous results
        otpResult.classList.add('hidden');

        if (!mobile) {
            showToast('Please enter a mobile number', 'error');
            mobileInput.focus();
            return;
        }

        setLoading(getOtpBtn, true, 'Fetching from DB...');

        try {
            const data = await otpService.getLatestOtp(mobile);

            // Update UI with results
            resultMobile.textContent = data.mobile || mobile;
            otpCodeEl.textContent = data.otp || '--';

            // Format the received time
            if (data.receivedAt) {
                otpTimeEl.textContent = `Received at ${formatDate(data.receivedAt)}`;
            } else {
                otpTimeEl.textContent = 'Fetched just now';
            }

            otpResult.classList.remove('hidden');
            showToast('OTP fetched successfully', 'success');
        } catch (error) {
            showToast(error.message || 'Failed to fetch OTP. Please try again.', 'error');
        } finally {
            setLoading(getOtpBtn, false, 'Get Latest OTP');
        }
    });

    /**
     * Logout Button Click Handler
     */
    logoutBtn.addEventListener('click', async () => {
        try {
            await authService.logout();
            showToast('Logged out securely', 'success');
        } catch (error) {
            showToast('Logout completed', 'success');
        } finally {
            switchView('login');
            mobileInput.value = '';
            otpResult.classList.add('hidden');
            if (envBadge) {
                envBadge.classList.add('hidden');
            }
        }
    });

    /**
     * Handle Enter key in mobile number input
     */
    mobileInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getOtpBtn.click();
        }
    });
});

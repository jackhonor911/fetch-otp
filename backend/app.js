const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { testConnection } = require('./config/database');
const { CORS_ORIGINS, HELMET_CONFIG } = require('./config/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const path = require('path');
const routes = require('./routes');

/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Trust proxy for accurate IP addresses behind load balancers
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet(HELMET_CONFIG));

// CORS configuration
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// API routes
app.use('/api/v1', routes);

// Health check endpoint (unversioned for compatibility)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint - serve the frontend index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route for SPA (if needed in the future, currently optional but good practice)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

/**
 * Initialize database connection
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  try {
    await testConnection();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

module.exports = {
  app,
  initializeDatabase
};

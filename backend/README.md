# OTP Fetch Backend API

A production-ready Express.js backend API for the OTP Fetch application with MySQL authentication, JWT tokens, and comprehensive security features.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Project Structure](#project-structure)

## Features

- **Authentication**: JWT-based authentication with secure password hashing (bcrypt)
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Account Lockout**: Automatic account lockout after failed login attempts
- **Audit Logging**: Comprehensive audit trail for security and compliance
- **Input Validation**: Request validation using Joi
- **SQL Injection Prevention**: Parameterized queries throughout
- **CORS Support**: Configurable CORS for frontend integration
- **Security Headers**: Helmet.js for security headers
- **Session Management**: JWT token revocation and session tracking
- **Error Handling**: Centralized error handling with standardized responses

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (mysql2)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **Security**: Helmet, express-rate-limit, cors
- **Environment**: dotenv

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd otp_fetch/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=dsa
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=1h

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Security Configuration
   MAX_LOGIN_ATTEMPTS=5
   LOCKOUT_DURATION_MINUTES=15
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=5
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `root` |
| `DB_NAME` | Database name | `dsa` |
| `DB_PORT` | Database port | `3306` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT token expiration | `1h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `MAX_LOGIN_ATTEMPTS` | Max failed login attempts | `5` |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration | `15` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `5` |

## Database Setup

1. **Create the database** (if not exists):
   ```bash
   mysql -uroot -proot --ssl-mode=DISABLED -e "CREATE DATABASE IF NOT EXISTS dsa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. **Run the schema**:
   ```bash
   mysql -uroot -proot --ssl-mode=DISABLED dsa < ../database/schema.sql
   ```

3. **Seed initial data** (optional):
   ```bash
   mysql -uroot -proot --ssl-mode=DISABLED dsa < ../database/seed.sql
   ```

## Running the Server

### Development Mode

```bash
npm run dev
```

This will start the server with nodemon for auto-reloading on file changes.

### Production Mode

```bash
npm start
```

The server will start on the configured port (default: 3000).

### Verify Server is Running

Check the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### POST `/api/v1/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "expiresIn": 3600
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

#### POST `/api/v1/auth/logout`

Invalidate the current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/v1/auth/me`

Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/v1/auth/refresh`

Refresh an expired JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### OTP Endpoints

#### GET `/api/v1/otp/latest/:mobileNumber`

Get the latest OTP for a mobile number or customerId.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "mobileNumber": "+1234567890",
    "otpCode": "123456",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-01T00:05:00.000Z",
    "isUsed": false,
    "usedAt": null
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "OTP_NOT_FOUND",
    "message": "No OTP found for this mobile number or customerId"
  }
}
```

#### GET `/api/v1/otp/history/:mobileNumber`

Get paginated OTP history for a mobile number or customerId.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "mobileNumber": "+1234567890",
      "otpCode": "123456",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-01T00:05:00.000Z",
      "isUsed": false,
      "usedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### GET `/api/v1/otp/statistics`

Get OTP statistics (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "used": 80,
    "unused": 20,
    "expired": 5,
    "uniqueMobileNumbers": 50
  }
}
```

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 salt rounds
- Passwords are never stored or logged in plain text

### JWT Authentication
- JWT tokens with configurable expiration (default: 1 hour)
- Token revocation through session management
- Secure token storage in database

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- OTP fetches: 10 per minute per user
- General API: 5 requests per 15 minutes

### Account Lockout
- Automatic lockout after 5 failed login attempts
- Lockout duration: 15 minutes (configurable)
- Automatic unlock after lockout period expires

### Input Validation
- All inputs validated using Joi schemas
- SQL injection prevention via parameterized queries
- XSS prevention through input sanitization

### Security Headers
- Helmet.js for security headers
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options, X-Content-Type-Options, etc.

### Audit Logging
- All authentication attempts logged
- OTP fetch requests logged
- IP addresses and user agents tracked
- Success/failure status recorded

## Project Structure

```
backend/
├── config/
│   ├── database.js       # MySQL connection pool
│   ├── jwt.js           # JWT configuration
│   └── security.js      # Security settings
├── middleware/
│   ├── auth.js          # JWT authentication
│   ├── errorHandler.js  # Global error handler
│   ├── rateLimiter.js   # Rate limiting
│   └── validator.js    # Request validation
├── models/
│   ├── User.js          # User model
│   ├── Otp.js           # OTP model
│   ├── Session.js       # Session model
│   └── AuditLog.js      # Audit log model
├── controllers/
│   ├── authController.js # Auth request handlers
│   └── otpController.js  # OTP request handlers
├── routes/
│   ├── auth.js          # Auth routes
│   ├── otp.js           # OTP routes
│   └── index.js         # Route aggregator
├── services/
│   ├── authService.js    # Auth business logic
│   └── otpService.js    # OTP business logic
├── .env.example         # Environment variables template
├── app.js              # Express app setup
├── server.js           # Server entry point
├── package.json        # Dependencies
└── README.md           # This file
```

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []  // Optional: validation errors
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid username or password |
| `NO_TOKEN` | 401 | Authentication token required |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `INVALID_TOKEN` | 401 | Invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `ACCOUNT_LOCKED` | 423 | Account temporarily locked |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `OTP_NOT_FOUND` | 404 | OTP not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Development

### Running Tests

```bash
npm test
```

### Code Style

The project follows standard JavaScript conventions. Use a linter like ESLint for consistency.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify MySQL is running:
   ```bash
   sudo systemctl status mysql
   ```

2. Check your `.env` file credentials

3. Test database connection manually:
   ```bash
   mysql -uroot -proot --ssl-mode=DISABLED dsa
   ```

### Port Already in Use

If port 3000 is already in use:

1. Change the `PORT` in your `.env` file
2. Or kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

## License

ISC

## Support

For issues or questions, please refer to the main project documentation.

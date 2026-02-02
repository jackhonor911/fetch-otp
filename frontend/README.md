# OTP Fetch Frontend

A secure, responsive frontend application for retrieving OTP codes from the production database. This frontend connects to the backend API to authenticate users and fetch OTP data.

## Features

- **Secure Authentication**: JWT-based authentication with session persistence
- **OTP Retrieval**: Fetch the latest OTP for any mobile number
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Feedback**: Loading states and toast notifications for user actions
- **Session Management**: Automatic session validation and logout on token expiration

## File Structure

```
frontend/
├── index.html    # Main HTML structure
├── styles.css    # Complete styling with CSS variables
├── app.js        # JavaScript logic with API integration
└── README.md     # This documentation file
```

## How to Use

### Prerequisites

1. **Backend Server Running**: Ensure the backend API server is running at `http://localhost:3000`
2. **Database Configured**: The backend should have access to the production database with OTP records

### Getting Started

1. **Open the Application**:
   - Simply open `index.html` in a web browser
   - Or serve it using a local web server (recommended for production use)

2. **Login**:
   - Enter your credentials:
     - **Username**: `admin`
     - **Password**: `SecurePass123!`
   - Click the "Login" button

3. **Fetch OTP**:
   - Enter a mobile number (e.g., `1234567890`)
   - Click "Get Latest OTP"
   - The OTP will be displayed in the result area

4. **Logout**:
   - Click the "Logout" button at the bottom of the dashboard
   - This will clear your session and return you to the login screen

## API Integration

The frontend communicates with the backend API at `http://localhost:3000/api/v1/`:

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user, returns JWT token |
| POST | `/auth/logout` | Invalidate current session |
| GET | `/auth/me` | Get current user information |

### OTP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/otp/latest/:mobileNumber` | Get latest OTP for mobile number |
| GET | `/otp/history/:mobileNumber` | Get paginated OTP history |

### Request/Response Examples

#### Login Request
```json
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "SecurePass123!"
}
```

#### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin"
  }
}
```

#### Get Latest OTP Response
```json
{
  "mobile": "1234567890",
  "otp": "123456",
  "receivedAt": "2026-02-02T19:30:00.000Z"
}
```

## Session Management

- **Token Storage**: JWT tokens are stored in `localStorage` under the key `auth_token`
- **Auto-Login**: If a valid token exists, the user is automatically logged in on page load
- **Token Expiration**: When a token expires (401 response), the user is automatically logged out
- **Manual Logout**: Users can manually logout via the logout button

## Error Handling

The frontend handles various error scenarios:

- **Network Errors**: Displays user-friendly messages when the backend is unreachable
- **Authentication Errors**: Shows appropriate messages for invalid credentials
- **Validation Errors**: Displays validation messages for missing or invalid inputs
- **API Errors**: Shows error messages returned by the backend

## Default Credentials

| Username | Password |
|----------|----------|
| admin | SecurePass123! |

> **Note**: These credentials are for demonstration purposes. In a production environment, use secure credentials and implement proper user management.

## Browser Compatibility

The application works on all modern browsers that support:
- ES6 JavaScript features
- CSS Variables
- Fetch API
- LocalStorage

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

1. **HTTPS**: In production, always serve the application over HTTPS
2. **CORS**: Ensure the backend has proper CORS configuration
3. **Token Storage**: Tokens are stored in localStorage for convenience. For higher security, consider using httpOnly cookies
4. **Input Validation**: All inputs are validated on both client and server side
5. **Rate Limiting**: The backend implements rate limiting to prevent abuse

## Development

### Modifying the API Base URL

To change the backend API URL, edit the `API_BASE_URL` constant in [`app.js`](app.js:4):

```javascript
const API_BASE_URL = 'http://your-api-url:port/api/v1';
```

### Customizing Styles

All styles are defined in [`styles.css`](styles.css:1) using CSS variables. Modify the variables in the `:root` selector to change the color scheme:

```css
:root {
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    --bg-color: #f3f4f6;
    /* ... more variables */
}
```

## Troubleshooting

### "Session expired" error
- Clear your browser's localStorage
- Login again with valid credentials

### "Failed to fetch OTP" error
- Ensure the backend server is running
- Check that the mobile number exists in the database
- Verify the API endpoint is accessible

### CORS errors
- Check the backend CORS configuration
- Ensure the frontend origin is allowed in the backend

## License

This frontend is part of the OTP Fetch application. See the main project license for details.

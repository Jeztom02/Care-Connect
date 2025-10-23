# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Compassion Care Connect application.

## Prerequisites

1. A Google Cloud Console account
2. Access to the project's backend and frontend

## Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
5. Copy the Client ID and Client Secret

## Step 2: Backend Configuration

1. Create a `.env` file in the `server` directory (copy from `env.example`):
   ```bash
   cp server/env.example server/.env
   ```

2. Update the `.env` file with your Google OAuth credentials:
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
   
   # Other required variables
   SESSION_SECRET=your-super-secret-session-key-change-me-in-production
   JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

## Step 3: Frontend Configuration

The frontend is already configured to work with the Google OAuth integration. The Google sign-in buttons have been added to both the login and register pages.

## Step 4: Testing the Integration

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   ```

3. Navigate to `http://localhost:8080/login` or `http://localhost:8080/register`

4. Click the "Sign in with Google" or "Sign up with Google" button

5. Complete the Google OAuth flow

6. You should be redirected to the appropriate dashboard based on your role

## Features

### Backend Features
- Google OAuth 2.0 integration using Passport.js
- Automatic user creation for new Google users (default role: 'patient')
- Account linking for existing users with the same email
- JWT token generation for seamless authentication
- Session management for OAuth flow

### Frontend Features
- Google sign-in button with official Google branding
- Seamless integration with existing login/register forms
- Automatic redirect to appropriate dashboard after authentication
- Error handling for failed authentication attempts
- Profile picture support from Google accounts

### User Experience
- New users signing up with Google are automatically assigned the 'patient' role
- Existing users can link their Google account to their existing account
- Users can sign in with either email/password or Google OAuth
- Consistent UI/UX with the existing design system

## Security Considerations

1. **Environment Variables**: Never commit your `.env` file to version control
2. **HTTPS in Production**: Ensure your production environment uses HTTPS
3. **Session Security**: Use strong, unique session secrets in production
4. **JWT Secrets**: Use cryptographically secure JWT secrets in production

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:
   - Ensure the redirect URI in Google Cloud Console matches exactly
   - Check that the `GOOGLE_CALLBACK_URL` in your `.env` file is correct

2. **"Client ID not found" error**:
   - Verify your `GOOGLE_CLIENT_ID` is correct in the `.env` file
   - Ensure the Google+ API is enabled in Google Cloud Console

3. **Session/cookie issues**:
   - Check that your `SESSION_SECRET` is set in the `.env` file
   - In production, ensure cookies are secure and use HTTPS

4. **CORS issues**:
   - Verify the `ORIGIN` environment variable matches your frontend URL
   - Check that the backend CORS configuration includes your frontend domain

### Development vs Production

- **Development**: Uses `http://localhost` URLs
- **Production**: Update all URLs to use your production domain and HTTPS
- **Environment Variables**: Use different values for development and production

## Database Schema Changes

The user model has been updated to support Google OAuth:

```typescript
{
  email: string (required, unique)
  name: string (required)
  role: string (required, enum)
  passwordHash: string (optional - for Google OAuth users)
  googleId: string (optional, unique, sparse)
  profilePicture: string (optional)
  authProvider: string (enum: 'local' | 'google', default: 'local')
}
```

## API Endpoints

- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Handles Google OAuth callback
- `POST /api/auth/login` - Traditional email/password login (unchanged)
- `POST /api/auth/register` - Traditional registration (unchanged)
- `GET /api/auth/me` - Get current user info (unchanged)

## Support

If you encounter any issues with the Google OAuth integration, please check:
1. Google Cloud Console configuration
2. Environment variables
3. Network connectivity
4. Browser console for frontend errors
5. Backend server logs for authentication errors


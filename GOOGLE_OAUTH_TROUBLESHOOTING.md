# Google OAuth Troubleshooting Guide

## Quick Fix Checklist

### 1. Create Environment File
Create `server/.env` file with the following content:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/compassion

# Server Configuration
PORT=3001
ORIGIN=http://localhost:8080
NODE_ENV=development

# JWT Configuration
JWT_SECRET=dev-secret-change-me-in-production-12345
JWT_EXPIRES_IN=1h

# Session Configuration
SESSION_SECRET=dev-session-secret-change-me-in-production-67890

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

### 2. Google Cloud Console Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/Select Project**
3. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - **Authorized JavaScript origins:**
     - `http://localhost:8080` (for frontend)
     - `http://localhost:3001` (for backend)
   - **Authorized redirect URIs:**
     - `http://localhost:3001/api/auth/google/callback`

### 3. Test the Configuration

1. **Start the backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Check health endpoint:**
   Visit `http://localhost:3001/api/health`
   You should see:
   ```json
   {
     "status": "ok",
     "uptime": 123.45,
     "googleOAuth": {
       "configured": true,
       "clientId": "Set",
       "callbackUrl": "http://localhost:3001/api/auth/google/callback"
     }
   }
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

4. **Test Google Sign-In:**
   - Go to `http://localhost:8080/login`
   - Click "Sign in with Google"
   - Should redirect to Google OAuth

## Common Issues and Solutions

### Issue 1: "This page isn't working" Error

**Cause:** Missing or incorrect Google OAuth credentials

**Solution:**
1. Check if `server/.env` file exists
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. Check backend logs for "Google OAuth credentials not configured"

### Issue 2: "Invalid redirect URI" Error

**Cause:** Redirect URI in Google Cloud Console doesn't match backend

**Solution:**
1. In Google Cloud Console, go to OAuth 2.0 Client IDs
2. Edit your OAuth client
3. Add redirect URI: `http://localhost:3001/api/auth/google/callback`
4. Make sure it matches exactly (including http vs https)

### Issue 3: Frontend Button Not Working

**Cause:** Frontend trying to access wrong URL

**Solution:**
1. Check browser console for errors
2. Verify the button redirects to `http://localhost:3001/api/auth/google`
3. Check if backend is running on port 3001

### Issue 4: "Client ID not found" Error

**Cause:** Google Cloud Console configuration issue

**Solution:**
1. Verify the OAuth client is created correctly
2. Check that the Client ID is copied correctly to `.env`
3. Ensure the project has Google+ API enabled

### Issue 5: Database Connection Issues

**Cause:** MongoDB not running or wrong connection string

**Solution:**
1. Start MongoDB: `mongod`
2. Check `MONGODB_URI` in `.env` file
3. Verify MongoDB is accessible at `mongodb://127.0.0.1:27017/compassion`

## Debugging Steps

### 1. Check Backend Logs
```bash
cd server
npm run dev
```
Look for:
- "Google OAuth initiation requested"
- "Environment check" logs
- Any error messages

### 2. Check Frontend Console
Open browser developer tools and look for:
- Network errors
- JavaScript errors
- Console logs

### 3. Test Backend Endpoints
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test Google OAuth initiation (should redirect to Google)
curl -I http://localhost:3001/api/auth/google
```

### 4. Verify Environment Variables
```bash
cd server
node -e "require('dotenv').config(); console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');"
```

## Production Deployment

### Environment Variables for Production
```env
# Production Configuration
PORT=3001
ORIGIN=https://yourdomain.com
NODE_ENV=production

# Production Google OAuth
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Production Database
MONGODB_URI=mongodb://your-production-db-url

# Production Secrets (use strong, unique values)
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-super-secure-session-secret
```

### Google Cloud Console Production Setup
1. Add production redirect URI: `https://yourdomain.com/api/auth/google/callback`
2. Add production JavaScript origin: `https://yourdomain.com`
3. Update environment variables with production values

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Health endpoint shows Google OAuth as configured
- [ ] Frontend loads without console errors
- [ ] Google sign-in button redirects to Google OAuth
- [ ] Google OAuth redirects back to your app
- [ ] User is created/found in database
- [ ] User is logged in and redirected to dashboard

## Still Having Issues?

1. **Check the exact error message** in browser console and backend logs
2. **Verify all URLs match exactly** between Google Cloud Console and your configuration
3. **Test with a simple curl command** to isolate the issue
4. **Check if MongoDB is running** and accessible
5. **Verify all environment variables** are set correctly

## Support

If you're still experiencing issues:
1. Check the backend logs for specific error messages
2. Verify your Google Cloud Console configuration
3. Test each component individually (backend health, frontend button, OAuth flow)
4. Make sure all URLs and ports match your configuration


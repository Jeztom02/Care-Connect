# Authentication & Authorization Guide

This document outlines the authentication and authorization system implemented in the application, including JWT handling, role-based access control (RBAC), and protected routes.

## Table of Contents
- [Authentication Flow](#authentication-flow)
- [JWT Token Management](#jwt-token-management)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Protected Routes](#protected-routes)
- [API Integration](#api-integration)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)

## Authentication Flow

1. **Login**
   - User submits credentials (email/password)
   - Server validates credentials and returns JWT token
   - Token is stored in `localStorage`
   - User is redirected to the dashboard

2. **Token Refresh**
   - Access tokens have a limited lifetime
   - A refresh token is used to obtain a new access token
   - Token refresh happens automatically via an axios interceptor

3. **Logout**
   - Token is removed from `localStorage`
   - User is redirected to the login page
   - All cached queries are invalidated

## JWT Token Management

### Token Storage
- Access token: Stored in `localStorage` under `authToken`
- Refresh token: Stored in `localStorage` under `refreshToken`
- User info: Basic user data is stored in `localStorage` for quick access

### Token Expiration
- Access tokens expire after 1 hour (configurable)
- Refresh tokens have a longer expiration (7 days)
- The app automatically refreshes tokens before they expire

## Role-Based Access Control (RBAC)

The application uses the following roles:

| Role      | Description                     |
|-----------|---------------------------------|
| `ADMIN`   | Full system access              |
| `DOCTOR`  | Doctor-specific functionality   |
| `NURSE`   | Nurse-specific functionality    |
| `PATIENT` | Patient portal access           |
| `FAMILY`  | Family member access            |

## Protected Routes

Use the `withAuth` HOC to protect routes:

```tsx
import { withAuth } from '@/components/auth/withAuth';
import { Role } from '@/types';

// Protect a route for specific roles
const AdminDashboard = withAuth({
  requiredRoles: [Role.ADMIN],
  redirectTo: '/unauthorized',
})(() => <div>Admin Dashboard</div>);

// Protect a route for any authenticated user
const UserProfile = withAuth()(() => <div>User Profile</div>);
```

## API Integration

### Making Authenticated Requests

Use the `api` instance from `@/utils/api` for all HTTP requests. It automatically:
- Adds the JWT token to the `Authorization` header
- Handles token refresh when needed
- Manages request/response interceptors

```typescript
import api from '@/utils/api';

// GET request
const fetchPatients = async () => {
  const response = await api.get('/patients');
  return response.data;
};

// POST request
const createPatient = async (data) => {
  const response = await api.post('/patients', data);
  return response.data;
};
```

## Error Handling

### Authentication Errors
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `400 Bad Request`: Invalid request data

### Handling Errors in Components

```typescript
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const PatientList = () => {
  const { data: patients, error } = useQuery({
    queryKey: ['patients'],
    queryFn: patientService.getPatients,
  });

  useEffect(() => {
    if (error) {
      toast.error(error.message || 'Failed to load patients');
    }
  }, [error]);

  // ...
};
```

## Security Considerations

1. **Token Security**
   - Tokens are stored in `localStorage` (consider `httpOnly` cookies in production)
   - Tokens are never logged to the console
   - Tokens are automatically refreshed before expiration

2. **CORS**
   - Only whitelisted origins are allowed
   - Credentials are required for all API requests

3. **Rate Limiting**
   - Implement rate limiting on the server
   - Add exponential backoff for failed requests

4. **Sensitive Data**
   - Never store sensitive data in `localStorage`
   - Use environment variables for API keys and secrets

## Troubleshooting

### Common Issues

1. **Token not being attached to requests**
   - Verify the token exists in `localStorage`
   - Check the axios request interceptor

2. **CORS errors**
   - Ensure the backend allows requests from your frontend origin
   - Verify credentials are being sent with the request

3. **403 Forbidden errors**
   - Check the user's role has the required permissions
   - Verify the JWT token contains the correct role claims

For additional help, please refer to the API documentation or contact the development team.

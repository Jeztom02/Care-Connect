import axios from 'axios';
import { apiRequest } from '../hooks/useApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Token management
const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ROLE_KEY = 'userRole';
const USER_NAME_KEY = 'userName';
const USER_ID_KEY = 'userId';

// Helper to get auth header
export const getAuthHeader = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authService = {
  // Get the current access token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  // Set the access token
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Set refresh token
  setRefreshToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  // Get user info
  getUser: () => ({
    id: localStorage.getItem(USER_ID_KEY),
    role: localStorage.getItem(USER_ROLE_KEY),
    name: localStorage.getItem(USER_NAME_KEY)
  }),

  // Set user info
  setUser: (user: { id?: string; role?: string; name?: string }) => {
    if (user.id) localStorage.setItem(USER_ID_KEY, user.id);
    if (user.role) localStorage.setItem(USER_ROLE_KEY, user.role);
    if (user.name) localStorage.setItem(USER_NAME_KEY, user.name);
  },

  // Clear all auth data
  clearAuth: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_ROLE_KEY);
      localStorage.removeItem(USER_NAME_KEY);
      localStorage.removeItem(USER_ID_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  // Check if user has required role
  hasRole: (requiredRole: string): boolean => {
    const userRole = localStorage.getItem(USER_ROLE_KEY);
    return userRole === requiredRole;
  },

  // Login with email/password
  login: async (email: string, password: string, role: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const { accessToken, refreshToken, user } = data;

      if (!accessToken || !user) {
        throw new Error('Invalid server response');
      }

      // Store tokens and user info
      authService.setToken(accessToken);
      if (refreshToken) {
        authService.setRefreshToken(refreshToken);
      }
      authService.setUser({
        id: user.id || user._id,
        role: user.role,
        name: user.name || user.email?.split('@')[0] || 'User'
      });

      return { user, accessToken };
    } catch (error) {
      console.error('Login error:', error);
      authService.clearAuth();
      throw error;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      // Call server to invalidate the refresh token
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: getAuthHeader(),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of server response
      authService.clearAuth();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<string | null> => {
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const { accessToken, user } = data;

      if (accessToken && user) {
        authService.setToken(accessToken);
        authService.setUser({
          id: user.id || user._id,
          role: user.role,
          name: user.name || user.email?.split('@')[0] || 'User'
        });
        return accessToken;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      authService.clearAuth();
      return null;
    }
  },

  // Check if user is logged in and has a valid token
  checkAuth: async (): Promise<boolean> => {
    const token = authService.getToken();
    if (!token) return false;

    try {
      // Try to make an authenticated request to validate the token
      await apiRequest('/api/auth/me');
      return true;
    } catch (error) {
      // If token is invalid, try to refresh it
      if (error.status === 401) {
        const newToken = await authService.refreshToken();
        return !!newToken;
      }
      return false;
    }
  }
};

export default authService;

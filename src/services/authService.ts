import axios, { AxiosHeaders } from 'axios';

const API_BASE_URL = '/api/auth';

// Create axios instance for auth requests
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include token in requests
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!(config.headers instanceof AxiosHeaders)) {
        config.headers = new AxiosHeaders(config.headers);
      }
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  // Get the current access token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  // Set the access token
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      // Update the default Authorization header for all requests
      authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  // Remove the access token
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      delete authApi.defaults.headers.common['Authorization'];
    }
  },

  // Refresh the access token using the refresh token
  refreshToken: async (): Promise<string | null> => {
    try {
      // Don't use authApi here to avoid infinite loop
      const response = await axios.post(
        `${API_BASE_URL}/refresh-token`,
        {},
        { withCredentials: true }
      );
      
      const { accessToken } = response.data;
      
      if (accessToken) {
        authService.setToken(accessToken);
        return accessToken;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      authService.removeToken();
      
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return null;
    }
  },

  // Check if the user is authenticated
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  // Logout the user
  logout: (): void => {
    authService.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

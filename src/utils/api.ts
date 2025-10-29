import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import authService from '@/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with base URL and headers
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Log error details in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        response: error.response?.data,
        headers: error.config?.headers
      });
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If this is a login request, don't try to refresh
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      try {
        console.log('Attempting to refresh token...');
        const newToken = await authService.refreshToken();
        if (newToken) {
          console.log('Token refreshed successfully');
          // Update the Authorization header with the new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry the original request with the new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear auth and redirect to login on refresh failure
        authService.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      console.error('Access Denied:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        role: authService.getUser()?.role,
        requiredRoles: ['doctor', 'nurse', 'admin', 'volunteer']
      });
      
      // Optionally redirect to unauthorized page or show a message
      // window.location.href = '/unauthorized';
    }

    // For other errors, just reject with the error
    return Promise.reject(error);
  }
);

export default api;

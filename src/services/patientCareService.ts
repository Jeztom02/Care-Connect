import axios, { AxiosHeaders } from 'axios';
import { VitalsData } from '@/components/patient/UpdateVitalsDialog';
import { authService } from './authService';

const API_BASE_URL = '/api/patient-care';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Ensure headers is an AxiosHeaders instance
    if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = new AxiosHeaders(config.headers);
    }
    
    // Get the current token
    let token = authService.getToken();
    
    // If no token, try to refresh it
    if (!token) {
      try {
        const newToken = await authService.refreshToken();
        if (newToken) {
          token = newToken;
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Don't redirect here, let the response interceptor handle it
      }
    }
    
    // Add the token to the request if available
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const newToken = await authService.refreshToken();
        
        if (newToken) {
          // Update the Authorization header
          if (!(originalRequest.headers instanceof AxiosHeaders)) {
            originalRequest.headers = new AxiosHeaders(originalRequest.headers);
          }
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          
          // Retry the original request with the new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // If refresh fails, clear the token and redirect to login
        authService.logout();
        return Promise.reject(refreshError);
      }
    }
    
    // If we get here, either it's not a 401 or refresh failed
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response?.data?.message || 'Unauthorized');
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        authService.logout();
      }
    }
    
    return Promise.reject(error);
  }
);

export const patientCareApi = {
  // Notes
  addNote: async (patientId: string, content: string) => {
    const response = await api.post(`/${patientId}/notes`, { content });
    return response.data;
  },

  getNotes: async (patientId: string, page = 1, limit = 10) => {
    const response = await api.get(`/${patientId}/notes`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Vitals
  recordVitals: async (patientId: string, vitals: VitalsData) => {
    const response = await api.post(`/${patientId}/vitals`, vitals);
    return response.data;
  },

  getVitals: async (patientId: string, limit = 10) => {
    const response = await api.get(`/${patientId}/vitals`, {
      params: { limit },
    });
    return response.data;
  },

  // Emergency Alerts
  createEmergencyAlert: async (patientId: string, data: { priority: string; details: string }) => {
    const response = await api.post(`/${patientId}/alerts`, data);
    return response.data;
  },

  getEmergencyAlerts: async (patientId: string, status?: string) => {
    const response = await api.get(`/${patientId}/alerts`, {
      params: { status },
    });
    return response.data;
  },

  // Patient Info
  getPatientInfo: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  },
};

export default patientCareApi;

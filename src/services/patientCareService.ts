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

// Response interceptor to handle errors and token refresh
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
        // Don't logout here, just reject with the original error
        return Promise.reject({
          ...error,
          message: 'Session expired. Please log in again.',
          isAuthError: true
        });
      }
    }
    
    // Handle other error cases
    if (error.response) {
      // Server responded with a status code outside 2xx
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized
      if (status === 401) {
        console.error('Authentication error:', data?.message || 'Unauthorized');
        // Don't automatically logout, let the component handle it
        return Promise.reject({
          ...error,
          message: data?.message || 'Your session has expired. Please log in again.',
          isAuthError: true
        });
      }
      
      // Handle other error statuses
      return Promise.reject({
        ...error,
        message: data?.message || 'An error occurred. Please try again.'
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error:', error.message);
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection and try again.'
      });
    }
    
    // Something happened in setting up the request
    console.error('Request error:', error.message);
    return Promise.reject({
      ...error,
      message: error.message || 'An unexpected error occurred.'
    });
  }
);

export const patientCareApi = {
    // Notes
  addNote: async (patientId: string, content: string) => {
    try {
      console.log(`Adding note for patient ${patientId}:`, { content });
      const response = await api.post(`/${patientId}/notes`, { content });
      console.log('Note added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  getNotes: async (patientId: string, page = 1, limit = 10) => {
    try {
      console.log(`Fetching notes for patient ${patientId}, page ${page}`);
      const response = await api.get(`/${patientId}/notes`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  // Vitals
  recordVitals: async (patientId: string, vitals: VitalsData) => {
    try {
      console.log(`Recording vitals for patient ${patientId}:`, vitals);
      const response = await api.post(`/${patientId}/vitals`, vitals);
      console.log('Vitals recorded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error recording vitals:', error);
      throw error;
    }
  },

  getVitals: async (patientId: string, limit = 10) => {
    try {
      console.log(`Fetching vitals for patient ${patientId}`);
      const response = await api.get(`/patient-care/${patientId}/vitals`, {
        params: { limit },
      });
      console.log('Vitals data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching vitals:', error);
      throw error;
    }
  },

  // Emergency Alerts
  async createEmergencyAlert(patientId: string, data: { priority: string; details: string }) {
    try {
      const response = await api.post(`/${patientId}/alerts`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating emergency alert:', error);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          throw new Error(data.message || 'Invalid request. Please check your input.');
        } else if (status === 401) {
          const error = new Error('Your session has expired. Please log in again.');
          (error as any).isAuthError = true;
          throw error;
        } else if (status === 404) {
          throw new Error('Patient not found. Please refresh the page and try again.');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later or contact support.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('Network error. Please check your internet connection.');
      }
      
      // Unknown error
      throw new Error('An unexpected error occurred. Please try again.');
    }
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

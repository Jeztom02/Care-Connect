/**
 * API Configuration
 * Handles different API URLs for development and production environments
 */

const getApiUrl = (): string => {
  // In production, use the environment variable set by Render
  if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use the proxy (Vite will forward /api to backend)
  if (import.meta.env.DEV) {
    return ''; // Empty string means use relative URLs, Vite proxy handles it
  }
  
  // Fallback for production if VITE_API_URL is not set
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHECK_EMAIL: '/api/auth/check-email',
    CHECK_PHONE: '/api/auth/check-phone',
    GOOGLE: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
  },
  
  // Resource endpoints
  PATIENTS: '/api/patients',
  APPOINTMENTS: '/api/appointments',
  MESSAGES: '/api/messages',
  ALERTS: '/api/alerts',
  MEDICAL_RECORDS: '/api/medical-records',
  PRESCRIPTIONS: '/api/prescriptions',
  MEDICATIONS: '/api/medications',
  ROUNDS: '/api/rounds',
  USERS: '/api/users',
  VOLUNTEER: '/api/volunteer',
  NURSE: '/api/nurse',
  PATIENT_STATUS: '/api/patient-status',
  CARE_UPDATES: '/api/care-updates',
  PATIENT_CARE: '/api/patient-care',
  ADMIN: '/api/admin',
  UPLOADS: '/api/uploads',
  
  // Health check
  HEALTH: '/api/health',
};

// WebSocket URL configuration
export const getWebSocketUrl = (): string => {
  if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
    // Convert HTTP(S) URL to WS(S) URL
    return import.meta.env.VITE_API_URL.replace(/^http/, 'ws');
  }
  
  if (import.meta.env.DEV) {
    return 'ws://localhost:3001';
  }
  
  return 'ws://localhost:3001';
};

export const WS_URL = getWebSocketUrl();

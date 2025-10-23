import axios from 'axios';

const API_BASE_URL = '/api/nurse';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Ensure credentials are sent with requests
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Using authToken:', token ? 'Token found' : 'No token found');
    
    if (token) {
      // Ensure the token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      console.log('Authorization header set with token');
    } else {
      console.warn('No authToken found in localStorage');
    }
    
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        url: error.config.url,
        data: error.response.data,
        headers: error.response.headers,
      });
      
      if (error.response.status === 401) {
        console.error('Authentication error:', error.response.data?.message || 'Unauthorized');
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Get nurse's assigned patients
export const getNursePatients = async () => {
  try {
    const response = await api.get('/patients');
    return response.data;
  } catch (error) {
    console.error('Error fetching nurse patients:', error);
    throw error;
  }
};

// Record patient vitals
export const recordVitals = async (patientId: string, vitalsData: any) => {
  try {
    const response = await api.post(`/patients/${patientId}/vitals`, vitalsData);
    return response.data;
  } catch (error) {
    console.error('Error recording vitals:', error);
    throw error;
  }
};

// Get nurse's schedule
export const getNurseSchedule = async () => {
  try {
    const response = await api.get('/schedule');
    return response.data;
  } catch (error) {
    console.error('Error fetching nurse schedule:', error);
    throw error;
  }
};

// Update round status
export const updateRoundStatus = async (roundId: string, status: string, notes?: string) => {
  try {
    const response = await api.patch(`/rounds/${roundId}`, { status, notes });
    return response.data;
  } catch (error) {
    console.error('Error updating round status:', error);
    throw error;
  }
};

// Get patient medications
export const getPatientMedications = async (patientId: string) => {
  try {
    const response = await api.get(`/patients/${patientId}/medications`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient medications:', error);
    throw error;
  }
};

// Record medication administration
export const recordMedication = async (medicationData: {
  prescriptionId: string;
  patientId: string;
  medication: string;
  dosage: string;
  time?: Date;
  notes?: string;
}) => {
  try {
    const response = await api.post('/medications/record', medicationData);
    return response.data;
  } catch (error) {
    console.error('Error recording medication:', error);
    throw error;
  }
};

export default {
  getNursePatients,
  recordVitals,
  getNurseSchedule,
  updateRoundStatus,
  getPatientMedications,
  recordMedication,
};

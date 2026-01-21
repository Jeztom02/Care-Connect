import api from '@/utils/api';
import { parseJwt, isTokenExpired } from '@/utils/authUtils';
import { Role } from '@/types';

export interface Patient {
  _id: string;
  userId?: string;
  name?: string; // Backend uses single name field
  firstName?: string; // For compatibility
  lastName?: string; // For compatibility
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  bloodType?: string;
  allergies?: string[];
  medicalHistory?: string[];
  assignedNurse?: string;
  assignedNurseId?: string;
  assignedDoctor?: string;
  assignedDoctorId?: string;
  roomNumber?: string;
  status?: 'active' | 'inactive' | 'discharged' | 'Active' | 'Inactive' | 'Discharged';
  priority?: 'low' | 'medium' | 'high' | 'Low' | 'Medium' | 'High';
  condition?: string;
  notes?: string;
  lastVitals?: string;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
  emergencyContact?: string;
  nextAppointment?: string;
}

const patientService = {
  /**
   * Get all patients (for dropdowns and lists)
   * @param filters Optional filters for patient search
   * @returns Promise with array of patients
   */
  getPatients: async (filters: Record<string, any> = {}): Promise<Patient[]> => {
    try {
      const response = await api.get<Patient[]>('/patients', { 
        params: filters,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    } catch (error: any) {
      // Error handling is now centralized in the API interceptor
      throw error;
    }  
  },

  /**
   * Get current patient (for patient role)
   * @returns Promise with the current patient's data
   */
  getCurrentPatient: async (): Promise<Patient> => {
    try {
      const response = await api.get<Patient>('/patients/me/self');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Patient record not found. Please contact support.');
      }
      throw error;
    }
  },

  /**
   * Get a single patient by ID
   * @param id Patient ID
   * @returns Promise with patient data
   */
  getPatientById: async (id: string): Promise<Patient> => {
    if (!id) {
      throw new Error('Patient ID is required');
    }
    
    try {
      const response = await api.get<Patient>(`/patients/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Patient not found');
      }
      throw error;
    }
  },

  /**
   * Update current patient's information
   * @param data Partial patient data to update
   * @returns Promise with updated patient data
   */
  updateCurrentPatient: async (data: Partial<Patient>): Promise<Patient> => {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No data provided for update');
    }
    
    try {
      const response = await api.patch<Patient>('/patients/me', data);
      return response.data;
    } catch (error) {
      throw error; // Error handling is done by the interceptor
    }
  },

  /**
   * Search patients by name or other criteria
   * @param query Search query string
   * @param filters Additional search filters
   * @returns Promise with array of matching patients
   */
  searchPatients: async (query: string, filters: Record<string, any> = {}): Promise<Patient[]> => {
    if (!query?.trim()) {
      return [];
    }
    
    try {
      const response = await api.get<Patient[]>('/patients', { 
        params: { 
          q: query.trim(),
          ...filters 
        } 
      });
      return response.data;
    } catch (error) {
      throw error; // Error handling is done by the interceptor
    }
  },

  /**
   * Create a new patient (admin/doctor/nurse only)
   * @param patientData Patient data to create
   * @returns Promise with created patient data
   */
  createPatient: async (patientData: Omit<Patient, '_id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    if (!patientData) {
      throw new Error('Patient data is required');
    }
    
    try {
      const response = await api.post<Patient>('/patients', patientData);
      return response.data;
    } catch (error) {
      throw error; // Error handling is done by the interceptor
    }
  },

  /**
   * Update a patient (admin/doctor/nurse only)
   * @param id Patient ID
   * @param patientData Partial patient data to update
   * @returns Promise with updated patient data
   */
  updatePatient: async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
    if (!id) {
      throw new Error('Patient ID is required');
    }
    if (!patientData || Object.keys(patientData).length === 0) {
      throw new Error('No data provided for update');
    }
    
    try {
      const response = await api.patch<Patient>(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      throw error; // Error handling is done by the interceptor
    }
  },

  /**
   * Delete a patient (admin/doctor only)
   * @param id Patient ID to delete
   * @returns Promise that resolves when patient is deleted
   */
  deletePatient: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Patient ID is required');
    }
    
    try {
      await api.delete(`/patients/${id}`);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Patient not found');
      }
      throw error; // Error handling is done by the interceptor
    }
  },
};

export default patientService;

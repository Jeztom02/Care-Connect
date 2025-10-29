import api from '@/services/api';

export interface Medication {
  _id: string;
  patientId: string;
  patientName?: string; // This might be populated by the backend
  name: string;        // Medication name (previously 'medication')
  medication?: string; // Keep for backward compatibility
  dosage: string;
  frequency: string;
  startDate: string | Date;
  endDate?: string | Date;
  status: 'pending' | 'taken' | 'missed' | 'as_needed';
  lastTaken?: string | Date;
  nextDose?: string | Date;
  notes?: string;      // For backward compatibility
  instructions?: string; // This is what the backend expects
  isReminderSet: boolean;
  reminderTime?: string;
  createdBy?: string;
  updatedAt?: string;
  prescribedBy?: string | {
    _id: string;
    name: string;
    role: string;
  };
}

export interface MedicationStats {
  total: number;
  takenToday: number;
  pending: number;
  asNeeded: number;
  remindersSet: number;
}

const medicationService = {
  // Get all medications for the current nurse's patients
  getMedications: async (): Promise<Medication[]> => {
    try {
      const response = await api.get('/medications');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching medications:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          // Handle unauthorized (token expired or invalid)
          throw new Error('Your session has expired. Please log in again.');
        } else if (error.response.status === 403) {
          // Handle forbidden (no permission)
          throw new Error('You do not have permission to view medications.');
        } else if (error.response.status === 404) {
          // Handle not found
          return [];
        } else if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      }
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message || 'Failed to fetch medications');
    }
  },

  // Get medication statistics
  getMedicationStats: async (): Promise<MedicationStats> => {
    try {
      const response = await api.get('/medications/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching medication stats:', error);
      // Return default values if stats endpoint fails
      return {
        total: 0,
        takenToday: 0,
        pending: 0,
        asNeeded: 0,
        remindersSet: 0
      };
    }
  },

  // Search medications
  searchMedications: async (query: string): Promise<Medication[]> => {
    if (!query.trim()) return [];
    
    try {
      const response = await api.get(`/medications/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: any) {
      console.error('Error searching medications:', error);
      if (error.response?.status === 401) {
        // If unauthorized, the error will be caught by the interceptor
        throw error;
      }
      // For other errors, return empty array instead of failing
      return [];
    }
  },

  // Add new medication
  addMedication: async (medicationData: Omit<Medication, '_id' | 'createdBy' | 'updatedAt' | 'patientName' | 'prescribedBy'>): Promise<Medication> => {
    try {
      // Use name if available, otherwise fall back to medication (for backward compatibility)
      const medicationName = medicationData.name || medicationData.medication;
      if (!medicationName) {
        throw new Error('Medication name is required');
      }

      // Ensure required fields are present
      if (!medicationData.patientId || !medicationData.dosage || !medicationData.frequency || !medicationData.startDate) {
        throw new Error('Missing required fields. Required: patientId, name, dosage, frequency, startDate');
      }
      
      const requestData = {
        patientId: medicationData.patientId,
        name: medicationName,
        medication: medicationName, // Ensure both name and medication fields are set
        dosage: medicationData.dosage,
        frequency: medicationData.frequency,
        startDate: medicationData.startDate,
        endDate: medicationData.endDate,
        instructions: medicationData.instructions || medicationData.notes || '',
        status: medicationData.status || 'pending',
        isReminderSet: medicationData.isReminderSet || false,
        reminderTime: medicationData.isReminderSet ? medicationData.reminderTime : undefined
      };

      console.log('Sending medication data:', requestData);
      const response = await api.post('/medications', requestData);
      
      return response.data;
    } catch (error: any) {
      console.error('Error adding medication:', error);
      
      // Extract error message from response if available
      let errorMessage = 'Failed to add medication';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        if (error.response.data?.errors) {
          // If there are validation errors, include them in the error message
          const validationErrors = Object.entries(error.response.data.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          errorMessage += `\n${validationErrors}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response received from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        errorMessage = error.message || 'Error setting up the request';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Update medication status
  updateMedicationStatus: async (id: string, status: Medication['status']): Promise<Medication> => {
    try {
      const response = await api.patch(`/medications/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating medication status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update medication status');
    }
  },

  // Update medication
  updateMedication: async (id: string, data: Partial<Medication>): Promise<Medication> => {
    try {
      const response = await api.put(`/medications/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating medication:', error);
      
      let errorMessage = 'Failed to update medication';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Medication not found';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to update this medication';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Error setting up the request';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Toggle medication reminder
  toggleMedicationReminder: async (id: string, reminderTime: string): Promise<Medication> => {
    try {
      // First get the current medication to check its status
      const response = await api.get(`/medications/${id}`);
      const currentMedication = response.data;
      
      if (!currentMedication) {
        throw new Error('Medication not found');
      }
      
      // Toggle the reminder status and update
      const updateResponse = await api.patch(`/medications/${id}/reminder`, { 
        isReminderSet: !currentMedication.isReminderSet,
        reminderTime: reminderTime || currentMedication.reminderTime || '09:00' // Default to 9 AM if not provided
      });
      
      return updateResponse.data;
    } catch (error) {
      console.error('Error toggling medication reminder:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to update medication reminder';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Medication not found';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to update this medication';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || 'Error setting up the request';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Delete medication
  deleteMedication: async (id: string): Promise<void> => {
    try {
      // Directly attempt to delete the medication
      const response = await api.delete(`/medications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting medication:', error);
      
      let errorMessage = 'Failed to delete medication';
      
      if (error.response) {
        // Handle different HTTP status codes
        if (error.response.status === 404) {
          errorMessage = 'Medication not found';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this medication';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || 'Error setting up the request';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Get medications by patient
  getPatientMedications: async (patientId: string): Promise<Medication[]> => {
    if (!patientId) {
      console.error('No patient ID provided');
      return [];
    }
    
    try {
      const response = await api.get(`/patients/${patientId}/medications`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching medications for patient ${patientId}:`, error);
      
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (error.response.status === 403) {
          throw new Error('You do not have permission to view these medications.');
        } else if (error.response.status === 404) {
          // Return empty array if no medications found for the patient
          return [];
        } else if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      throw new Error('Failed to fetch patient medications. Please try again.');
    }
  }
};

export default medicationService;

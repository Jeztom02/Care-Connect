import api from '@/services/api';

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  refillsRemaining?: number;
  status: 'Active' | 'Discontinued';
}

export interface Prescription {
  _id: string;
  patientId: string | {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  doctorId: string | {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  appointmentId?: string;
  // Legacy single-medicine fields
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  // Multi-medicine structure
  items?: PrescriptionItem[];
  startDate: string | Date;
  endDate?: string | Date;
  status: 'Active' | 'Expired' | 'Pending' | 'Discontinued';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreatePrescriptionData {
  patientId: string;
  appointmentId?: string;
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  items?: Omit<PrescriptionItem, 'refillsRemaining' | 'status'>[];
  startDate?: string | Date;
  endDate?: string | Date;
  status?: 'Active' | 'Pending';
}

const prescriptionService = {
  // Get all prescriptions (for doctors, nurses, admin)
  getAllPrescriptions: async (): Promise<Prescription[]> => {
    try {
      const response = await api.get('/prescriptions');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      if (error.response?.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view prescriptions.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch prescriptions');
    }
  },

  // Get prescriptions for a specific patient
  getPatientPrescriptions: async (patientId: string): Promise<Prescription[]> => {
    try {
      if (!patientId) {
        console.error('No patientId provided');
        return [];
      }
      const response = await api.get(`/prescriptions/patient/${patientId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching patient prescriptions:', error);
      if (error.response?.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view prescriptions.');
      } else if (error.response?.status === 404) {
        return [];
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch patient prescriptions');
    }
  },

  // Get prescription details by ID
  getPrescriptionById: async (id: string): Promise<Prescription> => {
    try {
      const response = await api.get(`/prescriptions/detail/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching prescription:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch prescription');
    }
  },

  // Create a new prescription (doctors only)
  createPrescription: async (data: CreatePrescriptionData): Promise<Prescription> => {
    try {
      if (!data.patientId) {
        throw new Error('Patient ID is required');
      }

      // Validate that either items or single medication fields are provided
      const hasItems = data.items && data.items.length > 0;
      const hasSingleMed = data.medication && data.dosage && data.frequency;

      if (!hasItems && !hasSingleMed) {
        throw new Error('Either items array or medication/dosage/frequency are required');
      }

      const response = await api.post('/prescriptions', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create prescription');
    }
  },

  // Update a prescription (doctors only)
  updatePrescription: async (id: string, data: Partial<CreatePrescriptionData>): Promise<Prescription> => {
    try {
      const response = await api.put(`/prescriptions/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating prescription:', error);
      if (error.response?.status === 404) {
        throw new Error('Prescription not found');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this prescription');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update prescription');
    }
  },

  // Request a refill for a prescription
  requestRefill: async (id: string, itemIndex?: number): Promise<Prescription> => {
    try {
      const response = await api.post(`/prescriptions/${id}/request-refill`, { itemIndex });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting refill:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to request refill');
    }
  },

  // Update dosage/frequency for a prescription item
  updatePrescriptionItem: async (
    id: string,
    itemIndex: number,
    data: { dosage?: string; frequency?: string }
  ): Promise<Prescription> => {
    try {
      const response = await api.patch(`/prescriptions/${id}/items/${itemIndex}/dosage`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating prescription item:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update prescription item');
    }
  },

  // Discontinue a prescription item
  discontinuePrescriptionItem: async (id: string, itemIndex: number): Promise<Prescription> => {
    try {
      const response = await api.post(`/prescriptions/${id}/items/${itemIndex}/discontinue`);
      return response.data;
    } catch (error: any) {
      console.error('Error discontinuing prescription item:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to discontinue prescription item');
    }
  },

  // Delete a prescription (admin only)
  deletePrescription: async (id: string): Promise<void> => {
    try {
      await api.delete(`/prescriptions/${id}`);
    } catch (error: any) {
      console.error('Error deleting prescription:', error);
      if (error.response?.status === 404) {
        throw new Error('Prescription not found');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this prescription');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete prescription');
    }
  },

  // Fulfill a prescription (pharmacy only)
  fulfillPrescription: async (id: string, notes: string): Promise<Prescription> => {
    try {
      const response = await api.put(`/prescriptions/${id}/fulfill`, {
        status: 'Active',
        notes
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fulfilling prescription:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fulfill prescription');
    }
  }
};

export default prescriptionService;

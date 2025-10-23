import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const { toast } = useToast();

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      if (options.onError) {
        options.onError(errorMessage);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    if (options.immediate !== false) {
      fetchData();
    }
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
  };
}

// API utility functions
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Try to parse JSON error, otherwise fallback to status text
    let message = response.statusText || 'Request failed';
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.message === 'string') {
        message = errorData.message;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message || `HTTP ${response.status}`);
  }

  // Handle 204 No Content gracefully
  if (response.status === 204) {
    return null as unknown as any;
  }

  // Attempt to parse JSON when content-type indicates JSON
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  // Fallback: return text for non-JSON responses
  return response.text();
};

// Specific API hooks for different data types
export const useAppointments = (userRole: string) => {
  return useApi(
    () => apiRequest('/api/appointments'),
    [userRole],
    {
      onError: (error) => {
        console.error('Failed to fetch appointments:', error);
      }
    }
  );
};

export const usePatients = () => {
  return useApi(
    () => apiRequest('/api/patients'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch patients:', error);
      }
    }
  );
};

export const usePatientsQuery = (params: { q?: string; status?: string; priority?: string; doctor?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.doctor) query.set('doctor', params.doctor);
  const qs = query.toString();
  return useApi(
    () => apiRequest(`/api/patients${qs ? `?${qs}` : ''}`),
    [qs],
    {
      onError: (error) => {
        console.error('Failed to fetch patients (query):', error);
      }
    }
  );
};

export const useMessages = () => {
  return useApi(
    () => apiRequest('/api/messages'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch messages:', error);
      }
    }
  );
};

export const useAlerts = () => {
  return useApi(
    () => apiRequest('/api/alerts'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch alerts:', error);
      }
    }
  );
};

export const useUserProfile = () => {
  return useApi(
    () => apiRequest('/api/users/me'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch user profile:', error);
      }
    }
  );
};

export const useUsers = () => {
  return useApi(
    () => apiRequest('/api/users'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch users:', error);
      }
    }
  );
};

// Patient users (joined with Patient docs): returns array with _id as Patient ID
export const usePatientUsers = () => {
  return useApi(
    () => apiRequest('/api/users/patients'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch patient users:', error);
      }
    }
  );
};

// Users by role with linked patientId (for appointment dropdowns)
export const useUsersByRole = (role: string) => {
  return useApi(
    () => apiRequest(`/api/users/by-role?role=${encodeURIComponent(role)}`),
    [role],
    {
      onError: (error) => {
        console.error('Failed to fetch users by role:', error);
      }
    }
  );
};

export const useVolunteerTasks = () => {
  return useApi(
    () => apiRequest('/api/volunteer/tasks'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch volunteer tasks:', error);
      }
    }
  );
};

export const useVolunteerSchedule = () => {
  return useApi(
    () => apiRequest('/api/volunteer/schedule'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch volunteer schedule:', error);
      }
    }
  );
};

export const useVolunteerReports = () => {
  return useApi(
    () => apiRequest('/api/volunteer/reports'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch volunteer reports:', error);
      }
    }
  );
};

export const useVolunteerPatientSupport = () => {
  return useApi(
    () => apiRequest('/api/volunteer/patient-support'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch patient support updates:', error);
      }
    }
  );
};

export const usePatientStatus = () => {
  return useApi(
    () => apiRequest('/api/patient-status'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch patient status:', error);
      }
    }
  );
};

export const useCareUpdates = () => {
  return useApi(
    () => apiRequest('/api/care-updates'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch care updates:', error);
      }
    }
  );
};

export const useMedications = () => {
  return useApi(
    () => apiRequest('/api/medications'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch medications:', error);
      }
    }
  );
};

// Rounds (nurse scheduling/updates)
export const useRounds = () => {
  return useApi(
    () => apiRequest('/api/rounds'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch rounds:', error);
      }
    }
  );
};

export const usePatientRounds = (patientId: string | null | undefined) => {
  return useApi(
    () => apiRequest(`/api/rounds/patient/${patientId}`),
    [patientId],
    {
      immediate: !!patientId,
      onError: (error) => {
        console.error('Failed to fetch patient rounds:', error);
      }
    }
  );
};

// Medical Records
export const useAllMedicalRecords = () => {
  return useApi(
    () => apiRequest('/api/medical-records'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch medical records:', error);
      }
    }
  );
};

// Medical Records with pagination/search
export const useMedicalRecordsQuery = (params: { q?: string; type?: string; status?: string; patientId?: string; page?: number; limit?: number; sort?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.type && params.type !== 'all') query.set('type', params.type);
  if (params.status) query.set('status', params.status);
  if (params.patientId) query.set('patientId', params.patientId);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sort) query.set('sort', params.sort);
  const qs = query.toString();
  return useApi(
    () => apiRequest(`/api/medical-records${qs ? `?${qs}` : ''}`),
    [qs],
    {
      onError: (error) => {
        console.error('Failed to fetch medical records (query):', error);
      }
    }
  );
};

export const useMedicalRecordsByPatient = (patientId: string | null | undefined) => {
  return useApi(
    () => apiRequest(`/api/medical-records/${patientId}`),
    [patientId],
    {
      immediate: !!patientId,
      onError: (error) => {
        console.error('Failed to fetch patient medical records:', error);
      }
    }
  );
};

// Prescriptions
export const useAllPrescriptions = () => {
  return useApi(
    () => apiRequest('/api/prescriptions'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch prescriptions:', error);
      }
    }
  );
};

export const usePrescriptionsByPatient = (patientId: string | null | undefined) => {
  return useApi(
    () => apiRequest(`/api/prescriptions/${patientId}`),
    [patientId],
    {
      immediate: !!patientId,
      onError: (error) => {
        console.error('Failed to fetch patient prescriptions:', error);
      }
    }
  );
};

// Nurse-specific API hooks
export const useNurseDetails = () => {
  return useApi(
    () => apiRequest('/api/nurses/me'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch nurse details:', error);
      }
    }
  );
};

export const useNursePatients = () => {
  return useApi(
    () => apiRequest('/api/nurses/me/patients'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch nurse patients:', error);
      }
    }
  );
};

export const useNurseMedicationSchedule = () => {
  return useApi(
    () => apiRequest('/api/nurses/me/medication-schedule'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch nurse medication schedule:', error);
      }
    }
  );
};

export const useNurseRounds = () => {
  return useApi(
    () => apiRequest('/api/nurses/me/rounds'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch nurse rounds:', error);
      }
    }
  );
};

export const useNurseAlerts = () => {
  return useApi(
    () => apiRequest('/api/nurses/me/alerts'),
    [],
    {
      onError: (error) => {
        console.error('Failed to fetch nurse alerts:', error);
      }
    }
  );
};
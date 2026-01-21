import api from './api';

// Types
export interface LabRequest {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    age: number;
    gender: string;
    email?: string;
    phone?: string;
  };
  testName: string;
  testType: string;
  priority: 'Routine' | 'Urgent' | 'STAT';
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled' | 'Rejected';
  requestedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  requestedByRole: string;
  requestDate: string;
  assignedToLab?: {
    _id: string;
    name: string;
    email: string;
  };
  acceptedAt?: string;
  completedAt?: string;
  clinicalNotes?: string;
  symptoms?: string;
  provisionalDiagnosis?: string;
  instructions?: string;
  fastingRequired: boolean;
  sampleType?: string;
  sampleCollectedAt?: string;
  sampleCollectedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  labReportId?: {
    _id: string;
    testName: string;
    status: string;
    fileUrl?: string;
    fileName?: string;
    date: string;
  };
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  labNotes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabRequestData {
  patientId: string;
  testName: string;
  testType?: string;
  priority?: 'Routine' | 'Urgent' | 'STAT';
  clinicalNotes?: string;
  symptoms?: string;
  provisionalDiagnosis?: string;
  instructions?: string;
  fastingRequired?: boolean;
}

export interface UpdateLabRequestData {
  testName?: string;
  testType?: string;
  priority?: 'Routine' | 'Urgent' | 'STAT';
  clinicalNotes?: string;
  symptoms?: string;
  provisionalDiagnosis?: string;
  instructions?: string;
  fastingRequired?: boolean;
}

export interface UpdateLabRequestStatusData {
  status: string;
  notes?: string;
  sampleType?: string;
  labReportId?: string;
}

export interface LabRequestFilters {
  page?: number;
  limit?: number;
  patientId?: string;
  status?: string;
  priority?: string;
  testType?: string;
  requestedBy?: string;
}

export interface LabRequestsResponse {
  requests: LabRequest[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface LabRequestStats {
  statusBreakdown: Array<{ _id: string; count: number }>;
  priorityBreakdown: Array<{ _id: string; count: number }>;
  totalRequests: number;
  pendingRequests: number;
  urgentRequests: number;
}

// Lab Request Service
class LabRequestService {
  // Create a new lab request
  async createLabRequest(data: CreateLabRequestData): Promise<LabRequest> {
    const response = await api.post<LabRequest>('/lab/requests', data);
    return response.data;
  }

  // Get all lab requests with filters
  async getLabRequests(filters?: LabRequestFilters): Promise<LabRequestsResponse> {
    const response = await api.get<LabRequestsResponse>('/lab/requests', {
      params: filters,
    });
    return response.data;
  }

  // Get single lab request by ID
  async getLabRequestById(requestId: string): Promise<LabRequest> {
    const response = await api.get<LabRequest>(`/lab/requests/${requestId}`);
    return response.data;
  }

  // Update lab request status (Lab users)
  async updateLabRequestStatus(
    requestId: string,
    data: UpdateLabRequestStatusData
  ): Promise<LabRequest> {
    const response = await api.patch<LabRequest>(
      `/lab/requests/${requestId}/status`,
      data
    );
    return response.data;
  }

  // Update lab request details
  async updateLabRequest(
    requestId: string,
    data: UpdateLabRequestData
  ): Promise<LabRequest> {
    const response = await api.put<LabRequest>(`/lab/requests/${requestId}`, data);
    return response.data;
  }

  // Cancel lab request
  async cancelLabRequest(requestId: string, reason?: string): Promise<{ message: string; request: LabRequest }> {
    const response = await api.delete<{ message: string; request: LabRequest }>(
      `/lab/requests/${requestId}`,
      { data: { reason } }
    );
    return response.data;
  }

  // Get lab requests for a specific patient
  async getPatientLabRequests(patientId: string): Promise<LabRequest[]> {
    const response = await api.get<LabRequest[]>(
      `/lab/requests/patient/${patientId}`
    );
    return response.data;
  }

  // Get lab request statistics
  async getLabRequestStats(): Promise<LabRequestStats> {
    const response = await api.get<LabRequestStats>('/lab/requests-stats');
    return response.data;
  }

  // Get current patient's lab requests (for authenticated patients)
  async getMyLabRequests(): Promise<LabRequest[]> {
    const response = await api.get<LabRequest[]>('/lab/requests/my');
    return response.data;
  }
}

export const labRequestService = new LabRequestService();
export default labRequestService;

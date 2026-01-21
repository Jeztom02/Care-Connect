import { useState } from 'react';
import { apiRequest } from './useApi';

export interface SimilarPatient {
  rank: number;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    condition: string;
    roomNumber: string;
  };
  similarity: number;
  distance: string;
  matchReasons: string[];
  sharedConditions: string[];
}

export interface SimilarPatientsResponse {
  targetPatient: {
    id: string;
    name: string;
    age: number;
    condition: string;
  };
  k: number;
  similarPatients: SimilarPatient[];
  timestamp: string;
}

export interface VolunteerCandidate {
  rank: number;
  volunteer: {
    id: string;
    name: string;
    email: string;
    skills: string[];
    experienceYears: number;
    tasksCompleted: number;
    rating: string;
  };
  matchScore: number;
  matchReasons: string[];
}

export interface VolunteerMatchResponse {
  task: {
    id: string;
    type: string;
    requiredSkills: string[];
    requiredLanguages: string[];
    estimatedHours: number;
  };
  k: number;
  candidates: VolunteerCandidate[];
  timestamp: string;
}

export interface DoctorRecommendation {
  rank: number;
  doctor: {
    id: string;
    name: string;
    email: string;
    specialty: string;
    department: string;
    experienceYears: number;
    rating: string;
    currentPatients: number;
  };
  matchScore: number;
  availability: string;
  recommendationReasons: string[];
}

export interface DoctorRecommendationResponse {
  patient: {
    id: string;
    name: string;
    condition: string;
    department: string;
  };
  requestedSpecialty?: string;
  k: number;
  recommendations: DoctorRecommendation[];
  timestamp: string;
}

export const useSimilarPatients = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimilarPatientsResponse | null>(null);

  const findSimilar = async (patientId: string, k: number = 5) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/knn/patients/${patientId}/similar?k=${k}`);
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to find similar patients';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { findSimilar, loading, error, result };
};

export const useVolunteerMatch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VolunteerMatchResponse | null>(null);

  const findCandidates = async (taskId: string, k: number = 5) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/knn/volunteer/tasks/${taskId}/candidates?k=${k}`);
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to find volunteer candidates';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { findCandidates, loading, error, result };
};

export const useDoctorRecommendation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DoctorRecommendationResponse | null>(null);

  const recommendDoctors = async (patientId: string, k: number = 3, specialty?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = specialty 
        ? `/api/knn/patients/${patientId}/recommend-doctors?k=${k}&specialty=${specialty}`
        : `/api/knn/patients/${patientId}/recommend-doctors?k=${k}`;
      const data = await apiRequest(url);
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to recommend doctors';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { recommendDoctors, loading, error, result };
};

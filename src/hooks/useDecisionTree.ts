import { useState } from 'react';
import { apiRequest } from './useApi';

export interface PatientFeatures {
  age?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  painLevel?: number;
  mobilityScore?: number;
  daysAdmitted?: number;
  hasChronicCondition?: boolean;
  recentSurgery?: boolean;
}

export interface DecisionResult {
  patientId: string;
  patientName: string;
  recommendation: string;
  confidence: number;
  rulePath: string[];
  reasoning: string;
  nextSteps: string[];
  timestamp: string;
}

export const useCarePath = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);

  const getRecommendation = async (patientId: string, features?: PatientFeatures) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/decision-tree/patients/${patientId}/care-path`, {
        method: 'POST',
        body: JSON.stringify(features || {}),
      });
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get care path recommendation';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { getRecommendation, loading, error, result };
};

export const useDischargeReadiness = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);

  const evaluate = async (patientId: string, features?: PatientFeatures) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/decision-tree/patients/${patientId}/discharge-readiness`, {
        method: 'POST',
        body: JSON.stringify(features || {}),
      });
      setResult(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to evaluate discharge readiness';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { evaluate, loading, error, result };
};

export const useDecisionTreeExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportTree = async (type: 'care-path' | 'discharge-readiness') => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/decision-tree/export/${type}`);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to export decision tree';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { exportTree, loading, error };
};

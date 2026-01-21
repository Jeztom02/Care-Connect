/**
 * K-Nearest Neighbors (KNN) Implementation
 * For similarity matching without training
 */

interface FeatureVector {
  [key: string]: number;
}

interface SimilarityResult<T> {
  item: T;
  distance: number;
  similarity: number; // 0-1 scale (1 = most similar)
}

/**
 * Calculate Euclidean distance between two feature vectors
 */
export function euclideanDistance(a: FeatureVector, b: FeatureVector): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let sumSquares = 0;
  
  for (const key of keys) {
    const valA = a[key] || 0;
    const valB = b[key] || 0;
    sumSquares += Math.pow(valA - valB, 2);
  }
  
  return Math.sqrt(sumSquares);
}

/**
 * Calculate cosine similarity between two feature vectors
 */
export function cosineSimilarity(a: FeatureVector, b: FeatureVector): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (const key of keys) {
    const valA = a[key] || 0;
    const valB = b[key] || 0;
    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  }
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

/**
 * Normalize feature vector to 0-1 scale
 */
export function normalizeFeatures(vectors: FeatureVector[]): FeatureVector[] {
  if (vectors.length === 0) return [];
  
  // Find min and max for each feature
  const keys = Object.keys(vectors[0]);
  const ranges: { [key: string]: { min: number; max: number } } = {};
  
  for (const key of keys) {
    const values = vectors.map(v => v[key] || 0);
    ranges[key] = {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
  
  // Normalize each vector
  return vectors.map(vector => {
    const normalized: FeatureVector = {};
    for (const key of keys) {
      const value = vector[key] || 0;
      const range = ranges[key];
      if (range.max === range.min) {
        normalized[key] = 0;
      } else {
        normalized[key] = (value - range.min) / (range.max - range.min);
      }
    }
    return normalized;
  });
}

/**
 * Find K nearest neighbors using specified distance metric
 */
export function findKNN<T>(
  target: FeatureVector,
  candidates: Array<{ item: T; features: FeatureVector }>,
  k: number,
  metric: 'euclidean' | 'cosine' = 'euclidean'
): SimilarityResult<T>[] {
  if (candidates.length === 0) return [];
  
  // Calculate distances/similarities
  const results = candidates.map(({ item, features }) => {
    let distance: number;
    let similarity: number;
    
    if (metric === 'cosine') {
      similarity = cosineSimilarity(target, features);
      distance = 1 - similarity; // Convert to distance
    } else {
      distance = euclideanDistance(target, features);
      // Convert distance to similarity (0-1 scale)
      similarity = 1 / (1 + distance);
    }
    
    return { item, distance, similarity };
  });
  
  // Sort by distance (ascending) or similarity (descending)
  results.sort((a, b) => a.distance - b.distance);
  
  // Return top K
  return results.slice(0, k);
}

/**
 * Patient Feature Extraction
 */
export interface PatientFeatures {
  age: number;
  gender: number; // 0 = male, 1 = female, 0.5 = other
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  bmi: number;
  daysAdmitted: number;
  chronicConditionsCount: number;
  allergiesCount: number;
  medicationsCount: number;
  severity: number; // 0 = normal, 0.5 = warning, 1 = critical
}

export function extractPatientFeatures(patient: any, vitals?: any): FeatureVector {
  // Gender encoding
  let genderValue = 0.5;
  if (patient.gender === 'male' || patient.gender === 'M') genderValue = 0;
  if (patient.gender === 'female' || patient.gender === 'F') genderValue = 1;
  
  // Severity encoding
  let severityValue = 0;
  if (vitals?.severity === 'warning') severityValue = 0.5;
  if (vitals?.severity === 'critical') severityValue = 1;
  
  // Days admitted
  let daysAdmitted = 0;
  if (patient.admissionDate) {
    daysAdmitted = Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Calculate age from dateOfBirth
  let age = 0;
  if (patient.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  } else if (patient.age) {
    age = patient.age;
  }
  
  return {
    age: age,
    gender: genderValue,
    heartRate: vitals?.heartRate || 0,
    bloodPressureSystolic: vitals?.bloodPressure ? parseInt(vitals.bloodPressure.split('/')[0]) : 0,
    bloodPressureDiastolic: vitals?.bloodPressure ? parseInt(vitals.bloodPressure.split('/')[1]) : 0,
    temperature: vitals?.temperature || 0,
    oxygenSaturation: vitals?.oxygenSaturation || 0,
    respiratoryRate: vitals?.respiratoryRate || 0,
    bmi: 0, // BMI not stored in current model
    daysAdmitted: daysAdmitted,
    chronicConditionsCount: patient.medicalConditions?.length || 0,
    allergiesCount: patient.allergies?.length || 0,
    medicationsCount: patient.medications?.length || 0,
    severity: severityValue
  };
}

/**
 * Volunteer Feature Extraction
 */
export interface VolunteerFeatures {
  availability: number; // 0-1 scale
  experienceYears: number;
  tasksCompleted: number;
  averageRating: number; // 0-5 scale, normalized to 0-1
  skillMatch: number; // 0-1 based on skill overlap
  proximityScore: number; // 0-1 based on location
  languageMatch: number; // 0-1 based on language overlap
  preferenceMatch: number; // 0-1 based on task type preference
}

export function extractVolunteerFeatures(volunteer: any, task: any): FeatureVector {
  // Calculate skill match
  const volunteerSkills = new Set(volunteer.skills || []);
  const requiredSkills = new Set(task.requiredSkills || []);
  const skillOverlap = [...requiredSkills].filter(s => volunteerSkills.has(s)).length;
  const skillMatch = requiredSkills.size > 0 ? skillOverlap / requiredSkills.size : 0;
  
  // Calculate language match
  const volunteerLanguages = new Set(volunteer.languages || []);
  const requiredLanguages = new Set(task.requiredLanguages || []);
  const languageOverlap = [...requiredLanguages].filter(l => volunteerLanguages.has(l)).length;
  const languageMatch = requiredLanguages.size > 0 ? languageOverlap / requiredLanguages.size : 1;
  
  // Calculate preference match
  const preferenceMatch = volunteer.preferredTaskTypes?.includes(task.type) ? 1 : 0.5;
  
  // Availability (0-1 scale)
  const availability = volunteer.availableHours ? Math.min(volunteer.availableHours / 40, 1) : 0.5;
  
  return {
    availability: availability,
    experienceYears: volunteer.experienceYears || 0,
    tasksCompleted: volunteer.tasksCompleted || 0,
    averageRating: (volunteer.averageRating || 0) / 5, // Normalize to 0-1
    skillMatch: skillMatch,
    proximityScore: volunteer.proximityScore || 0.5,
    languageMatch: languageMatch,
    preferenceMatch: preferenceMatch
  };
}

/**
 * Doctor Feature Extraction
 */
export interface DoctorFeatures {
  specialtyMatch: number; // 0-1 based on specialty match
  experienceYears: number;
  patientsHandled: number;
  averageRating: number; // 0-5 normalized to 0-1
  availability: number; // 0-1 scale
  caseloadSimilarity: number; // 0-1 based on similar cases handled
  departmentMatch: number; // 0 or 1
  languageMatch: number; // 0-1 based on language overlap
}

export function extractDoctorFeatures(doctor: any, patient: any, requiredSpecialty?: string): FeatureVector {
  // Specialty match
  const specialtyMatch = requiredSpecialty && doctor.specialty === requiredSpecialty ? 1 : 0.5;
  
  // Department match
  const departmentMatch = patient.department && doctor.department === patient.department ? 1 : 0;
  
  // Language match
  const doctorLanguages = new Set(doctor.languages || ['English']);
  const patientLanguages = new Set(patient.preferredLanguages || ['English']);
  const languageOverlap = [...patientLanguages].filter(l => doctorLanguages.has(l)).length;
  const languageMatch = patientLanguages.size > 0 ? languageOverlap / patientLanguages.size : 1;
  
  // Availability
  const availability = doctor.currentPatients ? Math.max(0, 1 - (doctor.currentPatients / 20)) : 0.8;
  
  return {
    specialtyMatch: specialtyMatch,
    experienceYears: doctor.experienceYears || 0,
    patientsHandled: doctor.totalPatientsHandled || 0,
    averageRating: (doctor.averageRating || 4) / 5,
    availability: availability,
    caseloadSimilarity: doctor.caseloadSimilarity || 0.5,
    departmentMatch: departmentMatch,
    languageMatch: languageMatch
  };
}

/**
 * Calculate weighted KNN (give more importance to certain features)
 */
export function findWeightedKNN<T>(
  target: FeatureVector,
  candidates: Array<{ item: T; features: FeatureVector }>,
  k: number,
  weights: { [key: string]: number } = {}
): SimilarityResult<T>[] {
  if (candidates.length === 0) return [];
  
  // Apply weights to features
  const weightedTarget = { ...target };
  const weightedCandidates = candidates.map(({ item, features }) => {
    const weightedFeatures = { ...features };
    
    for (const key in weights) {
      if (key in weightedTarget) {
        weightedTarget[key] = (weightedTarget[key] || 0) * weights[key];
      }
      if (key in weightedFeatures) {
        weightedFeatures[key] = (weightedFeatures[key] || 0) * weights[key];
      }
    }
    
    return { item, features: weightedFeatures };
  });
  
  return findKNN(weightedTarget, weightedCandidates, k, 'euclidean');
}

/**
 * Explain why items are similar
 */
export function explainSimilarity(
  targetFeatures: FeatureVector,
  candidateFeatures: FeatureVector,
  featureNames: { [key: string]: string } = {}
): string[] {
  const explanations: string[] = [];
  const threshold = 0.1; // Features within 10% are considered similar
  
  for (const key in targetFeatures) {
    if (key in candidateFeatures) {
      const diff = Math.abs(targetFeatures[key] - candidateFeatures[key]);
      if (diff <= threshold) {
        const featureName = featureNames[key] || key;
        explanations.push(`Similar ${featureName}: ${targetFeatures[key].toFixed(2)} vs ${candidateFeatures[key].toFixed(2)}`);
      }
    }
  }
  
  return explanations;
}

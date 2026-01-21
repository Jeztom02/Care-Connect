import mongoose from 'mongoose';

// Import models
import { Patient } from './patient';
import { PatientNote } from './patientNote';
import { PatientVital } from './patientVital';
import { EmergencyAlert } from './emergencyAlert';
import { LabReport } from './labReport';
import { LabRequest } from './labRequest';
import { Medicine } from './medicine';
import { MedicinePayment } from './medicinePayment';
import { MedicalHistory } from './medicalHistory';

// Export types
export * from './patientNote';
export * from './patientVital';
export * from './emergencyAlert';
export * from './patient';

// Export models with checks to prevent recompilation
export const models = {
  Patient: mongoose.models.Patient || Patient,
  PatientNote: mongoose.models.PatientNote || PatientNote,
  PatientVital: mongoose.models.PatientVital || PatientVital,
  EmergencyAlert: mongoose.models.EmergencyAlert || EmergencyAlert
  ,
  LabReport: mongoose.models.LabReport || LabReport,
  LabRequest: mongoose.models.LabRequest || LabRequest,
  Medicine: mongoose.models.Medicine || Medicine,
  MedicinePayment: mongoose.models.MedicinePayment || MedicinePayment
  ,
  MedicalHistory: mongoose.models.MedicalHistory || MedicalHistory
};

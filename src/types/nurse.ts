export interface MedicationData {
  prescriptionId: string;
  patientId: string;
  medication: string;
  dosage: string;
  time?: Date;
  notes?: string;
}

export interface Patient {
  _id: string;
  name: string;
  roomNumber: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  condition: string;
  lastVitalCheck?: string;
}

export interface Round {
  _id: string;
  patientId: {
    name: string;
    roomNumber: string;
  };
  scheduledAt: string;
  status: string;
}

export interface VitalsData {
  bloodPressure: string;
  temperature: number;
  pulse: number;
  oxygenLevel: number;
  notes?: string;
  recordedAt: Date;
}

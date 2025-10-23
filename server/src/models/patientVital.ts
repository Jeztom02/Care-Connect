import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientVital extends Document {
  patientId: mongoose.Types.ObjectId;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  recordedAt: Date;
}

const PatientVitalSchema = new Schema<IPatientVital>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true 
    },
    bloodPressure: { 
      type: String, 
      required: true,
      match: /^\d{2,3}\/\d{2,3}$/,
      trim: true 
    },
    heartRate: { 
      type: Number, 
      required: true,
      min: 30,
      max: 250 
    },
    temperature: { 
      type: Number, 
      required: true,
      min: 30,
      max: 45 
    },
    oxygenSaturation: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100 
    },
    respiratoryRate: { 
      type: Number, 
      required: true,
      min: 0,
      max: 60 
    },
    notes: { 
      type: String, 
      trim: true 
    },
    recordedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    recordedAt: { 
      type: Date, 
      default: Date.now 
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: (doc: any, ret: Record<string, any>) => {
        const { __v, ...rest } = ret;
        return rest;
      }
    }
  }
);

// Check if model exists before compiling it
export const PatientVital = (mongoose.models.PatientVital as mongoose.Model<IPatientVital>) || 
  mongoose.model<IPatientVital>('PatientVital', PatientVitalSchema);

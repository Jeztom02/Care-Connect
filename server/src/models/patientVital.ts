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
  recordedByRole: string;
  recordedAt: Date;
  severity: 'normal' | 'warning' | 'critical';
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    role: string;
    timestamp: Date;
  }>;
  acknowledgedBy?: {
    userId: mongoose.Types.ObjectId;
    role: string;
    timestamp: Date;
    notes?: string;
  };
  status: 'new' | 'acknowledged' | 'resolved';
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
    recordedByRole: {
      type: String,
      required: true,
      enum: ['doctor', 'nurse', 'admin']
    },
    recordedAt: { 
      type: Date, 
      default: Date.now 
    },
    severity: {
      type: String,
      enum: ['normal', 'warning', 'critical'],
      default: 'normal'
    },
    readBy: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: String,
      timestamp: { type: Date, default: Date.now }
    }],
    acknowledgedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: String,
      timestamp: { type: Date },
      notes: String
    },
    status: {
      type: String,
      enum: ['new', 'acknowledged', 'resolved'],
      default: 'new'
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

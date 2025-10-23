import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string[];
  medicalConditions?: string[];
  medications?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  roomNumber?: string;
  bedNumber?: string;
  admissionDate?: Date;
  dischargeDate?: Date;
  status: 'admitted' | 'discharged' | 'transferred' | 'in-surgery' | 'critical';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  lastVitals?: mongoose.Types.ObjectId;
  lastVisit?: Date;
  nextAppointment?: Date;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  primaryPhysician?: mongoose.Types.ObjectId;
  assignedNurse?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    dateOfBirth: { 
      type: Date, 
      required: true 
    },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      required: true 
    },
    bloodType: { 
      type: String, 
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
    },
    allergies: [{ 
      type: String,
      trim: true 
    }],
    medicalConditions: [{ 
      type: String,
      trim: true 
    }],
    medications: [{ 
      type: String,
      trim: true 
    }],
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },
    roomNumber: { 
      type: String,
      trim: true 
    },
    bedNumber: { 
      type: String,
      trim: true 
    },
    admissionDate: { 
      type: Date 
    },
    dischargeDate: { 
      type: Date 
    },
    status: { 
      type: String, 
      enum: ['admitted', 'discharged', 'transferred', 'in-surgery', 'critical'],
      default: 'admitted' 
    },
    notes: { 
      type: String,
      trim: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    lastVitals: { 
      type: Schema.Types.ObjectId, 
      ref: 'PatientVital' 
    },
    lastVisit: { 
      type: Date 
    },
    nextAppointment: { 
      type: Date 
    },
    insuranceProvider: { 
      type: String,
      trim: true 
    },
    insurancePolicyNumber: { 
      type: String,
      trim: true 
    },
    primaryPhysician: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    assignedNurse: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
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

// Indexes for faster queries
PatientSchema.index({ name: 'text' });
PatientSchema.index({ status: 1 });
PatientSchema.index({ roomNumber: 1, bedNumber: 1 }, { unique: true, sparse: true });
PatientSchema.index({ primaryPhysician: 1 });
PatientSchema.index({ assignedNurse: 1 });

// Virtual for patient's age
PatientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Check if model exists before compiling it
export const Patient = (mongoose.models.Patient as mongoose.Model<IPatient>) || 
  mongoose.model<IPatient>('Patient', PatientSchema);

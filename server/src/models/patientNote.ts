import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientNote extends Document {
  patientId: mongoose.Types.ObjectId;
  title?: string;
  content: string;
  category?: 'general' | 'nursing' | 'doctor' | 'lab' | 'pharmacy' | 'other';
  priority: 'low' | 'medium' | 'high';
  isFlagged: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdByRole: string;
  updatedBy?: {
    userId: mongoose.Types.ObjectId;
    role: string;
    timestamp: Date;
  };
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
  status: 'active' | 'archived' | 'resolved';
  tags?: string[];
  relatedTo?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientNoteSchema = new Schema<IPatientNote>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true
    },
    content: { 
      type: String, 
      required: true,
      trim: true 
    },
    category: {
      type: String,
      enum: ['general', 'nursing', 'doctor', 'lab', 'pharmacy', 'other'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    createdByRole: {
      type: String,
      required: true,
      enum: ['doctor', 'nurse', 'admin']
    },
    updatedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: String,
      timestamp: { type: Date }
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
      enum: ['active', 'archived', 'resolved'],
      default: 'active'
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    relatedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'PatientNote'
    }],
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: (_, ret: Record<string, any>) => {
        // Create a new object without the __v field
        const { __v, ...rest } = ret;
        return rest;
      }
    }
  }
);

// Check if model exists before compiling it
export const PatientNote = (mongoose.models.PatientNote as mongoose.Model<IPatientNote>) || 
  mongoose.model<IPatientNote>('PatientNote', PatientNoteSchema);

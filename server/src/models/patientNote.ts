import mongoose, { Schema, Document } from 'mongoose';

export interface IPatientNote extends Document {
  patientId: mongoose.Types.ObjectId;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PatientNoteSchema = new Schema<IPatientNote>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true 
    },
    content: { 
      type: String, 
      required: true,
      trim: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: (_, ret) => {
        if ('__v' in ret) {
          delete ret.__v;
        }
        return ret;
      }
    }
  }
);

// Check if model exists before compiling it
export const PatientNote = (mongoose.models.PatientNote as mongoose.Model<IPatientNote>) || 
  mongoose.model<IPatientNote>('PatientNote', PatientNoteSchema);

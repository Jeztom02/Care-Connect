import mongoose, { Schema, Document } from 'mongoose';

export type EmergencyPriority = 'low' | 'medium' | 'high';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface IEmergencyAlert extends Document {
  patientId: mongoose.Types.ObjectId;
  priority: EmergencyPriority;
  details: string;
  status: AlertStatus;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      required: true 
    },
    details: { 
      type: String, 
      required: true,
      trim: true 
    },
    status: { 
      type: String, 
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active' 
    },
    acknowledgedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    acknowledgedAt: { 
      type: Date 
    },
    resolvedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    resolvedAt: { 
      type: Date 
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

// Index for faster queries
EmergencyAlertSchema.index({ patientId: 1, status: 1 });
EmergencyAlertSchema.index({ status: 1, priority: 1 });
EmergencyAlertSchema.index({ createdAt: -1 });

// Check if model exists before compiling it
export const EmergencyAlert = (mongoose.models.EmergencyAlert as mongoose.Model<IEmergencyAlert>) || 
  mongoose.model<IEmergencyAlert>('EmergencyAlert', EmergencyAlertSchema);

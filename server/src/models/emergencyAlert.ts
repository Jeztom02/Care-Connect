import mongoose, { Schema, Document } from 'mongoose';

export type EmergencyPriority = 'low' | 'medium' | 'high';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface IEmergencyAlert extends Document {
  patientId: mongoose.Types.ObjectId;
  title: string;
  priority: EmergencyPriority;
  details: string;
  category: 'vital' | 'medication' | 'fall' | 'behavioral' | 'medical' | 'other';
  status: AlertStatus;
  
  // Tracking who has read the alert
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    role: string;
    timestamp: Date;
  }>;
  
  // Acknowledgment information
  acknowledgedBy?: {
    userId: mongoose.Types.ObjectId;
    role: string;
    timestamp: Date;
    notes?: string;
  };
  
  // Resolution information
  resolvedBy?: {
    userId: mongoose.Types.ObjectId;
    role: string;
    timestamp: Date;
    resolutionNotes?: string;
  };
  
  // Additional metadata
  relatedTo?: {
    type: 'vital' | 'medication' | 'note' | 'other';
    id: mongoose.Types.ObjectId;
  };
  
  // Creator information
  createdBy: {
    userId: mongoose.Types.ObjectId;
    role: string;
    name: string;
  };
  
  // System timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Custom methods
  markAsRead(userId: mongoose.Types.ObjectId, role: string): Promise<void>;
  acknowledge(userId: mongoose.Types.ObjectId, role: string, notes?: string): Promise<void>;
  resolve(userId: mongoose.Types.ObjectId, role: string, notes?: string): Promise<void>;
}

const EmergencyAlertSchema = new Schema<IEmergencyAlert>(
  {
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      required: true,
      index: true
    },
    details: { 
      type: String, 
      required: true,
      trim: true 
    },
    category: {
      type: String,
      enum: ['vital', 'medication', 'fall', 'behavioral', 'medical', 'other'],
      default: 'other',
      index: true
    },
    status: { 
      type: String, 
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
      index: true
    },
    
    // Tracks who has read this alert
    readBy: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    
    // Acknowledgment information
    acknowledgedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String },
      timestamp: { type: Date },
      notes: { type: String }
    },
    
    // Resolution information
    resolvedBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String },
      timestamp: { type: Date },
      resolutionNotes: { type: String }
    },
    
    // Reference to related document (e.g., a specific vital reading)
    relatedTo: {
      type: { 
        type: String, 
        enum: ['vital', 'medication', 'note', 'other']
      },
      id: { type: Schema.Types.ObjectId }
    },
    
    // Creator information
    createdBy: {
      userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
      },
      role: { 
        type: String, 
        required: true,
        enum: ['doctor', 'nurse', 'admin']
      },
      name: { type: String, required: true }
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: (_, ret: Record<string, any>) => {
        // Remove __v field
        const { __v, ...rest } = ret;
        return rest;
      }
    }
  }
);

// Indexes for optimized queries
EmergencyAlertSchema.index({ patientId: 1, status: 1 });
EmergencyAlertSchema.index({ status: 1, priority: 1 });
EmergencyAlertSchema.index({ 'createdBy.userId': 1, status: 1 });
EmergencyAlertSchema.index({ 'acknowledgedBy.userId': 1 });
EmergencyAlertSchema.index({ 'resolvedBy.userId': 1 });
EmergencyAlertSchema.index({ createdAt: -1 });
EmergencyAlertSchema.index({ updatedAt: -1 });

// Add instance methods for common operations
EmergencyAlertSchema.methods.markAsRead = async function(
  userId: mongoose.Types.ObjectId, 
  role: string
): Promise<void> {
  // Check if user has already read this alert
  const hasRead = this.readBy.some(
    (entry: any) => entry.userId.toString() === userId.toString()
  );
  
  if (!hasRead) {
    this.readBy.push({
      userId,
      role,
      timestamp: new Date()
    });
    
    await this.save();
  }
};

EmergencyAlertSchema.methods.acknowledge = async function(
  userId: mongoose.Types.ObjectId,
  role: string,
  notes?: string
): Promise<void> {
  if (this.status === 'resolved') {
    throw new Error('Cannot acknowledge a resolved alert');
  }
  
  this.status = 'acknowledged';
  this.acknowledgedBy = {
    userId,
    role,
    timestamp: new Date(),
    notes
  };
  
  await this.save();
};

EmergencyAlertSchema.methods.resolve = async function(
  userId: mongoose.Types.ObjectId,
  role: string,
  notes?: string
): Promise<void> {
  this.status = 'resolved';
  this.resolvedBy = {
    userId,
    role,
    timestamp: new Date(),
    resolutionNotes: notes
  };
  
  await this.save();
};

// Check if model exists before compiling it
export const EmergencyAlert = (mongoose.models.EmergencyAlert as mongoose.Model<IEmergencyAlert>) || 
  mongoose.model<IEmergencyAlert>('EmergencyAlert', EmergencyAlertSchema);

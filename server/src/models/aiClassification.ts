import mongoose, { Schema, Document } from 'mongoose';

export interface IAIClassification extends Document {
  type: 'alert_priority' | 'medical_record_type';
  inputText: {
    title?: string;
    message?: string;
    summary?: string;
    diagnosis?: string;
  };
  aiPrediction: {
    label: string;
    confidence: number;
    scores: Record<string, number>;
  };
  userSelection?: string;
  outcome?: 'correct' | 'incorrect' | 'pending';
  relatedId?: mongoose.Types.ObjectId; // Alert or MedicalRecord ID
  patientId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AIClassificationSchema = new Schema<IAIClassification>(
  {
    type: {
      type: String,
      enum: ['alert_priority', 'medical_record_type'],
      required: true
    },
    inputText: {
      title: String,
      message: String,
      summary: String,
      diagnosis: String
    },
    aiPrediction: {
      label: { type: String, required: true },
      confidence: { type: Number, required: true },
      scores: { type: Map, of: Number }
    },
    userSelection: String,
    outcome: {
      type: String,
      enum: ['correct', 'incorrect', 'pending'],
      default: 'pending'
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      refPath: 'type'
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
AIClassificationSchema.index({ type: 1, createdAt: -1 });
AIClassificationSchema.index({ userId: 1 });
AIClassificationSchema.index({ outcome: 1 });

export const AIClassification = (mongoose.models.AIClassification as mongoose.Model<IAIClassification>) || 
  mongoose.model<IAIClassification>('AIClassification', AIClassificationSchema);

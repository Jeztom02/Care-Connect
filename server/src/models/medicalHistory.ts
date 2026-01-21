import mongoose, { Schema, model } from 'mongoose';

const medicalHistorySchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // patient user
  documentType: { type: String },
  fileUrl: { type: String, required: true },
  description: { type: String },
  date: { type: Date },
}, { timestamps: true });

export const MedicalHistory = mongoose.models.MedicalHistory || model('MedicalHistory', medicalHistorySchema);

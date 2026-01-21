import mongoose, { Schema, model } from 'mongoose';

const medicinePaymentSchema = new Schema({
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  transactionDate: { type: Date, default: Date.now }
}, { timestamps: true });

export const MedicinePayment = mongoose.models.MedicinePayment || model('MedicinePayment', medicinePaymentSchema);

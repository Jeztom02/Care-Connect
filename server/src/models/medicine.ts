import mongoose, { Schema, model } from 'mongoose';

const medicineSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  sku: { type: String },
  price: { type: Number, required: true, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String },
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Medicine = mongoose.models.Medicine || model('Medicine', medicineSchema);

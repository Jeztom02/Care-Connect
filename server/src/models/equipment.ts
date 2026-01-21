import mongoose, { Schema, model } from 'mongoose';

const equipmentSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // e.g., 'Oxygen Cylinder', 'Wheelchair', 'Bed'
  condition: { type: String, enum: ['New', 'Used'], required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Sold', 'Pending', 'Reserved'], default: 'Available' },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerType: { type: String, enum: ['Hospital', 'Patient', 'Admin'], required: true },
  images: [{ type: String }],
  isVerified: { type: Boolean, default: false }, // For used equipment listed by patients
  location: { type: String },
  contactPhone: { type: String },
}, { timestamps: true });

const equipmentTransactionSchema = new Schema({
  equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  paymentMethod: { type: String },
  transactionDate: { type: Date, default: Date.now },
}, { timestamps: true });

export const Equipment = mongoose.models.Equipment || model('Equipment', equipmentSchema);
export const EquipmentTransaction = mongoose.models.EquipmentTransaction || model('EquipmentTransaction', equipmentTransactionSchema);

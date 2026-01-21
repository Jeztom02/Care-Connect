import mongoose, { Schema, model } from 'mongoose';

const usedEquipmentSaleSchema = new Schema({
  equipmentId: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  transactionDate: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const UsedEquipmentSale = mongoose.models.UsedEquipmentSale || model('UsedEquipmentSale', usedEquipmentSaleSchema);

export default UsedEquipmentSale;

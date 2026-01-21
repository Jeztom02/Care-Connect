import mongoose, { Schema, Document } from 'mongoose';

export interface IPharmacyOrder extends Document {
  prescriptionId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  pharmacyId?: mongoose.Types.ObjectId;
  orderNumber: string;
  items: Array<{
    medication: string;
    dosage: string;
    quantity: number;
    price: number;
    instructions?: string;
  }>;
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Fulfilled' | 'PaymentRequested' | 'Paid' | 'Completed' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'PaymentRequested' | 'Paid' | 'Refunded';
  paymentMethod?: string;
  paymentDate?: Date;
  transactionId?: string;
  fulfilledBy?: mongoose.Types.ObjectId;
  fulfilledAt?: Date;
  fulfillmentNotes?: string;
  patientNotes?: string;
  shippingAddress?: string;
  deliveryMethod?: 'Pickup' | 'HomeDelivery';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyOrderSchema = new Schema<IPharmacyOrder>({
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, required: true, unique: true },
  items: [{
    medication: { type: String, required: true },
    dosage: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    instructions: String
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Fulfilled', 'PaymentRequested', 'Paid', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'PaymentRequested', 'Paid', 'Refunded'],
    default: 'Unpaid'
  },
  paymentMethod: String,
  paymentDate: Date,
  transactionId: String,
  fulfilledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  fulfilledAt: Date,
  fulfillmentNotes: String,
  patientNotes: String,
  shippingAddress: String,
  deliveryMethod: { type: String, enum: ['Pickup', 'HomeDelivery'], default: 'Pickup' },
  estimatedDelivery: Date,
  actualDelivery: Date
}, {
  timestamps: true
});

// Generate order number
PharmacyOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('PharmacyOrder').countDocuments();
    this.orderNumber = `RX${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const PharmacyOrder = mongoose.model<IPharmacyOrder>('PharmacyOrder', PharmacyOrderSchema);

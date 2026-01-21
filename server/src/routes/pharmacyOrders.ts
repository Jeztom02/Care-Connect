import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { PharmacyOrder } from '../models/pharmacyOrder';
import { Prescription, User } from '../models';
import mongoose from 'mongoose';

// Get Patient model directly from mongoose to avoid TypeScript issues
const Patient = mongoose.models.Patient || mongoose.model('Patient');

export const pharmacyOrdersRouter = Router();
pharmacyOrdersRouter.use(authenticateJwt);

// Get all orders (pharmacy, admin)
pharmacyOrdersRouter.get('/', authorizeRoles('pharmacy', 'admin'), async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus } = req.query;
    const filter: any = {};
    
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const orders = await PharmacyOrder.find(filter)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Get all error:', err);
    res.status(500).json({ message: err.message || 'Failed to get orders' });
  }
});

// Get pharmacy transactions with statistics (pharmacy, admin)
pharmacyOrdersRouter.get('/stats/transactions', authorizeRoles('pharmacy', 'admin'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = {};
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    const orders = await PharmacyOrder.find(filter)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName')
      .sort({ createdAt: -1 });
    
    // Calculate statistics
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const pendingPayments = orders
      .filter(o => o.paymentStatus === 'PaymentRequested')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'Paid').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    
    res.json({
      orders,
      statistics: {
        totalRevenue,
        pendingPayments,
        completedOrders,
        paidOrders,
        pendingOrders,
        totalOrders: orders.length
      }
    });
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Get transactions error:', err);
    res.status(500).json({ message: err.message || 'Failed to get transactions' });
  }
});

// Get patient's orders
pharmacyOrdersRouter.get('/patient/:patientId', authorizeRoles('patient', 'doctor', 'nurse', 'pharmacy', 'admin'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const orders = await PharmacyOrder.find({ patientId })
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Get patient orders error:', err);
    res.status(500).json({ message: err.message || 'Failed to get patient orders' });
  }
});

// Get my orders (for logged-in patient)
pharmacyOrdersRouter.get('/my-orders', authorizeRoles('patient'), async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.sub);
    
    console.log('[PHARMACY ORDERS] Patient requesting orders, userId:', req.user!.sub);
    
    // Find patient by userId
    const patient = await Patient.findOne({ userId }).exec();
    if (!patient) {
      console.log('[PHARMACY ORDERS] No patient record found for userId:', req.user!.sub);
      return res.status(404).json({ message: 'Patient record not found' });
    }
    
    console.log('[PHARMACY ORDERS] Found patient record:', patient._id);
    
    const orders = await PharmacyOrder.find({ patientId: patient._id })
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName')
      .sort({ createdAt: -1 });
    
    console.log('[PHARMACY ORDERS] Found', orders.length, 'orders for patient');
    res.json(orders);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Get my orders error:', err);
    res.status(500).json({ message: err.message || 'Failed to get orders' });
  }
});

// Create order from prescription (auto-created when prescription is made)
pharmacyOrdersRouter.post('/', authorizeRoles('doctor', 'pharmacy', 'admin'), async (req: Request, res: Response) => {
  try {
    const { prescriptionId, patientId, doctorId, items, deliveryMethod, patientNotes } = req.body;
    
    if (!prescriptionId || !patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'prescriptionId, patientId, and items are required' });
    }
    
    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    const order = new PharmacyOrder({
      prescriptionId,
      patientId,
      doctorId: doctorId || req.user!.sub,
      items,
      totalAmount,
      deliveryMethod: deliveryMethod || 'Pickup',
      patientNotes,
      status: 'Pending',
      paymentStatus: 'Unpaid'
    });
    
    await order.save();
    
    const populated = await PharmacyOrder.findById(order._id)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId');
    
    res.status(201).json(populated);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Create error:', err);
    res.status(500).json({ message: err.message || 'Failed to create order' });
  }
});

// Fulfill order (pharmacy)
pharmacyOrdersRouter.put('/:orderId/fulfill', authorizeRoles('pharmacy', 'admin'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { fulfillmentNotes, estimatedDelivery } = req.body;
    
    const order = await PharmacyOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = 'Fulfilled';
    order.fulfilledBy = req.user!.sub as any;
    order.fulfilledAt = new Date();
    order.fulfillmentNotes = fulfillmentNotes;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    
    await order.save();
    
    const populated = await PharmacyOrder.findById(order._id)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName');
    
    res.json(populated);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Fulfill error:', err);
    res.status(500).json({ message: err.message || 'Failed to fulfill order' });
  }
});

// Request payment (pharmacy)
pharmacyOrdersRouter.put('/:orderId/request-payment', authorizeRoles('pharmacy', 'admin'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    const order = await PharmacyOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status !== 'Fulfilled') {
      return res.status(400).json({ message: 'Order must be fulfilled before requesting payment' });
    }
    
    order.status = 'PaymentRequested';
    order.paymentStatus = 'PaymentRequested';
    
    await order.save();
    
    const populated = await PharmacyOrder.findById(order._id)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName');
    
    res.json(populated);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Request payment error:', err);
    res.status(500).json({ message: err.message || 'Failed to request payment' });
  }
});

// Make payment (patient)
pharmacyOrdersRouter.post('/:orderId/payment', authorizeRoles('patient', 'admin'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, transactionId } = req.body;
    
    const order = await PharmacyOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify patient owns this order
    const userId = new mongoose.Types.ObjectId(req.user!.sub);
    const patient = await Patient.findOne({ userId }).exec();
    
    if (req.user!.role === 'patient' && (!patient || String(order.patientId) !== String(patient._id))) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }
    
    order.paymentStatus = 'Paid';
    order.status = 'Paid';
    order.paymentMethod = paymentMethod || 'Card';
    order.paymentDate = new Date();
    order.transactionId = transactionId || `TXN${Date.now()}`;
    
    await order.save();
    
    const populated = await PharmacyOrder.findById(order._id)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName');
    
    res.json(populated);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Payment error:', err);
    res.status(500).json({ message: err.message || 'Failed to process payment' });
  }
});

// Complete order (mark as delivered)
pharmacyOrdersRouter.put('/:orderId/complete', authorizeRoles('pharmacy', 'patient', 'admin'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    const order = await PharmacyOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.paymentStatus !== 'Paid') {
      return res.status(400).json({ message: 'Order must be paid before completion' });
    }
    
    order.status = 'Completed';
    order.actualDelivery = new Date();
    
    await order.save();
    
    const populated = await PharmacyOrder.findById(order._id)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName');
    
    res.json(populated);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Complete error:', err);
    res.status(500).json({ message: err.message || 'Failed to complete order' });
  }
});

// Cancel order
pharmacyOrdersRouter.put('/:orderId/cancel', authorizeRoles('patient', 'pharmacy', 'admin'), async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await PharmacyOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Cannot cancel paid order. Request refund instead.' });
    }
    
    order.status = 'Cancelled';
    if (reason) order.fulfillmentNotes = `Cancelled: ${reason}`;
    
    await order.save();
    
    const populated = await PharmacyOrder.findById(order._id)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName');
    
    res.json(populated);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Cancel error:', err);
    res.status(500).json({ message: err.message || 'Failed to cancel order' });
  }
});

// Get order details
pharmacyOrdersRouter.get('/:orderId', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    const order = await PharmacyOrder.findById(orderId)
      .populate('patientId', 'name firstName lastName email phone')
      .populate('doctorId', 'name firstName lastName email')
      .populate('prescriptionId')
      .populate('fulfilledBy', 'name firstName lastName');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (err: any) {
    console.error('[PHARMACY ORDER] Get order error:', err);
    res.status(500).json({ message: err.message || 'Failed to get order' });
  }
});

export default pharmacyOrdersRouter;

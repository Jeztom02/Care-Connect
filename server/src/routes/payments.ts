import express, { Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Prescription } from '../models';
import { Medicine } from '../models/medicine';
import { MedicinePayment } from '../models/medicinePayment';

const router = express.Router();

// Patient pays for prescribed medicines
router.post('/medicines', authenticateJwt, authorizeRoles('patient'), async (req: Request, res: Response) => {
  try {
    const { prescriptionId, paymentMethod } = req.body ?? {};
    if (!prescriptionId) return res.status(400).json({ message: 'prescriptionId is required' });

    const rx = await Prescription.findById(prescriptionId);
    if (!rx) return res.status(404).json({ message: 'Prescription not found' });
    if (String(rx.patientId) !== String(req.user!.sub)) return res.status(403).json({ message: 'Not authorized to pay for this prescription' });

    // Calculate amount from medicines referenced in items
    let amount = 0;
    for (const it of rx.items || []) {
      const medRef = String(it.medication || '');
      if (medRef.match(/^[0-9a-fA-F]{24}$/)) {
        const med = await Medicine.findById(medRef);
        if (med) amount += Number(med.price || 0);
      }
    }

    const payment = await MedicinePayment.create({ prescriptionId, patientId: req.user!.sub, amount, paymentMethod, status: 'Completed' });

    // Optionally update prescription with a note about payment (non-invasive)
    rx.notes = (rx.notes || '') + `\n[Payment] ${amount} paid via ${paymentMethod || 'unknown'} on ${new Date().toISOString()}`;
    await rx.save();

    res.status(201).json({ payment });
  } catch (err) {
    console.error('Medicine payment error', err);
    res.status(500).json({ message: 'Failed to process payment' });
  }
});

export const paymentsRouter = router;

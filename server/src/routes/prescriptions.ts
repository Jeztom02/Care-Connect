import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Prescription, Patient, User } from '../models';

export const prescriptionsRouter = Router();
prescriptionsRouter.use(authenticateJwt);

// List all prescriptions (staff)
prescriptionsRouter.get('/', authorizeRoles('doctor', 'nurse', 'admin'), async (_req: Request, res: Response) => {
  const items = await Prescription.find().sort({ createdAt: -1 });
  res.json(items);
});

// Get prescriptions for a patient
prescriptionsRouter.get('/:patientId', authorizeRoles('doctor', 'nurse', 'admin', 'patient', 'family'), async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const items = await Prescription.find({ patientId }).sort({ createdAt: -1 });
  res.json(items);
});

// Create a prescription (doctor/admin)
prescriptionsRouter.post('/', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const { patientId, appointmentId, medication, dosage, frequency, duration, notes, startDate, endDate, status, items } = req.body ?? {};
    // Log incoming payload (without sensitive data)
    // eslint-disable-next-line no-console
    console.log('[RX][CREATE] Incoming', {
      userId: req.user?.sub,
      role: req.user?.role,
      patientId: String(patientId || ''),
      medication: String(medication || ''),
      dosage: String(dosage || ''),
      frequency: String(frequency || ''),
      hasStartDate: !!startDate,
      hasEndDate: !!endDate
    });

    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required' });
    }
    const itemsArray = Array.isArray(items) ? items : [];
    const usingItems = itemsArray.length > 0;
    if (!usingItems && (!medication || !dosage || !frequency)) {
      return res.status(400).json({ message: 'Either items[] or medication, dosage, frequency are required' });
    }
    if (usingItems) {
      for (const it of itemsArray) {
        if (!it?.medication || !it?.dosage || !it?.frequency) {
          return res.status(400).json({ message: 'Each item requires medication, dosage, frequency' });
        }
      }
    }

    // Validate references exist
    const [patientExists, doctorExists] = await Promise.all([
      Patient.exists({ _id: patientId }),
      User.exists({ _id: req.user!.sub, role: { $in: ['doctor', 'admin'] } })
    ]);
    if (!patientExists) {
      return res.status(400).json({ message: 'Invalid patientId' });
    }
    if (!doctorExists) {
      return res.status(403).json({ message: 'Doctor not authorized' });
    }

    const created = await Prescription.create({
      patientId,
      doctorId: req.user!.sub,
      appointmentId,
      medication: usingItems ? undefined : medication,
      dosage: usingItems ? undefined : dosage,
      frequency: usingItems ? undefined : frequency,
      duration,
      notes,
      items: usingItems ? itemsArray.map((it: any) => ({
        medication: String(it.medication),
        dosage: String(it.dosage),
        frequency: String(it.frequency),
        duration: it.duration ? String(it.duration) : undefined,
        instructions: it.instructions ? String(it.instructions) : undefined,
        refillsRemaining: typeof it.refillsRemaining === 'number' ? Math.max(0, it.refillsRemaining) : undefined,
        status: it.status || 'Active',
      })) : undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    });
    // eslint-disable-next-line no-console
    console.log('[RX][CREATE] Success', { id: String(created._id), patientId: String(created.patientId), doctorId: String(created.doctorId) });
    return res.status(201).json(created);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[RX][CREATE] Error', err);
    const msg = (err as any)?.message || 'Failed to create prescription';
    return res.status(500).json({ message: msg });
  }
});

// Update prescription (doctor/admin)
prescriptionsRouter.put('/:id', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  const { medication, dosage, frequency, duration, notes, startDate, endDate, status, items } = req.body ?? {};
  const update: any = { duration, notes, status };
  if (startDate) update.startDate = new Date(startDate);
  if (endDate) update.endDate = new Date(endDate);
  if (items) update.items = items;
  if (medication) update.medication = medication;
  if (dosage) update.dosage = dosage;
  if (frequency) update.frequency = frequency;
  let updated;
  try {
    updated = await Prescription.findByIdAndUpdate(req.params.id, update, { new: true });
  } catch (err) {
    const msg = (err as any)?.message || 'Failed to update prescription';
    return res.status(500).json({ message: msg });
  }
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

// Get prescription by id (details)
prescriptionsRouter.get('/detail/:id', authorizeRoles('doctor', 'nurse', 'admin', 'patient', 'family'), async (req: Request, res: Response) => {
  const doc = await Prescription.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

// Request refill: decrement refillsRemaining for item or all items
prescriptionsRouter.post('/:id/request-refill', authorizeRoles('doctor', 'nurse', 'admin', 'patient'), async (req: Request, res: Response) => {
  const { itemIndex } = req.body ?? {};
  const rx = await Prescription.findById(req.params.id);
  if (!rx) return res.status(404).json({ message: 'Not found' });
  if (Array.isArray(rx.items) && rx.items.length > 0) {
    if (typeof itemIndex === 'number') {
      if (rx.items[itemIndex] && rx.items[itemIndex].refillsRemaining! > 0) {
        rx.items[itemIndex].refillsRemaining = Math.max(0, (rx.items[itemIndex].refillsRemaining as any) - 1) as any;
      }
    } else {
      rx.items = rx.items.map((it: any) => ({ ...it.toObject?.() || it, refillsRemaining: Math.max(0, Number(it.refillsRemaining || 0) - 1) }));
    }
  }
  await rx.save();
  res.json(rx);
});

// Modify dosage/frequency for an item
prescriptionsRouter.patch('/:id/items/:index/dosage', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  const { dosage, frequency } = req.body ?? {};
  const rx = await Prescription.findById(req.params.id);
  if (!rx) return res.status(404).json({ message: 'Not found' });
  const idx = Number(req.params.index);
  if (!Array.isArray(rx.items) || !rx.items[idx]) return res.status(400).json({ message: 'Invalid item index' });
  if (dosage) (rx.items[idx] as any).dosage = String(dosage);
  if (frequency) (rx.items[idx] as any).frequency = String(frequency);
  await rx.save();
  res.json(rx);
});

// Discontinue an item; if all discontinued, mark prescription as Discontinued
prescriptionsRouter.post('/:id/items/:index/discontinue', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  const rx = await Prescription.findById(req.params.id);
  if (!rx) return res.status(404).json({ message: 'Not found' });
  const idx = Number(req.params.index);
  if (!Array.isArray(rx.items) || !rx.items[idx]) return res.status(400).json({ message: 'Invalid item index' });
  (rx.items[idx] as any).status = 'Discontinued';
  const allDisc = rx.items.every((it: any) => String(it.status) === 'Discontinued');
  if (allDisc) rx.status = 'Discontinued' as any;
  await rx.save();
  res.json(rx);
});

// Delete prescription (admin)
prescriptionsRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const deleted = await Prescription.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

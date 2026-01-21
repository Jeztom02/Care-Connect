import express, { Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Medicine } from '../models/medicine';

const router = express.Router();

// Add medicine (Pharmacy only)
router.post('/medicines', authenticateJwt, authorizeRoles('pharmacy'), async (req: Request, res: Response) => {
  try {
    const { name, description, sku, price, stock, unit } = req.body ?? {};
    if (!name) return res.status(400).json({ message: 'name is required' });
    const created = await Medicine.create({ name, description, sku, price: Number(price || 0), stock: Number(stock || 0), unit, pharmacyId: req.user!.sub });
    res.status(201).json(created);
  } catch (err) {
    console.error('Add medicine error', err);
    res.status(500).json({ message: 'Failed to add medicine' });
  }
});

// Update medicine (Pharmacy only)
router.put('/medicines/:id', authenticateJwt, authorizeRoles('pharmacy'), async (req: Request, res: Response) => {
  try {
    const updated = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Medicine not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update medicine error', err);
    res.status(500).json({ message: 'Failed to update medicine' });
  }
});

// Delete medicine (Pharmacy only)
router.delete('/medicines/:id', authenticateJwt, authorizeRoles('pharmacy'), async (req: Request, res: Response) => {
  try {
    const deleted = await Medicine.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Medicine not found' });
    res.status(204).end();
  } catch (err) {
    console.error('Delete medicine error', err);
    res.status(500).json({ message: 'Failed to delete medicine' });
  }
});

// List medicines (Doctor, Nurse, Patient)
router.get('/medicines', authenticateJwt, authorizeRoles('doctor','nurse','patient','admin'), async (req: Request, res: Response) => {
  try {
    const items = await Medicine.find().sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list medicines' });
  }
});

export const pharmacyRouter = router;

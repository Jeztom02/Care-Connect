import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Round } from '../models';

export const roundsRouter = Router();
roundsRouter.use(authenticateJwt);

// List rounds
roundsRouter.get('/', authorizeRoles('nurse', 'doctor', 'admin'), async (req: Request, res: Response) => {
  const user = req.user!;
  let items;
  if (user.role === 'nurse') {
    items = await Round.find({ nurseId: user.sub }).populate('patientId nurseId').sort({ scheduledAt: -1 });
  } else {
    items = await Round.find().populate('patientId nurseId').sort({ scheduledAt: -1 });
  }
  res.json(items);
});

// List rounds for a patient
roundsRouter.get('/patient/:patientId', authorizeRoles('nurse', 'doctor', 'admin'), async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const items = await Round.find({ patientId }).populate('patientId nurseId').sort({ scheduledAt: -1 });
  res.json(items);
});

// Create a round (nurse/admin)
roundsRouter.post('/', authorizeRoles('nurse', 'admin'), async (req: Request, res: Response) => {
  const { patientId, scheduledAt, notes, status } = req.body ?? {};
  if (!patientId || !scheduledAt) return res.status(400).json({ message: 'patientId and scheduledAt are required' });
  const created = await Round.create({
    patientId,
    nurseId: req.user!.sub,
    scheduledAt: new Date(scheduledAt),
    notes,
    status,
  });
  res.status(201).json(created);
});

// Update a round (nurse/admin)
roundsRouter.put('/:id', authorizeRoles('nurse', 'admin'), async (req: Request, res: Response) => {
  const { scheduledAt, completedAt, notes, status } = req.body ?? {};
  const updated = await Round.findByIdAndUpdate(
    req.params.id,
    {
      scheduledAt: scheduledAt && new Date(scheduledAt),
      completedAt: completedAt && new Date(completedAt),
      notes,
      status,
    },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

// Delete a round (admin)
roundsRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const deleted = await Round.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

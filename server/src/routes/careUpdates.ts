import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { CareUpdate, Patient } from '../models';

export const careUpdatesRouter = Router();
careUpdatesRouter.use(authenticateJwt);

// Get care updates
careUpdatesRouter.get('/', async (req: Request, res: Response) => {
  const user = req.user!;
  
  try {
    let updates;
    
    if (user.role === 'admin' || user.role === 'doctor' || user.role === 'nurse') {
      // Medical staff can see all care updates
      updates = await CareUpdate.find()
        .populate('patientId', 'name status')
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 });
    } else if (user.role === 'family') {
      // Family members can see care updates for their associated patients
      updates = await CareUpdate.find()
        .populate('patientId', 'name status')
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(updates);
  } catch (error) {
    console.error('Error fetching care updates:', error);
    res.status(500).json({ message: 'Failed to fetch care updates' });
  }
});

// Get care updates for a specific patient
careUpdatesRouter.get('/patient/:patientId', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const updates = await CareUpdate.find({ patientId })
      .populate('patientId', 'name status')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    
    res.json(updates);
  } catch (error) {
    console.error('Error fetching patient care updates:', error);
    res.status(500).json({ message: 'Failed to fetch care updates' });
  }
});

// Create new care update (medical staff only)
careUpdatesRouter.post('/', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const user = req.user!;
  const { patientId, type, title, description, status, scheduledAt } = req.body;
  
  if (!patientId || !type || !title || !description) {
    return res.status(400).json({ message: 'patientId, type, title, and description are required' });
  }
  
  try {
    const update = await CareUpdate.create({
      patientId,
      type,
      title,
      description,
      status: status || 'Scheduled',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdBy: user.sub
    });
    
    const populatedUpdate = await CareUpdate.findById(update._id)
      .populate('patientId', 'name status')
      .populate('createdBy', 'name role');
    
    res.status(201).json(populatedUpdate);
  } catch (error) {
    console.error('Error creating care update:', error);
    res.status(500).json({ message: 'Failed to create care update' });
  }
});

// Update care update status
careUpdatesRouter.put('/:id', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, completedAt } = req.body;
  
  try {
    const updateData: any = { status };
    if (status === 'Completed' && !completedAt) {
      updateData.completedAt = new Date();
    }
    
    const updated = await CareUpdate.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('patientId', 'name status').populate('createdBy', 'name role');
    
    if (!updated) {
      return res.status(404).json({ message: 'Care update not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating care update:', error);
    res.status(500).json({ message: 'Failed to update care update' });
  }
});

// Delete care update
careUpdatesRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const deleted = await CareUpdate.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Care update not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting care update:', error);
    res.status(500).json({ message: 'Failed to delete care update' });
  }
});











import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { PatientStatus, Patient } from '../models';

export const patientStatusRouter = Router();
patientStatusRouter.use(authenticateJwt);

// Get patient status (for family members and medical staff)
patientStatusRouter.get('/', async (req: Request, res: Response) => {
  const user = req.user!;
  
  try {
    let statuses;
    
    if (user.role === 'admin' || user.role === 'doctor' || user.role === 'nurse') {
      // Medical staff can see all patient statuses
      statuses = await PatientStatus.find()
        .populate('patientId', 'name status')
        .populate('recordedBy', 'name role')
        .sort({ createdAt: -1 });
    } else if (user.role === 'family') {
      // Family members can see statuses for their associated patients
      // For now, showing all - in real app, you'd filter by family-patient relationship
      statuses = await PatientStatus.find()
        .populate('patientId', 'name status')
        .populate('recordedBy', 'name role')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching patient status:', error);
    res.status(500).json({ message: 'Failed to fetch patient status' });
  }
});

// Get latest status for a specific patient
patientStatusRouter.get('/patient/:patientId', async (req: Request, res: Response) => {
  const user = req.user!;
  const { patientId } = req.params;
  
  try {
    const status = await PatientStatus.findOne({ patientId })
      .populate('patientId', 'name status')
      .populate('recordedBy', 'name role')
      .sort({ createdAt: -1 });
    
    if (!status) {
      return res.status(404).json({ message: 'No status found for this patient' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching patient status:', error);
    res.status(500).json({ message: 'Failed to fetch patient status' });
  }
});

// Create new patient status (medical staff only)
patientStatusRouter.post('/', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const user = req.user!;
  const { patientId, vitals, condition, notes } = req.body;
  
  if (!patientId) {
    return res.status(400).json({ message: 'patientId is required' });
  }
  
  try {
    const status = await PatientStatus.create({
      patientId,
      vitals,
      condition: condition || 'Stable',
      notes,
      recordedBy: user.sub
    });
    
    const populatedStatus = await PatientStatus.findById(status._id)
      .populate('patientId', 'name status')
      .populate('recordedBy', 'name role');
    
    res.status(201).json(populatedStatus);
  } catch (error) {
    console.error('Error creating patient status:', error);
    res.status(500).json({ message: 'Failed to create patient status' });
  }
});

// Update patient status
patientStatusRouter.put('/:id', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { vitals, condition, notes } = req.body;
  
  try {
    const updated = await PatientStatus.findByIdAndUpdate(
      id,
      { vitals, condition, notes },
      { new: true }
    ).populate('patientId', 'name status').populate('recordedBy', 'name role');
    
    if (!updated) {
      return res.status(404).json({ message: 'Status not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating patient status:', error);
    res.status(500).json({ message: 'Failed to update patient status' });
  }
});











import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Medication, Patient } from '../models';

export const medicationsRouter = Router();
medicationsRouter.use(authenticateJwt);

// Get medications
medicationsRouter.get('/', async (req: Request, res: Response) => {
  const user = req.user!;
  
  try {
    let medications;
    
    if (user.role === 'admin' || user.role === 'doctor' || user.role === 'nurse') {
      // Medical staff can see all medications
      medications = await Medication.find()
        .populate('patientId', 'name status')
        .populate('prescribedBy', 'name role')
        .sort({ createdAt: -1 });
    } else if (user.role === 'patient') {
      // Patients can see their own medications
      medications = await Medication.find({ patientId: user.sub })
        .populate('patientId', 'name status')
        .populate('prescribedBy', 'name role')
        .sort({ createdAt: -1 });
    } else if (user.role === 'family') {
      // Family members can see medications for their associated patients
      medications = await Medication.find()
        .populate('patientId', 'name status')
        .populate('prescribedBy', 'name role')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ message: 'Failed to fetch medications' });
  }
});

// Get medications for a specific patient
medicationsRouter.get('/patient/:patientId', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  
  try {
    const medications = await Medication.find({ patientId })
      .populate('patientId', 'name status')
      .populate('prescribedBy', 'name role')
      .sort({ createdAt: -1 });
    
    res.json(medications);
  } catch (error) {
    console.error('Error fetching patient medications:', error);
    res.status(500).json({ message: 'Failed to fetch medications' });
  }
});

// Create new medication (medical staff only)
medicationsRouter.post('/', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const user = req.user!;
  const { patientId, name, dosage, frequency, startDate, endDate, instructions } = req.body;
  
  if (!patientId || !name || !dosage || !frequency || !startDate) {
    return res.status(400).json({ message: 'patientId, name, dosage, frequency, and startDate are required' });
  }
  
  try {
    const medication = await Medication.create({
      patientId,
      name,
      dosage,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      instructions,
      prescribedBy: user.sub
    });
    
    const populatedMedication = await Medication.findById(medication._id)
      .populate('patientId', 'name status')
      .populate('prescribedBy', 'name role');
    
    res.status(201).json(populatedMedication);
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ message: 'Failed to create medication' });
  }
});

// Update medication
medicationsRouter.put('/:id', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, dosage, frequency, endDate, instructions, status } = req.body;
  
  try {
    const updateData: any = { name, dosage, frequency, instructions, status };
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }
    
    const updated = await Medication.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('patientId', 'name status').populate('prescribedBy', 'name role');
    
    if (!updated) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ message: 'Failed to update medication' });
  }
});

// Delete medication
medicationsRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const deleted = await Medication.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ message: 'Failed to delete medication' });
  }
});











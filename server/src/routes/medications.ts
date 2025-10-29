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
// Get medication statistics
medicationsRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = {
      total: await Medication.countDocuments(),
      takenToday: await Medication.countDocuments({
        status: 'taken',
        'lastTaken': {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      pending: await Medication.countDocuments({ status: 'pending' }),
      asNeeded: await Medication.countDocuments({ status: 'as_needed' }),
      remindersSet: await Medication.countDocuments({ isReminderSet: true })
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching medication stats:', error);
    res.status(500).json({ message: 'Failed to fetch medication statistics' });
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
medicationsRouter.delete('/:id', authorizeRoles('admin', 'doctor', 'nurse'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  
  try {
    // For non-admin users, verify they have permission to delete this medication
    if (user.role !== 'admin') {
      const medication = await Medication.findById(id);
      if (!medication) {
        return res.status(404).json({ message: 'Medication not found' });
      }
      
      // Check if the user is the one who prescribed the medication
      if (medication.prescribedBy && medication.prescribedBy.toString() !== user.sub) {
        return res.status(403).json({ message: 'You can only delete medications you prescribed' });
      }
    }
    
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

// Toggle medication reminder
medicationsRouter.patch('/:id/reminder', authenticateJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isReminderSet, reminderTime } = req.body;
  const user = req.user!;
  
  try {
    const updateData: any = { 
      isReminderSet,
      ...(reminderTime && { reminderTime })
    };
    
    // For non-admin users, verify they have permission to update this medication
    if (user.role !== 'admin') {
      const medication = await Medication.findById(id);
      if (!medication) {
        return res.status(404).json({ message: 'Medication not found' });
      }
      
      // Patients can only update their own medication reminders
      if (user.role === 'patient' && medication.patientId.toString() !== user.sub) {
        return res.status(403).json({ message: 'You can only update your own medication reminders' });
      }
      
      // Medical staff can update reminders for medications they prescribed
      if ((user.role === 'doctor' || user.role === 'nurse') && 
          medication.prescribedBy && medication.prescribedBy.toString() !== user.sub) {
        return res.status(403).json({ message: 'You can only update reminders for medications you prescribed' });
      }
    }
    
    const updated = await Medication.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('patientId', 'name status').populate('prescribedBy', 'name role');
    
    if (!updated) {
      return res.status(404).json({ message: 'Medication not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating medication reminder:', error);
    res.status(500).json({ message: 'Failed to update medication reminder' });
  }
});











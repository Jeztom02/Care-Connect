import express, { Request, Response, NextFunction } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Patient, Round, MedicalRecord, Prescription } from '../models';
import { UserRole, JwtPayload } from '../types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

const router = express.Router();

// Get nurse's assigned patients
// Get nurse's assigned patients
router.get('/patients', authenticateJwt, authorizeRoles('nurse'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const patients = await Patient.find({ assignedNurseId: req.user.sub })
      .populate('assignedDoctorId', 'name')
      .lean();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching nurse patients:', error);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
});

// Record patient vitals
router.post('/patients/:patientId/vitals', authenticateJwt, authorizeRoles('nurse'), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { patientId } = req.params;
    const { bloodPressure, temperature, pulse, oxygenLevel, notes } = req.body;

    const medicalRecord = new MedicalRecord({
      patientId,
      createdBy: req.user.sub,
      title: 'Vital Signs',
      type: 'Assessment',
      summary: 'Routine vital signs check',
      vitals: {
        bloodPressure,
        temperature,
        pulse,
        oxygenLevel,
        recordedAt: new Date(),
        notes
      },
      status: 'Final'
    });

    await medicalRecord.save();
    
    // Update patient's last vital check
    await Patient.findByIdAndUpdate(patientId, { lastVitalCheck: new Date() });

    res.status(201).json(medicalRecord);
  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({ message: 'Failed to record vitals' });
  }
});

// Get nurse's schedule
router.get('/schedule', authenticateJwt, authorizeRoles('nurse'), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const schedule = await Round.find({
      nurseId: req.user.sub,
      scheduledAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('patientId', 'name roomNumber');

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching nurse schedule:', error);
    res.status(500).json({ message: 'Failed to fetch schedule' });
  }
});

// Update round status
router.patch('/rounds/:roundId', authenticateJwt, authorizeRoles('nurse'), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { roundId } = req.params;
    const { status, notes } = req.body;

    const round = await Round.findByIdAndUpdate(
      roundId,
      { 
        status,
        ...(notes && { notes }),
        ...(status === 'Completed' && { completedAt: new Date() })
      },
      { new: true }
    );

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    res.json(round);
  } catch (error) {
    console.error('Error updating round:', error);
    res.status(500).json({ message: 'Failed to update round' });
  }
});

// Get patient medications
router.get('/patients/:patientId/medications', authenticateJwt, authorizeRoles('nurse'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const medications = await Prescription.find({ 
      patientId,
      status: 'Active'
    }).populate('doctorId', 'name');

    res.json(medications);
  } catch (error) {
    console.error('Error fetching patient medications:', error);
    res.status(500).json({ message: 'Failed to fetch medications' });
  }
});

// Record medication administration
router.post('/medications/record', authenticateJwt, authorizeRoles('nurse'), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const { prescriptionId, patientId, medication, dosage, time, notes } = req.body;
    
    const medicalRecord = new MedicalRecord({
      patientId,
      createdBy: req.user.sub,
      title: 'Medication Administration',
      type: 'Medication',
      summary: `Administered ${dosage} of ${medication}`,
      medication: {
        prescriptionId,
        medication,
        dosage,
        administeredAt: time || new Date(),
        notes,
administeredBy: req.user.sub
      },
      status: 'Final'
    });

    await medicalRecord.save();
    res.status(201).json(medicalRecord);
  } catch (error) {
    console.error('Error recording medication:', error);
    res.status(500).json({ message: 'Failed to record medication administration' });
  }
});

export default router;

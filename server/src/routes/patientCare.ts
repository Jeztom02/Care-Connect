import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Patient } from '../models/patient';
import { PatientNote } from '../models/patientNote';
import { PatientVital } from '../models/patientVital';
import { EmergencyAlert } from '../models/emergencyAlert';
import { JwtPayload, UserRole } from '../types';

// Extend the Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & {
    name: string; // Add name to the user object
  };
}

const router = Router();

// Middleware to ensure user is authenticated and has the right role
router.use(authenticateJwt);

// Add clinical note for a patient
router.post('/:patientId/notes', authorizeRoles('doctor', 'nurse'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { patientId } = req.params;
    const { content } = req.body;
    const userId = req.user.sub;

    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const note = new PatientNote({
      patientId,
      content,
      createdBy: userId,
    });

    await note.save();
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').to(`patient_${patientId}`).emit('new_note', {
        ...note.toObject(),
        createdBy: { 
          _id: req.user!.sub, 
          name: req.user!.name || 'Unknown User',
          role: req.user!.role 
        }
      });
    }

    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding patient note:', error);
    res.status(500).json({ message: 'Failed to add patient note' });
  }
});

// Record patient vitals
router.post('/:patientId/vitals', authorizeRoles('doctor', 'nurse'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { patientId } = req.params;
    const { 
      bloodPressure,
      heartRate,
      temperature,
      oxygenSaturation,
      respiratoryRate,
      notes
    } = req.body;

    const userId = req.user.sub;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const vital = new PatientVital({
      patientId,
      bloodPressure,
      heartRate: Number(heartRate),
      temperature: Number(temperature),
      oxygenSaturation: Number(oxygenSaturation),
      respiratoryRate: Number(respiratoryRate),
      notes,
      recordedBy: userId,
    });

    await vital.save();
    
    // Update patient's lastVitals field
    if (vital._id) {
      patient.lastVitals = vital._id as unknown as mongoose.Types.ObjectId;
      await patient.save();
    }
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').to(`patient_${patientId}`).emit('vitals_updated', {
        ...vital.toObject(),
        recordedBy: { 
          _id: req.user!.sub, 
          name: (req.user as any).name || 'Unknown User',
          role: req.user!.role 
        }
      });
    }

    res.status(201).json(vital);
  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({ message: 'Failed to record vitals' });
  }
});

// Create emergency alert
router.post('/:patientId/alerts', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { patientId } = req.params;
    const { priority, details, status } = req.body;
    const userId = req.user.sub;

    if (!priority || !details) {
      return res.status(400).json({ message: 'Priority and details are required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const alert = new EmergencyAlert({
      patientId,
      priority,
      details,
      status: 'active',
      createdBy: userId,
    });

    if (status === 'acknowledged') {
      (alert as any).acknowledgedBy = new mongoose.Types.ObjectId(req.user!.sub);
      (alert as any).acknowledgedAt = new Date();
    }

    await alert.save();
    
    // Emit socket event for real-time updates to all connected staff
    const io = req.app.get('io');
    io.to('staff').emit('emergency_alert', {
      ...alert.toObject(),
      patient: { _id: patient._id, name: patient.name, roomNumber: patient.roomNumber },
      createdBy: { _id: req.user!.sub, name: req.user!.name, role: req.user!.role }
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({ message: 'Failed to create emergency alert' });
  }
});

// Get patient notes
router.get('/:patientId/notes', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const notes = await PatientNote.find({ patientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name role');

    const total = await PatientNote.countDocuments({ patientId });

    res.json({
      data: notes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching patient notes:', error);
    res.status(500).json({ message: 'Failed to fetch patient notes' });
  }
});

// Get patient vitals history
router.get('/:patientId/vitals', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { limit = '10' } = req.query;
    
    const vitals = await PatientVital.find({ patientId })
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit as string))
      .populate('recordedBy', 'name role');

    res.json(vitals);
  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    res.status(500).json({ message: 'Failed to fetch patient vitals' });
  }
});

export const patientCareRouter = router;

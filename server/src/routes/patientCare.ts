import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Patient } from '../models/patient';
import { PatientNote } from '../models/patientNote';
import { PatientVital } from '../models/patientVital';
import { EmergencyAlert } from '../models/emergencyAlert';
import { JwtPayload, UserRole } from '../types';
import { getRoleRoom } from '../types/socket';

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

// List emergency alerts for a patient (optionally filter by status)
router.get('/:patientId/alerts', authorizeRoles('doctor', 'nurse', 'admin', 'patient'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query as { status?: string };

    // If patient user, ensure they can only access their own alerts
    if (req.user?.role === 'patient' && req.user.sub !== patientId) {
      return res.status(403).json({ message: 'You can only view your own alerts' });
    }

    const filter: any = { patientId };
    if (status) {
      const allowed = ['active', 'acknowledged', 'resolved'];
      if (!allowed.includes(String(status))) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filter.status = status;
    }

    const alerts = await EmergencyAlert.find(filter)
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching emergency alerts:', error);
    res.status(500).json({ message: 'Failed to fetch emergency alerts' });
  }
});
    }
    
    const { patientId } = req.params;
    const { 
      content,  // This is the note content
      title,    // Optional title
      category = 'general', // Default to 'general' if not provided
      priority = 'medium',  // Default to 'medium' if not provided
      isFlagged = false,    // Default to false if not provided
      tags = []             // Default to empty array if not provided
    } = req.body;
    
    const userId = req.user.sub;

    if (!content) {
      return res.status(400).json({ 
        success: false,
        message: 'Note content is required',
        field: 'content'
      });
    }

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    // Create the note with all required fields
    const note = new PatientNote({
      patientId,
      content,
      title,
      category,
      priority,
      isFlagged,
      tags,
      createdBy: userId,
      createdByRole: req.user.role,
      status: 'active'
    });

    // Save the note
    await note.save();
    
    // Emit socket event for real-time updates
    if (req.app.get('io')) {
      req.app.get('io').to(`patient_${patientId}`).emit('new_note', {
        ...note.toObject(),
        createdBy: { 
          _id: userId, 
          name: req.user.name || 'Unknown User',
          role: req.user.role 
        }
      });
    }

    // Populate the createdBy field for the response
    const populatedNote = await PatientNote.findById(note._id).populate('createdBy', 'name role');
    
    res.status(201).json({
      success: true,
      data: populatedNote
    });
  } catch (error) {
    console.error('Error adding patient note:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A note with similar content already exists for this patient'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to add patient note',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    // Input validation
    if (!bloodPressure || !heartRate || temperature === undefined || oxygenSaturation === undefined || respiratoryRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['bloodPressure', 'heartRate', 'temperature', 'oxygenSaturation', 'respiratoryRate']
      });
    }

    const userId = req.user.sub;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ 
        success: false,
        message: 'Patient not found' 
      });
    }

    // Determine severity based on vitals
    let severity: 'normal' | 'warning' | 'critical' = 'normal';
    const hr = Number(heartRate);
    const temp = Number(temperature);
    const spo2 = Number(oxygenSaturation);
    const rr = Number(respiratoryRate);
    
    if (hr < 50 || hr > 120 || temp < 36 || temp > 38.5 || spo2 < 92 || rr < 12 || rr > 20) {
      severity = 'warning';
    }
    if (hr < 40 || hr > 140 || temp < 35 || temp > 40 || spo2 < 88 || rr < 8 || rr > 30) {
      severity = 'critical';
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const vital = new PatientVital({
        patientId,
        bloodPressure: String(bloodPressure).trim(),
        heartRate: hr,
        temperature: temp,
        oxygenSaturation: spo2,
        respiratoryRate: rr,
        notes: notes?.trim(),
        recordedBy: userId,
        recordedByRole: req.user.role,
        severity,
        status: 'new'
      });

      await vital.save({ session });
      
      // Update patient's lastVitals field
      if (vital._id) {
        patient.lastVitals = vital._id as unknown as mongoose.Types.ObjectId;
        patient.lastUpdatedBy = {
          userId: userId as unknown as mongoose.Types.ObjectId,
          role: req.user.role,
          timestamp: new Date()
        };
        await patient.save({ session });
      }
      
      await session.commitTransaction();
      session.endSession();
      
      // Emit socket event for real-time updates
      if (req.app.get('io')) {
        req.app.get('io').to(`patient_${patientId}`).emit('vitals_updated', {
          ...vital.toObject(),
          recordedBy: { 
            _id: req.user.sub, 
            name: (req.user as any).name || 'Unknown User',
            role: req.user.role 
          }
        });
      }

      // Populate the recordedBy field for the response
      const populatedVital = await PatientVital.findById(vital._id)
        .populate('recordedBy', 'name role');
      
      res.status(201).json({
        success: true,
        data: populatedVital
      });
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error recording vitals:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to record vitals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create emergency alert
router.post('/:patientId/alerts', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { patientId } = req.params;
    const { priority, details } = req.body;
    const userId = req.user.sub;

    if (!priority || !details) {
      return res.status(400).json({ message: 'Priority and details are required' });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ 
        message: 'Invalid priority. Must be one of: low, medium, high' 
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId).session(session);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create the alert (schema requires title and createdBy object)
    const alert = new EmergencyAlert({
      patientId: patient._id,
      title: `${priority.charAt(0).toUpperCase()}${priority.slice(1)} Priority Emergency Alert`,
      priority,
      details: details.trim(),
      status: 'active',
      createdBy: {
        userId: userId as unknown as mongoose.Types.ObjectId,
        role: req.user.role,
        name: req.user.name || 'Unknown User'
      }
    });

    await alert.save({ session });
    
    // Persist patient (optional further updates can be added here)
    await patient.save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Emit socket event for real-time updates to medical staff (admin/doctor/nurse)
    const io = req.app.get('io');
    if (io) {
      const payload = {
        ...alert.toObject(),
        patient: { 
          _id: patient._id, 
          name: patient.name, 
          roomNumber: patient.roomNumber 
        },
        createdBy: { 
          _id: req.user.sub, 
          name: req.user.name || 'Unknown User', 
          role: req.user.role 
        }
      };
      io.to(getRoleRoom('admin')).emit('emergency_alert', payload);
      io.to(getRoleRoom('doctor')).emit('emergency_alert', payload);
      io.to(getRoleRoom('nurse')).emit('emergency_alert', payload);
    }

    res.status(201).json({
      ...alert.toObject(),
      patient: {
        _id: patient._id,
        name: patient.name,
        roomNumber: patient.roomNumber
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating emergency alert:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create emergency alert',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
router.get('/:patientId/vitals', authorizeRoles('doctor', 'nurse', 'admin', 'patient'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { limit = '10' } = req.query;
    const userId = req.user?.sub;

    // If the user is a patient, ensure they can only access their own vitals
    if (req.user?.role === 'patient' && userId !== patientId) {
      return res.status(403).json({ message: 'You can only view your own vitals' });
    }
    
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

// List recent emergency alerts (staff-wide)
router.get('/alerts', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { status, limit = '20' } = req.query as { status?: string; limit?: string };
    const filter: any = {};
    if (status) {
      const allowed = ['active', 'acknowledged', 'resolved'];
      if (!allowed.includes(String(status))) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filter.status = status;
    }

    const items = await EmergencyAlert.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(100, parseInt(String(limit)) || 20)))
      .populate('patientId', 'name roomNumber');

    res.json(items);
  } catch (error) {
    console.error('Error fetching recent emergency alerts:', error);
    res.status(500).json({ message: 'Failed to fetch emergency alerts' });
  }
});

export const patientCareRouter = router;

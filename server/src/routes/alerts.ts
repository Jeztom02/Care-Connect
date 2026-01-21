import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Alert, AIClassification } from '../models';
import { classifyAlertPriority } from '../services/bayes';

export const alertsRouter = Router();
alertsRouter.use(authenticateJwt);

alertsRouter.get('/', async (req: Request, res: Response) => {
  const user = req.user!;
  const { status } = req.query;
  
  let query: any = {};
  
  // Filter by status if provided
  if (status) {
    query.status = status;
  }
  
  let items;
  
  if (user.role === 'admin' || user.role === 'doctor' || user.role === 'nurse') {
    // Medical staff can see all alerts
    items = await Alert.find(query).populate('createdByUserId', 'name email').sort({ createdAt: -1 });
  } else if (user.role === 'patient' || user.role === 'family') {
    // Patients and family can see alerts related to them
    // For now, we'll show all alerts - in a real app, you'd filter by patient association
    items = await Alert.find(query).populate('createdByUserId', 'name email').sort({ createdAt: -1 });
  } else {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.json(items);
});

alertsRouter.post('/', authorizeRoles('admin', 'doctor'), async (req: Request, res: Response) => {
  const user = req.user!;
  const { title, message, patientId, status } = req.body ?? {};
  if (!title || !message) return res.status(400).json({ message: 'title and message required' });
  const created = await Alert.create({ title, message, patientId, status, createdByUserId: user.sub });
  res.status(201).json(created);
});

alertsRouter.post('/classify-priority', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  const { title, message, patientId, userSelection } = req.body ?? {};
  console.log('[AI Classification] Request received:', { title, message, userSelection, patientId });
  
  const result = classifyAlertPriority({ title, message });
  console.log('[AI Classification] Result:', result);
  
  // Save AI classification for tracking
  try {
    const classification = await AIClassification.create({
      type: 'alert_priority',
      inputText: { title, message },
      aiPrediction: {
        label: result.label,
        confidence: Math.round(result.scores[result.label] * 100),
        scores: result.scores
      },
      userSelection,
      patientId,
      userId: req.user!.sub,
      outcome: 'pending'
    });
    console.log('[AI Classification] Saved to database:', classification._id);
  } catch (error) {
    console.error('[AI Classification] Failed to save:', error);
  }
  
  res.json(result);
});

// Get individual alert by ID
alertsRouter.get('/:id', async (req: Request, res: Response) => {
  const user = req.user!;
  
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('createdByUserId', 'name email role')
      .populate('patientId', 'name email');
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Check permissions
    if (user.role === 'patient' || user.role === 'family') {
      // In a real app, you'd check if the alert is related to the user
      // For now, we'll allow access
    }
    
    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Acknowledge an alert
alertsRouter.put('/:id/acknowledge', authorizeRoles('admin', 'doctor', 'nurse'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    if (!status || !['ACKNOWLEDGED', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be ACKNOWLEDGED or RESOLVED' });
    }
    
    const updated = await Alert.findByIdAndUpdate(
      req.params.id, 
      { 
        status,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user!.sub
      }, 
      { new: true }
    ).populate('createdByUserId', 'name email role');
    
    if (!updated) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

alertsRouter.put('/:id', authorizeRoles('admin', 'doctor'), async (req: Request, res: Response) => {
  const { title, message, patientId, status } = req.body ?? {};
  const updated = await Alert.findByIdAndUpdate(req.params.id, { title, message, patientId, status }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

alertsRouter.delete('/:id', authorizeRoles('admin'), async (req: Request, res: Response) => {
  const deleted = await Alert.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
});

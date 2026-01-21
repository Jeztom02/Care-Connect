import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { AIClassification } from '../models';
import { EmergencyAlert } from '../models/emergencyAlert';
import { Patient } from '../models/patient';

export const aiInsightsRouter = Router();
aiInsightsRouter.use(authenticateJwt);
aiInsightsRouter.use(authorizeRoles('admin', 'doctor', 'nurse'));

// Get AI insights and metrics
aiInsightsRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    console.log('[AI Insights] Fetching metrics...');
    
    // Get recent classifications
    const classifications = await AIClassification.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(String(limit)))
      .populate('userId', 'name role')
      .populate('patientId', 'name roomNumber');
    
    console.log('[AI Insights] Found classifications:', classifications.length);

    // Calculate metrics
    const total = await AIClassification.countDocuments();
    const withOutcome = classifications.filter(c => c.outcome !== 'pending');
    const correct = withOutcome.filter(c => c.outcome === 'correct').length;
    const accuracy = withOutcome.length > 0 ? (correct / withOutcome.length) * 100 : 0;
    
    const highConfidence = classifications.filter(c => c.aiPrediction.confidence >= 80);
    const highConfidenceCorrect = highConfidence.filter(c => c.outcome === 'correct').length;
    const highConfidenceAccuracy = highConfidence.length > 0 
      ? (highConfidenceCorrect / highConfidence.length) * 100 
      : 0;
    
    const disagreements = classifications.filter(c => 
      c.userSelection && c.userSelection.toLowerCase() !== c.aiPrediction.label.toLowerCase()
    );
    
    const avgConfidence = classifications.length > 0
      ? classifications.reduce((sum, c) => sum + c.aiPrediction.confidence, 0) / classifications.length
      : 0;

    // Get disagreements with patient info
    const disagreementDetails = await Promise.all(
      disagreements.slice(0, 20).map(async (d) => {
        let patientName = 'Unknown Patient';
        let roomNumber = undefined;
        
        if (d.patientId) {
          const patient = await Patient.findById(d.patientId).select('name roomNumber');
          if (patient) {
            patientName = patient.name;
            roomNumber = patient.roomNumber;
          }
        }
        
        return {
          alertId: d._id,
          patientName,
          roomNumber,
          nursePriority: d.userSelection,
          aiPriority: d.aiPrediction.label,
          aiConfidence: d.aiPrediction.confidence,
          details: d.inputText.message || d.inputText.title || '',
          createdAt: d.createdAt,
          outcome: d.outcome
        };
      })
    );

    res.json({
      metrics: {
        totalClassifications: total,
        accuracy: Math.round(accuracy * 10) / 10,
        highConfidenceCorrect: Math.round(highConfidenceAccuracy * 10) / 10,
        disagreements: disagreements.length,
        avgConfidence: Math.round(avgConfidence * 10) / 10
      },
      disagreements: disagreementDetails,
      recentClassifications: classifications.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({ message: 'Failed to fetch AI insights' });
  }
});

// Update classification outcome (for feedback loop)
aiInsightsRouter.put('/classification/:id/outcome', async (req: Request, res: Response) => {
  try {
    const { outcome } = req.body;
    
    if (!['correct', 'incorrect', 'pending'].includes(outcome)) {
      return res.status(400).json({ message: 'Invalid outcome value' });
    }
    
    const updated = await AIClassification.findByIdAndUpdate(
      req.params.id,
      { outcome },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Classification not found' });
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating classification outcome:', error);
    res.status(500).json({ message: 'Failed to update classification outcome' });
  }
});

export default aiInsightsRouter;

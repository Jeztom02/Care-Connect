import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Patient } from '../models/patient';
import { PatientVital } from '../models/patientVital';
import { carePathTree, dischargeReadinessTree, PatientFeatures } from '../services/decisionTree';

export const decisionTreeRouter = Router();
decisionTreeRouter.use(authenticateJwt);

/**
 * POST /api/decision-tree/patients/:id/care-path
 * Get care path recommendation for a patient
 */
decisionTreeRouter.post('/patients/:id/care-path', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[Decision Tree] Care path request for patient:', id);

    // Fetch patient data
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch latest vitals from PatientVital collection
    const latestVitals = await PatientVital.findOne({ patientId: id })
      .sort({ recordedAt: -1 })
      .limit(1);

    console.log('[Decision Tree] Patient data:', {
      name: patient.name,
      age: patient.age,
      latestVitals: latestVitals ? {
        heartRate: latestVitals.heartRate,
        bloodPressure: latestVitals.bloodPressure,
        temperature: latestVitals.temperature,
        oxygenSaturation: latestVitals.oxygenSaturation,
        respiratoryRate: latestVitals.respiratoryRate,
        recordedAt: latestVitals.recordedAt
      } : null
    });

    // Parse blood pressure (e.g., "120/80" -> systolic: 120, diastolic: 80)
    let bloodPressureSystolic = req.body.bloodPressureSystolic;
    let bloodPressureDiastolic = req.body.bloodPressureDiastolic;
    if (latestVitals?.bloodPressure) {
      const [systolic, diastolic] = latestVitals.bloodPressure.split('/').map(Number);
      bloodPressureSystolic = systolic || bloodPressureSystolic;
      bloodPressureDiastolic = diastolic || bloodPressureDiastolic;
    }

    // Extract features from latest vitals or request body
    const features: PatientFeatures = {
      age: patient.age || req.body.age || 0,
      heartRate: latestVitals?.heartRate || req.body.heartRate,
      bloodPressureSystolic: bloodPressureSystolic,
      bloodPressureDiastolic: bloodPressureDiastolic,
      temperature: latestVitals?.temperature || req.body.temperature,
      oxygenSaturation: latestVitals?.oxygenSaturation || req.body.oxygenSaturation,
      respiratoryRate: latestVitals?.respiratoryRate || req.body.respiratoryRate,
      painLevel: req.body.painLevel,
      mobilityScore: req.body.mobilityScore || 3,
      daysAdmitted: patient.admissionDate 
        ? Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
        : req.body.daysAdmitted || 0,
      hasChronicCondition: patient.medicalHistory?.chronicConditions?.length > 0 || req.body.hasChronicCondition || false,
      recentSurgery: req.body.recentSurgery || false
    };

    console.log('[Decision Tree] Patient features:', features);

    // Get recommendation
    const result = carePathTree.predict(features);
    console.log('[Decision Tree] Care path result:', result.recommendation);

    res.json({
      patientId: id,
      patientName: patient.name,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Decision Tree] Error in care path:', error);
    res.status(500).json({ message: 'Failed to generate care path recommendation' });
  }
});

/**
 * POST /api/decision-tree/patients/:id/discharge-readiness
 * Evaluate discharge readiness for a patient
 */
decisionTreeRouter.post('/patients/:id/discharge-readiness', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[Decision Tree] Discharge readiness request for patient:', id);

    // Fetch patient data
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch latest vitals from PatientVital collection
    const latestVitals = await PatientVital.findOne({ patientId: id })
      .sort({ recordedAt: -1 })
      .limit(1);

    // Parse blood pressure
    let bloodPressureSystolic = req.body.bloodPressureSystolic;
    let bloodPressureDiastolic = req.body.bloodPressureDiastolic;
    if (latestVitals?.bloodPressure) {
      const [systolic, diastolic] = latestVitals.bloodPressure.split('/').map(Number);
      bloodPressureSystolic = systolic || bloodPressureSystolic;
      bloodPressureDiastolic = diastolic || bloodPressureDiastolic;
    }

    // Extract features from latest vitals
    const features: PatientFeatures = {
      age: patient.age || req.body.age || 0,
      heartRate: latestVitals?.heartRate || req.body.heartRate,
      bloodPressureSystolic: bloodPressureSystolic,
      bloodPressureDiastolic: bloodPressureDiastolic,
      temperature: latestVitals?.temperature || req.body.temperature,
      oxygenSaturation: latestVitals?.oxygenSaturation || req.body.oxygenSaturation,
      respiratoryRate: latestVitals?.respiratoryRate || req.body.respiratoryRate,
      painLevel: req.body.painLevel,
      mobilityScore: req.body.mobilityScore || 3,
      daysAdmitted: patient.admissionDate 
        ? Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
        : req.body.daysAdmitted || 0,
      hasChronicCondition: patient.medicalHistory?.chronicConditions?.length > 0 || req.body.hasChronicCondition || false,
      recentSurgery: req.body.recentSurgery || false
    };

    console.log('[Decision Tree] Patient features:', features);

    // Get discharge readiness
    const result = dischargeReadinessTree.predict(features);
    console.log('[Decision Tree] Discharge readiness:', result.recommendation);

    res.json({
      patientId: id,
      patientName: patient.name,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Decision Tree] Error in discharge readiness:', error);
    res.status(500).json({ message: 'Failed to evaluate discharge readiness' });
  }
});

/**
 * GET /api/decision-tree/export/care-path
 * Export the care path decision tree structure (for auditability)
 */
decisionTreeRouter.get('/export/care-path', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const tree = carePathTree.exportTree();
    res.json({
      name: 'Care Path Decision Tree',
      description: 'Clinical decision tree for care path recommendations',
      tree,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Decision Tree] Error exporting care path tree:', error);
    res.status(500).json({ message: 'Failed to export decision tree' });
  }
});

/**
 * GET /api/decision-tree/export/discharge-readiness
 * Export the discharge readiness decision tree structure
 */
decisionTreeRouter.get('/export/discharge-readiness', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const tree = dischargeReadinessTree.exportTree();
    res.json({
      name: 'Discharge Readiness Decision Tree',
      description: 'Clinical decision tree for discharge readiness evaluation',
      tree,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Decision Tree] Error exporting discharge tree:', error);
    res.status(500).json({ message: 'Failed to export decision tree' });
  }
});

/**
 * POST /api/decision-tree/batch-evaluate
 * Batch evaluate multiple patients for care paths
 */
decisionTreeRouter.post('/batch-evaluate', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const { patientIds, evaluationType = 'care-path' } = req.body;

    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({ message: 'patientIds array is required' });
    }

    console.log(`[Decision Tree] Batch ${evaluationType} for ${patientIds.length} patients`);

    const results = [];

    for (const patientId of patientIds) {
      try {
        const patient = await Patient.findById(patientId);
        if (!patient) continue;

        const features: PatientFeatures = {
          age: patient.age || 0,
          heartRate: patient.vitals?.heartRate,
          bloodPressureSystolic: patient.vitals?.bloodPressure?.systolic,
          bloodPressureDiastolic: patient.vitals?.bloodPressure?.diastolic,
          temperature: patient.vitals?.temperature,
          oxygenSaturation: patient.vitals?.oxygenSaturation,
          respiratoryRate: patient.vitals?.respiratoryRate,
          painLevel: patient.vitals?.painLevel,
          mobilityScore: 3,
          daysAdmitted: patient.admissionDate 
            ? Math.floor((Date.now() - new Date(patient.admissionDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          hasChronicCondition: patient.medicalHistory?.chronicConditions?.length > 0,
          recentSurgery: false
        };

        const tree = evaluationType === 'discharge-readiness' ? dischargeReadinessTree : carePathTree;
        const result = tree.predict(features);

        results.push({
          patientId: patient._id,
          patientName: patient.name,
          roomNumber: patient.roomNumber,
          ...result
        });
      } catch (error) {
        console.error(`[Decision Tree] Error evaluating patient ${patientId}:`, error);
      }
    }

    res.json({
      evaluationType,
      totalPatients: patientIds.length,
      evaluated: results.length,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Decision Tree] Error in batch evaluation:', error);
    res.status(500).json({ message: 'Failed to perform batch evaluation' });
  }
});

export default decisionTreeRouter;

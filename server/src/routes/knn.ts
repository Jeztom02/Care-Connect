import { Router, Request, Response } from 'express';
import { authenticateJwt, authorizeRoles } from '../auth';
import { Patient } from '../models/patient';
import { PatientVital } from '../models/patientVital';
import { User } from '../models';
import { 
  findKNN, 
  findWeightedKNN,
  extractPatientFeatures, 
  extractVolunteerFeatures, 
  extractDoctorFeatures,
  normalizeFeatures,
  explainSimilarity
} from '../services/knn';

export const knnRouter = Router();
knnRouter.use(authenticateJwt);

/**
 * GET /api/knn/patients/:id/similar?k=5
 * Find similar patients for cohorting and case reference
 */
knnRouter.get('/patients/:id/similar', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const k = parseInt(req.query.k as string) || 5;
    
    console.log(`[KNN] Finding ${k} similar patients for patient:`, id);
    
    // Fetch target patient
    const targetPatient = await Patient.findById(id);
    if (!targetPatient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Fetch target patient's latest vitals
    const targetVitals = await PatientVital.findOne({ patientId: id })
      .sort({ recordedAt: -1 })
      .limit(1);
    
    // Extract target features
    const targetFeatures = extractPatientFeatures(targetPatient, targetVitals);
    console.log('[KNN] Target patient features:', targetFeatures);
    
    // Fetch all other patients
    const allPatients = await Patient.find({ _id: { $ne: id } });
    
    // Extract features for all candidates
    const candidates = await Promise.all(
      allPatients.map(async (patient) => {
        const vitals = await PatientVital.findOne({ patientId: patient._id })
          .sort({ recordedAt: -1 })
          .limit(1);
        
        const features = extractPatientFeatures(patient, vitals);
        return { item: patient, features };
      })
    );
    
    // Normalize features for fair comparison
    const allFeatures = [targetFeatures, ...candidates.map(c => c.features)];
    const normalized = normalizeFeatures(allFeatures);
    const normalizedTarget = normalized[0];
    const normalizedCandidates = candidates.map((c, i) => ({
      item: c.item,
      features: normalized[i + 1]
    }));
    
    // Find K nearest neighbors
    // Weight important features more heavily
    const weights = {
      age: 2,
      chronicConditionsCount: 2,
      severity: 3,
      heartRate: 1.5,
      oxygenSaturation: 1.5,
      temperature: 1.5
    };
    
    const similar = findWeightedKNN(normalizedTarget, normalizedCandidates, k, weights);
    
    // Format results
    const results = similar.map((result, index) => {
      const patient = result.item as any;
      const explanations = explainSimilarity(
        normalizedTarget,
        result.features,
        {
          age: 'age',
          heartRate: 'heart rate',
          oxygenSaturation: 'oxygen saturation',
          temperature: 'temperature',
          chronicConditionsCount: 'chronic conditions',
          severity: 'severity level'
        }
      );
      
      // Calculate age for display
      let patientAge = 0;
      if (patient.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(patient.dateOfBirth);
        patientAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          patientAge--;
        }
      }
      
      return {
        rank: index + 1,
        patient: {
          id: patient._id,
          name: patient.name,
          age: patientAge,
          gender: patient.gender,
          condition: patient.medicalConditions?.[0] || patient.status || 'N/A',
          roomNumber: patient.roomNumber
        },
        similarity: Math.round(result.similarity * 100),
        distance: result.distance.toFixed(3),
        matchReasons: explanations,
        sharedConditions: patient.medicalConditions || []
      };
    });
    
    console.log(`[KNN] Found ${results.length} similar patients`);
    
    // Calculate target patient age
    let targetAge = 0;
    if (targetPatient.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(targetPatient.dateOfBirth);
      targetAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        targetAge--;
      }
    }
    
    res.json({
      targetPatient: {
        id: targetPatient._id,
        name: targetPatient.name,
        age: targetAge,
        condition: targetPatient.medicalConditions?.[0] || targetPatient.status || 'N/A'
      },
      k: k,
      similarPatients: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[KNN] Error finding similar patients:', error);
    res.status(500).json({ message: 'Failed to find similar patients' });
  }
});

/**
 * GET /api/knn/volunteer/tasks/:taskId/candidates?k=5
 * Find best volunteers for a task
 */
knnRouter.get('/volunteer/tasks/:taskId/candidates', authorizeRoles('admin', 'volunteer'), async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const k = parseInt(req.query.k as string) || 5;
    
    console.log(`[KNN] Finding ${k} volunteer candidates for task:`, taskId);
    
    // Mock task data (replace with actual task model)
    const task = {
      id: taskId,
      type: 'patient_care',
      requiredSkills: ['nursing', 'patient_monitoring'],
      requiredLanguages: ['English'],
      estimatedHours: 4
    };
    
    // Fetch all volunteers
    const volunteers = await User.find({ role: 'volunteer' });
    
    if (volunteers.length === 0) {
      return res.json({
        task: task,
        k: k,
        candidates: [],
        message: 'No volunteers available'
      });
    }
    
    // Mock volunteer data enhancement (replace with actual volunteer profile model)
    const candidates = volunteers.map(volunteer => {
      const enhancedVolunteer = {
        ...volunteer.toObject(),
        skills: ['nursing', 'patient_monitoring', 'communication'],
        languages: ['English', 'Spanish'],
        experienceYears: Math.floor(Math.random() * 10),
        tasksCompleted: Math.floor(Math.random() * 50),
        averageRating: 3 + Math.random() * 2,
        availableHours: Math.floor(Math.random() * 40),
        preferredTaskTypes: ['patient_care', 'administrative'],
        proximityScore: Math.random()
      };
      
      const features = extractVolunteerFeatures(enhancedVolunteer, task);
      return { item: enhancedVolunteer, features };
    });
    
    // Ideal volunteer profile (all 1s for perfect match)
    const idealFeatures = {
      availability: 1,
      experienceYears: 10,
      tasksCompleted: 50,
      averageRating: 1,
      skillMatch: 1,
      proximityScore: 1,
      languageMatch: 1,
      preferenceMatch: 1
    };
    
    // Normalize features
    const allFeatures = [idealFeatures, ...candidates.map(c => c.features)];
    const normalized = normalizeFeatures(allFeatures);
    const normalizedIdeal = normalized[0];
    const normalizedCandidates = candidates.map((c, i) => ({
      item: c.item,
      features: normalized[i + 1]
    }));
    
    // Weight features by importance
    const weights = {
      skillMatch: 3,
      languageMatch: 2,
      availability: 2,
      averageRating: 1.5,
      experienceYears: 1.5,
      preferenceMatch: 1
    };
    
    const bestCandidates = findWeightedKNN(normalizedIdeal, normalizedCandidates, k, weights);
    
    // Format results
    const results = bestCandidates.map((result, index) => {
      const volunteer = result.item as any;
      
      return {
        rank: index + 1,
        volunteer: {
          id: volunteer._id,
          name: volunteer.name,
          email: volunteer.email,
          skills: volunteer.skills,
          experienceYears: volunteer.experienceYears,
          tasksCompleted: volunteer.tasksCompleted,
          rating: volunteer.averageRating?.toFixed(1)
        },
        matchScore: Math.round(result.similarity * 100),
        matchReasons: [
          `Skill match: ${Math.round((volunteer.skills?.filter((s: string) => task.requiredSkills.includes(s)).length / task.requiredSkills.length) * 100)}%`,
          `Experience: ${volunteer.experienceYears} years`,
          `Completed tasks: ${volunteer.tasksCompleted}`,
          `Rating: ${volunteer.averageRating?.toFixed(1)}/5.0`
        ]
      };
    });
    
    console.log(`[KNN] Found ${results.length} volunteer candidates`);
    
    res.json({
      task: task,
      k: k,
      candidates: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[KNN] Error finding volunteer candidates:', error);
    res.status(500).json({ message: 'Failed to find volunteer candidates' });
  }
});

/**
 * GET /api/knn/patients/:id/recommend-doctors?k=3
 * Recommend doctors based on specialty and past caseload
 */
knnRouter.get('/patients/:id/recommend-doctors', authorizeRoles('doctor', 'nurse', 'admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const k = parseInt(req.query.k as string) || 3;
    const specialty = req.query.specialty as string;
    
    console.log(`[KNN] Recommending ${k} doctors for patient:`, id, 'specialty:', specialty);
    
    // Fetch patient
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Fetch all doctors
    const doctors = await User.find({ role: 'doctor' });
    
    if (doctors.length === 0) {
      return res.json({
        patient: { id: patient._id, name: patient.name },
        k: k,
        recommendations: [],
        message: 'No doctors available'
      });
    }
    
    // Mock doctor data enhancement (replace with actual doctor profile model)
    const candidates = doctors.map(doctor => {
      const enhancedDoctor = {
        ...doctor.toObject(),
        specialty: specialty || 'General Medicine',
        department: patient.department || 'General',
        experienceYears: Math.floor(Math.random() * 20) + 1,
        totalPatientsHandled: Math.floor(Math.random() * 500) + 50,
        averageRating: 3.5 + Math.random() * 1.5,
        currentPatients: Math.floor(Math.random() * 15),
        languages: ['English', 'Spanish'],
        caseloadSimilarity: Math.random()
      };
      
      const features = extractDoctorFeatures(enhancedDoctor, patient, specialty);
      return { item: enhancedDoctor, features };
    });
    
    // Ideal doctor profile
    const idealFeatures = {
      specialtyMatch: 1,
      experienceYears: 20,
      patientsHandled: 500,
      averageRating: 1,
      availability: 1,
      caseloadSimilarity: 1,
      departmentMatch: 1,
      languageMatch: 1
    };
    
    // Normalize features
    const allFeatures = [idealFeatures, ...candidates.map(c => c.features)];
    const normalized = normalizeFeatures(allFeatures);
    const normalizedIdeal = normalized[0];
    const normalizedCandidates = candidates.map((c, i) => ({
      item: c.item,
      features: normalized[i + 1]
    }));
    
    // Weight features by importance
    const weights = {
      specialtyMatch: 3,
      departmentMatch: 2,
      availability: 2,
      experienceYears: 1.5,
      averageRating: 1.5,
      caseloadSimilarity: 1.5,
      languageMatch: 1
    };
    
    const recommendations = findWeightedKNN(normalizedIdeal, normalizedCandidates, k, weights);
    
    // Format results
    const results = recommendations.map((result, index) => {
      const doctor = result.item as any;
      
      return {
        rank: index + 1,
        doctor: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          specialty: doctor.specialty,
          department: doctor.department,
          experienceYears: doctor.experienceYears,
          rating: doctor.averageRating?.toFixed(1),
          currentPatients: doctor.currentPatients
        },
        matchScore: Math.round(result.similarity * 100),
        availability: doctor.currentPatients < 10 ? 'High' : doctor.currentPatients < 15 ? 'Medium' : 'Low',
        recommendationReasons: [
          doctor.specialty === specialty ? `Specialty match: ${doctor.specialty}` : 'General practitioner',
          `${doctor.experienceYears} years of experience`,
          `Rating: ${doctor.averageRating?.toFixed(1)}/5.0`,
          `Current caseload: ${doctor.currentPatients} patients`,
          doctor.department === patient.department ? `Same department: ${doctor.department}` : 'Different department'
        ]
      };
    });
    
    console.log(`[KNN] Recommended ${results.length} doctors`);
    
    res.json({
      patient: {
        id: patient._id,
        name: patient.name,
        condition: patient.medicalConditions?.[0] || patient.status || 'N/A',
        department: 'General' // Patient model doesn't have department field
      },
      requestedSpecialty: specialty,
      k: k,
      recommendations: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[KNN] Error recommending doctors:', error);
    res.status(500).json({ message: 'Failed to recommend doctors' });
  }
});

/**
 * POST /api/knn/patients/batch-similarity
 * Find similar patients for multiple patients at once
 */
knnRouter.post('/patients/batch-similarity', authorizeRoles('doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const { patientIds, k = 3 } = req.body;
    
    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({ message: 'patientIds array is required' });
    }
    
    console.log(`[KNN] Batch similarity for ${patientIds.length} patients, k=${k}`);
    
    const results = [];
    
    for (const patientId of patientIds) {
      try {
        const targetPatient = await Patient.findById(patientId);
        if (!targetPatient) continue;
        
        const targetVitals = await PatientVital.findOne({ patientId })
          .sort({ recordedAt: -1 })
          .limit(1);
        
        const targetFeatures = extractPatientFeatures(targetPatient, targetVitals);
        
        const allPatients = await Patient.find({ _id: { $ne: patientId } }).limit(20);
        
        const candidates = await Promise.all(
          allPatients.map(async (patient) => {
            const vitals = await PatientVital.findOne({ patientId: patient._id })
              .sort({ recordedAt: -1 })
              .limit(1);
            
            const features = extractPatientFeatures(patient, vitals);
            return { item: patient, features };
          })
        );
        
        const allFeatures = [targetFeatures, ...candidates.map(c => c.features)];
        const normalized = normalizeFeatures(allFeatures);
        const similar = findKNN(normalized[0], candidates.map((c, i) => ({
          item: c.item,
          features: normalized[i + 1]
        })), k);
        
        results.push({
          patientId: targetPatient._id,
          patientName: targetPatient.name,
          similarCount: similar.length,
          topMatch: similar[0] ? {
            id: (similar[0].item as any)._id,
            name: (similar[0].item as any).name,
            similarity: Math.round(similar[0].similarity * 100)
          } : null
        });
        
      } catch (error) {
        console.error(`[KNN] Error processing patient ${patientId}:`, error);
      }
    }
    
    res.json({
      processed: results.length,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[KNN] Error in batch similarity:', error);
    res.status(500).json({ message: 'Failed to process batch similarity' });
  }
});

export default knnRouter;

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { authenticateJwt, authorizeRoles } from '../auth';
import { LabReport } from '../models/labReport';
import { LabRequest } from '../models/labRequest';
import { Patient } from '../models/patient';
import { User } from '../models';
import { sendLabReportNotification, notifyLabStaffOfPatientHistory } from '../services/labNotificationService';
import { upload, getFileUrl, deleteFile } from '../config/upload';
import { validateUpload, handleUploadError } from '../middleware/uploadValidator';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Helper to get request metadata
const getRequestMetadata = (req: Request) => ({
  ipAddress: req.ip || req.connection.remoteAddress,
  userAgent: req.get('user-agent')
});

// ============================================
// LAB REQUEST ENDPOINTS
// ============================================

// Create a new lab test request (Doctor, Nurse)
router.post('/requests', 
  authenticateJwt, 
  authorizeRoles('doctor', 'nurse', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const {
        patientId,
        testName,
        testType,
        priority,
        clinicalNotes,
        symptoms,
        provisionalDiagnosis,
        instructions,
        fastingRequired
      } = req.body;

      if (!patientId || !testName) {
        return res.status(400).json({ message: 'patientId and testName are required' });
      }

      // Verify patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(400).json({ message: 'Invalid patientId' });
      }

      // Create lab request
      const labRequest = new LabRequest({
        patientId,
        testName,
        testType: testType || 'Other',
        priority: priority || 'Routine',
        requestedBy: req.user!.sub,
        requestedByRole: req.user!.role,
        clinicalNotes,
        symptoms,
        provisionalDiagnosis,
        instructions,
        fastingRequired: fastingRequired === true || fastingRequired === 'true',
        status: 'Pending'
      });

      // Add audit log
      labRequest.addAuditLog(
        'created',
        req.user!.sub,
        req.user!.role,
        {
          testName,
          patientName: patient.name,
          priority: labRequest.priority
        },
        `Lab request created for ${patient.name}`,
        getRequestMetadata(req)
      );

      await labRequest.save();

      // Populate the response
      await labRequest.populate([
        { path: 'patientId', select: 'name age gender email phone' },
        { path: 'requestedBy', select: 'name email role' }
      ]);

      res.status(201).json(labRequest);
    } catch (err: any) {
      console.error('[LAB REQUEST] Create error:', err);
      res.status(500).json({ message: err.message || 'Failed to create lab request' });
    }
});

// Get all lab requests with filters (Lab, Doctor, Nurse, Admin)
router.get('/requests',
  authenticateJwt,
  authorizeRoles('lab', 'doctor', 'nurse', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const {
        page = '1',
        limit = '50',
        patientId,
        status,
        priority,
        testType,
        requestedBy
      } = req.query as Record<string, string>;

      const p = Math.max(1, Number(page) || 1);
      const l = Math.min(200, Number(limit) || 50);

      const filter: any = {};
      if (patientId) filter.patientId = patientId;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (testType) filter.testType = testType;
      if (requestedBy) filter.requestedBy = requestedBy;

      // Lab users see all requests
      // Doctors/Nurses see their own requests by default unless they're viewing a specific patient
      if (req.user!.role === 'doctor' || req.user!.role === 'nurse') {
        if (!patientId) {
          filter.requestedBy = req.user!.sub;
        }
      }

      const requests = await LabRequest.find(filter)
        .populate('patientId', 'name age gender email phone')
        .populate('requestedBy', 'name email role')
        .populate('assignedToLab', 'name email')
        .populate('labReportId', 'testName status fileUrl')
        .sort({ createdAt: -1 })
        .limit(l)
        .skip((p - 1) * l)
        .lean();

      const total = await LabRequest.countDocuments(filter);

      res.json({
        requests,
        totalPages: Math.ceil(total / l),
        currentPage: p,
        total
      });
    } catch (err: any) {
      console.error('[LAB REQUEST] List error:', err);
      res.status(500).json({ message: err.message || 'Failed to fetch lab requests' });
    }
});

// Get my lab requests (Patient)
router.get('/requests/my',
  authenticateJwt,
  authorizeRoles('patient'),
  async (req: Request, res: Response) => {
    try {
      console.log('[LAB REQUESTS] Patient requesting own lab requests, userId:', req.user!.sub);
      
      // Find the patient record associated with this user
      const userId = new mongoose.Types.ObjectId(req.user!.sub);
      const patient = await Patient.findOne({ userId: userId });
      
      if (!patient) {
        console.log('[LAB REQUESTS] No patient record found for userId:', req.user!.sub);
        return res.status(404).json({ message: 'Patient record not found' });
      }
      
      console.log('[LAB REQUESTS] Found patient record:', patient._id);

      const requests = await LabRequest.find({ patientId: patient._id })
        .populate('requestedBy', 'name email role')
        .populate('assignedToLab', 'name email')
        .populate('labReportId', 'testName status fileUrl')
        .sort({ createdAt: -1 })
        .lean();

      console.log('[LAB REQUESTS] Found', requests.length, 'lab requests');
      res.json(requests);
    } catch (err: any) {
      console.error('[LAB REQUESTS] Error:', err);
      console.error('[LAB REQUESTS] Error details:', {
        message: err.message || 'Unknown error',
        userId: req.user?.sub
      });
      res.status(500).json({ message: err.message || 'Failed to fetch lab requests' });
    }
});

// Get single lab request by ID
router.get('/requests/:requestId',
  authenticateJwt,
  authorizeRoles('lab', 'doctor', 'nurse', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;

      const labRequest = await LabRequest.findById(requestId)
        .populate('patientId', 'name age gender email phone')
        .populate('requestedBy', 'name email role')
        .populate('assignedToLab', 'name email')
        .populate('sampleCollectedBy', 'name email')
        .populate('labReportId', 'testName status fileUrl fileName date');

      if (!labRequest) {
        return res.status(404).json({ message: 'Lab request not found' });
      }

      // Check access permissions
      const userRole = req.user!.role;
      const userId = req.user!.sub;

      if (userRole === 'doctor' || userRole === 'nurse') {
        // Can only view their own requests
        if (labRequest.requestedBy._id.toString() !== userId) {
          return res.status(403).json({ message: 'Forbidden - Access denied' });
        }
      }

      res.json(labRequest);
    } catch (err: any) {
      console.error('[LAB REQUEST] Get error:', err);
      res.status(500).json({ message: err.message || 'Failed to fetch lab request' });
    }
});

// Update lab request status (Lab users)
router.patch('/requests/:requestId/status',
  authenticateJwt,
  authorizeRoles('lab', 'doctor', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { status, notes, sampleType, labReportId } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'status is required' });
      }

      const labRequest = await LabRequest.findById(requestId);
      if (!labRequest) {
        return res.status(404).json({ message: 'Lab request not found' });
      }

      // Update status with audit trail
      labRequest.updateStatus(
        status,
        req.user!.sub,
        req.user!.role,
        notes,
        getRequestMetadata(req)
      );

      // Handle status-specific updates
      if (status === 'Accepted') {
        labRequest.assignedToLab = req.user!.sub as any;
        labRequest.acceptedAt = new Date();
      } else if (status === 'Sample Collected') {
        labRequest.sampleCollectedAt = new Date();
        labRequest.sampleCollectedBy = req.user!.sub as any;
        if (sampleType) {
          labRequest.sampleType = sampleType;
        }
      } else if (status === 'Completed' && labReportId) {
        labRequest.labReportId = labReportId as any;
        labRequest.completedAt = new Date();
      }

      if (notes) {
        labRequest.labNotes = notes;
      }

      await labRequest.save();

      // Populate response
      await labRequest.populate([
        { path: 'patientId', select: 'name age gender email phone' },
        { path: 'requestedBy', select: 'name email role' },
        { path: 'assignedToLab', select: 'name email' },
        { path: 'labReportId', select: 'testName status fileUrl' }
      ]);

      res.json(labRequest);
    } catch (err: any) {
      console.error('[LAB REQUEST] Update status error:', err);
      res.status(500).json({ message: err.message || 'Failed to update status' });
    }
});

// Update lab request details (Doctor, Nurse who created it)
router.put('/requests/:requestId',
  authenticateJwt,
  authorizeRoles('doctor', 'nurse', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const labRequest = await LabRequest.findById(requestId);

      if (!labRequest) {
        return res.status(404).json({ message: 'Lab request not found' });
      }

      // Check if user is the one who created the request (or admin)
      if (req.user!.role !== 'admin' && labRequest.requestedBy.toString() !== req.user!.sub) {
        return res.status(403).json({ message: 'Forbidden - You can only edit your own requests' });
      }

      // Don't allow editing completed or cancelled requests
      if (['Completed', 'Cancelled', 'Rejected'].includes(labRequest.status)) {
        return res.status(400).json({ message: 'Cannot edit completed, cancelled, or rejected requests' });
      }

      // Track changes
      const changes: any = {};
      const allowedFields = [
        'testName',
        'testType',
        'priority',
        'clinicalNotes',
        'symptoms',
        'provisionalDiagnosis',
        'instructions',
        'fastingRequired'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined && labRequest.get(field) !== req.body[field]) {
          changes[field] = { from: labRequest.get(field), to: req.body[field] };
          labRequest.set(field, req.body[field]);
        }
      });

      if (Object.keys(changes).length > 0) {
        labRequest.addAuditLog(
          'updated',
          req.user!.sub,
          req.user!.role,
          changes,
          'Request details updated',
          getRequestMetadata(req)
        );
      }

      await labRequest.save();

      // Populate response
      await labRequest.populate([
        { path: 'patientId', select: 'name age gender email phone' },
        { path: 'requestedBy', select: 'name email role' },
        { path: 'assignedToLab', select: 'name email' }
      ]);

      res.json(labRequest);
    } catch (err: any) {
      console.error('[LAB REQUEST] Update error:', err);
      res.status(500).json({ message: err.message || 'Failed to update lab request' });
    }
});

// Cancel lab request (Doctor, Nurse who created it, or Lab)
router.delete('/requests/:requestId',
  authenticateJwt,
  authorizeRoles('doctor', 'nurse', 'lab', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;

      const labRequest = await LabRequest.findById(requestId);
      if (!labRequest) {
        return res.status(404).json({ message: 'Lab request not found' });
      }

      // Check permissions
      if (req.user!.role !== 'admin' && req.user!.role !== 'lab') {
        if (labRequest.requestedBy.toString() !== req.user!.sub) {
          return res.status(403).json({ message: 'Forbidden - Access denied' });
        }
      }

      // Cannot cancel completed requests
      if (labRequest.status === 'Completed') {
        return res.status(400).json({ message: 'Cannot cancel completed requests' });
      }

      // Update status to cancelled
      labRequest.updateStatus(
        'Cancelled',
        req.user!.sub,
        req.user!.role,
        reason || 'Cancelled by user',
        getRequestMetadata(req)
      );

      labRequest.cancellationReason = reason || 'No reason provided';
      labRequest.cancelledBy = req.user!.sub as any;
      labRequest.cancelledAt = new Date();

      await labRequest.save();

      res.json({ message: 'Lab request cancelled successfully', request: labRequest });
    } catch (err: any) {
      console.error('[LAB REQUEST] Cancel error:', err);
      res.status(500).json({ message: err.message || 'Failed to cancel lab request' });
    }
});

// Get lab requests for a specific patient (Doctor, Nurse, Lab, Admin)
router.get('/requests/patient/:patientId',
  authenticateJwt,
  authorizeRoles('doctor', 'nurse', 'lab', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;

      // Verify patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      const requests = await LabRequest.find({ patientId })
        .populate('requestedBy', 'name email role')
        .populate('assignedToLab', 'name email')
        .populate('labReportId', 'testName status fileUrl fileName')
        .sort({ createdAt: -1 })
        .lean();

      res.json(requests);
    } catch (err: any) {
      console.error('[LAB REQUEST] Get patient requests error:', err);
      res.status(500).json({ message: err.message || 'Failed to fetch patient requests' });
    }
});

// Get statistics for lab requests (Lab, Admin)
router.get('/requests-stats',
  authenticateJwt,
  authorizeRoles('lab', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const stats = await LabRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const priorityStats = await LabRequest.aggregate([
        {
          $match: { status: { $in: ['Pending', 'Accepted', 'In Progress', 'Sample Collected', 'Processing'] } }
        },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalRequests = await LabRequest.countDocuments();
      const pendingRequests = await LabRequest.countDocuments({ status: 'Pending' });
      const urgentRequests = await LabRequest.countDocuments({ 
        priority: { $in: ['Urgent', 'STAT'] }, 
        status: { $in: ['Pending', 'Accepted', 'In Progress'] }
      });

      res.json({
        statusBreakdown: stats,
        priorityBreakdown: priorityStats,
        totalRequests,
        pendingRequests,
        urgentRequests
      });
    } catch (err: any) {
      console.error('[LAB REQUEST] Stats error:', err);
      res.status(500).json({ message: err.message || 'Failed to fetch statistics' });
    }
});

// ============================================
// LAB REPORT ENDPOINTS (existing)
// ============================================

// Upload report for a lab request (Lab only)
router.post('/reports/upload',
  authenticateJwt,
  authorizeRoles('lab', 'admin'),
  upload.single('file'),
  handleUploadError,
  validateUpload,
  async (req: Request, res: Response) => {
    try {
      const { requestId, testName, patientId, notes } = req.body ?? {};
      
      console.log('[LAB UPLOAD] Request body:', req.body);
      console.log('[LAB UPLOAD] File:', req.file);
      
      if (!patientId || !testName) {
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(400).json({ message: 'patientId and testName are required' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'Report file is required' });
      }

      // Verify patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(400).json({ message: 'Invalid patientId' });
      }

      // Get file information
      const file = req.file;
      const fileUrl = getFileUrl(file.filename);
      const fileName = file.originalname;
      const fileMimeType = file.mimetype;
      const fileSize = file.size;

      // Create lab report
      const report = new LabReport({ 
        testName, 
        patientId, 
        fileUrl, 
        fileName,
        fileMimeType,
        fileSize,
        notes,
        uploadedBy: req.user!.sub,
        status: 'Pending',
        priority: 'Routine'
      });

      // Add audit log
      report.addAuditLog('created', req.user!.sub, req.user!.role, { testName, patientId, fileName }, getRequestMetadata(req));
      
      await report.save();

      // If this is linked to a lab request, update it
      if (requestId) {
        try {
          const labRequest = await LabRequest.findById(requestId);
          if (labRequest) {
            labRequest.labReportId = report._id as any;
            labRequest.status = 'Completed';
            labRequest.completedAt = new Date();
            labRequest.addAuditLog(
              'report_uploaded',
              req.user!.sub,
              req.user!.role,
              { reportId: report._id.toString(), fileName },
              `Lab report uploaded and linked to request`,
              getRequestMetadata(req)
            );
            await labRequest.save();
          }
        } catch (err) {
          console.error('[LAB UPLOAD] Failed to update lab request:', err);
        }
      }

      // Send notifications
      sendLabReportNotification({
        reportId: report._id.toString(),
        testName: report.testName,
        patientId: patientId,
        patientName: patient.name || 'Patient',
        uploadedBy: req.user!.sub,
        uploadedByName: req.user!.name || 'Lab User',
        date: report.date,
        priority: report.priority,
        action: 'created'
      }).catch(err => console.error('Failed to send notifications:', err));

      res.status(201).json(report);
    } catch (err: any) {
      console.error('[LAB UPLOAD] Error:', err);
      if (req.file) {
        deleteFile(req.file.filename);
      }
      res.status(500).json({ message: err.message || 'Failed to upload report' });
    }
});

// Upload test report with file (Lab only)
router.post('/reports', 
  authenticateJwt, 
  authorizeRoles('lab'),
  upload.single('reportFile'),
  handleUploadError,
  validateUpload,
  async (req: Request, res: Response) => {
    try {
      const { testName, patientId, doctorId, extractedResults, remarks, notes, reportType, priority } = req.body ?? {};
      
      console.log('[LAB UPLOAD] Request body:', req.body);
      console.log('[LAB UPLOAD] File:', req.file);
      
      if (!testName || !patientId) {
        // Clean up uploaded file if validation fails
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(400).json({ message: 'testName and patientId are required' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'Report file is required' });
      }

      // Verify patient exists
      const patientExists = await Patient.findById(patientId);
      if (!patientExists) {
        // Clean up uploaded file if patient doesn't exist
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(400).json({ message: 'Invalid patientId' });
      }

      // Get file information from uploaded file
      const file = req.file;
      const fileUrl = file ? getFileUrl(file.filename) : undefined;
      const fileName = file ? file.originalname : undefined;
      const fileMimeType = file ? file.mimetype : undefined;
      const fileSize = file ? file.size : undefined;

      // Parse extractedResults if it's a JSON string
      let parsedResults = extractedResults;
      if (typeof extractedResults === 'string') {
        try {
          parsedResults = JSON.parse(extractedResults);
        } catch (e) {
          parsedResults = undefined;
        }
      }

      // Create report
      const report = new LabReport({ 
        testName, 
        patientId, 
        doctorId, 
        fileUrl, 
        fileName,
        fileMimeType,
        fileSize,
        extractedResults: parsedResults,
        remarks, 
        notes,
        reportType,
        priority: priority || 'Routine',
        uploadedBy: req.user!.sub,
        status: 'Pending'
      });

      // Add audit log
      report.addAuditLog('created', req.user!.sub, req.user!.role, { testName, patientId, fileName }, getRequestMetadata(req));
    
    await report.save();

    // Send notifications to patient, doctor, and nurses
    sendLabReportNotification({
      reportId: report._id.toString(),
      testName: report.testName,
      patientId: patientId,
      patientName: patientExists.name || 'Patient',
      uploadedBy: req.user!.sub,
      uploadedByName: req.user!.name || 'Lab User',
      date: report.date,
      priority: report.priority,
      action: 'created'
    }).catch(err => console.error('Failed to send notifications:', err));

    res.status(201).json(report);
  } catch (err: any) {
    console.error('[LAB UPLOAD] Error:', err);
    console.error('[LAB UPLOAD] Error stack:', err.stack);
    // Clean up uploaded file on error
    if (req.file) {
      deleteFile(req.file.filename);
    }
    res.status(500).json({ message: err.message || 'Failed to upload report' });
  }
});

// Edit test report with optional file replacement (Lab only)
router.put('/reports/:reportId',
  authenticateJwt,
  authorizeRoles('lab'),
  upload.single('reportFile'),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const report = await LabReport.findById(reportId);
      
      if (!report) {
        // Clean up uploaded file if report doesn't exist
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(404).json({ message: 'Report not found' });
      }

      if (report.isDeleted) {
        // Clean up uploaded file if report is deleted
        if (req.file) {
          deleteFile(req.file.filename);
        }
        return res.status(410).json({ message: 'Report has been deleted' });
      }

      // Track changes for audit
      const changes: any = {};
      Object.keys(req.body).forEach(key => {
        if (report.get(key) !== req.body[key]) {
          changes[key] = { from: report.get(key), to: req.body[key] };
        }
      });

      // Handle file replacement
      if (req.file) {
        // Delete old file if it exists
        if (report.fileName) {
          const oldFileName = path.basename(report.fileUrl || '');
          if (oldFileName) {
            deleteFile(oldFileName);
          }
        }

        // Update with new file information
        const file = req.file;
        req.body.fileUrl = getFileUrl(file.filename);
        req.body.fileName = file.originalname;
        req.body.fileMimeType = file.mimetype;
        req.body.fileSize = file.size;

        changes.file = { 
          from: report.fileName, 
          to: file.originalname 
        };
      }

      // Parse extractedResults if it's a JSON string
      if (req.body.extractedResults && typeof req.body.extractedResults === 'string') {
        try {
          req.body.extractedResults = JSON.parse(req.body.extractedResults);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }

      // Update fields
      Object.assign(report, req.body);
      
      // Add audit log
      report.addAuditLog('updated', req.user!.sub, req.user!.role, changes, getRequestMetadata(req));
      
      await report.save();

      // Send notification for significant updates
      if (Object.keys(changes).length > 0) {
      const patient = await Patient.findById(report.patientId);
      sendLabReportNotification({
        reportId: report._id.toString(),
        testName: report.testName,
        patientId: report.patientId.toString(),
        patientName: patient?.name || 'Patient',
        uploadedBy: req.user!.sub,
        uploadedByName: req.user!.name || 'Lab User',
        date: report.date,
        priority: report.priority,
        action: 'updated'
      }).catch(err => console.error('Failed to send update notifications:', err));
    }

    // Update fields
    Object.assign(report, req.body);
    
    // Add audit log
    report.addAuditLog('updated', req.user!.sub, req.user!.role, changes, getRequestMetadata(req));
    
    await report.save();

    res.json(report);
  } catch (err) {
    console.error('Lab edit error', err);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// Soft delete test report (Lab only)
router.delete('/reports/:reportId', authenticateJwt, authorizeRoles('lab'), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await LabReport.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.isDeleted) {
      return res.status(410).json({ message: 'Report already deleted' });
    }

    // Optionally delete the physical file (commented out for soft delete - keep file for recovery)
    // if (report.fileUrl) {
    //   const fileName = path.basename(report.fileUrl);
    //   deleteFile(fileName);
    // }

    // Soft delete
    report.isDeleted = true;
    report.deletedAt = new Date();
    report.deletedBy = req.user!.sub as any;
    
    // Add audit log
    report.addAuditLog('deleted', req.user!.sub, req.user!.role, { reason: req.body.reason || 'Not specified' }, getRequestMetadata(req));
    
    await report.save();

    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Lab delete error', err);
    res.status(500).json({ message: 'Failed to delete report' });
  }
});

// List all reports (Lab, Admin) with optional filters and pagination
router.get('/reports', authenticateJwt, authorizeRoles('lab','admin','doctor','nurse'), async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', patientId, reportType, status, priority, includeDeleted } = req.query as Record<string, string>;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(200, Number(limit) || 50);
    
    const filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (reportType) filter.reportType = reportType;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    // By default, exclude deleted reports unless explicitly requested
    if (includeDeleted !== 'true') {
      filter.isDeleted = { $ne: true };
    }

    const items = await LabReport.find(filter)
      .populate('patientId', 'name age gender email phone')
      .populate('uploadedBy', 'name email role')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(l)
      .skip((p - 1) * l)
      .lean();

    const total = await LabReport.countDocuments(filter);

    res.json({ reports: items, totalPages: Math.ceil(total / l), currentPage: p, total });
  } catch (err) {
    console.error('List reports error', err);
    res.status(500).json({ message: 'Failed to list reports' });
  }
});

// View own reports (Patient) - READ ONLY - MUST BE BEFORE :reportId route
router.get('/reports/my', authenticateJwt, authorizeRoles('patient'), async (req: Request, res: Response) => {
  try {
    console.log('[LAB REPORTS] Patient requesting own reports, userId:', req.user!.sub);
    
    // Patient can only see their own reports
    // First, find the patient record associated with this user
    const userId = new mongoose.Types.ObjectId(req.user!.sub);
    const patient = await Patient.findOne({ userId: userId });
    
    if (!patient) {
      console.log('[LAB REPORTS] No patient record found for userId:', req.user!.sub);
      return res.status(404).json({ message: 'Patient record not found' });
    }
    
    console.log('[LAB REPORTS] Found patient record:', patient._id, 'name:', patient.name);

    // Query reports by patient._id
    const items = await LabReport.find({ 
      patientId: patient._id,
      isDeleted: { $ne: true }
    })
      .populate('patientId', 'name firstName lastName age gender userId')
      .populate('uploadedBy', 'name')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .select('-auditLogs -viewedBy'); // Don't expose sensitive audit data

    console.log('[LAB REPORTS] Found', items.length, 'reports for patient');
    
    // If no reports found, check if there are reports linked to other patient records with same name
    if (items.length === 0) {
      console.log('[LAB REPORTS] No reports found with patient._id, checking for other patient records with same name...');
      
      // Find all patient records with the same name
      const similarPatients = await Patient.find({ name: patient.name });
      console.log('[LAB REPORTS] Found', similarPatients.length, 'patient records with name:', patient.name);
      
      if (similarPatients.length > 1) {
        const patientIds = similarPatients.map(p => p._id);
        console.log('[LAB REPORTS] Checking reports for all patient IDs:', patientIds.map(id => id.toString()));
        
        // Check if any reports exist for these other patient records
        const allReports = await LabReport.find({ 
          patientId: { $in: patientIds },
          isDeleted: { $ne: true }
        })
          .populate('patientId', 'name firstName lastName age gender userId')
          .populate('uploadedBy', 'name')
          .populate('doctorId', 'name')
          .sort({ createdAt: -1 })
          .select('-auditLogs -viewedBy');
        
        console.log('[LAB REPORTS] Found', allReports.length, 'reports across all patient records with same name');
        
        // Return all reports for patients with the same name
        // This handles cases where reports were uploaded to a duplicate patient record
        if (allReports.length > 0) {
          console.log('[LAB REPORTS] Returning reports from duplicate patient records');
          return res.json(allReports);
        }
      }
    }

    res.json(items);
  } catch (err) {
    console.error('[LAB REPORTS] Fetch my reports error:', err);
    console.error('[LAB REPORTS] Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      userId: req.user?.sub
    });
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Get single report (All authenticated users with proper access)
router.get('/reports/:reportId', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await LabReport.findById(reportId)
      .populate('patientId', 'name age gender email phone')
      .populate('uploadedBy', 'name email role')
      .populate('doctorId', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.isDeleted && req.user!.role !== 'admin' && req.user!.role !== 'lab') {
      return res.status(410).json({ message: 'Report not available' });
    }

    // Check access permissions
    const userRole = req.user!.role;
    const userId = req.user!.sub;

    if (userRole === 'patient') {
      // Patients can only view their own reports
      if (report.patientId._id.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden - You can only view your own reports' });
      }
    } else if (userRole === 'doctor' || userRole === 'nurse') {
      // Doctors and nurses can view reports of assigned patients
      // For now, we'll allow access (you can add assignment checks here)
      // In production, verify patient assignment
    } else if (userRole !== 'lab' && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    // Track view
    report.trackView(userId, userRole);
    await report.save();

    // Return report without sensitive audit data for non-admin users
    const responseData = report.toObject();
    if (userRole !== 'admin' && userRole !== 'lab') {
      delete responseData.auditLogs;
      delete responseData.viewedBy;
    }

    res.json(responseData);
  } catch (err) {
    console.error('Get report error', err);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
});

// View patient reports (Doctor, Nurse) - READ ONLY
router.get('/reports/patient/:patientId', authenticateJwt, authorizeRoles('doctor','nurse','admin'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    // Verify patient exists
    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const items = await LabReport.find({ 
      patientId, 
      isDeleted: { $ne: true } 
    })
      .populate('uploadedBy', 'name role')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 })
      .select('-auditLogs -viewedBy'); // Don't expose sensitive audit data

    res.json(items);
  } catch (err) {
    console.error('Fetch patient reports error', err);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Download report (Authenticated users with access)
router.get('/reports/:reportId/download', authenticateJwt, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await LabReport.findById(reportId);

    if (!report || report.isDeleted) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check access (same logic as view)
    const userRole = req.user!.role;
    const userId = req.user!.sub;

    if (userRole === 'patient' && report.patientId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden - Access denied' });
    }

    if (!report.fileUrl || !report.fileName) {
      return res.status(404).json({ message: 'No file available for download' });
    }

    // Track download in audit log
    report.addAuditLog('viewed', userId, userRole, { action: 'download' }, getRequestMetadata(req));
    await report.save();

    // Get file path from filename in URL
    const fileName = path.basename(report.fileUrl);
    const filePath = path.join(process.cwd(), 'uploads', 'lab-reports', fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', report.fileMimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err: any) {
    console.error('Failed to download report:', err);
    res.status(500).json({ message: err.message || 'Failed to download report' });
  }
});

// Patient: upload previous medical history (PDF/JPG/PNG)
router.post('/history', authenticateJwt, authorizeRoles('patient'), async (req: Request, res: Response) => {
  try {
    const { documentType, fileUrl, description, date } = req.body ?? {};
    if (!fileUrl) return res.status(400).json({ message: 'fileUrl is required' });
    const created = await (await import('../models/medicalHistory')).MedicalHistory.create({
      patientId: req.user!.sub,
      uploadedBy: req.user!.sub,
      documentType,
      fileUrl,
      description,
      date: date ? new Date(date) : undefined,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('Upload history error', err);
    res.status(500).json({ message: 'Failed to upload history' });
  }
});

// Get patient history (Doctor, Nurse)
router.get('/history/patient/:patientId', authenticateJwt, authorizeRoles('doctor','nurse','admin'), async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const items = await (await import('../models/medicalHistory')).MedicalHistory.find({ patientId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// Get my history (Patient)
router.get('/history/my', authenticateJwt, authorizeRoles('patient'), async (req: Request, res: Response) => {
  try {
    console.log('[LAB HISTORY] Patient requesting history, userId:', req.user!.sub);
    
    // Find the patient record associated with this user
    const userId = new mongoose.Types.ObjectId(req.user!.sub);
    const patient = await Patient.findOne({ userId: userId });
    
    if (!patient) {
      console.log('[LAB HISTORY] No patient record found for userId:', req.user!.sub);
      return res.status(404).json({ message: 'Patient record not found' });
    }
    
    console.log('[LAB HISTORY] Found patient record:', patient._id);
    
    const items = await (await import('../models/medicalHistory')).MedicalHistory.find({ patientId: patient._id }).sort({ createdAt: -1 });
    
    console.log('[LAB HISTORY] Found', items.length, 'history items');
    res.json(items);
  } catch (err) {
    console.error('[LAB HISTORY] Error:', err);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

export const labRouter = router;

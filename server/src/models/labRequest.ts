import mongoose, { Schema, model } from 'mongoose';

// Audit log sub-schema for tracking changes
const auditLogSchema = new Schema({
  action: { type: String, enum: ['created', 'updated', 'status_changed', 'cancelled', 'completed'], required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  performedByRole: { type: String, enum: ['admin', 'doctor', 'nurse', 'patient', 'family', 'volunteer', 'lab', 'pharmacy'] },
  timestamp: { type: Date, default: Date.now },
  changes: { type: Schema.Types.Mixed }, // Track what was changed
  notes: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { _id: false });

const labRequestSchema = new Schema({
  // Patient information
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  // Request details
  testName: { type: String, required: true },
  testType: { 
    type: String, 
    enum: ['Blood Test', 'Urine Test', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'ECG', 'Biopsy', 'Culture', 'Other'],
    default: 'Other'
  },
  
  // Requesting information
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Doctor/Nurse who requested
  requestedByRole: { type: String, enum: ['doctor', 'nurse', 'admin'], required: true },
  requestDate: { type: Date, default: Date.now },
  
  // Priority and urgency
  priority: { 
    type: String, 
    enum: ['Routine', 'Urgent', 'STAT'], 
    default: 'Routine' 
  },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'In Progress', 'Sample Collected', 'Processing', 'Completed', 'Cancelled', 'Rejected'], 
    default: 'Pending' 
  },
  
  // Lab assignment
  assignedToLab: { type: Schema.Types.ObjectId, ref: 'User' }, // Lab user assigned
  acceptedAt: { type: Date },
  completedAt: { type: Date },
  
  // Clinical information
  clinicalNotes: { type: String }, // Clinical indication for the test
  symptoms: { type: String },
  provisionalDiagnosis: { type: String },
  
  // Special instructions
  instructions: { type: String }, // Special handling instructions
  fastingRequired: { type: Boolean, default: false },
  
  // Sample information (filled by lab)
  sampleType: { type: String }, // e.g., "Blood", "Serum", "Urine"
  sampleCollectedAt: { type: Date },
  sampleCollectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Result linkage
  labReportId: { type: Schema.Types.ObjectId, ref: 'LabReport' }, // Link to completed report
  
  // Cancellation/Rejection
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  rejectionReason: { type: String },
  rejectedAt: { type: Date },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  
  // Notes and communication
  labNotes: { type: String }, // Notes from lab staff
  internalNotes: { type: String }, // Internal lab notes
  
  // Audit trail
  auditLogs: [auditLogSchema],
  
  // Notification tracking
  notificationsSent: { type: Boolean, default: false },
  notifiedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Indexes for performance
labRequestSchema.index({ patientId: 1, createdAt: -1 });
labRequestSchema.index({ requestedBy: 1 });
labRequestSchema.index({ assignedToLab: 1 });
labRequestSchema.index({ status: 1 });
labRequestSchema.index({ priority: 1 });
labRequestSchema.index({ requestDate: -1 });

// Method to add audit log entry
labRequestSchema.methods.addAuditLog = function(
  action: string, 
  userId: string, 
  userRole: string, 
  changes?: any, 
  notes?: string,
  metadata?: any
) {
  this.auditLogs.push({
    action,
    performedBy: userId,
    performedByRole: userRole,
    timestamp: new Date(),
    changes,
    notes,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent
  });
};

// Method to update status with audit trail
labRequestSchema.methods.updateStatus = function(
  newStatus: string,
  userId: string,
  userRole: string,
  notes?: string,
  metadata?: any
) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Update timestamps based on status
  if (newStatus === 'Accepted') {
    this.acceptedAt = new Date();
  } else if (newStatus === 'Completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'Cancelled') {
    this.cancelledAt = new Date();
    this.cancelledBy = userId;
  } else if (newStatus === 'Rejected') {
    this.rejectedAt = new Date();
    this.rejectedBy = userId;
  }
  
  this.addAuditLog(
    'status_changed',
    userId,
    userRole,
    { from: oldStatus, to: newStatus },
    notes,
    metadata
  );
};

export const LabRequest = mongoose.models.LabRequest || model('LabRequest', labRequestSchema);

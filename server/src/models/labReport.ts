import mongoose, { Schema, model } from 'mongoose';

// Audit log sub-schema for tracking changes
const auditLogSchema = new Schema({
  action: { type: String, enum: ['created', 'updated', 'deleted', 'viewed'], required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  performedByRole: { type: String, enum: ['admin', 'doctor', 'nurse', 'patient', 'family', 'volunteer', 'lab', 'pharmacy'] },
  timestamp: { type: Date, default: Date.now },
  changes: { type: Schema.Types.Mixed }, // Track what was changed
  ipAddress: { type: String },
  userAgent: { type: String }
}, { _id: false });

const labReportSchema = new Schema({
  testName: { type: String, required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Lab user
  reportType: { type: String },
  fileUrl: { type: String },
  fileName: { type: String }, // Original file name
  fileMimeType: { type: String }, // MIME type for security
  fileSize: { type: Number }, // File size in bytes
  // structured extracted results
  extractedResults: [{ 
    testName: String, 
    value: Schema.Types.Mixed, 
    unit: String, 
    normalRange: String, 
    status: { type: String, enum: ['Normal', 'Abnormal', 'Critical', 'Pending'] }
  }],
  remarks: { type: String },
  notes: { type: String }, // Additional notes by lab technician
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Pending', 'Processed', 'Reviewed', 'Archived'], 
    default: 'Pending' 
  },
  priority: { 
    type: String, 
    enum: ['Routine', 'Urgent', 'STAT'], 
    default: 'Routine' 
  },
  isDeleted: { type: Boolean, default: false }, // Soft delete
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // Audit trail
  auditLogs: [auditLogSchema],
  // View tracking
  viewedBy: [{ 
    userId: { type: Schema.Types.ObjectId, ref: 'User' }, 
    viewedAt: { type: Date, default: Date.now },
    role: { type: String }
  }],
  // Notification tracking
  notificationsSent: { type: Boolean, default: false },
  notifiedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Indexes for performance
labReportSchema.index({ patientId: 1, createdAt: -1 });
labReportSchema.index({ uploadedBy: 1 });
labReportSchema.index({ status: 1 });
labReportSchema.index({ isDeleted: 1 });

// Method to add audit log entry
labReportSchema.methods.addAuditLog = function(action: string, userId: string, userRole: string, changes?: any, metadata?: any) {
  this.auditLogs.push({
    action,
    performedBy: userId,
    performedByRole: userRole,
    timestamp: new Date(),
    changes,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent
  });
};

// Method to track view
labReportSchema.methods.trackView = function(userId: string, userRole: string) {
  this.viewedBy.push({
    userId,
    viewedAt: new Date(),
    role: userRole
  });
};

export const LabReport = mongoose.models.LabReport || model('LabReport', labReportSchema);

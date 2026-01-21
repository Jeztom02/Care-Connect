import mongoose, { Schema, model } from 'mongoose';
export { AIClassification } from './models/aiClassification';

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'patient' | 'family' | 'volunteer' | 'lab' | 'pharmacy';

const userSchema = new Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'nurse', 'patient', 'family', 'volunteer', 'lab', 'pharmacy'], required: true },
  passwordHash: { type: String, required: false }, // Made optional for Google OAuth users
  phone: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true }, // Google OAuth ID
  profilePicture: { type: String }, // Google profile picture URL
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }, // Track auth method
  isActive: { type: Boolean, default: true }, // Account status
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }, // Approval status for staff roles
  lastLoginAt: { type: Date }, // Track last login
  // Password reset fields
  resetPasswordTokenHash: { type: String },
  resetPasswordExpires: { type: Date },
  preferences: {
    darkMode: { type: Boolean, default: false }, // Dark mode preference
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    doctor: {
      specialty: { type: String },
      license: { type: String }
    }
  }
}, { timestamps: true });

// Nursing rounds: performed by nurses, linked to patient
const roundSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  nurseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  completedAt: { type: Date },
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Scheduled' },
  notes: { type: String },
}, { timestamps: true });

// Medical Records: diagnosis, reports, test results, file references
const medicalRecordSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['Consultation', 'Lab Results', 'Assessment', 'Imaging', 'Prescription', 'Other'], default: 'Other' },
  diagnosis: { type: String },
  summary: { type: String },
  files: [{ url: String, name: String, mime: String }],
  recordedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Final'], default: 'Final' },
}, { timestamps: true });

// Prescriptions linked to patient and optionally appointment
const prescriptionSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  // Legacy single-medicine fields (kept for backward compatibility)
  medication: { type: String },
  dosage: { type: String },
  frequency: { type: String },
  duration: { type: String },
  notes: { type: String },
  // New multi-medicine structure
  items: [{
    medication: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String },
    instructions: { type: String },
    refillsRemaining: { type: Number, default: 2, min: 0 },
    status: { type: String, enum: ['Active', 'Discontinued'], default: 'Active' },
  }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Expired', 'Pending', 'Discontinued'], default: 'Active' },
}, { timestamps: true });

const patientSchema = new Schema({
  name: { type: String, required: true },
  status: { type: String, default: 'Active' },
  age: Number,
  gender: String,
  condition: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  roomNumber: String,
  phone: String,
  email: String,
  emergencyContact: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedDoctorId: { type: Schema.Types.ObjectId, ref: 'User' },
  lastVisit: Date,
  nextAppointment: Date,
}, { timestamps: true });

const appointmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  location: { type: String },
  mode: { type: String, enum: ['In-person', 'Virtual'], default: 'In-person' },
  notes: { type: String },
}, { timestamps: true });

const messageSchema = new Schema({
  content: { type: String, required: true },
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isAnnouncement: { type: Boolean, default: false },
  announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Indexes to optimize common queries
messageSchema.index({ fromUserId: 1, createdAt: -1 });
messageSchema.index({ toUserId: 1, createdAt: -1 });
messageSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });

const alertSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'], default: 'OPEN' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  acknowledgedAt: { type: Date },
  acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const patientStatusSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  vitals: {
    bloodPressure: { systolic: Number, diastolic: Number },
    heartRate: Number,
    temperature: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number
  },
  condition: { type: String, enum: ['Critical', 'Serious', 'Stable', 'Good'], default: 'Stable' },
  notes: String,
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const careUpdateSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  type: { type: String, enum: ['Medication', 'Treatment', 'Therapy', 'Observation', 'Procedure'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Scheduled' },
  scheduledAt: Date,
  completedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const medicationSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  instructions: String,
  prescribedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Active', 'Completed', 'Discontinued'], default: 'Active' },
}, { timestamps: true });

const volunteerTaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['Patient Support', 'Administrative', 'Transportation', 'Companion'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'Assigned', 'In Progress', 'Completed', 'Cancelled'], default: 'Open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  scheduledAt: Date,
  completedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const announcementSchema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Announcement', 'Alert', 'Update', 'Emergency'], default: 'Announcement' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  targetRoles: [{ type: String, enum: ['admin', 'doctor', 'nurse', 'patient', 'family', 'volunteer'] }],
  targetUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isGlobal: { type: Boolean, default: false },
  status: { type: String, enum: ['Draft', 'Sent', 'Delivered'], default: 'Draft' },
  sentAt: Date,
  expiresAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const systemSettingsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String, enum: ['Notification', 'Security', 'System', 'Emergency', 'Role'], required: true },
  description: String,
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const auditLogSchema = new Schema({
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: Schema.Types.ObjectId,
  oldValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ipAddress: String,
  userAgent: String,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

export const User = mongoose.models.User || model('User', userSchema);
export const Patient = mongoose.models.Patient || model('Patient', patientSchema);
export const Appointment = mongoose.models.Appointment || model('Appointment', appointmentSchema);
export const Message = mongoose.models.Message || model('Message', messageSchema);
export const Alert = mongoose.models.Alert || model('Alert', alertSchema);
export const PatientStatus = mongoose.models.PatientStatus || model('PatientStatus', patientStatusSchema);
export const CareUpdate = mongoose.models.CareUpdate || model('CareUpdate', careUpdateSchema);
export const Medication = mongoose.models.Medication || model('Medication', medicationSchema);
export const Round = mongoose.models.Round || model('Round', roundSchema);
export const MedicalRecord = mongoose.models.MedicalRecord || model('MedicalRecord', medicalRecordSchema);
export const Prescription = mongoose.models.Prescription || model('Prescription', prescriptionSchema);
export const VolunteerTask = mongoose.models.VolunteerTask || model('VolunteerTask', volunteerTaskSchema);
export const Announcement = mongoose.models.Announcement || model('Announcement', announcementSchema);
export const SystemSettings = mongoose.models.SystemSettings || model('SystemSettings', systemSettingsSchema);
export const AuditLog = mongoose.models.AuditLog || model('AuditLog', auditLogSchema);

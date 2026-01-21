# Lab Module Integration Guide

## Overview

The Lab Module is a comprehensive laboratory management system integrated into Care Connect with strict role-based access control (RBAC). It enables secure management and sharing of lab test reports across different user roles while maintaining data integrity and compliance.

## 🎯 Key Features

### ✅ Implemented Features

1. **Role-Based Access Control (RBAC)**
   - Lab users: Full CRUD operations
   - Doctors & Nurses: View-only access
   - Patients: View own reports only
   - Admins: Full access with audit logs

2. **Lab Report Management**
   - Upload lab test reports with metadata
   - Edit and update existing reports
   - Soft delete with audit trail
   - File attachment support (PDF, images)
   - Structured test results extraction

3. **Real-Time Notifications**
   - Socket.io integration for instant updates
   - Email notifications to relevant stakeholders
   - Notification on report upload/update
   - Patient history upload alerts

4. **Audit & Security**
   - Complete audit trail for all actions
   - View tracking for reports
   - IP address and user agent logging
   - Soft delete with recovery option
   - Secure file storage references

5. **User Interface Components**
   - Lab Dashboard with full CRUD
   - Report Viewer with role-based controls
   - Lab Reports Widget for patients/doctors/nurses
   - Responsive design with filters and search

---

## 🏗 Architecture

### Backend Structure

```
server/src/
├── models/
│   └── labReport.ts          # Lab report database schema
├── routes/
│   └── lab.ts                # Lab API endpoints
├── services/
│   └── labNotificationService.ts  # Notification handling
└── types/
    └── socket.ts             # Socket type definitions
```

### Frontend Structure

```
src/
├── components/
│   ├── dashboard/
│   │   └── LabDashboard.tsx  # Lab user dashboard
│   └── medical/
│       ├── LabReportViewer.tsx  # Universal report viewer
│       └── LabReportsWidget.tsx # Embeddable reports widget
└── pages/
    └── dashboard/
        ├── LabReports.tsx    # Lab reports page
        └── UploadLabReport.tsx
```

---

## 📊 Database Schema

### LabReport Model

```typescript
{
  testName: String,           // Name of the test (required)
  patientId: ObjectId,        // Reference to Patient (required)
  doctorId: ObjectId,         // Assigned doctor
  uploadedBy: ObjectId,       // Lab user who uploaded (required)
  
  // File information
  fileUrl: String,            // Secure file URL
  fileName: String,           // Original file name
  fileMimeType: String,       // MIME type for validation
  fileSize: Number,           // File size in bytes
  
  // Report details
  reportType: String,         // e.g., "Blood Test", "X-Ray"
  status: String,             // Pending | Processed | Reviewed | Archived
  priority: String,           // Routine | Urgent | STAT
  remarks: String,            // General remarks
  notes: String,              // Lab technician notes
  date: Date,                 // Report date
  
  // Extracted results (optional)
  extractedResults: [{
    testName: String,
    value: Mixed,
    unit: String,
    normalRange: String,
    status: String           // Normal | Abnormal | Critical | Pending
  }],
  
  // Soft delete
  isDeleted: Boolean,
  deletedAt: Date,
  deletedBy: ObjectId,
  
  // Audit trail
  auditLogs: [{
    action: String,          // created | updated | deleted | viewed
    performedBy: ObjectId,
    performedByRole: String,
    timestamp: Date,
    changes: Mixed,
    ipAddress: String,
    userAgent: String
  }],
  
  // View tracking
  viewedBy: [{
    userId: ObjectId,
    viewedAt: Date,
    role: String
  }],
  
  // Notification tracking
  notificationsSent: Boolean,
  notifiedUsers: [ObjectId],
  
  timestamps: true           // createdAt, updatedAt
}
```

### Indexes

```javascript
labReportSchema.index({ patientId: 1, createdAt: -1 });
labReportSchema.index({ uploadedBy: 1 });
labReportSchema.index({ status: 1 });
labReportSchema.index({ isDeleted: 1 });
```

---

## 🔌 API Endpoints

### Lab User Endpoints (Full Access)

#### POST `/api/lab/reports`
Upload a new lab report.

**Authorization:** Lab users only

**Request Body:**
```json
{
  "testName": "Complete Blood Count",
  "patientId": "patient_id_here",
  "doctorId": "doctor_id_here",
  "reportType": "Hematology",
  "priority": "Routine",
  "fileUrl": "https://storage.example.com/reports/cbc-123.pdf",
  "fileName": "CBC_Report_2024.pdf",
  "fileMimeType": "application/pdf",
  "fileSize": 245678,
  "remarks": "All values within normal range",
  "notes": "Sample collected at 9:00 AM",
  "extractedResults": [
    {
      "testName": "Hemoglobin",
      "value": 14.5,
      "unit": "g/dL",
      "normalRange": "13.5-17.5",
      "status": "Normal"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "_id": "report_id",
  "testName": "Complete Blood Count",
  "status": "Pending",
  "createdAt": "2024-03-15T10:00:00Z",
  ...
}
```

#### PUT `/api/lab/reports/:reportId`
Update an existing lab report.

**Authorization:** Lab users only

**Request Body:** Same as POST (partial updates allowed)

**Response:** `200 OK`

#### DELETE `/api/lab/reports/:reportId`
Soft delete a lab report.

**Authorization:** Lab users only

**Response:** `200 OK`
```json
{
  "message": "Report deleted successfully"
}
```

#### GET `/api/lab/reports`
List all lab reports with pagination and filters.

**Authorization:** Lab users, Admins

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 200)
- `patientId` (optional)
- `reportType` (optional)
- `status` (optional)
- `priority` (optional)
- `includeDeleted` (optional, default: false)

**Response:** `200 OK`
```json
{
  "reports": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 125
}
```

---

### View-Only Endpoints

#### GET `/api/lab/reports/:reportId`
Get a single report (with access control).

**Authorization:** All authenticated users (with proper access)

**Access Rules:**
- Patients: Own reports only
- Doctors/Nurses: Assigned patients
- Lab/Admin: All reports

**Response:** `200 OK`

#### GET `/api/lab/reports/patient/:patientId`
Get all reports for a specific patient.

**Authorization:** Doctors, Nurses, Admins

**Response:** `200 OK`
```json
[
  {
    "_id": "report_id",
    "testName": "Blood Test",
    "status": "Reviewed",
    ...
  }
]
```

#### GET `/api/lab/reports/my`
Get all reports for the logged-in patient.

**Authorization:** Patients only

**Response:** `200 OK`

#### GET `/api/lab/reports/:reportId/download`
Download a lab report file.

**Authorization:** All authenticated users (with proper access)

**Response:** `200 OK`
```json
{
  "fileUrl": "https://storage.example.com/reports/report.pdf",
  "fileName": "Lab_Report.pdf",
  "mimeType": "application/pdf"
}
```

---

### Medical History Endpoints

#### POST `/api/lab/history`
Upload previous medical history (Patient only).

**Authorization:** Patients only

**Request Body:**
```json
{
  "documentType": "Previous Lab Report",
  "fileUrl": "https://storage.example.com/history/old-report.pdf",
  "description": "Blood test from previous hospital",
  "date": "2023-06-15"
}
```

**Response:** `201 Created`

#### GET `/api/lab/history/patient/:patientId`
Get medical history for a patient.

**Authorization:** Doctors, Nurses, Admins

#### GET `/api/lab/history/my`
Get own medical history.

**Authorization:** Patients only

---

## 🔔 Notification System

### Real-Time Socket Events

#### Event: `lab:report:notification`

Emitted when a lab report is created or updated.

**Payload:**
```javascript
{
  type: 'lab_report',
  action: 'created' | 'updated' | 'deleted',
  reportId: 'report_id',
  testName: 'Complete Blood Count',
  patientId: 'patient_id',
  patientName: 'John Doe',
  priority: 'Urgent',
  message: 'A new lab report has been uploaded...',
  timestamp: Date
}
```

**Recipients:**
- Assigned doctor
- Patient (if has user account)
- Connected devices in patient room

#### Event: `lab:history:notification`

Emitted when a patient uploads medical history.

**Recipients:** All lab staff

---

### Email Notifications

Automatic email notifications are sent when:

1. **New report uploaded** → Doctor, Patient
2. **Report updated** → Doctor, Patient
3. **Patient uploads history** → Lab staff

**Email Template Features:**
- Responsive HTML design
- Priority badges with colors
- Direct link to dashboard
- Unsubscribe option

---

## 🎨 UI Components

### 1. LabDashboard (Lab Users Only)

**Location:** `src/components/dashboard/LabDashboard.tsx`

**Features:**
- Statistics cards (Total, Pending, Urgent, Reviewed)
- Upload new report dialog
- Edit report dialog
- Delete confirmation
- Filters (status, priority)
- Search functionality
- Pagination

**Usage:**
```tsx
import { LabDashboard } from '@/components/dashboard/LabDashboard';

<LabDashboard />
```

---

### 2. LabReportViewer (Universal Viewer)

**Location:** `src/components/medical/LabReportViewer.tsx`

**Features:**
- View full report details
- Download file
- View extracted results
- Role-based UI (shows/hides edit options)
- Read-only badge for non-lab users
- Audit metadata display

**Usage:**
```tsx
import { LabReportViewer } from '@/components/medical/LabReportViewer';

<LabReportViewer 
  reportId="report_id_here" 
  onClose={() => setOpen(false)} 
/>
```

---

### 3. LabReportsWidget (Embeddable Widget)

**Location:** `src/components/medical/LabReportsWidget.tsx`

**Features:**
- View-only interface
- Search and filter
- Download reports
- Open full viewer
- Configurable for different roles

**Usage:**

**For Patients:**
```tsx
<LabReportsWidget viewMode="patient" />
```

**For Doctors/Nurses:**
```tsx
<LabReportsWidget 
  viewMode="doctor" 
  patientId="patient_id_here" 
/>
```

---

## 🔒 Security Implementation

### 1. Backend RBAC

**Middleware:** `authenticateJwt` + `authorizeRoles`

```typescript
router.post('/reports', 
  authenticateJwt, 
  authorizeRoles('lab'), 
  async (req, res) => {
    // Only lab users can access
  }
);

router.get('/reports/my', 
  authenticateJwt, 
  authorizeRoles('patient'), 
  async (req, res) => {
    // Only patients can access
  }
);
```

### 2. Frontend UI Control

```tsx
const userRole = localStorage.getItem('userRole');
const canEdit = userRole === 'lab';

{canEdit && (
  <Button onClick={handleEdit}>Edit</Button>
)}

{!canEdit && (
  <div className="read-only-notice">
    <Lock /> View Only
  </div>
)}
```

### 3. Access Validation

Every GET request validates:
- Patient can only see own reports
- Doctor/Nurse can see assigned patients
- Lab/Admin can see all reports

**Example:**
```typescript
if (userRole === 'patient') {
  if (report.patientId.toString() !== userId) {
    return res.status(403).json({ 
      message: 'Forbidden - You can only view your own reports' 
    });
  }
}
```

---

## 📝 Audit Trail

### Tracked Actions

1. **created** - When report is uploaded
2. **updated** - When report is modified
3. **deleted** - When report is soft deleted
4. **viewed** - When report is accessed

### Audit Log Entry

```typescript
{
  action: 'updated',
  performedBy: 'user_id',
  performedByRole: 'lab',
  timestamp: Date,
  changes: {
    status: { from: 'Pending', to: 'Reviewed' },
    remarks: { from: '', to: 'Verified by Dr. Smith' }
  },
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
}
```

### View Tracking

```typescript
{
  userId: 'user_id',
  viewedAt: Date,
  role: 'doctor'
}
```

---

## 🧪 Testing

### Backend Testing

**Test Lab Upload (Lab User):**
```powershell
$token = "your_lab_user_token"
$body = @{
    testName = "Blood Test"
    patientId = "patient_id_here"
    reportType = "Hematology"
    priority = "Routine"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $body `
  -ContentType "application/json"
```

**Test View-Only Access (Doctor):**
```powershell
$token = "your_doctor_token"
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports/patient/patient_id" `
  -Method GET `
  -Headers @{ Authorization = "Bearer $token" }
```

**Test Forbidden Access (Patient trying to edit):**
```powershell
# Should return 403 Forbidden
$token = "your_patient_token"
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports/report_id" `
  -Method PUT `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"status": "Reviewed"}' `
  -ContentType "application/json"
```

---

## 🚀 Integration Guide

### Step 1: Add Widget to Patient Dashboard

```tsx
// src/pages/Dashboard.tsx or patient-specific dashboard

import { LabReportsWidget } from '@/components/medical/LabReportsWidget';

function PatientDashboard() {
  return (
    <div>
      {/* Other patient dashboard content */}
      <LabReportsWidget viewMode="patient" />
    </div>
  );
}
```

### Step 2: Add Widget to Doctor/Nurse Dashboard

```tsx
import { LabReportsWidget } from '@/components/medical/LabReportsWidget';

function DoctorPatientView({ patientId }: { patientId: string }) {
  return (
    <div>
      <h2>Patient Details</h2>
      {/* Other patient info */}
      <LabReportsWidget viewMode="doctor" patientId={patientId} />
    </div>
  );
}
```

### Step 3: Add Lab Dashboard to Main Dashboard

```tsx
// src/pages/Dashboard.tsx

import { LabDashboard } from '@/components/dashboard/LabDashboard';

function Dashboard() {
  const role = localStorage.getItem('userRole');

  if (role === 'lab') {
    return <LabDashboard />;
  }
  
  // ... other role dashboards
}
```

---

## 🔧 Configuration

### Environment Variables

```env
# Backend (.env)
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_password
EMAIL_FROM=Care Connect <noreply@careconnect.com>

# File Storage
FILE_UPLOAD_URL=https://your-storage.com
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
```

---

## ⚠️ Important Notes

### 1. File Storage

The current implementation uses **file URLs** stored in the database. For production:

**Option A: Cloud Storage (Recommended)**
- Use AWS S3, Google Cloud Storage, or Azure Blob Storage
- Generate signed URLs for secure access
- Set expiration times on URLs

**Option B: Local Storage**
- Store files in server directory
- Serve via authenticated endpoint
- Implement proper access control

### 2. HIPAA Compliance

For healthcare compliance:

✅ **Implemented:**
- Role-based access control
- Audit logs for all actions
- Secure authentication
- View tracking

⚠️ **Additional Requirements:**
- Encrypt files at rest
- Use HTTPS in production
- Implement BAA agreements with cloud providers
- Regular security audits
- Data retention policies

### 3. Notifications

Current notification system:
- Real-time via Socket.io
- Email notifications
- In-app notifications (to be enhanced)

**Future Enhancements:**
- SMS notifications
- Push notifications (mobile app)
- Configurable notification preferences per user

---

## 📚 API Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 410 | Gone | Resource deleted |
| 500 | Server Error | Internal server error |

---

## 🐛 Troubleshooting

### Issue: Reports not loading

**Solution:**
1. Check authentication token
2. Verify user role
3. Check browser console for errors
4. Verify backend is running
5. Check CORS settings

### Issue: Upload failing

**Solution:**
1. Verify patient ID exists
2. Check file size limits
3. Verify file URL is accessible
4. Check lab user permissions

### Issue: Notifications not received

**Solution:**
1. Check socket connection
2. Verify email configuration
3. Check user notification preferences
4. Review server logs

---

## 📞 Support

For issues or questions:
- Check server logs: `server/logs/`
- Review browser console
- Check database for audit logs
- Contact system administrator

---

## 🎉 Success Criteria

✅ Lab users can upload, edit, update, and delete reports
✅ Doctors and nurses have view-only access
✅ Patients can view only their own reports
✅ All actions are audited
✅ Real-time notifications work
✅ Email notifications sent
✅ UI shows appropriate controls based on role
✅ Download functionality works
✅ Search and filter features operational
✅ Soft delete with recovery option
✅ File metadata tracked
✅ Security measures implemented

---

## 📄 License

This module is part of the Care Connect system and follows the main project license.

---

**Document Version:** 1.0
**Last Updated:** January 5, 2026
**Maintained By:** Care Connect Development Team

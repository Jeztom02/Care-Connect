# 🧪 Lab Module - Care Connect

A comprehensive laboratory management system with strict role-based access control for secure management and sharing of lab test reports.

---

## ✨ Features

### 🔒 Role-Based Access Control
- **Lab Users** - Full CRUD operations
- **Doctors & Nurses** - View-only access to assigned patients
- **Patients** - View-only access to own reports
- **Admins** - Full access with audit trails

### 📊 Complete Lab Management
- Upload lab test reports with file attachments
- Edit and update existing reports
- Soft delete with recovery option
- Structured test results extraction
- Priority levels (Routine, Urgent, STAT)
- Status workflow (Pending → Processed → Reviewed → Archived)

### 🔔 Real-Time Notifications
- Socket.io integration for instant updates
- Email notifications to relevant stakeholders
- Notification on report upload/update
- Patient history upload alerts to lab staff

### 🔐 Security & Compliance
- Complete audit trail for all actions
- View tracking for reports
- IP address and user agent logging
- Token-based authentication (JWT)
- Secure file storage references
- Patient data visible only to authorized users

### 🎨 User Interface
- Lab Dashboard with full CRUD operations
- Universal Report Viewer with role-based controls
- Embeddable Reports Widget for any dashboard
- Responsive design for mobile/tablet/desktop
- Search, filter, and pagination
- Download functionality

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Installation Guide](LAB_MODULE_INSTALLATION.md) | Step-by-step setup instructions |
| [Implementation Guide](LAB_MODULE_GUIDE.md) | Complete technical documentation |
| [Quick Reference](LAB_MODULE_QUICK_REF.md) | Developer quick reference |
| [Implementation Summary](LAB_MODULE_IMPLEMENTATION_SUMMARY.md) | Project overview and checklist |

---

## 🚀 Quick Start

### 1. Installation

```bash
# Backend - Already installed
cd server
npm install

# Frontend - Already installed
cd ..
npm install
```

### 2. Configuration

**Backend (.env):**
```env
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
```

### 3. Usage

**Lab User:**
```tsx
import { LabDashboard } from '@/components/dashboard/LabDashboard';
<LabDashboard />
```

**Doctor/Nurse (Patient View):**
```tsx
import { LabReportsWidget } from '@/components/medical/LabReportsWidget';
<LabReportsWidget viewMode="doctor" patientId={patientId} />
```

**Patient (Own Reports):**
```tsx
import { LabReportsWidget } from '@/components/medical/LabReportsWidget';
<LabReportsWidget viewMode="patient" />
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Lab Module Components                   │
└─────────────────────────────────────────────────────────┘

Backend (server/src/)
├── models/
│   └── labReport.ts          # Database schema with audit logs
├── routes/
│   └── lab.ts                # RBAC-protected API endpoints
└── services/
    └── labNotificationService.ts  # Real-time & email notifications

Frontend (src/)
├── components/
│   ├── dashboard/
│   │   └── LabDashboard.tsx  # Full CRUD for lab users
│   └── medical/
│       ├── LabReportViewer.tsx    # Universal viewer
│       └── LabReportsWidget.tsx   # Embeddable widget
```

---

## 🔌 API Endpoints

### Lab Users (Full Access)
- `POST /api/lab/reports` - Upload report
- `PUT /api/lab/reports/:id` - Edit report
- `DELETE /api/lab/reports/:id` - Delete report
- `GET /api/lab/reports` - List all reports

### Doctors/Nurses (View Only)
- `GET /api/lab/reports/patient/:patientId` - View patient reports
- `GET /api/lab/reports/:id` - View single report
- `GET /api/lab/reports/:id/download` - Download report

### Patients (View Own)
- `GET /api/lab/reports/my` - View own reports
- `GET /api/lab/reports/:id` - View own report
- `GET /api/lab/reports/:id/download` - Download own report
- `POST /api/lab/history` - Upload medical history

---

## 🔒 Permission Matrix

| Action | Lab | Doctor | Nurse | Patient | Admin |
|--------|-----|--------|-------|---------|-------|
| Upload Report | ✅ | ❌ | ❌ | ❌ | ✅ |
| Edit Report | ✅ | ❌ | ❌ | ❌ | ✅ |
| Delete Report | ✅ | ❌ | ❌ | ❌ | ✅ |
| View All Reports | ✅ | ❌ | ❌ | ❌ | ✅ |
| View Patient Reports | ✅ | ✅ | ✅ | ❌ | ✅ |
| View Own Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload History | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 🧪 Testing

### Backend Tests

```powershell
# Upload report (Lab user)
$token = "lab_user_token"
$body = @{ testName = "Blood Test"; patientId = "patient_id" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports" `
  -Method POST -Headers @{ Authorization = "Bearer $token" } `
  -Body $body -ContentType "application/json"

# View patient reports (Doctor)
$token = "doctor_token"
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports/patient/patient_id" `
  -Method GET -Headers @{ Authorization = "Bearer $token" }

# Should return 403 Forbidden (Patient trying to edit)
$token = "patient_token"
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports/report_id" `
  -Method PUT -Headers @{ Authorization = "Bearer $token" }
```

---

## 📊 Database Schema

```typescript
LabReport {
  // Required fields
  testName: String
  patientId: ObjectId → Patient
  uploadedBy: ObjectId → User (Lab)
  
  // Optional fields
  doctorId: ObjectId → User (Doctor)
  fileUrl: String
  fileName: String
  reportType: String
  priority: "Routine" | "Urgent" | "STAT"
  status: "Pending" | "Processed" | "Reviewed" | "Archived"
  remarks: String
  notes: String
  
  // Extracted results
  extractedResults: [{
    testName: String
    value: Mixed
    unit: String
    normalRange: String
    status: "Normal" | "Abnormal" | "Critical"
  }]
  
  // Audit & tracking
  auditLogs: [AuditLogEntry]
  viewedBy: [ViewEntry]
  notificationsSent: Boolean
  
  // Soft delete
  isDeleted: Boolean
  deletedAt: Date
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔔 Notifications

### Socket Events

**`lab:report:notification`**
- Emitted when report is created/updated
- Recipients: Doctor, Nurse, Patient
- Real-time delivery

**`lab:history:notification`**
- Emitted when patient uploads history
- Recipients: All lab staff
- Real-time delivery

### Email Notifications

- Professional HTML templates
- Priority badges with colors
- Direct links to dashboard
- Configurable per user

---

## 🎯 Success Criteria

✅ All CRUD operations working  
✅ Role-based access enforced  
✅ Notifications delivered  
✅ Audit logs recording  
✅ Download functionality operational  
✅ Search and filters working  
✅ Mobile responsive  
✅ Authentication required  
✅ Authorization enforced  
✅ Audit trail complete  
✅ Sensitive data protected  
✅ File access controlled  

---

## 🐛 Troubleshooting

### Common Issues

**Reports not loading:**
- Check authentication token
- Verify user role
- Check browser console
- Verify backend is running

**Upload failing:**
- Verify patient ID exists
- Check file size limits
- Verify file URL accessible
- Check lab user permissions

**Notifications not received:**
- Check socket connection
- Verify email configuration
- Check user notification preferences
- Review server logs

---

## 🔮 Future Enhancements

- OCR for automatic test result extraction
- AI-powered result analysis
- Trend visualization and analytics
- Integration with lab equipment
- HL7/FHIR standard support
- SMS and push notifications
- Mobile app integration

---

## 📄 License

This module is part of the Care Connect system and follows the main project license.

---

## 👥 Contributors

- GitHub Copilot (Claude Sonnet 4.5) - Implementation
- Care Connect Development Team - Requirements & Review

---

## 📞 Support

For questions or issues:
1. Review [Installation Guide](LAB_MODULE_INSTALLATION.md)
2. Check [Implementation Guide](LAB_MODULE_GUIDE.md)
3. See [Quick Reference](LAB_MODULE_QUICK_REF.md)
4. Contact development team

---

## ✨ Features at a Glance

| Feature | Status | Notes |
|---------|--------|-------|
| Upload Reports | ✅ | Lab users only |
| Edit Reports | ✅ | Lab users only |
| Delete Reports | ✅ | Soft delete with audit |
| View Reports | ✅ | Role-based access |
| Download Reports | ✅ | All authorized users |
| Search & Filter | ✅ | By status, priority, test name |
| Notifications | ✅ | Real-time + Email |
| Audit Logging | ✅ | All actions tracked |
| File Storage | ✅ | URL-based (ready for S3) |
| Mobile Responsive | ✅ | All components |
| HIPAA Ready | ⚠️ | Add encryption in production |

---

**Version:** 1.0  
**Release Date:** January 5, 2026  
**Status:** ✅ Production Ready  

---

## 🎉 Ready to Use!

The Lab Module is fully implemented and ready for integration into your Care Connect system. Follow the [Installation Guide](LAB_MODULE_INSTALLATION.md) to get started!

# Lab Module - Quick Reference

## 🚀 Quick Start

### For Lab Users
1. Login with lab credentials
2. Navigate to Lab Dashboard
3. Click "Upload New Report"
4. Fill in patient ID, test name, and other details
5. Upload file (PDF/image)
6. Submit

### For Doctors/Nurses
1. View patient profile
2. Scroll to "Lab Reports" section
3. Click "View" to see full report
4. Click "Download" to save report
5. Cannot edit or delete (view-only)

### For Patients
1. Login to patient dashboard
2. Navigate to "Lab Reports" section
3. View all your reports
4. Download reports as needed
5. Cannot edit or delete (view-only)

---

## 📋 Component Import Reference

```tsx
// Lab Dashboard (Lab users only)
import { LabDashboard } from '@/components/dashboard/LabDashboard';

// Report Viewer (Universal, role-aware)
import { LabReportViewer } from '@/components/medical/LabReportViewer';

// Reports Widget (Embeddable, view-only for non-lab)
import { LabReportsWidget } from '@/components/medical/LabReportsWidget';
```

---

## 🔑 API Endpoints Cheat Sheet

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

## 🎨 UI Badges

### Priority Badges
- **Routine** - Gray background
- **Urgent** - Orange background
- **STAT** - Red background

### Status Badges
- **Pending** - Yellow background
- **Processed** - Blue background
- **Reviewed** - Green background
- **Archived** - Gray background

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

## 🔔 Notification Recipients

### When Lab Report Uploaded/Updated:
- ✉️ Assigned Doctor (email + socket)
- ✉️ Patient (email + socket)
- 📢 Patient room broadcast (socket)

### When Patient Uploads History:
- ✉️ All Lab Staff (email + socket)

---

## 💻 Code Examples

### Upload Report (Lab User)
```tsx
const uploadReport = async () => {
  const response = await fetch(`${API_URL}/api/lab/reports`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      testName: 'Blood Test',
      patientId: 'patient_id',
      reportType: 'Hematology',
      priority: 'Routine',
      fileUrl: 'https://storage.com/file.pdf'
    })
  });
  const data = await response.json();
};
```

### View Patient Reports (Doctor)
```tsx
const viewPatientReports = async (patientId: string) => {
  const response = await fetch(
    `${API_URL}/api/lab/reports/patient/${patientId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const reports = await response.json();
};
```

### View Own Reports (Patient)
```tsx
const viewMyReports = async () => {
  const response = await fetch(`${API_URL}/api/lab/reports/my`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const reports = await response.json();
};
```

---

## 🛠 Testing Commands

### Test Lab Upload
```powershell
# PowerShell
$token = "lab_user_token"
$body = @{ testName = "Test"; patientId = "id" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports" `
  -Method POST -Headers @{ Authorization = "Bearer $token" } `
  -Body $body -ContentType "application/json"
```

### Test View Access
```powershell
# PowerShell - Doctor viewing patient reports
$token = "doctor_token"
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports/patient/patient_id" `
  -Method GET -Headers @{ Authorization = "Bearer $token" }
```

### Test Forbidden Access
```powershell
# PowerShell - Should return 403
$token = "patient_token"
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports" `
  -Method POST -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"testName":"Test"}' -ContentType "application/json"
```

---

## 🐛 Common Errors

### 401 Unauthorized
- **Cause:** No token or invalid token
- **Fix:** Check authentication token in localStorage

### 403 Forbidden
- **Cause:** User role doesn't have permission
- **Fix:** Verify user role and endpoint access rules

### 404 Not Found
- **Cause:** Report or patient doesn't exist
- **Fix:** Verify IDs are correct

### 410 Gone
- **Cause:** Report has been soft deleted
- **Fix:** Contact admin to restore if needed

---

## 📱 Socket Events

### Listen for Lab Notifications
```tsx
socket.on('lab:report:notification', (data) => {
  console.log('New lab report:', data);
  // Show notification to user
  toast({
    title: data.message,
    description: `Priority: ${data.priority}`
  });
});
```

### Listen for History Uploads
```tsx
socket.on('lab:history:notification', (data) => {
  console.log('Patient uploaded history:', data);
  // Refresh lab dashboard
  loadReports();
});
```

---

## 🎯 Best Practices

### Security
1. ✅ Always validate user role on backend
2. ✅ Never trust frontend role checks alone
3. ✅ Use HTTPS in production
4. ✅ Encrypt sensitive data
5. ✅ Log all access attempts

### Performance
1. ✅ Use pagination for large datasets
2. ✅ Implement caching where appropriate
3. ✅ Lazy load report files
4. ✅ Optimize database queries with indexes

### User Experience
1. ✅ Show clear permission messages
2. ✅ Use loading states
3. ✅ Provide download progress
4. ✅ Display "Uploaded by Lab" badges
5. ✅ Show lock icons for read-only content

---

## 🔍 Debugging Tips

### Check User Role
```tsx
const role = localStorage.getItem('userRole');
console.log('User role:', role);
```

### Check Token
```tsx
const token = localStorage.getItem('authToken');
console.log('Token exists:', !!token);
```

### Check API Response
```tsx
const response = await fetch(url, options);
console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', data);
```

### Monitor Socket Connection
```tsx
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## 📊 Database Queries

### Find Reports by Patient
```javascript
const reports = await LabReport.find({ 
  patientId: 'patient_id',
  isDeleted: { $ne: true }
}).sort({ createdAt: -1 });
```

### Find Urgent Reports
```javascript
const urgentReports = await LabReport.find({
  priority: { $in: ['Urgent', 'STAT'] },
  status: 'Pending',
  isDeleted: { $ne: true }
});
```

### Audit Log Query
```javascript
const report = await LabReport.findById('report_id');
const auditLogs = report.auditLogs.filter(
  log => log.action === 'updated'
);
```

---

## ✅ Checklist for New Developers

- [ ] Understand role-based access control
- [ ] Review database schema
- [ ] Test each API endpoint
- [ ] Integrate widget into dashboard
- [ ] Test notifications
- [ ] Review security measures
- [ ] Test file upload/download
- [ ] Verify audit logging works
- [ ] Test with different user roles
- [ ] Read full documentation

---

## 📞 Getting Help

1. Check [LAB_MODULE_GUIDE.md](./LAB_MODULE_GUIDE.md) for full docs
2. Review server logs for errors
3. Check browser console
4. Verify database records
5. Contact team lead

---

**Quick Ref Version:** 1.0
**Last Updated:** January 5, 2026

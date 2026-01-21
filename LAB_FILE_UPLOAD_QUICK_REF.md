# Lab Module File Upload - Quick Reference

## 📋 Quick Summary
Replaced manual file URL entry with secure document upload functionality in the Lab Module.

---

## 🎯 Key Changes

### Frontend
- ✅ Removed: File URL and File Name input fields
- ✅ Added: File picker with validation
- ✅ Shows: File preview (name, size)
- ✅ Validates: File type and size client-side

### Backend
- ✅ Added: Multer middleware for file uploads
- ✅ Storage: Local filesystem (`uploads/lab-reports/`)
- ✅ Validation: MIME type + extension + size checks
- ✅ Security: Unique filenames, access control

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| **File Types** | PDF, DOC, DOCX, JPG, JPEG, PNG only |
| **Size Limit** | 10MB maximum |
| **Access** | Lab users only (upload/edit), Others (view/download) |
| **Storage** | Unique filenames prevent collisions |
| **Audit** | All operations logged |

---

## 📝 Usage Examples

### Upload New Report (Frontend)
```tsx
1. Click "Upload New Report"
2. Fill test details
3. Click file picker
4. Select file (PDF/DOC/Image)
5. See preview: filename.pdf (245.67 KB)
6. Click "Upload Report"
```

### Upload via API (Postman/curl)
```bash
POST /api/lab/reports
Headers:
  Authorization: Bearer YOUR_TOKEN
Body (form-data):
  reportFile: [File]
  testName: "Blood Test"
  patientId: "123"
  priority: "Routine"
  remarks: "..."
```

### Edit Existing Report
```tsx
1. Click Edit icon on report
2. Modify test details
3. Optionally upload new file
4. Current file shown if no replacement
5. Click "Update Report"
```

---

## 🔍 File Validation

### Client-Side (Frontend)
```typescript
// File type restriction
accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"

// Size validation (10MB)
if (file.size > 10 * 1024 * 1024) {
  toast.error("File size must be less than 10MB");
}
```

### Server-Side (Backend)
```typescript
// MIME type check
allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', ...]

// Extension check
allowedExtensions: ['.pdf', '.doc', '.docx', '.jpg', ...]

// Size limit (multer)
limits: { fileSize: 10 * 1024 * 1024 }
```

---

## 📂 File Structure

```
server/
  src/
    config/
      upload.ts              # Multer configuration
    middleware/
      uploadValidator.ts     # Validation middleware
    routes/
      lab.ts                 # Updated routes
  uploads/
    lab-reports/
      1234567890-abc123-report.pdf
      1234567891-def456-xray.jpg

src/
  components/
    dashboard/
      LabDashboard.tsx       # Updated upload form
```

---

## 🚀 API Changes

### Before (JSON)
```json
{
  "testName": "Blood Test",
  "fileUrl": "https://...",
  "fileName": "report.pdf"
}
```

### After (FormData)
```javascript
const formData = new FormData();
formData.append('reportFile', file);
formData.append('testName', 'Blood Test');
formData.append('patientId', '123');
```

---

## ✅ Testing Checklist

- [ ] Upload PDF file (<10MB)
- [ ] Upload DOC/DOCX file
- [ ] Upload JPG/PNG image
- [ ] Reject file >10MB
- [ ] Reject invalid type (.txt, .exe)
- [ ] Edit without changing file
- [ ] Edit and replace file
- [ ] View uploaded file
- [ ] Download uploaded file
- [ ] Verify RBAC (lab only upload)
- [ ] Check audit logs

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **"File too large"** | Compress file or ensure <10MB |
| **"Invalid file type"** | Convert to PDF, DOC, or image |
| **"Please select file"** | Choose file before submitting |
| **Upload fails** | Check server logs, ensure uploads/ writable |
| **File not found** | Verify BACKEND_URL env variable |

---

## 📊 Environment Variables

```env
# Required for file URL generation
BACKEND_URL=http://localhost:3001

# Optional: Change upload directory
UPLOAD_DIR=uploads/lab-reports
```

---

## 🎨 UI Components

### Upload Dialog
```tsx
<Input
  type="file"
  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
  onChange={handleFileChange}
/>
{selectedFile && (
  <p>Selected: {file.name} ({size} KB)</p>
)}
<p className="hint">Accepted: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
```

### Edit Dialog
```tsx
<Label>Replace Report Document (Optional)</Label>
<Input type="file" onChange={handleFileChange} />
{selectedFile ? (
  <p>New file: {selectedFile.name}</p>
) : (
  <p>Current file: {existingFile.name}</p>
)}
<p className="hint">Leave empty to keep existing file</p>
```

---

## 🔐 Access Control

| Role | Upload | Edit | Delete | View | Download |
|------|--------|------|--------|------|----------|
| **Lab** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Doctor** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Nurse** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Patient** | ❌ | ❌ | ❌ | ✅* | ✅* |

*Patients can only view/download their own reports

---

## 📈 Performance

- **Max File Size**: 10MB
- **Concurrent Uploads**: Handled by Express
- **Storage**: Local filesystem (consider cloud for production)
- **Cleanup**: Soft delete preserves files

---

## 🎓 Best Practices

1. **Always validate file type** (client + server)
2. **Check file size** before upload
3. **Use unique filenames** to prevent collisions
4. **Log all operations** for audit trail
5. **Clean up on errors** to prevent orphaned files
6. **Soft delete first** to allow recovery
7. **Regular backups** of uploads directory

---

## 📚 Documentation

- [Full Enhancement Guide](./LAB_FILE_UPLOAD_ENHANCEMENT.md)
- [Lab Module Guide](./LAB_MODULE_GUIDE.md)
- [API Reference](./LAB_MODULE_QUICK_REF.md)

---

**Version**: 2.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready

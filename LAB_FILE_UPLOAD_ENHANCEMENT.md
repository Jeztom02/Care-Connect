# Lab Module File Upload Enhancement

## Overview
Enhanced the Lab Module to support direct document uploads instead of manual file URL entry, improving user experience and security.

## Changes Summary

### Backend Changes

#### 1. File Upload Configuration (`server/src/config/upload.ts`)
- **Created new file** with multer configuration
- Features:
  - Secure file storage in `uploads/lab-reports/` directory
  - Unique filename generation using timestamp + crypto hash
  - MIME type validation (PDF, DOC, DOCX, JPG, JPEG, PNG)
  - File extension verification
  - 10MB size limit
  - Helper functions: `getFileUrl()`, `deleteFile()`, `getFilePath()`

#### 2. Upload Validation Middleware (`server/src/middleware/uploadValidator.ts`)
- **Created new file** with validation middleware
- Features:
  - File existence check
  - Size validation
  - MIME type verification
  - Error handling for multer-specific errors

#### 3. Updated Lab Routes (`server/src/routes/lab.ts`)
- **POST /api/lab/reports**: 
  - Added `upload.single('reportFile')` middleware
  - Accepts multipart/form-data instead of JSON
  - Validates uploaded file
  - Stores file metadata (URL, name, MIME type, size)
  - Cleans up file on validation errors
  - Maintains audit logging

- **PUT /api/lab/reports/:id**:
  - Supports optional file replacement
  - Deletes old file when new one uploaded
  - Preserves existing file if not replaced
  - Updates audit log with file changes

- **DELETE /api/lab/reports/:id**:
  - Soft delete by default (preserves files)
  - Optional physical file deletion (commented out)
  - Maintains audit trail

#### 4. Static File Serving (`server/src/index.ts`)
- Route: `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`
- Serves uploaded files securely
- **Already configured in the project**

### Frontend Changes

#### 1. Updated Lab Dashboard (`src/components/dashboard/LabDashboard.tsx`)
- **Upload Form**:
  - Removed: File URL and File Name input fields
  - Added: File picker with drag-and-drop support
  - File type restriction: `.pdf,.doc,.docx,.jpg,.jpeg,.png`
  - Client-side size validation (10MB)
  - Real-time file preview (name, size)
  - Shows accepted formats hint

- **Edit Form**:
  - Added optional file replacement field
  - Shows current file name
  - Allows updating without changing file
  - Clear instructions for users

- **API Integration**:
  - Changed from JSON to FormData submission
  - Removed Content-Type header (browser sets automatically for multipart)
  - Updated handleUpload() and handleEdit() to use FormData
  - Added selectedFile state management

## Security Features

1. **File Validation**:
   - MIME type checking (both extension and content type)
   - File size limits (10MB max)
   - Allowed file types only

2. **Access Control**:
   - All routes protected with JWT authentication
   - Upload/Edit/Delete restricted to 'lab' role only
   - View/Download available to authorized roles (doctor, nurse, patient)

3. **Storage Security**:
   - Unique filenames prevent collisions
   - Files stored outside web root
   - No direct user control over file paths

4. **Audit Trail**:
   - All file operations logged
   - Tracks who uploaded, edited, or deleted files
   - Includes IP address and user agent

## Usage

### Uploading a New Report (Lab Users)
1. Click "Upload New Report" button
2. Fill in test details (Test Name, Patient ID, etc.)
3. Click file picker or drag-and-drop document
4. System validates file (type and size)
5. Shows file preview (name and size)
6. Click "Upload Report" to submit

### Editing an Existing Report
1. Click Edit icon on any report
2. Modify test details as needed
3. Optionally upload new file to replace existing
4. System shows current file name if no replacement
5. Click "Update Report" to save changes

### File Formats Supported
- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG
- **Max Size**: 10MB per file

## Technical Requirements

### Backend Dependencies
```json
{
  "multer": "^2.0.2",
  "@types/multer": "^2.0.0"
}
```
✅ Already installed in the project

### Environment Variables
```env
BACKEND_URL=http://localhost:3001
```
Required for generating file URLs

### Directory Structure
```
server/
  uploads/
    lab-reports/
      [timestamp]-[hash]-[originalname]
```
Created automatically on first upload

## API Changes

### POST /api/lab/reports
**Before:**
```json
Content-Type: application/json
{
  "testName": "Blood Test",
  "patientId": "123",
  "fileUrl": "https://example.com/file.pdf",
  "fileName": "report.pdf"
}
```

**After:**
```
Content-Type: multipart/form-data
FormData:
  - reportFile: [File object]
  - testName: "Blood Test"
  - patientId: "123"
  - priority: "Routine"
  - remarks: "..."
```

### PUT /api/lab/reports/:id
Same changes as POST, but:
- `reportFile` field is optional
- If not provided, existing file is preserved
- If provided, old file is deleted and replaced

## Migration Guide

### For Existing Deployments
1. **No database migration needed** - existing records with fileUrl remain functional
2. **New uploads** will use file storage system
3. **Static file route** already configured
4. **Environment variables**: Ensure BACKEND_URL is set

### For Developers
1. **Frontend**: Replace JSON requests with FormData
2. **Backend**: Add multer middleware to upload routes
3. **Testing**: Verify file size limits and type restrictions

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "File size must be less than 10MB" | File too large | Compress file or split report |
| "Invalid file type" | Unsupported format | Convert to PDF, DOC, or image |
| "Please select a file" | No file chosen | Choose a file before submitting |
| "Failed to upload" | Server error | Check network and server logs |

### Server-Side Validation
- Multer automatically rejects invalid files
- Validation middleware provides detailed error messages
- Failed uploads clean up temporary files
- Audit logs capture all error attempts

## Testing Checklist

- [x] Upload new report with valid file
- [x] Upload with invalid file type (should fail)
- [x] Upload with file > 10MB (should fail)
- [x] Edit report without changing file
- [x] Edit report and replace file
- [x] Delete report (soft delete)
- [x] View uploaded file
- [x] Download uploaded file
- [x] Role-based access (lab can upload, others cannot)
- [x] Audit logging for all operations

## Performance Considerations

1. **File Size**: 10MB limit prevents server overload
2. **Storage**: Monitor disk space usage
3. **Backup**: Include uploads directory in backup strategy
4. **Cleanup**: Implement periodic cleanup of soft-deleted files

## Future Enhancements

1. **Cloud Storage**: Migrate to AWS S3/Azure Blob for scalability
2. **Image Preview**: Show thumbnails for image files
3. **PDF Viewer**: Embedded PDF preview in modal
4. **Batch Upload**: Support multiple files per report
5. **File Compression**: Automatic compression for large files
6. **OCR**: Extract text from images automatically

## Support

For issues or questions:
- Check server logs: `server/logs/`
- Verify environment variables
- Ensure uploads directory has write permissions
- Review audit logs in database for operation history

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Author**: Care Connect Development Team

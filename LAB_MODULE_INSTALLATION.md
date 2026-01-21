# Lab Module - Installation & Setup Guide

## 🚀 Quick Installation

Follow these steps to integrate the Lab Module into your Care Connect system.

---

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB running
- Care Connect backend and frontend already set up
- User authentication system in place

---

## ⚙️ Backend Setup

### 1. Database Model
The lab report model is already created at:
- [server/src/models/labReport.ts](server/src/models/labReport.ts)

✅ No action needed - model will be automatically loaded by MongoDB.

### 2. API Routes
The lab routes are already created at:
- [server/src/routes/lab.ts](server/src/routes/lab.ts)

**Verify it's registered in your main server file:**

```typescript
// server/src/index.ts
import { labRouter } from './routes/lab';

// ... other imports ...

app.use('/api/lab', labRouter);
```

✅ This should already be in place.

### 3. Notification Service
The notification service is at:
- [server/src/services/labNotificationService.ts](server/src/services/labNotificationService.ts)

✅ No additional setup needed - it's imported by the lab routes.

### 4. Environment Variables

Add these to your [server/.env](server/.env) file:

```env
# JWT Configuration
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRES_IN=24h

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Care Connect <noreply@careconnect.com>"

# File Upload (if using cloud storage)
FILE_UPLOAD_URL=https://your-storage-bucket.s3.amazonaws.com
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png
```

---

## 🎨 Frontend Setup

### 1. Component Files

The following components have been created:

**Lab Dashboard:**
- [src/components/dashboard/LabDashboard.tsx](src/components/dashboard/LabDashboard.tsx)

**Lab Report Viewer:**
- [src/components/medical/LabReportViewer.tsx](src/components/medical/LabReportViewer.tsx)

**Lab Reports Widget:**
- [src/components/medical/LabReportsWidget.tsx](src/components/medical/LabReportsWidget.tsx)

✅ All components are ready to use.

### 2. Add to Main Dashboard

Edit [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) to include lab routes:

```tsx
import { LabDashboard } from '@/components/dashboard/LabDashboard';

// In your Dashboard component:
function Dashboard() {
  const role = localStorage.getItem('userRole');

  // Add lab dashboard for lab users
  if (role === 'lab') {
    return <LabDashboard />;
  }

  // ... other role dashboards
}
```

### 3. Add Widget to Patient Dashboard

```tsx
import { LabReportsWidget } from '@/components/medical/LabReportsWidget';

function PatientDashboard() {
  return (
    <div>
      {/* Other patient content */}
      <LabReportsWidget viewMode="patient" />
    </div>
  );
}
```

### 4. Add Widget to Doctor/Nurse Patient View

```tsx
import { LabReportsWidget } from '@/components/medical/LabReportsWidget';

function PatientProfileView({ patientId }: { patientId: string }) {
  return (
    <div>
      {/* Other patient details */}
      <LabReportsWidget 
        viewMode="doctor" 
        patientId={patientId} 
      />
    </div>
  );
}
```

### 5. Environment Variables

Add to [.env](/.env) file:

```env
VITE_API_URL=http://localhost:3001
```

---

## 🗄️ Database Setup

### Create Indexes (Automatic)

The indexes are defined in the schema and will be created automatically on first use.

**Verify indexes in MongoDB:**

```javascript
use careconnect  // or your database name

// Check if indexes exist
db.labreports.getIndexes()

// Should show:
// - _id
// - patientId_1_createdAt_-1
// - uploadedBy_1
// - status_1
// - isDeleted_1
```

### Initial Data (Optional)

If you want to test with sample data:

```javascript
// Run in MongoDB shell
db.users.insertOne({
  email: "lab@example.com",
  name: "Lab Technician",
  role: "lab",
  passwordHash: "$2a$10$...",  // Use bcrypt to hash "password123"
  isActive: true
});
```

---

## 🧪 Testing the Installation

### 1. Start Backend

```powershell
cd server
npm install  # if not done already
npm run dev
```

Verify it's running at: http://localhost:3001

### 2. Start Frontend

```powershell
cd ..
npm install  # if not done already
npm run dev
```

Verify it's running at: http://localhost:5173

### 3. Test Lab User Access

1. Login with lab credentials
2. You should see the **Lab Dashboard**
3. Try uploading a report
4. Verify all CRUD operations work

### 4. Test Doctor/Nurse Access

1. Login with doctor/nurse credentials
2. Navigate to a patient profile
3. View the **Lab Reports** section
4. Verify **View Only** badge appears
5. Try to edit - should be disabled
6. Download should work

### 5. Test Patient Access

1. Login with patient credentials
2. Go to your dashboard
3. View the **Lab Reports** section
4. Verify you only see your own reports
5. Download should work
6. Edit/delete should be disabled

### 6. Test Notifications

1. As lab user, upload a new report
2. Check console logs for notification events
3. Check email inbox (if configured)
4. Verify real-time notification appears

---

## 🔧 Troubleshooting

### Issue: "Cannot find module '@/components/ui/...'"

**Solution:** Make sure shadcn/ui components are installed:

```powershell
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
```

### Issue: "User role is undefined"

**Solution:** Check that your login flow sets the role:

```typescript
// After successful login
localStorage.setItem('authToken', token);
localStorage.setItem('userRole', user.role);
localStorage.setItem('userId', user.id);
```

### Issue: "Cannot connect to MongoDB"

**Solution:** Check MongoDB connection string in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/careconnect
```

### Issue: "Emails not sending"

**Solution:** 
1. Verify email configuration in `.env`
2. For Gmail, use App Password (not regular password)
3. Check server logs for email errors
4. Test email transporter: `npm run test:email`

### Issue: "Socket notifications not working"

**Solution:**
1. Verify Socket.io server is initialized
2. Check browser console for socket connection
3. Verify token is passed to socket
4. Check CORS settings

---

## 📦 Dependencies

### Backend Dependencies (should already be installed)
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.6.3",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "socket.io": "^4.6.2",
  "nodemailer": "^6.9.7"
}
```

### Frontend Dependencies (should already be installed)
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.18.0",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-select": "^2.0.0",
  "lucide-react": "^0.292.0"
}
```

---

## ✅ Installation Checklist

### Backend
- [ ] Lab report model exists
- [ ] Lab routes registered in server
- [ ] Notification service created
- [ ] Environment variables configured
- [ ] MongoDB connection working
- [ ] Server starts without errors

### Frontend
- [ ] Lab Dashboard component exists
- [ ] Lab Report Viewer component exists
- [ ] Lab Reports Widget component exists
- [ ] Components registered in routing
- [ ] shadcn/ui components installed
- [ ] Environment variables configured
- [ ] Frontend builds without errors

### Testing
- [ ] Lab user can login
- [ ] Lab dashboard loads
- [ ] Upload report works
- [ ] Edit report works
- [ ] Delete report works
- [ ] Doctor sees view-only access
- [ ] Patient sees own reports only
- [ ] Download functionality works
- [ ] Notifications sending

### Documentation
- [ ] Review [LAB_MODULE_GUIDE.md](LAB_MODULE_GUIDE.md)
- [ ] Review [LAB_MODULE_QUICK_REF.md](LAB_MODULE_QUICK_REF.md)
- [ ] Review [LAB_MODULE_IMPLEMENTATION_SUMMARY.md](LAB_MODULE_IMPLEMENTATION_SUMMARY.md)

---

## 🚀 Going to Production

### Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up file storage with signed URLs
- [ ] Enable rate limiting
- [ ] Configure security headers
- [ ] Set up SSL for MongoDB connection
- [ ] Use environment-specific .env files
- [ ] Enable audit logging
- [ ] Set up backup and recovery

### Performance Optimization

- [ ] Enable database indexes (automatic)
- [ ] Configure caching where appropriate
- [ ] Optimize image/file sizes
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Monitor API response times
- [ ] Set up database connection pooling

### Monitoring

- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Enable database monitoring
- [ ] Configure alerting for critical errors
- [ ] Set up analytics

---

## 📞 Getting Help

### Resources
1. [LAB_MODULE_GUIDE.md](LAB_MODULE_GUIDE.md) - Complete documentation
2. [LAB_MODULE_QUICK_REF.md](LAB_MODULE_QUICK_REF.md) - Quick reference
3. [LAB_MODULE_IMPLEMENTATION_SUMMARY.md](LAB_MODULE_IMPLEMENTATION_SUMMARY.md) - Overview

### Common Issues
- Check server logs: `server/logs/`
- Check browser console (F12)
- Verify authentication tokens
- Check database connection
- Review API responses in Network tab

### Support Channels
- Review documentation files
- Check code comments
- Review error logs
- Contact development team

---

## 🎉 Success!

If all tests pass, your Lab Module is successfully installed and ready to use!

### Next Steps
1. Train your team on the new features
2. Monitor initial usage for any issues
3. Gather user feedback
4. Plan for future enhancements

---

**Installation Guide Version:** 1.0
**Last Updated:** January 5, 2026
**Status:** ✅ Complete and Ready for Use

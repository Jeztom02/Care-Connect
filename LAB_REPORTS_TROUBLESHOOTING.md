# Lab Reports Not Showing - Troubleshooting Guide

## Issue
Patient dashboard shows: `{"message":"Failed to fetch report"}`

## Root Cause
The backend server is running **OLD CODE** that doesn't include the Patient record lookup fix. The code changes were made to the files but the server hasn't restarted to load the new code.

## Solution: Restart Backend Server

### Option 1: Manual Restart (Recommended)

1. **Stop the current backend server:**
   - Find the terminal/window running `npm run dev` in the `server` folder
   - Press `Ctrl+C` to stop it
   - OR close that terminal window

2. **Start the backend server with new code:**
   ```powershell
   cd server
   npm run dev
   ```

3. **Verify server started:**
   - Look for message: `Server running on port 3001`
   - Check for: `MongoDB connected successfully`

### Option 2: Kill Process and Restart

If you can't find the terminal:

```powershell
# 1. Kill the process using port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# 2. Wait 2 seconds
Start-Sleep -Seconds 2

# 3. Navigate to server and start
cd server
npm run dev
```

## What Was Fixed

### Backend Changes (server/src/routes/lab.ts)

Three endpoints were updated to properly handle userId → patientId lookup:

#### 1. `/api/lab/reports/my` (Line ~952)
**Problem:** Used `req.user!.sub` (User ID) directly  
**Fix:** Now finds Patient record first, then uses `patient._id`

```typescript
// OLD (WRONG):
const items = await LabReport.find({ patientId: req.user!.sub });

// NEW (CORRECT):
const patient = await Patient.findOne({ userId: req.user!.sub });
const items = await LabReport.find({ patientId: patient._id });
```

#### 2. `/api/lab/history/my` (Line ~1070)
Same pattern applied - lookup Patient first, then query with patient._id

#### 3. `/api/lab/requests/my` (NEW ENDPOINT, Line ~800)
New endpoint created for patients to view their lab requests

## How to Verify It's Working

### 1. Check Server Logs
After restarting, you should see these logs when loading lab reports:

```
[LAB REPORTS] Patient requesting own reports, userId: [user_id]
[LAB REPORTS] Found patient record: [patient_id]
[LAB REPORTS] Found X reports for patient
```

### 2. Check Browser Console
Open DevTools (F12) and look for:
- Network tab: `/api/lab/reports/my` should return `200 OK`
- Console tab: Should NOT see "Failed to fetch report"

### 3. Test All Tabs
In the Lab Reports page, test all 4 tabs:
- ✅ **Reports** - Should show uploaded lab reports
- ✅ **Test Results** - Should show extracted test values
- ✅ **Previous History** - Should show medical documents  
- ✅ **Lab Requests** - Should show lab test requests

## Still Not Working?

### Check 1: Server Actually Restarted?
```powershell
# Check what's running on port 3001
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

# Check when the Node process started
Get-Process -Name node | Select-Object Id, ProcessName, StartTime
```
The StartTime should be AFTER you made the code changes.

### Check 2: Correct Backend URL?
In browser DevTools Console, run:
```javascript
console.log(import.meta.env.VITE_API_URL || 'http://localhost:3001')
```
Should show: `http://localhost:3001`

### Check 3: Valid Auth Token?
In browser DevTools Console, run:
```javascript
console.log('Token:', localStorage.getItem('authToken'))
console.log('Role:', localStorage.getItem('userRole'))
```
Role should be: `patient`

### Check 4: Patient Record Exists?
Connect to MongoDB and check:
```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "patient@example.com" })
// Note the _id

db.patients.findOne({ userId: ObjectId("[user_id_from_above]") })
// This should return a patient record
```

If no patient record exists, that's the problem - the patient user doesn't have a corresponding Patient document.

## Creating Patient Record (If Missing)

If the patient user doesn't have a Patient record:

```javascript
// In MongoDB shell/Compass
db.patients.insertOne({
  userId: ObjectId("[user_id]"),
  name: "Patient Name",
  dateOfBirth: new Date("1990-01-01"),
  gender: "male",  // or "female", "other", "prefer-not-to-say"
  status: "admitted",
  createdBy: ObjectId("[user_id]"),
  updatedBy: ObjectId("[user_id]"),
  assignedNurses: [],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Quick Test Command

After server restart, test the endpoint directly:

```powershell
# Replace [TOKEN] with actual auth token from localStorage
$token = "[YOUR_TOKEN_HERE]"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3001/api/lab/reports/my" -Headers $headers
```

Should return an array of lab reports or empty array `[]`, NOT an error message.

## Summary

**The fix is complete in the code**, but requires:
1. ✅ Code updated (Done)
2. ⏳ **Server restart** (Required - Not done yet)
3. ⏳ Browser refresh (Required)
4. ⏳ Login as patient (Required)

**Next immediate step: RESTART THE BACKEND SERVER**

---

## Files Modified Summary

| File | Status | Changes |
|------|--------|---------|
| `server/src/routes/lab.ts` | ✅ Updated | Fixed 3 endpoints with Patient lookup |
| `src/services/labRequestService.ts` | ✅ Updated | Added getMyLabRequests() method |
| `src/pages/dashboard/LabReports.tsx` | ✅ Updated | Added Lab Requests tab and fetching |

**All code changes are complete. Server restart is the only remaining step.**

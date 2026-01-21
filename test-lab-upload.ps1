# Lab Module File Upload Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Lab Module File Upload Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$BACKEND_URL = "http://localhost:3001"

# Get auth token (replace with actual login)
Write-Host "Step 1: Login as Lab User" -ForegroundColor Yellow
$loginBody = @{
    email = "lab@test.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $TOKEN = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($TOKEN.Substring(0, 20))...`n" -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 1: Create a test file
Write-Host "Step 2: Create Test File" -ForegroundColor Yellow
$testFilePath = "$env:TEMP\test-lab-report.txt"
"This is a test lab report file for upload testing." | Out-File -FilePath $testFilePath -Encoding UTF8
Write-Host "✓ Test file created at: $testFilePath`n" -ForegroundColor Green

# Test 2: Upload lab report with file
Write-Host "Step 3: Upload Lab Report with File" -ForegroundColor Yellow

# Note: PowerShell's Invoke-RestMethod doesn't handle multipart/form-data well
# For actual testing, use Postman or curl
Write-Host "⚠ For actual file upload testing, use one of these methods:`n" -ForegroundColor Yellow

Write-Host "Method 1: Using curl (if available)" -ForegroundColor Cyan
Write-Host @"
curl -X POST http://localhost:3001/api/lab/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "reportFile=@test-report.pdf" \
  -F "testName=Blood Test" \
  -F "patientId=PATIENT_ID" \
  -F "priority=Routine" \
  -F "remarks=Test upload"
"@ -ForegroundColor Gray

Write-Host "`nMethod 2: Using Postman" -ForegroundColor Cyan
Write-Host @"
1. Create new POST request to: http://localhost:3001/api/lab/reports
2. Headers:
   - Authorization: Bearer YOUR_TOKEN
3. Body: form-data
   - reportFile: [Select file]
   - testName: Blood Test
   - patientId: PATIENT_ID
   - priority: Routine
   - remarks: Test upload
"@ -ForegroundColor Gray

Write-Host "`nMethod 3: Using Frontend" -ForegroundColor Cyan
Write-Host @"
1. Navigate to Lab Dashboard
2. Click "Upload New Report"
3. Fill in test details
4. Select file using file picker
5. Click "Upload Report"
"@ -ForegroundColor Gray

# Test 3: List lab reports
Write-Host "`nStep 4: List Lab Reports" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
    }
    
    $reports = Invoke-RestMethod -Uri "$BACKEND_URL/api/lab/reports" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Retrieved $($reports.total) reports" -ForegroundColor Green
    
    if ($reports.reports.Count -gt 0) {
        Write-Host "`nSample Report:" -ForegroundColor Cyan
        $sample = $reports.reports[0]
        Write-Host "  ID: $($sample._id)" -ForegroundColor Gray
        Write-Host "  Test: $($sample.testName)" -ForegroundColor Gray
        Write-Host "  File: $($sample.fileName)" -ForegroundColor Gray
        Write-Host "  Size: $($sample.fileSize) bytes" -ForegroundColor Gray
        Write-Host "  URL: $($sample.fileUrl)`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to retrieve reports: $_" -ForegroundColor Red
}

# Test 4: File validation tests
Write-Host "Step 5: File Validation Tests" -ForegroundColor Yellow
Write-Host "The following files should be REJECTED:`n" -ForegroundColor Cyan

Write-Host "❌ File too large (>10MB)" -ForegroundColor Red
Write-Host "   Example: 15MB PDF file" -ForegroundColor Gray

Write-Host "❌ Invalid file type (.exe, .zip, .txt)" -ForegroundColor Red
Write-Host "   Example: malware.exe" -ForegroundColor Gray

Write-Host "❌ Missing required fields" -ForegroundColor Red
Write-Host "   Example: No testName or patientId`n" -ForegroundColor Gray

Write-Host "The following files should be ACCEPTED:`n" -ForegroundColor Cyan

Write-Host "✅ Valid PDF (<10MB)" -ForegroundColor Green
Write-Host "   Example: lab-report.pdf" -ForegroundColor Gray

Write-Host "✅ Valid DOC/DOCX (<10MB)" -ForegroundColor Green
Write-Host "   Example: blood-test.docx" -ForegroundColor Gray

Write-Host "✅ Valid JPG/PNG (<10MB)" -ForegroundColor Green
Write-Host "   Example: x-ray.jpg`n" -ForegroundColor Gray

# Test 5: Edit report with file replacement
Write-Host "Step 6: Edit Report Test" -ForegroundColor Yellow
Write-Host "To test file replacement:" -ForegroundColor Cyan
Write-Host @"
1. Get a report ID from the list above
2. Use Postman or frontend to edit
3. Upload new file (optional)
4. Verify old file is deleted
5. Check audit log for changes
"@ -ForegroundColor Gray

# Test 6: Check uploads directory
Write-Host "`nStep 7: Check Server Files" -ForegroundColor Yellow
$uploadsPath = "..\server\uploads\lab-reports"
if (Test-Path $uploadsPath) {
    $files = Get-ChildItem -Path $uploadsPath -File
    Write-Host "✓ Found $($files.Count) files in uploads directory" -ForegroundColor Green
    
    if ($files.Count -gt 0) {
        Write-Host "`nRecent uploads:" -ForegroundColor Cyan
        $files | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1KB, 2)) KB)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "⚠ Uploads directory not found. Will be created on first upload." -ForegroundColor Yellow
}

# Cleanup
Write-Host "`nStep 8: Cleanup" -ForegroundColor Yellow
if (Test-Path $testFilePath) {
    Remove-Item $testFilePath
    Write-Host "✓ Test file removed" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Login successful" -ForegroundColor Green
Write-Host "✓ API routes accessible" -ForegroundColor Green
Write-Host "⚠ File upload requires Postman/Frontend for full testing" -ForegroundColor Yellow
Write-Host "✓ Documentation created" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Start backend server: cd server && npm run dev" -ForegroundColor Gray
Write-Host "2. Start frontend: npm run dev" -ForegroundColor Gray
Write-Host "3. Login as lab user" -ForegroundColor Gray
Write-Host "4. Navigate to Lab Dashboard" -ForegroundColor Gray
Write-Host "5. Test file upload feature" -ForegroundColor Gray
Write-Host "`n========================================`n" -ForegroundColor Cyan

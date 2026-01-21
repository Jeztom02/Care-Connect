# Lab Patient Requests - Quick Test Script
# Run this script to test the new Lab Patient Requests feature

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Lab Patient Requests Test Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "Checking if server is accessible..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not accessible at http://localhost:3001" -ForegroundColor Red
    Write-Host "  Please start the server with: cd server; npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Test Scenarios:" -ForegroundColor Cyan
Write-Host "1. Navigate to: http://localhost:5173/dashboard" -ForegroundColor White
Write-Host "2. Login with lab user credentials" -ForegroundColor White
Write-Host "3. Go to 'Lab' → 'Patient reports'" -ForegroundColor White
Write-Host ""

Write-Host "What to test:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "As Doctor/Nurse:" -ForegroundColor Yellow
Write-Host "  ✓ Click 'New Request' button" -ForegroundColor White
Write-Host "  ✓ Fill in patient ID and test details" -ForegroundColor White
Write-Host "  ✓ Select priority (Routine/Urgent/STAT)" -ForegroundColor White
Write-Host "  ✓ Add clinical notes and symptoms" -ForegroundColor White
Write-Host "  ✓ Submit the request" -ForegroundColor White
Write-Host "  ✓ View your created requests in the table" -ForegroundColor White

Write-Host ""
Write-Host "As Lab User:" -ForegroundColor Yellow
Write-Host "  ✓ View all pending requests" -ForegroundColor White
Write-Host "  ✓ Use search and filters" -ForegroundColor White
Write-Host "  ✓ Click 'Update Status' on a request" -ForegroundColor White
Write-Host "  ✓ Change status: Pending → Accepted → Sample Collected → Processing → Completed" -ForegroundColor White
Write-Host "  ✓ Add lab notes when updating status" -ForegroundColor White
Write-Host "  ✓ View detailed request information" -ForegroundColor White

Write-Host ""
Write-Host "Features to verify:" -ForegroundColor Yellow
Write-Host "  ✓ Real-time search across test names and patients" -ForegroundColor White
Write-Host "  ✓ Filter by status (Pending, Accepted, etc.)" -ForegroundColor White
Write-Host "  ✓ Filter by priority (STAT, Urgent, Routine)" -ForegroundColor White
Write-Host "  ✓ Color-coded status and priority badges" -ForegroundColor White
Write-Host "  ✓ Pagination for large datasets" -ForegroundColor White
Write-Host "  ✓ Cancel requests before completion" -ForegroundColor White
Write-Host "  ✓ View complete request history and details" -ForegroundColor White

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "API Endpoints Available:" -ForegroundColor Cyan
Write-Host "  POST   /api/lab/requests              - Create new request" -ForegroundColor White
Write-Host "  GET    /api/lab/requests              - Get all requests (with filters)" -ForegroundColor White
Write-Host "  GET    /api/lab/requests/:id          - Get single request" -ForegroundColor White
Write-Host "  PATCH  /api/lab/requests/:id/status   - Update status (Lab only)" -ForegroundColor White
Write-Host "  PUT    /api/lab/requests/:id          - Update request details" -ForegroundColor White
Write-Host "  DELETE /api/lab/requests/:id          - Cancel request" -ForegroundColor White
Write-Host "  GET    /api/lab/requests/patient/:id  - Get patient's requests" -ForegroundColor White
Write-Host "  GET    /api/lab/requests-stats        - Get statistics" -ForegroundColor White

Write-Host ""
Write-Host "Files Created/Modified:" -ForegroundColor Cyan
Write-Host "  ✓ server/src/models/labRequest.ts" -ForegroundColor Green
Write-Host "  ✓ server/src/models/index.ts (updated)" -ForegroundColor Green
Write-Host "  ✓ server/src/routes/lab.ts (added endpoints)" -ForegroundColor Green
Write-Host "  ✓ src/services/labRequestService.ts" -ForegroundColor Green
Write-Host "  ✓ src/pages/dashboard/LabPatientRequests.tsx" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Status: ✅ READY TO TEST" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to open the application in browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:5173/dashboard"

Write-Host ""
Write-Host "Browser opened! Happy testing! 🎉" -ForegroundColor Green
Write-Host ""

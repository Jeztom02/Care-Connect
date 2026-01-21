# Lab Reports Connection Test Script
# This script tests the lab reports, history, and requests endpoints for patients

$backendUrl = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Lab Reports Connection Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "1. Checking if backend server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method Get -ErrorAction SilentlyContinue
    Write-Host "   ✓ Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend server is not responding" -ForegroundColor Red
    Write-Host "   Please start the server: cd server && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Prompt for authentication token
Write-Host "2. Authentication" -ForegroundColor Yellow
Write-Host "   Please login as a PATIENT user and provide the authentication token" -ForegroundColor White
Write-Host "   (You can find this in localStorage after logging in, or copy from browser dev tools)" -ForegroundColor Gray
Write-Host ""
$token = Read-Host "   Enter patient auth token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "   ✗ No token provided. Exiting." -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host ""

# Test Lab Reports endpoint
Write-Host "3. Testing Lab Reports Endpoint (/api/lab/reports/my)" -ForegroundColor Yellow
try {
    $reports = Invoke-RestMethod -Uri "$backendUrl/api/lab/reports/my" -Method Get -Headers $headers
    $reportCount = if ($reports -is [Array]) { $reports.Count } else { 1 }
    Write-Host "   ✓ Successfully fetched $reportCount lab report(s)" -ForegroundColor Green
    
    if ($reportCount -gt 0) {
        Write-Host "   Sample report:" -ForegroundColor Gray
        $firstReport = if ($reports -is [Array]) { $reports[0] } else { $reports }
        Write-Host "   - Test Name: $($firstReport.testName)" -ForegroundColor Gray
        Write-Host "   - Status: $($firstReport.status)" -ForegroundColor Gray
        Write-Host "   - Date: $($firstReport.date)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Failed to fetch lab reports" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Lab History endpoint
Write-Host "4. Testing Lab History Endpoint (/api/lab/history/my)" -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$backendUrl/api/lab/history/my" -Method Get -Headers $headers
    $historyCount = if ($history -is [Array]) { $history.Count } else { 1 }
    Write-Host "   ✓ Successfully fetched $historyCount history item(s)" -ForegroundColor Green
    
    if ($historyCount -gt 0) {
        Write-Host "   Sample history item:" -ForegroundColor Gray
        $firstHistory = if ($history -is [Array]) { $history[0] } else { $history }
        Write-Host "   - Document Type: $($firstHistory.documentType)" -ForegroundColor Gray
        Write-Host "   - Description: $($firstHistory.description)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Failed to fetch lab history" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Lab Requests endpoint (NEW)
Write-Host "5. Testing Lab Requests Endpoint (/api/lab/requests/my)" -ForegroundColor Yellow
try {
    $requests = Invoke-RestMethod -Uri "$backendUrl/api/lab/requests/my" -Method Get -Headers $headers
    $requestCount = if ($requests -is [Array]) { $requests.Count } else { 1 }
    Write-Host "   ✓ Successfully fetched $requestCount lab request(s)" -ForegroundColor Green
    
    if ($requestCount -gt 0) {
        Write-Host "   Sample lab request:" -ForegroundColor Gray
        $firstRequest = if ($requests -is [Array]) { $requests[0] } else { $requests }
        Write-Host "   - Test Name: $($firstRequest.testName)" -ForegroundColor Gray
        Write-Host "   - Status: $($firstRequest.status)" -ForegroundColor Gray
        Write-Host "   - Priority: $($firstRequest.priority)" -ForegroundColor Gray
        Write-Host "   - Request Date: $($firstRequest.requestDate)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Failed to fetch lab requests" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Login to the patient dashboard in your browser" -ForegroundColor White
Write-Host "2. Navigate to Lab Reports section" -ForegroundColor White
Write-Host "3. Verify all 4 tabs work correctly:" -ForegroundColor White
Write-Host "   - Reports (uploaded lab reports)" -ForegroundColor Gray
Write-Host "   - Test Results (extracted values)" -ForegroundColor Gray
Write-Host "   - Previous History (medical documents)" -ForegroundColor Gray
Write-Host "   - Lab Requests (requested lab tests)" -ForegroundColor Gray
Write-Host "4. Check browser console for [LAB REPORTS] log messages" -ForegroundColor White
Write-Host ""

# Restart Backend Server and Test Lab Reports
# This script stops the old server and starts the new one with updated code

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend Server Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find Node processes on port 3001
Write-Host "1. Finding Node.js processes using port 3001..." -ForegroundColor Yellow
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($port3001) {
    Write-Host "   Found process ID(s): $($port3001 -join ', ')" -ForegroundColor Gray
    Write-Host "   Stopping process(es)..." -ForegroundColor Yellow
    
    foreach ($pid in $port3001) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "   ✓ Stopped process $pid" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ Failed to stop process $pid" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 2
} else {
    Write-Host "   No process found on port 3001" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2. Starting backend server with updated code..." -ForegroundColor Yellow

# Navigate to server directory and start
cd server

# Start the server in a new window
$proc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -PassThru -WindowStyle Normal

Write-Host "   ✓ Server started in new window (PID: $($proc.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "3. Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if server is responding
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Server is responding" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Server may still be starting up..." -ForegroundColor Yellow
    Write-Host "   Check the new PowerShell window for startup logs" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server Restart Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. The server is now running with updated lab routes" -ForegroundColor White
Write-Host "2. Refresh your browser and login as a patient" -ForegroundColor White
Write-Host "3. Navigate to Lab Reports section" -ForegroundColor White
Write-Host "4. The reports should now load correctly" -ForegroundColor White
Write-Host ""
Write-Host "To test the endpoint manually, run:" -ForegroundColor Yellow
Write-Host "   .\\test-lab-connection.ps1" -ForegroundColor Gray
Write-Host ""

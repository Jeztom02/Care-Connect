# Development Startup Script for Windows PowerShell
# This script starts both frontend and backend servers

Write-Host "🚀 Starting Care Connect Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
Write-Host ""
Write-Host "📊 Checking MongoDB connection..." -ForegroundColor Yellow
Write-Host "   Make sure MongoDB is running or you have a MongoDB Atlas connection string in server/.env" -ForegroundColor Gray

# Start Backend Server
Write-Host ""
Write-Host "🔧 Starting Backend Server (Port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✨ Development servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "🔌 Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "🏥 API Docs: http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Gray

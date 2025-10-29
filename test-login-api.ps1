$body = @{
    email = 'doctor@care.local'
    password = 'doctor123'
} | ConvertTo-Json

Write-Host "Testing login with doctor@care.local..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType 'application/json'
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, 20))..."
    Write-Host "User: $($response.user.name) ($($response.user.role))"
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error: $($_.ErrorDetails.Message)"
}

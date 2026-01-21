# Test equipment buy flow: register doctor, create equipment, register patient, buy
$base = 'http://localhost:3001'
function Register($name,$email,$password,$role,$phone){
  $body = @{name=$name; email=$email; password=$password; role=$role; phone=$phone} | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -Body $body -ContentType 'application/json' } catch { Write-Error "Register failed: $($_.Exception.Message)"; return $null }
}
function Login($email,$password){
  $body = @{email=$email; password=$password} | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -Body $body -ContentType 'application/json' } catch { Write-Error "Login failed: $($_.Exception.Message)"; return $null }
}
function CreateEquipment($token,$data){
  $body = $data | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$base/api/equipment" -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } } catch { Write-Error "Create equipment failed: $($_.Exception.Message)"; return $null }
}
function BuyEquipment($token,$id){
  try { Invoke-RestMethod -Uri "$base/api/equipment/$id/buy" -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } } catch { Write-Error "Buy failed: $($_.Exception.Message)"; return $null }
}

# Register doctor
$doc = Register 'Dr Test' 'drtest@example.com' 'Passw0rd!' 'doctor' '+10000000001'
Write-Output "Doctor register: $($doc | ConvertTo-Json -Compress)"
# Login doctor
$docLogin = Login 'drtest@example.com' 'Passw0rd!'
Write-Output "Doctor login: $($docLogin | ConvertTo-Json -Compress)"
$docToken = $docLogin.token

# Create equipment as doctor (should be auto-verified)
$equip = CreateEquipment $docToken @{ name='Test Oxygen Cylinder'; description='Used, good condition'; category='Oxygen Cylinder'; condition='Used'; price=150; images=@(); location='TestCity'; contactPhone='+10000000001' }
Write-Output "Created equipment: $($equip | ConvertTo-Json -Compress)"
$equipId = $equip._id

# Register patient
$pat = Register 'Patient One' 'patient1@example.com' 'PatientPass1!' 'patient' '+10000000002'
Write-Output "Patient register: $($pat | ConvertTo-Json -Compress)"
# Login patient
$patLogin = Login 'patient1@example.com' 'PatientPass1!'
Write-Output "Patient login: $($patLogin | ConvertTo-Json -Compress)"
$patToken = $patLogin.token

# Patient buys equipment
$buy = BuyEquipment $patToken $equipId
Write-Output "Buy response: $($buy | ConvertTo-Json -Compress)"

# Fetch equipment detail to verify status
try { $detail = Invoke-RestMethod -Uri "$base/api/equipment/$equipId" -Method Get; Write-Output "Equipment detail after purchase: $($detail | ConvertTo-Json -Compress)" } catch { Write-Error "Fetch detail failed: $($_.Exception.Message)" }

Write-Output 'TEST_DONE'

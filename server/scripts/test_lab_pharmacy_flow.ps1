# Smoke test: Lab + Pharmacy + Prescription + Payment flows
$base = 'http://localhost:3001'
function Register($name,$email,$password,$role,$phone){
  $body = @{name=$name; email=$email; password=$password; role=$role; phone=$phone} | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -Body $body -ContentType 'application/json' } catch { Write-Error "Register failed: $($_.Exception.Message)"; return $null }
}
function Login($email,$password){
  $body = @{email=$email; password=$password} | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -Body $body -ContentType 'application/json' } catch { Write-Error "Login failed: $($_.Exception.Message)"; return $null }
}
function CreateMedicine($token,$data){
  $body = $data | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$base/api/pharmacy/medicines" -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } } catch { Write-Error "Create medicine failed: $($_.Exception.Message)"; return $null }
}
function CreatePrescription($token,$data){
  $body = $data | ConvertTo-Json -Depth 10
  try { Invoke-RestMethod -Uri "$base/api/prescriptions" -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } } catch { Write-Error "Create prescription failed: $($_.Exception.Message)"; return $null }
}
function PayPrescription($token,$data){
  $body = $data | ConvertTo-Json
  try { Invoke-RestMethod -Uri "$base/api/payments/medicines" -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } } catch { Write-Error "Payment failed: $($_.Exception.Message)"; return $null }
}
function UploadReport($token,$data){
  $body = $data | ConvertTo-Json -Depth 6
  try { Invoke-RestMethod -Uri "$base/api/lab/reports" -Method Post -Body $body -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } } catch { Write-Error "Upload report failed: $($_.Exception.Message)"; return $null }
}

Write-Output "--- Starting Lab+Pharmacy smoke test ---"

# Register pharmacy
$ph = Register 'Pharmacy One' 'pharmacy1@example.com' 'PharmPass1!' 'pharmacy' '+10000001001'
Write-Output "Pharmacy register: $($ph | ConvertTo-Json -Compress)"
$phLogin = Login 'pharmacy1@example.com' 'PharmPass1!'
Write-Output "Pharmacy login: $($phLogin | ConvertTo-Json -Compress)"
$phToken = $phLogin.token

# Register lab
$lab = Register 'Lab One' 'lab1@example.com' 'LabPass1!' 'lab' '+10000002001'
Write-Output "Lab register: $($lab | ConvertTo-Json -Compress)"
$labLogin = Login 'lab1@example.com' 'LabPass1!'
Write-Output "Lab login: $($labLogin | ConvertTo-Json -Compress)"
$labToken = $labLogin.token

# Register doctor
$doc = Register 'Dr Smoke' 'drsmoke@example.com' 'DocPass1!' 'doctor' '+10000003001'
Write-Output "Doctor register: $($doc | ConvertTo-Json -Compress)"
$docLogin = Login 'drsmoke@example.com' 'DocPass1!'
Write-Output "Doctor login: $($docLogin | ConvertTo-Json -Compress)"
$docToken = $docLogin.token

# Register patient
$pat = Register 'Patient Smoke' 'patsmoke@example.com' 'PatPass1!' 'patient' '+10000004001'
Write-Output "Patient register: $($pat | ConvertTo-Json -Compress)"
$patLogin = Login 'patsmoke@example.com' 'PatPass1!'
Write-Output "Patient login: $($patLogin | ConvertTo-Json -Compress)"
$patToken = $patLogin.token

# Get patient record id
try { $patientRecord = Invoke-RestMethod -Uri "$base/api/patients/me/self" -Method Get -Headers @{ Authorization = "Bearer $patToken" }; Write-Output "Patient record: $($patientRecord | ConvertTo-Json -Compress)" } catch { Write-Error "Failed to fetch patient record: $($_.Exception.Message)"; exit 1 }
$patientId = $patientRecord._id

# Pharmacy creates medicine
$med = CreateMedicine $phToken @{ name='TestMed A'; description='Test pain relief'; sku='TM-A-001'; price=12.5; stock=100; unit='pcs' }
Write-Output "Created medicine: $($med | ConvertTo-Json -Compress)"
$medId = $med._id

# Doctor prescribes medicine (uses medicine id from pharmacy inventory)
$presc = CreatePrescription $docToken @{ patientId = $patientId; items = @(@{ medication = $medId; dosage = '1 tablet'; frequency = 'Once daily'; duration = '5 days' }) }
Write-Output "Prescription create: $($presc | ConvertTo-Json -Compress)"
$prescId = $presc._id

# Patient pays for prescription
$payment = PayPrescription $patToken @{ prescriptionId = $prescId; paymentMethod = 'Credit Card' }
Write-Output "Payment response: $($payment | ConvertTo-Json -Compress)"

# Lab uploads a test report for patient
$report = UploadReport $labToken @{ testName = 'CBC'; patientId = $patientId; doctorId = $doc._id; fileUrl = 'https://example.com/reports/cbc.pdf'; resultValues = @{ WBC = 5.6; RBC = 4.7 }; remarks = 'Within normal limits' }
Write-Output "Uploaded report: $($report | ConvertTo-Json -Compress)"

# Negative test: Pharmacy attempts to create a prescription (should be forbidden)
try { $bad = CreatePrescription $phToken @{ patientId = $patientId; items = @(@{ medication = $medId; dosage = '1'; frequency = 'Once' }) }; Write-Error "Pharmacy was able to create prescription unexpectedly: $($bad | ConvertTo-Json -Compress)" } catch { Write-Output "Expected forbidden: pharmacy cannot prescribe. Error: $($_.Exception.Message)" }

Write-Output 'SMOKE_TEST_DONE'

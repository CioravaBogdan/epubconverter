# Test script pentru conversie PDF to MOBI
$ErrorActionPreference = "Stop"

$apiUrl = "http://localhost:3000/api/convert/single"
$pdfFile = "E:\Projects\ConvertPDF\Book On .pdf"
$boundary = [System.Guid]::NewGuid().ToString()

Write-Host "Testing PDF to MOBI conversion..." -ForegroundColor Green
Write-Host "API URL: $apiUrl" -ForegroundColor Yellow

try {
    # Citește fișierul
    $fileBytes = [System.IO.File]::ReadAllBytes($pdfFile)
    $fileContent = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes)
    
    # Construiește body-ul multipart/form-data
    $LF = "`r`n"
    $bodyLines = @()
    
    # File field
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"file`"; filename=`"Book On .pdf`""
    $bodyLines += "Content-Type: application/pdf"
    $bodyLines += ""
    $bodyLines += $fileContent
    
    # Format field pentru MOBI
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"format`""
    $bodyLines += ""
    $bodyLines += "mobi"
    
    # End boundary
    $bodyLines += "--$boundary--"
    $bodyLines += ""
    
    $body = $bodyLines -join $LF
    
    Write-Host "Sending MOBI conversion request..." -ForegroundColor Yellow
    
    # Trimite cererea
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
        -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body)) `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -TimeoutSec 300 `
        -UseBasicParsing
    
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Content:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

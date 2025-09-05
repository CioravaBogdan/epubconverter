# Test script pentru conversie PDF -> EPUB + MOBI + PDF original
$ErrorActionPreference = "Stop"

$apiUrl = "http://localhost:3000/convert/single"
$pdfFile = "e:\Aplciatii Docker\ConvertPDF\Book On .pdf"
$boundary = [System.Guid]::NewGuid().ToString()

Write-Host "Testing PDF to ALL formats (EPUB + MOBI + Original PDF)..." -ForegroundColor Green
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
    
    # Format field pentru BOTH (EPUB + MOBI)
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"format`""
    $bodyLines += ""
    $bodyLines += "both"
    
    # Include Original field pentru PDF
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"includeOriginal`""
    $bodyLines += ""
    $bodyLines += "true"
    
    # Template field
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"template`""
    $bodyLines += ""
    $bodyLines += "mobile"
    
    # End boundary
    $bodyLines += "--$boundary--"
    $bodyLines += ""
    
    $body = $bodyLines -join $LF
    
    Write-Host "Sending conversion request (format=both + includeOriginal=true)..." -ForegroundColor Yellow
    
    # Trimite cererea
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
        -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body)) `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -TimeoutSec 300 `
        -UseBasicParsing
    
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Content:" -ForegroundColor Green
    $responseJson = $response.Content | ConvertFrom-Json
    
    Write-Host "Success: $($responseJson.success)" -ForegroundColor Green
    Write-Host "Job ID: $($responseJson.jobId)" -ForegroundColor Yellow
    Write-Host "Files generated:" -ForegroundColor Green
    
    foreach ($file in $responseJson.files) {
        Write-Host "  - $($file.filename) ($($file.format)) - Size: $([math]::Round($file.size/1MB, 2)) MB" -ForegroundColor White
        Write-Host "    Download: http://localhost:3000$($file.downloadUrl)" -ForegroundColor Cyan
    }
    
    if ($responseJson.zipDownload) {
        Write-Host "ZIP Download: http://localhost:3000$($responseJson.zipDownload)" -ForegroundColor Magenta
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
        $reader.Close()
    }
    Write-Host "Full Exception: $($_ | Out-String)" -ForegroundColor Red
}

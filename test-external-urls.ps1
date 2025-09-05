# Test script pentru a vedea răspunsul JSON complet cu URL-urile externe
$ErrorActionPreference = "Stop"

$apiUrl = "http://localhost:3000/convert/single"
$pdfFile = "e:\Aplciatii Docker\ConvertPDF\Book On .pdf"
$boundary = [System.Guid]::NewGuid().ToString()

Write-Host "Testing cu simulare header Cloudflare..." -ForegroundColor Green

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
    
    # Format field pentru BOTH
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"format`""
    $bodyLines += ""
    $bodyLines += "both"
    
    # Include Original
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"includeOriginal`""
    $bodyLines += ""
    $bodyLines += "true"
    
    # End boundary
    $bodyLines += "--$boundary--"
    $bodyLines += ""
    
    $body = $bodyLines -join $LF
    
    # Header pentru simulare Cloudflare
    $headers = @{
        'CF-Ray' = 'simulated-ray-id'
        'X-Forwarded-For' = '1.2.3.4'
    }
    
    Write-Host "Sending request cu headers Cloudflare simulate..." -ForegroundColor Yellow
    
    # Trimite cererea
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST `
        -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body)) `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Headers $headers `
        -TimeoutSec 300 `
        -UseBasicParsing
    
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Raw JSON Response:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor White
    
    # Parse JSON pentru a vedea structura
    $responseJson = $response.Content | ConvertFrom-Json
    Write-Host "`nFiles cu URL-uri complete:" -ForegroundColor Green
    foreach ($file in $responseJson.files) {
        Write-Host "  File: $($file.filename)" -ForegroundColor White
        Write-Host "    downloadUrl: $($file.downloadUrl)" -ForegroundColor Cyan
        if ($file.fullDownloadUrl) {
            Write-Host "    fullDownloadUrl: $($file.fullDownloadUrl)" -ForegroundColor Magenta
        }
    }
    
    if ($responseJson.zipDownload) {
        Write-Host "`nZIP Downloads:" -ForegroundColor Green
        Write-Host "  zipDownload: $($responseJson.zipDownload)" -ForegroundColor Cyan
        if ($responseJson.fullZipDownload) {
            Write-Host "  fullZipDownload: $($responseJson.fullZipDownload)" -ForegroundColor Magenta
        }
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# Simple PowerShell test script for Ebook Converter API
param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$PdfFile = "E:\Projects\ConvertPDF\Book On .pdf",
    [string]$Format = "both"
)

Write-Host "TESTING EBOOK CONVERTER API" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

if (-not (Test-Path $PdfFile)) {
    Write-Host "ERROR: PDF file not found: $PdfFile" -ForegroundColor Red
    exit 1
}

# Test Health Check
Write-Host ""
Write-Host "1. HEALTH CHECK TEST" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/health"
    Write-Host "SUCCESS: API is healthy" -ForegroundColor Green
    Write-Host "Status: $($health.status)" -ForegroundColor White
} catch {
    Write-Host "ERROR: API not responding" -ForegroundColor Red
    exit 1
}

# Test Conversion
Write-Host ""
Write-Host "2. PDF CONVERSION TEST" -ForegroundColor Yellow

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

try {
    $fileContent = [System.IO.File]::ReadAllBytes($PdfFile)
    
    $body = (
        "--$boundary$LF" +
        "Content-Disposition: form-data; name=`"file`"; filename=`"$(Split-Path $PdfFile -Leaf)`"$LF" +
        "Content-Type: application/pdf$LF$LF"
    )
    $body += [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileContent)
    $body += "$LF--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"format`"$LF$LF"
    $body += "$Format$LF--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"title`"$LF$LF"
    $body += "Test Book$LF--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"author`"$LF$LF"
    $body += "Test Author$LF--$boundary--$LF"
    
    Write-Host "Uploading and converting PDF..." -ForegroundColor White
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/convert/single" -Method Post -Body $body -ContentType "multipart/form-data; boundary=$boundary"
    
    Write-Host "SUCCESS: Conversion completed" -ForegroundColor Green
    Write-Host "Job ID: $($response.jobId)" -ForegroundColor White
    Write-Host "Files generated: $($response.files.Count)" -ForegroundColor White
    
    foreach($file in $response.files) {
        Write-Host "  - $($file.filename) ($($file.size) bytes)" -ForegroundColor White
    }
    
} catch {
    Write-Host "ERROR: Conversion failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Test Download
Write-Host ""
Write-Host "3. FILE DOWNLOAD TEST" -ForegroundColor Yellow

$downloadDir = "E:\Projects\ConvertPDF\downloads"
if (-not (Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null
}

foreach($file in $response.files) {
    $downloadUrl = "$ApiUrl$($file.downloadUrl)"
    $outputPath = Join-Path $downloadDir $file.filename
    
    try {
        Write-Host "Downloading: $($file.filename)" -ForegroundColor White
        Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath
        $size = (Get-Item $outputPath).Length
        Write-Host "SUCCESS: Downloaded $size bytes to $outputPath" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Download failed for $($file.filename)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "ALL TESTS COMPLETED SUCCESSFULLY!" -ForegroundColor Green

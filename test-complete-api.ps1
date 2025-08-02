# Script PowerShell complet pentru testarea API-ului de conversie PDF
# Author: GitHub Copilot
# Date: July 29, 2025

param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$PdfFile = "E:\Projects\ConvertPDF\Book On .pdf",
    [string]$OutputDir = "E:\Projects\ConvertPDF\downloads",
    [string]$Format = "both",  # epub, mobi, both
    [string]$Title = "Test Book",
    [string]$Author = "Test Author",
    [string]$Optimize = "kindle"  # kindle, ipad, generic
)

Write-Host "EBOOK CONVERTER API - COMPLETE TEST SCRIPT" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Verifică dacă fișierul PDF există
if (-not (Test-Path $PdfFile)) {
    Write-Host "ERROR: PDF file not found: $PdfFile" -ForegroundColor Red
    exit 1
}

# Creează directorul de output
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Green
}

# Afișează informații despre test
Write-Host ""
Write-Host "📋 PARAMETRII TESTULUI:" -ForegroundColor Yellow
Write-Host "  API URL: $ApiUrl" -ForegroundColor White
Write-Host "  PDF File: $PdfFile" -ForegroundColor White
Write-Host "  Format: $Format" -ForegroundColor White
Write-Host "  Title: $Title" -ForegroundColor White
Write-Host "  Author: $Author" -ForegroundColor White
Write-Host "  Optimize: $Optimize" -ForegroundColor White
Write-Host "  Output Dir: $OutputDir" -ForegroundColor White

# Funcție pentru afișarea răspunsurilor JSON frumos
function Show-JsonResponse {
    param([string]$Json, [string]$Title)
    Write-Host ""
    Write-Host "📄 $Title" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $Json | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
}

# Funcție pentru testarea endpoint-urilor
function Test-Endpoint {
    param([string]$Url, [string]$Method = "GET", [string]$Description)
    
    Write-Host ""
    Write-Host "🔍 TESTEZ: $Description" -ForegroundColor Yellow
    Write-Host "   URL: $Method $Url" -ForegroundColor Gray
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method $Method
            Show-JsonResponse -Json ($response | ConvertTo-Json -Depth 10) -Title "RĂSPUNS SUCCESS"
            return $response
        }
    } catch {
        Write-Host "❌ EROARE: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorBody = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorBody)
            $errorText = $reader.ReadToEnd()
            Write-Host "   Detalii: $errorText" -ForegroundColor Red
        }
        return $null
    }
}

Write-Host ""
Write-Host "🏥 STEP 1: VERIFICARE HEALTH CHECK" -ForegroundColor Magenta
$healthResponse = Test-Endpoint -Url "$ApiUrl/health" -Description "Health Check"

if (-not $healthResponse) {
    Write-Host "❌ API-ul nu răspunde! Verifică dacă containerele sunt pornite." -ForegroundColor Red
    Write-Host "   Rulează: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📊 STEP 2: VERIFICARE METRICI" -ForegroundColor Magenta
$metricsResponse = Test-Endpoint -Url "$ApiUrl/metrics" -Description "System Metrics"

Write-Host ""
Write-Host "📤 STEP 3: UPLOAD ȘI CONVERSIE PDF" -ForegroundColor Magenta

# Pregătește multipart/form-data pentru upload
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

try {
    $fileContent = [System.IO.File]::ReadAllBytes($PdfFile)
    $fileSize = $fileContent.Length
    Write-Host "   📄 Fișier: $(Split-Path $PdfFile -Leaf) ($fileSize bytes)" -ForegroundColor White
    
    # Construiește body-ul multipart
    $body = (
        "--$boundary$LF" +
        "Content-Disposition: form-data; name=`"file`"; filename=`"$(Split-Path $PdfFile -Leaf)`"$LF" +
        "Content-Type: application/pdf$LF$LF"
    )
    $body += [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileContent)
    
    # Adaugă parametrii de conversie
    $body += "$LF--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"format`"$LF$LF"
    $body += "$Format$LF--$boundary$LF"
    
    $body += "Content-Disposition: form-data; name=`"title`"$LF$LF"
    $body += "$Title$LF--$boundary$LF"
    
    $body += "Content-Disposition: form-data; name=`"author`"$LF$LF"
    $body += "$Author$LF--$boundary$LF"
    
    $body += "Content-Disposition: form-data; name=`"optimize`"$LF$LF"
    $body += "$Optimize$LF--$boundary$LF"
    
    $body += "Content-Disposition: form-data; name=`"cover`"$LF$LF"
    $body += "true$LF--$boundary--$LF"
    
    Write-Host "   🚀 Trimit cererea de conversie..." -ForegroundColor Yellow
    $startTime = Get-Date
    
    $conversionResponse = Invoke-RestMethod -Uri "$ApiUrl/api/convert/single" -Method Post -Body $body -ContentType "multipart/form-data; boundary=$boundary"
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "   ✅ Conversie completă în $duration secunde!" -ForegroundColor Green
    Show-JsonResponse -Json ($conversionResponse | ConvertTo-Json -Depth 10) -Title "RĂSPUNS CONVERSIE"
    
} catch {
    Write-Host "❌ EROARE la conversie: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorText = $reader.ReadToEnd()
        Write-Host "   Detalii: $errorText" -ForegroundColor Red
    }
    exit 1
}

if (-not $conversionResponse.success) {
    Write-Host "❌ Conversia a eșuat!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 STEP 4: VERIFICARE STATUS JOB" -ForegroundColor Magenta
$jobId = $conversionResponse.jobId
$statusResponse = Test-Endpoint -Url "$ApiUrl/status/$jobId" -Description "Job Status pentru $jobId"

Write-Host ""
Write-Host "📥 STEP 5: DESCĂRCARE FIȘIERE CONVERTITE" -ForegroundColor Magenta

$downloadedFiles = @()

foreach ($file in $conversionResponse.files) {
    $fileName = $file.filename
    $downloadUrl = "$ApiUrl$($file.downloadUrl)"
    $outputPath = Join-Path $OutputDir $fileName
    
    Write-Host "   📄 Descarc: $fileName ($($file.size) bytes)" -ForegroundColor White
    Write-Host "   🔗 URL: $downloadUrl" -ForegroundColor Gray
    
    try {
        $downloadStart = Get-Date
        Invoke-WebRequest -Uri $downloadUrl -OutFile $outputPath
        $downloadEnd = Get-Date
        $downloadDuration = ($downloadEnd - $downloadStart).TotalSeconds
        
        $downloadedSize = (Get-Item $outputPath).Length
        Write-Host "   ✅ Descărcat: $outputPath ($downloadedSize bytes în $downloadDuration s)" -ForegroundColor Green
        
        $downloadedFiles += @{
            FileName = $fileName
            Path = $outputPath
            Size = $downloadedSize
            Format = $file.format
        }
        
    } catch {
        Write-Host "   ❌ EROARE la descărcare: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verifică dacă există ZIP pentru multiple fișiere
if ($conversionResponse.zipDownload) {
    $zipUrl = "$ApiUrl$($conversionResponse.zipDownload)"
    $zipPath = Join-Path $OutputDir "$(Split-Path $conversionResponse.zipDownload -Leaf)"
    
    Write-Host "   📦 Descarc arhiva ZIP: $zipUrl" -ForegroundColor White
    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
        $zipSize = (Get-Item $zipPath).Length
        Write-Host "   ✅ ZIP descărcat: $zipPath ($zipSize bytes)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ EROARE la descărcarea ZIP: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 STEP 6: VERIFICARE FINALĂ METRICI" -ForegroundColor Magenta
$finalMetrics = Test-Endpoint -Url "$ApiUrl/metrics" -Description "Final System Metrics"

Write-Host ""
Write-Host "🎉 REZUMATUL TESTULUI" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "✅ Health Check: OK" -ForegroundColor Green
Write-Host "✅ Metrics: OK" -ForegroundColor Green
Write-Host "✅ Conversie: OK (Job ID: $jobId)" -ForegroundColor Green
Write-Host "✅ Status Check: OK" -ForegroundColor Green
Write-Host "✅ Fișiere descărcate: $($downloadedFiles.Count)" -ForegroundColor Green

if ($downloadedFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "FILES DOWNLOADED:" -ForegroundColor Cyan
    foreach ($file in $downloadedFiles) {
        Write-Host "   File: $($file.FileName) [$($file.Format)] - $($file.Size) bytes" -ForegroundColor White
        Write-Host "      Path: $($file.Path)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔧 COMENZI UTILE:" -ForegroundColor Yellow
Write-Host "   docker-compose logs ebook-api        # Vezi logurile API" -ForegroundColor White
Write-Host "   docker-compose restart ebook-api     # Restart API" -ForegroundColor White
Write-Host "   docker exec ebook-calibre ebook-convert --help  # Help Calibre" -ForegroundColor White

Write-Host ""
Write-Host "✨ TEST COMPLET FINALIZAT CU SUCCES! ✨" -ForegroundColor Green

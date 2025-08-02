@echo off
setlocal EnableDelayedExpansion

:: Script de instalare pentru Windows
:: Ebook Converter - PDF to EPUB/MOBI

title Ebook Converter Setup

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  📚 EBOOK CONVERTER SETUP                    ║
echo ║              PDF → EPUB/MOBI Conversion System               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Check Docker
echo [INFO] Verificare Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker nu este instalat! Te rog instalează Docker Desktop.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker nu rulează! Te rog pornește Docker Desktop.
    pause
    exit /b 1
)

echo [SUCCESS] Docker este disponibil și rulează

:: Check Docker Compose
echo [INFO] Verificare Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose nu este instalat!
        pause
        exit /b 1
    )
)

echo [SUCCESS] Docker Compose este disponibil

:: Check ports
echo [INFO] Verificare porturi disponibile...
netstat -an | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Portul 3000 pare să fie ocupat. Continuăm oricum...
)

netstat -an | findstr ":6379" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Portul 6379 pare să fie ocupat. Continuăm oricum...
)

:: Create directories
echo [INFO] Crearea directoarelor...
if not exist "storage" mkdir storage
if not exist "storage\input" mkdir storage\input
if not exist "storage\output" mkdir storage\output
if not exist "storage\temp" mkdir storage\temp
if not exist "logs" mkdir logs

echo [SUCCESS] Directoarele au fost create

:: Generate API key if .env doesn't exist
if not exist ".env" (
    echo [INFO] Generarea cheii API...
    
    :: Generate random API key
    set "API_KEY=ebook-api-key-%RANDOM%%RANDOM%%RANDOM%"
    
    echo # Ebook Converter Configuration > .env
    echo API_KEY=!API_KEY! >> .env
    echo NODE_ENV=production >> .env
    echo MAX_FILE_SIZE=104857600 >> .env
    echo CLEANUP_INTERVAL=86400 >> .env
    echo RATE_LIMIT=100 >> .env
    echo LOG_LEVEL=info >> .env
    echo. >> .env
    echo # Optional: Email configuration >> .env
    echo SMTP_HOST= >> .env
    echo SMTP_PORT=587 >> .env
    echo SMTP_USER= >> .env
    echo SMTP_PASS= >> .env
    echo SMTP_FROM_EMAIL= >> .env
    echo. >> .env
    echo # Optional: Google Drive integration >> .env
    echo GOOGLE_DRIVE_FOLDER_ID= >> .env
    echo. >> .env
    echo # Default notification email >> .env
    echo DEFAULT_NOTIFICATION_EMAIL=your-email@example.com >> .env
    
    echo [SUCCESS] Fișierul .env a fost creat cu API key: !API_KEY!
    echo [WARNING] Te rog editează .env pentru configurări suplimentare
) else (
    echo [INFO] Fișierul .env există deja
)

:: Build and start containers
echo [INFO] Building și pornirea containerelor...
echo [INFO] Acest pas poate dura câteva minute pentru prima dată...

:: Stop existing containers
docker-compose down >nul 2>&1

:: Build and start
docker-compose up -d --build
if errorlevel 1 (
    echo [ERROR] Eroare la pornirea containerelor
    pause
    exit /b 1
)

echo [SUCCESS] Containerele au fost pornite cu succes!

:: Wait for services
echo [INFO] Așteptarea pornirii serviciilor...
timeout /t 10 /nobreak >nul

:: Check services
echo [INFO] Verificarea serviciilor...

:: Check API
curl -s -f http://localhost:3000/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] ✅ API este funcțional
) else (
    echo [WARNING] ⚠️  API nu răspunde încă, poate fi încă în curs de pornire
)

:: Check Calibre
docker exec ebook-calibre calibre --version >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] ✅ Calibre este funcțional
) else (
    echo [WARNING] ⚠️  Calibre nu răspunde încă
)

:: Check Redis
docker exec ebook-redis redis-cli ping >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] ✅ Redis este funcțional
) else (
    echo [WARNING] ⚠️  Redis nu răspunde încă
)

:: Final information
echo.
echo 🎉 INSTALAREA A FOST FINALIZATĂ CU SUCCES! 🎉
echo.

echo 📊 Informații de acces:
echo • API URL: http://localhost:3000
echo • Health Check: http://localhost:3000/health
echo • Metrics: http://localhost:3000/metrics
echo.

echo 🔑 Autentificare:
for /f "tokens=2 delims==" %%a in ('findstr "API_KEY" .env 2^>nul') do echo • API Key: %%a
echo.

echo 📁 Directoare:
echo • Input PDFs: .\storage\input\
echo • Output files: .\storage\output\
echo • Logs: .\logs\
echo.

echo 💡 Comenzi utile:
echo • Oprește sistemul: docker-compose down
echo • Repornește: docker-compose up -d
echo • Vezi logs: docker-compose logs -f
echo • Cleanup: docker-compose down ^&^& docker system prune -f
echo.

echo 🧪 Test rapid:
echo curl -X POST ^
echo   -H "x-api-key: YOUR_API_KEY" ^
echo   -F "file=@your-book.pdf" ^
echo   -F "format=both" ^
echo   -F "title=My Book" ^
echo   http://localhost:3000/api/convert/single
echo.

echo 📖 Documentație completă:
echo • README.md - Ghid complet de utilizare
echo • n8n-flows\ - Flow-uri gata pentru n8n
echo.

echo Sistemul este gata de utilizare! 🚀

:: Open browser
set /p "open_browser=Deschid browser-ul cu health check? (y/N): "
if /i "!open_browser!"=="y" (
    start http://localhost:3000/health
)

pause

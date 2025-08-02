#!/bin/bash

# Script de instalare one-liner pentru Ebook Converter
# Automatizează întregul setup și configurare

set -e

# Colors pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funcții helper
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  📚 EBOOK CONVERTER SETUP                    ║"
echo "║              PDF → EPUB/MOBI Conversion System               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verifică Docker
log_info "Verificare Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker nu este instalat! Te rog instalează Docker Desktop."
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker nu rulează! Te rog pornește Docker Desktop."
    exit 1
fi

log_success "Docker este disponibil și rulează"

# Verifică Docker Compose
log_info "Verificare Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose nu este instalat!"
    exit 1
fi

log_success "Docker Compose este disponibil"

# Verifică porturile
log_info "Verificare porturi disponibile..."
if netstat -an 2>/dev/null | grep -q ":3000.*LISTEN" || ss -ln 2>/dev/null | grep -q ":3000"; then
    log_warning "Portul 3000 pare să fie ocupat. Continuăm oricum..."
fi

if netstat -an 2>/dev/null | grep -q ":6379.*LISTEN" || ss -ln 2>/dev/null | grep -q ":6379"; then
    log_warning "Portul 6379 pare să fie ocupat. Continuăm oricum..."
fi

# Creează directoarele necesare
log_info "Crearea directoarelor..."
mkdir -p storage/input storage/output storage/temp logs

# Setează permisiunile
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "cygwin" ]]; then
    chmod 755 storage/
    chmod 777 storage/input storage/output storage/temp
fi

log_success "Directoarele au fost create"

# Generează API key dacă nu există
if [ ! -f .env ]; then
    log_info "Generarea cheii API..."
    API_KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32 || echo "your-secret-api-key-$(date +%s)")
    
    cat > .env << EOF
# Ebook Converter Configuration
API_KEY=${API_KEY}
NODE_ENV=production
MAX_FILE_SIZE=104857600
CLEANUP_INTERVAL=86400
RATE_LIMIT=100
LOG_LEVEL=info

# Optional: Email configuration
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=

# Optional: Google Drive integration
GOOGLE_DRIVE_FOLDER_ID=

# Default notification email
DEFAULT_NOTIFICATION_EMAIL=your-email@example.com
EOF

    log_success "Fișierul .env a fost creat cu API key: ${API_KEY}"
    log_warning "Te rog editează .env pentru configurări suplimentare (email, Google Drive, etc.)"
else
    log_info "Fișierul .env există deja"
fi

# Update docker-compose.yml să folosească .env
if ! grep -q "env_file:" docker-compose.yml; then
    log_info "Actualizarea docker-compose.yml pentru .env..."
    
    # Backup
    cp docker-compose.yml docker-compose.yml.backup
    
    # Adaugă env_file la serviciul ebook-api
    sed -i '/ebook-api:/a\    env_file:\n      - .env' docker-compose.yml
fi

# Build și start containerele
log_info "Building și pornirea containerelor..."
log_info "Acest pas poate dura câteva minute pentru prima dată..."

# Oprește containerele existente dacă rulează
docker-compose down 2>/dev/null || true

# Build și pornește
if docker-compose up -d --build; then
    log_success "Containerele au fost pornite cu succes!"
else
    log_error "Eroare la pornirea containerelor"
    exit 1
fi

# Așteaptă ca serviciile să pornească
log_info "Așteptarea pornirii serviciilor..."
sleep 10

# Verifică health-ul serviciilor
log_info "Verificarea serviciilor..."

# Check API
if curl -s -f http://localhost:3000/health > /dev/null; then
    log_success "✅ API este funcțional"
else
    log_warning "⚠️  API nu răspunde încă, poate fi încă în curs de pornire"
fi

# Check Calibre
if docker exec ebook-calibre calibre --version > /dev/null 2>&1; then
    log_success "✅ Calibre este funcțional"
else
    log_warning "⚠️  Calibre nu răspunde încă"
fi

# Check Redis
if docker exec ebook-redis redis-cli ping > /dev/null 2>&1; then
    log_success "✅ Redis este funcțional"
else
    log_warning "⚠️  Redis nu răspunde încă"
fi

# Test conversie rapidă dacă avem un PDF de test
if [ -f "test.pdf" ]; then
    log_info "Testarea conversiei cu fișierul test.pdf..."
    
    # Get API key from .env
    source .env 2>/dev/null || API_KEY="your-secret-api-key-here"
    
    if curl -s -X POST \
        -H "x-api-key: ${API_KEY}" \
        -F "file=@test.pdf" \
        -F "format=epub" \
        -F "title=Test Book" \
        http://localhost:3000/api/convert/single > /dev/null; then
        log_success "✅ Test de conversie a reușit!"
    else
        log_warning "⚠️  Testul de conversie a eșuat (normal dacă nu ai test.pdf)"
    fi
fi

# Informații finale
echo -e "\n${GREEN}🎉 INSTALAREA A FOST FINALIZATĂ CU SUCCES! 🎉${NC}\n"

echo -e "${BLUE}📊 Informații de acces:${NC}"
echo "• API URL: http://localhost:3000"
echo "• Health Check: http://localhost:3000/health"
echo "• Metrics: http://localhost:3000/metrics"
echo ""

echo -e "${BLUE}🔑 Autentificare:${NC}"
if [ -f .env ]; then
    echo "• API Key: $(grep API_KEY .env | cut -d= -f2)"
else
    echo "• API Key: Vezi fișierul .env"
fi
echo ""

echo -e "${BLUE}📁 Directoare:${NC}"
echo "• Input PDFs: ./storage/input/"
echo "• Output files: ./storage/output/"
echo "• Logs: ./logs/"
echo ""

echo -e "${BLUE}💡 Comenzi utile:${NC}"
echo "• Oprește sistemul: docker-compose down"
echo "• Repornește: docker-compose up -d"
echo "• Vezi logs: docker-compose logs -f"
echo "• Cleanup: docker-compose down && docker system prune -f"
echo ""

echo -e "${BLUE}🧪 Test rapid:${NC}"
echo "curl -X POST \\"
echo "  -H \"x-api-key: \$(grep API_KEY .env | cut -d= -f2)\" \\"
echo "  -F \"file=@your-book.pdf\" \\"
echo "  -F \"format=both\" \\"
echo "  -F \"title=My Book\" \\"
echo "  http://localhost:3000/api/convert/single"
echo ""

echo -e "${BLUE}📖 Documentație completă:${NC}"
echo "• README.md - Ghid complet de utilizare"
echo "• n8n-flows/ - Flow-uri gata pentru n8n"
echo ""

echo -e "${GREEN}Sistemul este gata de utilizare! 🚀${NC}"

# Opțional: deschide browser-ul cu health check
if command -v xdg-open &> /dev/null; then
    read -p "Deschid browser-ul cu health check? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:3000/health
    fi
elif command -v start &> /dev/null; then
    read -p "Deschid browser-ul cu health check? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start http://localhost:3000/health
    fi
fi

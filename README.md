# PDF to EPUB/MOBI Converter System

Un sistem complet de conversie PDF în EPUB și MOBI, optimizat pentru n8n și dispozitive mobile.

## 🎯 Caracteristici Principale

- **Conversie PDF → EPUB/MOBI** cu Calibre
- **9 Template-uri Specialized** pentru diferite tipuri de cărți
- **Optimizat iPhone 15 Pro Max** cu tema Apple Books
- **Integrare n8n** completă
- **Fix automat extensii fișiere** pentru compatibilitate
- **Docker Compose** pentru deployment simplu

## 🚀 Start Rapid

```bash
# Clonează repository-ul
git clone <repository-url>
cd ebook-converter

# Pornește serviciile
docker-compose up -d

# Verifică statusul
docker-compose ps
```

API-ul va fi disponibil pe `http://localhost:3000`

## 📱 Template-uri Disponibile

### iPhone 15 Pro Max - Apple Books
Template premium optimizat pentru iPhone 15 Pro Max cu:
- Tema dark Apple Books (#39454F)
- Imagini centrate și SVG-uri optimizate
- Poziționare absolută pentru ecran complet
- Font Apple SF Pro
- Box shadow și border radius pentru imagini

### Alte Template-uri
- **Mobile**: Optimizat pentru telefoane
- **Tablet/iPad**: Layout fluid pentru tablete
- **Copii**: Imagini mari și text simplu
- **Roman**: Pentru citit text lung
- **Tehnic**: Păstrează formatare complexă
- **Revistă**: Layout cu multe imagini
- **Ecran Complet**: Fără margini pe mobile
- **Standard**: Setări echilibrate

## 🔧 API Endpoints

### Conversie
```http
POST /api/convert
Content-Type: multipart/form-data

{
  "file": "fisier.pdf",
  "format": "epub|mobi", 
  "template": "iphone15",
  "title": "Titlu Carte",
  "author": "Autor"
}
```

### Template-uri
```http
GET /api/templates
```

### Health Check
```http
GET /health
```

## 🐳 Arhitectura Docker

- **ebook-api**: Node.js API (port 3000)
- **calibre-service**: Serviciu Calibre pentru conversii
- **redis**: Cache și queue management (port 6381)

Toate serviciile sunt conectate la rețeaua `ebook-network` și `n8n-network`.

## 🔧 Fix-uri Critice Aplicate

### Problema Extensiilor Fișierelor
**Problema**: Fișierele fără extensie `.pdf` cauzau eroarea "Input file must have an extension"

**Soluția**: Multer configurare automată pentru a forța extensia `.pdf`:

```javascript
filename: (req, file, cb) => {
  const sanitized = sanitizeFilename(file.originalname);
  // Forțează extensia .pdf dacă lipsește
  const finalName = sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
  
  if (!file.originalname.endsWith('.pdf')) {
    console.log(`[MULTER] Missing .pdf extension - forcing: ${file.originalname} → ${finalName}`);
  }
  
  cb(null, finalName);
}
```

## 🎨 Template iPhone 15 Pro Max

Template complet optimizat cu:

```css
/* Dark Apple Books Theme */
body {
  background: #39454F !important;
  color: #ffffff !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text" !important;
}

/* Imagini și SVG-uri centrate */
img, svg {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-height: 95vh !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
}
```

## 🌐 Integrare n8n

Pentru a conecta la n8n, asigură-te că:

1. n8n rulează pe rețeaua `n8n-network`
2. API-ul este accesibil la `http://ebook-converter-api:3000`
3. Folosește endpoint-ul `/api/convert` pentru conversii

## 📝 Logging și Debug

Toate operațiile sunt loggate pentru debug:
- Upload-uri fișiere și extensii lipsă
- Progres conversii Calibre
- Erori și warnings
- Template-uri aplicate

## 🔄 Rebuild și Update

Pentru a aplica modificări:

```bash
# Rebuild complet
docker-compose build --no-cache ebook-api

# Restart servicii
docker-compose down && docker-compose up -d
```

## 📋 Cerințe Sistem

- Docker și Docker Compose
- 2GB RAM minim
- 1GB spațiu disk pentru conversii temporare
- Port 3000 și 6381 disponibile

## 🎯 Template-uri Recomandate

- **iPhone 15 Pro Max**: Pentru citire premium pe mobile
- **Mobile**: Pentru telefoane obișnuite
- **Tablet**: Pentru iPad-uri și tablete Android
- **Copii**: Pentru cărți ilustrate
- **Tehnic**: Pentru documentație și manuale

## 🔧 Troubleshooting

### Erori comune:

1. **"Input file must have an extension"**: Fix aplicat automat în multer
2. **Network connectivity**: Verifică că n8n și API sunt pe aceeași rețea
3. **Template nu se aplică**: Verifică că template-ul există în `bookTemplates.js`

Sistemul este complet funcțional și optimizat pentru producție!

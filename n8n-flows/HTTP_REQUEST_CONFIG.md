# 🔧 CONFIGURARE HTTP REQUEST ÎN N8N - GHID COMPLET

## 🚨 PROBLEMA IDENTIFICATĂ

Din screenshot-ul tău:
- **Eroarea**: "The service refused the connection - perhaps it is offline"
- **Cauza**: n8n rulează în container Docker și nu poate accesa `localhost:3000`
- **Soluția**: Folosește IP-ul local al mașinii

---

## ✅ CONFIGURAȚIA CORECTĂ HTTP REQUEST

### **URL care funcționează**: 
```
http://192.168.1.21:3000/convert/single
```

### **Configurare completă n8n HTTP Request:**

#### **1. URL**
```
http://192.168.1.21:3000/convert/single
```

#### **2. Method**
```
POST
```

#### **3. Send Binary Data**
```
✅ ACTIVAT (foarte important!)
```

#### **4. Body Content Type**
```
multipart/form-data
```

#### **5. Timeout**
```
60000 (60 secunde)
```

#### **6. Parameters/Body** 
n8n va trimite automat:
- `file` - fișierul PDF uplodat
- `format` - epub sau mobi (din formular)

---

## 🌐 TOATE ENDPOINT-URILE DISPONIBILE

### **Pentru Conversie:**
| Endpoint | Method | Purpose | URL Completă |
|----------|--------|---------|--------------|
| `/convert/single` | POST | Conversie 1 fișier | `http://192.168.1.21:3000/convert/single` |
| `/convert/batch` | POST | Conversie multiple | `http://192.168.1.21:3000/convert/batch` |
| `/convert/status/:jobId` | GET | Status conversie | `http://192.168.1.21:3000/convert/status/123` |

### **Pentru Monitoring:**
| Endpoint | Method | Purpose | URL Completă |
|----------|--------|---------|--------------|
| `/health` | GET | Health check | `http://192.168.1.21:3000/health` |
| `/metrics` | GET | Statistici sistem | `http://192.168.1.21:3000/metrics` |
| `/jobs` | GET | Joburi active | `http://192.168.1.21:3000/jobs` |

---

## 📥 DOWNLOAD CONVERSIE - CONFIGURAȚIA

### **Response-ul API-ului returnează:**
```json
{
  "success": true,
  "filename": "converted-book.epub",
  "format": "epub",
  "fileSize": 1234567,
  "downloadUrl": "/download/converted-book.epub"
}
```

### **Pentru download în n8n:**

#### **Opțiunea 1: Return Binary (Recomandat)**
În **Respond to Webhook** node:
```
Respond With: "allEntries"
Options → Response Headers:
  Content-Disposition: attachment; filename="{{ $json.filename }}"
  Content-Type: application/epub+zip (pentru EPUB) sau application/x-mobipocket-ebook (pentru MOBI)
```

#### **Opțiunea 2: Redirect la download**
```javascript
// În Code node după HTTP Request
const downloadUrl = `http://192.168.1.21:3000${$json.downloadUrl}`;
return [{
  json: {
    redirectUrl: downloadUrl
  }
}];
```

---

## 🔧 CONFIGURAȚIE PAS CU PAS

### **1. HTTP Request Node:**
```
URL: http://192.168.1.21:3000/convert/single
Method: POST
Send Binary Data: ✅ DA
Body Content Type: multipart-form-data
Timeout: 60000
```

### **2. Parametrii trimișo automat:**
- `file` - din webhook upload
- `format` - din formular (epub/mobi)

### **3. Response handling:**
API-ul returnează fișierul convertit direct ca binary data.

---

## ✅ TEST RAPID

### **Test cu curl:**
```bash
# Test că API-ul funcționează
curl http://192.168.1.21:3000/health

# Test conversie (cu fișierul tău)
curl -X POST http://192.168.1.21:3000/convert/single \
  -F "file=@test.pdf" \
  -F "format=epub" \
  --output converted.epub
```

---

## 🐛 TROUBLESHOOTING

### **Dacă tot nu funcționează:**

#### **1. Verifică IP-ul**
```bash
ipconfig | findstr "IPv4"
```
Folosește primul IP găsit (192.168.1.21)

#### **2. Verifică că API-ul rulează:**
```bash
docker ps
curl http://192.168.1.21:3000/health
```

#### **3. Alternative URL:**
Dacă IP-ul nu merge, încearcă:
- `http://host.docker.internal:3000/convert/single` (pe Windows/Mac)
- `http://172.17.0.1:3000/convert/single` (bridge Docker)

#### **4. Verifică firewall:**
Windows Firewall poate bloca conexiunea. Adaugă excepție pentru portul 3000.

---

## 📋 CONFIGURAȚIA FINALĂ PENTRU COPY-PASTE

```json
{
  "url": "http://192.168.1.21:3000/convert/single",
  "method": "POST",
  "sendBinaryData": true,
  "bodyContentType": "multipart/form-data",
  "timeout": 60000
}
```

**🎯 Cu această configurație, HTTP Request-ul va funcționa perfect!**

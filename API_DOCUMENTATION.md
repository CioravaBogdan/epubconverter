# 📚 API ENDPOINTS PENTRU SISTEM CONVERSIE PDF → EPUB/MOBI

## 🔗 ENDPOINT-URI DISPONIBILE

### 1. **CONVERSIE FIȘIER INDIVIDUAL**
```
POST http://localhost:3000/api/convert/single
```

### 2. **CONVERSIE BATCH (MULTIPLE FIȘIERE)**
```
POST http://localhost:3000/api/convert/batch
```

### 3. **DESCĂRCARE FIȘIERE CONVERTITE** ⭐
```
GET http://localhost:3000/download/{filename}
```

### 4. **VERIFICARE STATUS JOB**
```
GET http://localhost:3000/status/{jobId}
```

### 5. **HEALTH CHECK**
```
GET http://localhost:3000/health
```

### 6. **METRICI SISTEM**
```
GET http://localhost:3000/metrics
```

---

## 📋 PARAMETRII PENTRU CONVERSIE

### **Parametrii multipart/form-data pentru POST /api/convert/single:**

| Parametru | Tip | Obligatoriu | Valori | Descriere |
|-----------|-----|-------------|--------|-----------|
| `file` | File | ✅ DA | PDF file | Fișierul PDF de convertit |
| `format` | String | ❌ Nu | `epub`, `mobi`, `both` | Format de ieșire (default: `epub`) |
| `title` | String | ❌ Nu | 1-200 caractere | Titlul cărții (default: numele fișierului) |
| `author` | String | ❌ Nu | 1-100 caractere | Autorul cărții (default: "Unknown Author") |
| `optimize` | String | ❌ Nu | `kindle`, `ipad`, `generic` | Optimizare pentru dispozitiv (default: `generic`) |
| `cover` | Boolean | ❌ Nu | `true`, `false` | Extrage cover din PDF (default: `true`) |

### **Exemple valori parametri:**
- `format`: `"epub"`, `"mobi"`, `"both"`
- `optimize`: `"kindle"` (pentru Kindle), `"ipad"` (pentru iPad), `"generic"` (universal)
- `cover`: `"true"` (extrage cover), `"false"` (fără cover)

---

## 💻 EXEMPLE DE UTILIZARE

### **1. PowerShell - Conversie EPUB**
```powershell
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$filePath = "E:\Projects\ConvertPDF\Book On .pdf"
$fileContent = [System.IO.File]::ReadAllBytes($filePath)

$body = (
    "--$boundary$LF" +
    "Content-Disposition: form-data; name=`"file`"; filename=`"Book On .pdf`"$LF" +
    "Content-Type: application/pdf$LF$LF"
) 
$body += [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileContent)
$body += "$LF--$boundary$LF"
$body += "Content-Disposition: form-data; name=`"format`"$LF$LF"
$body += "epub$LF--$boundary$LF"
$body += "Content-Disposition: form-data; name=`"title`"$LF$LF"
$body += "Cartea Mea$LF--$boundary$LF"
$body += "Content-Disposition: form-data; name=`"author`"$LF$LF"
$body += "Ion Popescu$LF--$boundary$LF"
$body += "Content-Disposition: form-data; name=`"optimize`"$LF$LF"
$body += "kindle$LF--$boundary--$LF"

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/convert/single" -Method Post -Body $body -ContentType "multipart/form-data; boundary=$boundary"
Write-Host "✅ Success: $($response.message)"
Write-Host "📁 Files: $($response.files.Count)"
foreach($file in $response.files) {
    Write-Host "  📄 $($file.filename) ($($file.size) bytes) → $($file.downloadUrl)"
}
```

### **2. cURL - Conversie MOBI cu parametri completi**
```bash
curl -X POST http://localhost:3000/api/convert/single \
  -F "file=@/path/to/document.pdf" \
  -F "format=mobi" \
  -F "title=Cartea Mea Preferata" \
  -F "author=George Enescu" \
  -F "optimize=kindle" \
  -F "cover=true"
```

### **3. PowerShell - Conversie BOTH (EPUB + MOBI)**
```powershell
# Același cod ca mai sus, dar cu:
$body += "both$LF--$boundary$LF"  # în loc de "epub"
```

---

## 📥 DESCĂRCAREA FIȘIERELOR

### **Din răspunsul API:**
```json
{
  "success": true,
  "jobId": "cf68df33-f59a-4961-8c71-2adbeca08047",
  "files": [
    {
      "filename": "cf68df33-f59a-4961-8c71-2adbeca08047.mobi",
      "format": "mobi",
      "size": 2727314,
      "downloadUrl": "/download/cf68df33-f59a-4961-8c71-2adbeca08047.mobi"
    }
  ]
}
```

### **Pentru a descărca fișierul:**
```powershell
# Din răspuns, ia downloadUrl și adaugă host-ul
$downloadUrl = "http://localhost:3000" + $response.files[0].downloadUrl
Invoke-WebRequest -Uri $downloadUrl -OutFile "output.mobi"
```

```bash
# cURL
curl -O http://localhost:3000/download/cf68df33-f59a-4961-8c71-2adbeca08047.mobi
```

---

## 🎯 FLUX COMPLET DE LUCRU

### **1. Upload și conversie:**
```
POST /api/convert/single
↓
RESPONSE: jobId + downloadUrl(s)
```

### **2. Descărcare fișier:**
```
GET /download/{filename}
↓
BINARY FILE DOWNLOAD
```

### **3. (Opțional) Verificare status:**
```
GET /status/{jobId}
↓
RESPONSE: status, progress, rezultate
```

---

## ⚙️ SETĂRI AVANSATE

### **Variabile de mediu (docker-compose.yml):**
```yaml
environment:
  - MAX_FILE_SIZE=104857600    # 100MB max file size
  - RATE_LIMIT=100            # 100 requests per 15 min
  - API_KEY=your_secret_key   # Opțional pentru protejare
```

### **Headers pentru securitate (opțional):**
```
X-API-Key: your_secret_key
```

---

## 🚀 SCRIPT COMPLET DE TEST

Creez un script PowerShell complet pentru testare...

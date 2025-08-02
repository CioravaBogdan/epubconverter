# 🔧 INSTRUCȚIUNI PENTRU CONFIGURAREA N8N

## ❌ PROBLEMELE IDENTIFICATE ȘI SOLUȚIILE

### 1. **PROBLEMA: Download nu merge din n8n**
**CAUZA:** n8n nu poate accesa `localhost:3000` din containerul său
**SOLUȚIA:** Folosește numele containerului în loc de localhost

### 2. **PROBLEMA: Format "both" pare să nu funcționeze**
**CAUZA:** Posibil bug în procesarea parametrului sau în logică
**SOLUȚIA:** Verificăm și corectăm logica

---

## 🛠️ CONFIGURAREA CORECTĂ ÎN N8N

### **✅ URL-URI CORECTE PENTRU N8N:**

#### **Pentru conversie:**
```
http://ebook-converter-api:3000/api/convert/single
```

#### **Pentru download:**
```
http://ebook-converter-api:3000/download/{filename}
```

#### **Pentru health check:**
```
http://ebook-converter-api:3000/health
```

---

## 📝 WORKFLOW N8N CORECT

### **1. HTTP REQUEST NODE - CONVERSIE**
```json
{
  "method": "POST",
  "url": "http://ebook-converter-api:3000/api/convert/single",
  "sendHeaders": true,
  "contentType": "multipart-form-data",
  "sendBody": true,
  "options": {
    "timeout": 120000
  }
}
```

### **Parametrii multipart-form-data:**
```json
{
  "file": "[FILE_BINARY_DATA]",
  "format": "both",
  "title": "{{$json.title}}",
  "author": "{{$json.author}}",
  "optimize": "kindle"
}
```

### **2. HTTP REQUEST NODE - DOWNLOAD**
```json
{
  "method": "GET", 
  "url": "http://ebook-converter-api:3000{{$json.files[0].downloadUrl}}",
  "sendHeaders": true,
  "options": {
    "timeout": 120000,
    "followRedirect": true
  }
}
```

---

## 🔍 VERIFICARE CONEXIUNE

### **Test ping din n8n:**
```bash
# Execută în containerul n8n pentru test
docker exec n8n-n8n-main-1 ping -c 2 ebook-converter-api
```

### **Test API din n8n:**
```bash
# Test health endpoint
docker exec n8n-n8n-main-1 wget -q -O - http://ebook-converter-api:3000/health
```

---

## 🐛 DEBUGGING FORMAT "BOTH"

### **Testez manual pentru format "both":**
```bash
# PowerShell test
powershell.exe -File "test-simple-api.ps1" -Format "both"
```

### **Verifică log-urile API:**
```bash
# Vezi ultimele log-uri
docker logs ebook-converter-api --tail 20

# Vezi log-uri în timp real
docker logs -f ebook-converter-api
```

---

## 🎯 EXEMPLE COMPLETE N8N

### **Exemplu cURL pentru testare din n8n:**
```bash
# Test conversie cu format "both"
curl -X POST http://ebook-converter-api:3000/api/convert/single \
  -F "file=@document.pdf" \
  -F "format=both" \
  -F "title=Test Book" \
  -F "author=Test Author"
```

### **Răspuns așteptat pentru format "both":**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "files": [
    {
      "filename": "uuid.epub",
      "format": "epub", 
      "size": 2701344,
      "downloadUrl": "/download/uuid.epub"
    },
    {
      "filename": "uuid.mobi", 
      "format": "mobi",
      "size": 2727298,
      "downloadUrl": "/download/uuid.mobi"
    }
  ]
}
```

---

## ⚙️ CONFIGURARE DOCKER NETWORK

### **Conectarea automată la rețeaua n8n:**
```bash
# Conectează API-ul la rețeaua n8n (deja făcut)
docker network connect n8n-network ebook-converter-api
```

### **Verificare rețele:**
```bash
# Lista rețelelor
docker network ls

# Verifică ce containere sunt în n8n-network
docker network inspect n8n-network
```

---

## 🚀 PAȘI PENTRU CONFIGURAREA FINALĂ ÎN N8N

### **1. Schimbă URL-urile în workflow-ul n8n:**
- `localhost:3000` → `ebook-converter-api:3000`

### **2. Testează connection:**
- Rulează workflow-ul cu un fișier mic
- Verifică că format "both" returnează 2 fișiere

### **3. Configurează timeout-uri:**
- Conversie: 120 secunde (2 minute)
- Download: 60 secunde (1 minut)

### **4. Gestionează erorile:**
- Verifică status code 200 pentru succes
- Parsează response JSON pentru downloadUrl-uri
- Implementează retry logic pentru download-uri

---

## 🔥 TROUBLESHOOTING RAPID

### **Dacă download nu merge:**
1. Verifică că folosești `ebook-converter-api:3000` în loc de `localhost:3000`
2. Verifică că fișierul există: `docker exec ebook-converter-api ls -la /app/storage/output/`

### **Dacă format "both" nu generează ambele:**
1. Verifică parametrul în request: `"format": "both"`
2. Verifică log-urile: `docker logs ebook-converter-api --tail 20`
3. Test manual: `powershell.exe -File "test-simple-api.ps1" -Format "both"`

### **Dacă n8n nu poate conecta:**
1. Verifică rețeaua: `docker network inspect n8n-network`
2. Reconnect: `docker network connect n8n-network ebook-converter-api`
3. Restart n8n: `docker restart n8n-n8n-main-1`

# 🌐 EXEMPLE API PENTRU DIFERITE LIMBAJE
# Sistem de conversie PDF → EPUB/MOBI

## 📋 ENDPOINT-URI PRINCIPALE

### 🔗 **ENDPOINT DE DESCĂRCARE:**
```
GET http://localhost:3000/download/{filename}
```

### 🔗 **ENDPOINT DE CONVERSIE:**
```
POST http://localhost:3000/api/convert/single
```

---

## 💻 EXEMPLE PRACTICE

### 1. **PowerShell (Windows) - RECOMANDAT**

```powershell
# Upload și conversie
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
$body += "epub$LF--$boundary--$LF"

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/convert/single" -Method Post -Body $body -ContentType "multipart/form-data; boundary=$boundary"

# Descărcare fișier
$downloadUrl = "http://localhost:3000" + $response.files[0].downloadUrl
Invoke-WebRequest -Uri $downloadUrl -OutFile "output.epub"
```

### 2. **cURL (Linux/Mac/Windows)**

```bash
# Upload și conversie
curl -X POST http://localhost:3000/api/convert/single \
  -F "file=@/path/to/document.pdf" \
  -F "format=epub" \
  -F "title=My Book" \
  -F "author=John Doe" \
  -F "optimize=kindle"

# Descărcare (din răspunsul de mai sus)
curl -O http://localhost:3000/download/filename.epub
```

### 3. **Python cu requests**

```python
import requests

# Upload și conversie
url = "http://localhost:3000/api/convert/single"
files = {'file': open('/path/to/document.pdf', 'rb')}
data = {
    'format': 'epub',
    'title': 'My Book',
    'author': 'John Doe',
    'optimize': 'kindle'
}

response = requests.post(url, files=files, data=data)
result = response.json()

# Descărcare
if result['success']:
    download_url = f"http://localhost:3000{result['files'][0]['downloadUrl']}"
    file_response = requests.get(download_url)
    
    with open('output.epub', 'wb') as f:
        f.write(file_response.content)
```

### 4. **JavaScript (Node.js) cu FormData**

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function convertPdf() {
    const form = new FormData();
    form.append('file', fs.createReadStream('/path/to/document.pdf'));
    form.append('format', 'epub');
    form.append('title', 'My Book');
    form.append('author', 'John Doe');
    
    try {
        const response = await axios.post('http://localhost:3000/api/convert/single', form, {
            headers: form.getHeaders()
        });
        
        // Descărcare
        const downloadUrl = `http://localhost:3000${response.data.files[0].downloadUrl}`;
        const fileResponse = await axios.get(downloadUrl, { responseType: 'stream' });
        
        fileResponse.data.pipe(fs.createWriteStream('output.epub'));
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}
```

### 5. **C# (.NET)**

```csharp
using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

class Program 
{
    static async Task Main()
    {
        using var client = new HttpClient();
        using var form = new MultipartFormDataContent();
        
        // Upload fișier
        var fileContent = new ByteArrayContent(File.ReadAllBytes(@"C:\path\to\document.pdf"));
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        form.Add(fileContent, "file", "document.pdf");
        
        // Parametri
        form.Add(new StringContent("epub"), "format");
        form.Add(new StringContent("My Book"), "title");
        form.Add(new StringContent("John Doe"), "author");
        
        // Conversie
        var response = await client.PostAsync("http://localhost:3000/api/convert/single", form);
        var result = await response.Content.ReadAsStringAsync();
        
        Console.WriteLine($"Result: {result}");
        
        // Pentru descărcare, parsează JSON și folosește downloadUrl
    }
}
```

### 6. **PHP**

```php
<?php
$url = 'http://localhost:3000/api/convert/single';

$data = [
    'file' => new CURLFile('/path/to/document.pdf', 'application/pdf', 'document.pdf'),
    'format' => 'epub',
    'title' => 'My Book',
    'author' => 'John Doe',
    'optimize' => 'kindle'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

// Descărcare
if ($result['success']) {
    $downloadUrl = 'http://localhost:3000' . $result['files'][0]['downloadUrl'];
    file_put_contents('output.epub', file_get_contents($downloadUrl));
}
?>
```

---

## 📊 PARAMETRII DISPONIBILI

| Parametru | Tip | Valori | Default | Descriere |
|-----------|-----|--------|---------|-----------|
| `file` | File | PDF file | - | **OBLIGATORIU:** Fișierul PDF |
| `format` | String | `epub`, `mobi`, `both` | `epub` | Formatul de ieșire |
| `title` | String | 1-200 chars | filename | Titlul cărții |
| `author` | String | 1-100 chars | "Unknown Author" | Autorul |
| `optimize` | String | `kindle`, `ipad`, `generic` | `generic` | Optimizare dispozitiv |
| `cover` | Boolean | `true`, `false` | `true` | Extrage cover din PDF |

---

## 🎯 FLUX COMPLET

```
1. POST /api/convert/single (cu file + parametri)
   ↓
2. Primești răspuns cu jobId și downloadUrl(s)
   ↓
3. GET /download/{filename} pentru fiecare fișier
   ↓
4. Salvezi fișierele local (.epub/.mobi)
```

---

## 📝 RĂSPUNS TIP

```json
{
  "success": true,
  "jobId": "cf68df33-f59a-4961-8c71-2adbeca08047",
  "message": "Conversia a fost finalizată cu succes",
  "files": [
    {
      "filename": "cf68df33-f59a-4961-8c71-2adbeca08047.epub",
      "format": "epub",
      "size": 2701347,
      "downloadUrl": "/download/cf68df33-f59a-4961-8c71-2adbeca08047.epub"
    }
  ],
  "processingTime": 1351,
  "metadata": {
    "title": "Book On ",
    "author": "Unknown Author",
    "originalFilename": "Book On .pdf"
  }
}
```

---

## 🚀 TESTARE RAPIDĂ

### Script PowerShell complet:
```powershell
# Rulează scriptul complet de test
powershell.exe -File "E:\Projects\ConvertPDF\ebook-converter\test-complete-api.ps1"
```

### Test manual simplu:
```powershell
# Test EPUB
powershell.exe -File "E:\Projects\ConvertPDF\ebook-converter\test-api.ps1"

# Test MOBI  
powershell.exe -File "E:\Projects\ConvertPDF\ebook-converter\test-mobi.ps1"
```

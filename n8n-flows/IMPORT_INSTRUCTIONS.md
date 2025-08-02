# Instrucțiuni Import Flow-uri n8n

## Pasul 1: Accesați n8n
Accesați interfața n8n la adresa: `http://localhost:5678`

## Pasul 2: Import Flow-uri

### Pentru fiecare dintre flow-urile create:

1. **Flow Simplu (simple-upload-convert-download.json)**
   - Accesați n8n → New Workflow
   - Faceți clic pe "..." (menu) → Import from file
   - Selectați fișierul `simple-upload-convert-download.json`
   - Salvați workflow-ul

2. **Interface Completă (complete-pdf-converter-interface.json)**
   - Accesați n8n → New Workflow  
   - Faceți clic pe "..." (menu) → Import from file
   - Selectați fișierul `complete-pdf-converter-interface.json`
   - Salvați workflow-ul

3. **Convertor Batch (batch-pdf-converter.json)**
   - Accesați n8n → New Workflow
   - Faceți clic pe "..." (menu) → Import from file
   - Selectați fișierul `batch-pdf-converter.json`
   - Salvați workflow-ul

## Pasul 3: Activați Flow-urile

Pentru fiecare workflow importat:
1. Deschideți workflow-ul
2. Faceți clic pe butonul "Active" (toggle switch din dreapta sus)
3. Verificați că toate node-urile sunt configurate corect

## Pasul 4: Testați Flow-urile

### Interface Completă:
- Accesați: `http://localhost:5678/webhook/show-pdf-form`
- Veți vedea interfața HTML pentru upload

### Convertor Batch:
- Accesați: `http://localhost:5678/webhook/show-batch-form`
- Veți vedea interfața pentru conversie batch

### Flow Simplu:
- Utilizați Postman sau curl pentru a testa endpoint-ul:
  ```bash
  curl -X POST http://localhost:5678/webhook/upload-convert-pdf \
    -F "file=@path/to/your/file.pdf" \
    -F "format=epub"
  ```

## Webhook URLs
După import, URL-urile vor fi:

1. **Interface Completă:**
   - GET: `http://localhost:5678/webhook/show-pdf-form` (afișează formularul)
   - POST: `http://localhost:5678/webhook/process-pdf-upload` (procesează upload-ul)

2. **Convertor Batch:**
   - GET: `http://localhost:5678/webhook/show-batch-form` (afișează formularul batch)
   - POST: `http://localhost:5678/webhook/process-batch-upload` (procesează batch)

3. **Flow Simplu:**
   - POST: `http://localhost:5678/webhook/upload-convert-pdf` (API direct)

## Troubleshooting

### Dacă API-ul nu răspunde:
```bash
# Verificați statusul containerelor
docker ps

# Verificați logs
docker logs ebook-converter-api

# Testați API direct
curl http://localhost:3000/health
```

### Dacă n8n nu găsește webhook-urile:
1. Verificați că workflow-urile sunt activate
2. Restartați n8n dacă este necesar
3. Verificați că porturile nu sunt blocate

## Configurare Avansată

### Pentru a configura domenii custom:
1. Editați webhook URLs în n8n
2. Actualizați configurarea reverse proxy dacă folosiți unul
3. Verificați configurarea CORS în API dacă accesați din alte domenii

## Note Importante

- **Flow-urile sunt configurate să funcționeze cu API-ul local pe portul 3000**
- **Asigurați-vă că toate containerele Docker sunt pornite**
- **Fișierele convertite vor fi returnade direct ca download**
- **Pentru batch conversion, rezultatul va fi un fișier ZIP**
- **Timeout-urile sunt configurate pentru fișiere mari (până la 5 minute pentru batch)**

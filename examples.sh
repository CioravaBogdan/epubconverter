# Exemplu de teste pentru API-ul Ebook Converter

# Test conversie simplă EPUB
curl -X POST \
  -H "x-api-key: your-secret-api-key-here" \
  -F "file=@sample.pdf" \
  -F "format=epub" \
  -F "title=Carte de Test" \
  -F "author=Autor Test" \
  http://localhost:3000/api/convert/single

# Test conversie MOBI optimizată pentru Kindle
curl -X POST \
  -H "x-api-key: your-secret-api-key-here" \
  -F "file=@sample.pdf" \
  -F "format=mobi" \
  -F "optimize=kindle" \
  -F "title=Carte pentru Kindle" \
  http://localhost:3000/api/convert/single

# Test conversie ambele formate
curl -X POST \
  -H "x-api-key: your-secret-api-key-here" \
  -F "file=@sample.pdf" \
  -F "format=both" \
  -F "title=Carte Completa" \
  -F "author=Autor Complet" \
  -F "optimize=ipad" \
  -F "cover=true" \
  http://localhost:3000/api/convert/single

# Test conversie batch (multiple fișiere)
curl -X POST \
  -H "x-api-key: your-secret-api-key-here" \
  -F "files=@book1.pdf" \
  -F "files=@book2.pdf" \
  -F "files=@book3.pdf" \
  -F "format=epub" \
  -F "author=Autor Batch" \
  http://localhost:3000/api/convert/batch

# Health check
curl -X GET http://localhost:3000/health

# Metrics
curl -X GET http://localhost:3000/metrics

# Status job
curl -X GET \
  -H "x-api-key: your-secret-api-key-here" \
  http://localhost:3000/status/123e4567-e89b-12d3-a456-426614174000

# Download fișier convertit
curl -X GET \
  -H "x-api-key: your-secret-api-key-here" \
  -o "carte-convertita.epub" \
  http://localhost:3000/download/123e4567-e89b-12d3-a456-426614174000.epub

# Test cu Postman Collection JSON pentru import în Postman
cat > postman-collection.json << 'EOF'
{
  "info": {
    "name": "Ebook Converter API",
    "description": "Colecție pentru testarea API-ului de conversie PDF → EPUB/MOBI",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "apikey",
    "apikey": [
      {
        "key": "key",
        "value": "x-api-key",
        "type": "string"
      },
      {
        "key": "value",
        "value": "{{API_KEY}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "API_KEY",
      "value": "your-secret-api-key-here",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{BASE_URL}}/health",
          "host": ["{{BASE_URL}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Convert Single PDF to EPUB",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": []
            },
            {
              "key": "format",
              "value": "epub",
              "type": "text"
            },
            {
              "key": "title",
              "value": "Test Book",
              "type": "text"
            },
            {
              "key": "author",
              "value": "Test Author",
              "type": "text"
            },
            {
              "key": "optimize",
              "value": "ipad",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{BASE_URL}}/api/convert/single",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "convert", "single"]
        }
      }
    },
    {
      "name": "Convert to Both Formats",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": []
            },
            {
              "key": "format",
              "value": "both",
              "type": "text"
            },
            {
              "key": "title",
              "value": "Complete Book",
              "type": "text"
            },
            {
              "key": "author",
              "value": "Complete Author",
              "type": "text"
            },
            {
              "key": "optimize",
              "value": "generic",
              "type": "text"
            },
            {
              "key": "cover",
              "value": "true",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{BASE_URL}}/api/convert/single",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "convert", "single"]
        }
      }
    },
    {
      "name": "Batch Convert",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "files",
              "type": "file",
              "src": []
            },
            {
              "key": "files",
              "type": "file", 
              "src": []
            },
            {
              "key": "format",
              "value": "epub",
              "type": "text"
            },
            {
              "key": "author",
              "value": "Batch Author",
              "type": "text"
            }
          ]
        },
        "url": {
          "raw": "{{BASE_URL}}/api/convert/batch",
          "host": ["{{BASE_URL}}"],
          "path": ["api", "convert", "batch"]
        }
      }
    },
    {
      "name": "Get Job Status",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{BASE_URL}}/status/{{JOB_ID}}",
          "host": ["{{BASE_URL}}"],
          "path": ["status", "{{JOB_ID}}"]
        }
      }
    },
    {
      "name": "Download File",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{BASE_URL}}/download/{{FILENAME}}",
          "host": ["{{BASE_URL}}"],
          "path": ["download", "{{FILENAME}}"]
        }
      }
    },
    {
      "name": "Get Metrics",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{BASE_URL}}/metrics",
          "host": ["{{BASE_URL}}"],
          "path": ["metrics"]
        }
      }
    }
  ]
}
EOF

echo "Colecția Postman a fost salvată în postman-collection.json"
echo "Pentru a o importa în Postman:"
echo "1. Deschide Postman"
echo "2. Click pe Import"
echo "3. Selectează fișierul postman-collection.json"
echo "4. Setează variabila API_KEY cu cheia ta"

# Test cu Python (requests)
cat > test_api.py << 'EOF'
#!/usr/bin/env python3
"""
Script de test pentru API-ul Ebook Converter
"""

import requests
import json
import time
import os

# Configurație
BASE_URL = "http://localhost:3000"
API_KEY = "your-secret-api-key-here"  # Înlocuiește cu API key-ul tău
TEST_FILE = "sample.pdf"  # Înlocuiește cu calea către un PDF de test

headers = {
    "x-api-key": API_KEY
}

def test_health():
    """Test health check"""
    print("🔍 Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    
    if response.status_code == 200:
        print("✅ Health check passed")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Health check failed: {response.status_code}")
    print()

def test_single_conversion():
    """Test single file conversion"""
    if not os.path.exists(TEST_FILE):
        print(f"❌ Test file {TEST_FILE} not found. Skipping conversion test.")
        return None
    
    print("📚 Testing single PDF conversion...")
    
    with open(TEST_FILE, 'rb') as f:
        files = {'file': f}
        data = {
            'format': 'epub',
            'title': 'Test Book via Python',
            'author': 'Python Tester',
            'optimize': 'ipad'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/convert/single",
            headers=headers,
            files=files,
            data=data
        )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Conversion successful")
        print(f"Job ID: {result.get('jobId')}")
        print(f"Processing time: {result.get('processingTime')}ms")
        print(f"Files: {len(result.get('files', []))}")
        return result
    else:
        print(f"❌ Conversion failed: {response.status_code}")
        print(response.text)
        return None

def test_job_status(job_id):
    """Test job status check"""
    if not job_id:
        return
    
    print(f"📊 Testing job status for {job_id}...")
    response = requests.get(f"{BASE_URL}/status/{job_id}", headers=headers)
    
    if response.status_code == 200:
        print("✅ Status check successful")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Status check failed: {response.status_code}")
    print()

def test_metrics():
    """Test metrics endpoint"""
    print("📈 Testing metrics...")
    response = requests.get(f"{BASE_URL}/metrics")
    
    if response.status_code == 200:
        print("✅ Metrics retrieved")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Metrics failed: {response.status_code}")
    print()

def main():
    """Run all tests"""
    print("🚀 Starting Ebook Converter API Tests")
    print("=" * 50)
    
    # Test health
    test_health()
    
    # Test conversion
    result = test_single_conversion()
    job_id = result.get('jobId') if result else None
    
    # Wait a bit then test status
    if job_id:
        time.sleep(2)
        test_job_status(job_id)
    
    # Test metrics
    test_metrics()
    
    print("🏁 Tests completed!")

if __name__ == "__main__":
    main()
EOF

echo "Script-ul de test Python a fost salvat în test_api.py"
echo "Pentru a-l rula:"
echo "1. pip install requests"
echo "2. Înlocuiește API_KEY și TEST_FILE în script"
echo "3. python test_api.py"

# Test cu Node.js (axios)
cat > test_api.js << 'EOF'
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configurație
const BASE_URL = 'http://localhost:3000';
const API_KEY = 'your-secret-api-key-here'; // Înlocuiește cu API key-ul tău
const TEST_FILE = 'sample.pdf'; // Înlocuiește cu calea către un PDF de test

const headers = {
    'x-api-key': API_KEY
};

async function testHealth() {
    console.log('🔍 Testing health check...');
    
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ Health check failed: ${error.response?.status || error.message}`);
    }
    console.log();
}

async function testSingleConversion() {
    if (!fs.existsSync(TEST_FILE)) {
        console.log(`❌ Test file ${TEST_FILE} not found. Skipping conversion test.`);
        return null;
    }
    
    console.log('📚 Testing single PDF conversion...');
    
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(TEST_FILE));
        form.append('format', 'epub');
        form.append('title', 'Test Book via Node.js');
        form.append('author', 'Node.js Tester');
        form.append('optimize', 'ipad');
        
        const response = await axios.post(
            `${BASE_URL}/api/convert/single`,
            form,
            {
                headers: {
                    ...headers,
                    ...form.getHeaders()
                }
            }
        );
        
        console.log('✅ Conversion successful');
        console.log(`Job ID: ${response.data.jobId}`);
        console.log(`Processing time: ${response.data.processingTime}ms`);
        console.log(`Files: ${response.data.files?.length || 0}`);
        return response.data;
        
    } catch (error) {
        console.log(`❌ Conversion failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            console.log(error.response.data);
        }
        return null;
    }
}

async function testJobStatus(jobId) {
    if (!jobId) return;
    
    console.log(`📊 Testing job status for ${jobId}...`);
    
    try {
        const response = await axios.get(`${BASE_URL}/status/${jobId}`, { headers });
        console.log('✅ Status check successful');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ Status check failed: ${error.response?.status || error.message}`);
    }
    console.log();
}

async function testMetrics() {
    console.log('📈 Testing metrics...');
    
    try {
        const response = await axios.get(`${BASE_URL}/metrics`);
        console.log('✅ Metrics retrieved');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log(`❌ Metrics failed: ${error.response?.status || error.message}`);
    }
    console.log();
}

async function main() {
    console.log('🚀 Starting Ebook Converter API Tests');
    console.log('='.repeat(50));
    
    // Test health
    await testHealth();
    
    // Test conversion
    const result = await testSingleConversion();
    const jobId = result?.jobId;
    
    // Wait a bit then test status
    if (jobId) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testJobStatus(jobId);
    }
    
    // Test metrics
    await testMetrics();
    
    console.log('🏁 Tests completed!');
}

main().catch(console.error);
EOF

echo "Script-ul de test Node.js a fost salvat în test_api.js"
echo "Pentru a-l rula:"
echo "1. npm install axios form-data"
echo "2. Înlocuiește API_KEY și TEST_FILE în script"
echo "3. node test_api.js"

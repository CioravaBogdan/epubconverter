# 📚 Template-uri pentru Conversie Cărți - Ghid Complet

## 🎯 Tipuri de Template-uri Disponibile

### 1. **Template pentru Cărți de Copii** 👶
```json
{
  "format": "epub",
  "template": "children",
  "optimize": "ipad",
  "preserveImages": true,
  "extractCover": true
}
```

### 2. **Template pentru Romane** 📖
```json
{
  "format": "epub", 
  "template": "novel",
  "optimize": "kindle",
  "textOptimization": true,
  "smartChapters": true
}
```

### 3. **Template pentru Cărți Tehnice** 🔧
```json
{
  "format": "epub",
  "template": "technical", 
  "optimize": "generic",
  "preserveFormatting": true,
  "enableTOC": true
}
```

### 4. **Template pentru Reviste/Ziare** 📰
```json
{
  "format": "epub",
  "template": "magazine",
  "optimize": "ipad", 
  "columnLayout": true,
  "preserveImages": true
}
```

## 🛠️ Implementare Template-uri

### Pasul 1: Actualizează API-ul

Adaugă parametrul `template` în validare:

```javascript
// În routes/converter.js
const singleConversionValidation = [
  body('format').optional().isIn(['epub', 'mobi', 'both']),
  body('template').optional().isIn(['children', 'novel', 'technical', 'magazine', 'custom']),
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('author').optional().isLength({ min: 1, max: 100 }),
  body('optimize').optional().isIn(['kindle', 'ipad', 'generic'])
];
```

### Pasul 2: Definește Template-urile

Creează fișierul `api/templates/bookTemplates.js`:

```javascript
const BOOK_TEMPLATES = {
  children: {
    name: "Cărți de Copii",
    description: "Optimizat pentru imagini mari și text simplu",
    calibreSettings: {
      '--output-profile': 'ipad3',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',
      '--flow-size': '0',
      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--minimum-line-height': '150',
      '--margin-left': '10',
      '--margin-right': '10',
      '--margin-top': '10', 
      '--margin-bottom': '10',
      '--max-toc-links': '0',
      '--chapter': 'detect-none'
    }
  },
  
  novel: {
    name: "Roman/Ficțiune",
    description: "Optimizat pentru citit text lung",
    calibreSettings: {
      '--output-profile': 'kindle',
      '--epub-version': '3',
      '--smarten-punctuation': '',
      '--chapter': '//h:h1 | //h:h2',
      '--page-breaks-before': '//h:h1',
      '--margin-left': '5',
      '--margin-right': '5',
      '--margin-top': '5',
      '--margin-bottom': '5',
      '--minimum-line-height': '120',
      '--embed-all-fonts': '',
      '--disable-font-rescaling': ''
    }
  },

  technical: {
    name: "Cărți Tehnice",
    description: "Păstrează formatare complexă și tabele",
    calibreSettings: {
      '--output-profile': 'generic_eink',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',
      '--flow-size': '0',
      '--embed-all-fonts': '',
      '--expand-css': '',
      '--margin-left': '8',
      '--margin-right': '8',
      '--margin-top': '8',
      '--margin-bottom': '8',
      '--minimum-line-height': '130',
      '--chapter': '//h:h1 | //h:h2 | //h:h3',
      '--page-breaks-before': '//h:h1'
    }
  },

  magazine: {
    name: "Reviste/Ziare", 
    description: "Layout cu coloane și imagini complexe",
    calibreSettings: {
      '--output-profile': 'ipad3',
      '--epub-version': '3',
      '--preserve-cover-aspect-ratio': '',
      '--flow-size': '0',
      '--embed-all-fonts': '',
      '--disable-font-rescaling': '',
      '--margin-left': '3',
      '--margin-right': '3',
      '--margin-top': '3',
      '--margin-bottom': '3',
      '--minimum-line-height': '110',
      '--max-toc-links': '0',
      '--chapter': 'detect-none'
    }
  }
};

function getTemplateSettings(templateName) {
  return BOOK_TEMPLATES[templateName] || BOOK_TEMPLATES.novel;
}

module.exports = {
  BOOK_TEMPLATES,
  getTemplateSettings
};
```

### Pasul 3: Integrează Template-urile în Converter

Modifică `utils/converter.js`:

```javascript
const { getTemplateSettings } = require('../templates/bookTemplates');

function buildCalibreArgs(inputPath, outputPath, format, options) {
  const { title, author, optimize, extractCover, template } = options;
  
  // Obține setările template-ului
  const templateSettings = getTemplateSettings(template || 'novel');
  
  const containerInputPath = `/storage/input/${path.basename(inputPath)}`;
  const containerOutputPath = `/storage/output/${path.basename(outputPath)}`;
  
  const args = [containerInputPath, containerOutputPath];
  
  // Adaugă setările din template
  Object.entries(templateSettings.calibreSettings).forEach(([key, value]) => {
    args.push(key);
    if (value !== '') {
      args.push(value);
    }
  });
  
  // Suprascrie cu setări personalizate dacă sunt furnizate
  if (title) {
    args.push('--title', title);
  }
  if (author) {
    args.push('--authors', author);
  }
  
  return args;
}
```

## 🎮 Utilizare în N8N

### Template Cărți de Copii
```
Body Parameters:
- file: [PDF file]
- format: epub
- template: children
- title: "Povestea Iepurașului"
- author: "Ion Creangă"
```

### Template Roman
```
Body Parameters:
- file: [PDF file] 
- format: epub
- template: novel
- title: "Miorița"
- author: "Folclor Român"
```

### Template Tehnic
```
Body Parameters:
- file: [PDF file]
- format: epub
- template: technical  
- title: "Manual JavaScript"
- author: "Tech Author"
```

## 🔧 Template Custom

Pentru setări personalizate, folosește template-ul `custom` și adaugă parametri specifici:

```
Body Parameters:
- template: custom
- calibre_args: "--margin-left 15 --margin-right 15 --epub-version 2"
```

## 📊 Comparație Template-uri

| Template | Optimizat Pentru | Imagini | Text | Compatibilitate |
|----------|------------------|---------|------|------------------|
| children | Cărți ilustrate | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | iPad, Tablet |
| novel | Ficțiune/Roman | ⭐⭐ | ⭐⭐⭐⭐⭐ | Kindle, E-readers |
| technical | Manuale/Ghiduri | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Universal |
| magazine | Reviste/Ziare | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Tablete mari |

## 🚀 Next Steps

1. **Implementează template-urile** în API
2. **Testează fiecare template** cu diferite tipuri de PDF-uri
3. **Adaugă template-uri noi** bazate pe feedback
4. **Creează preseturi** în N8N pentru fiecare template
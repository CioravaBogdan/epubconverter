const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const { body, validationResult } = require('express-validator');

const { logger } = require('../utils/logger');
const { convertPdfToEbook } = require('../utils/converter');
const { validatePdfFile, sanitizeFilename } = require('../utils/validation');

const router = express.Router();

// Configurare multer pentru upload fișiere
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'storage', 'input');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const jobId = uuidv4();
    req.jobId = jobId;
    let extension = path.extname(file.originalname);
    
    // Forțează extensia .pdf dacă lipsește
    if (!extension) {
      extension = '.pdf';
      logger.warn('File missing extension, forcing .pdf', {
        jobId,
        originalname: file.originalname,
        mimetype: file.mimetype
      });
    }
    
    cb(null, `${jobId}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB default
    files: 10 // max 10 files for batch
  },
  fileFilter: (req, file, cb) => {
    // Verifică tipul de fișier
    if (file.mimetype === 'application/pdf' || 
        path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Doar fișiere PDF sunt permise'), false);
    }
  }
});

// Import templates
const { isValidTemplate, getAvailableTemplates } = require('../templates/bookTemplates');

// Validation rules
const singleConversionValidation = [
  body('format')
    .optional()
    .trim()
    .isIn(['epub', 'mobi', 'both'])
    .withMessage('Format invalid - trebuie să fie: epub, mobi sau both'),
  body('template').optional().custom((value) => {
    if (value && !isValidTemplate(value)) {
      throw new Error('Template invalid. Template-uri disponibile: ' + Object.keys(getAvailableTemplates()).join(', '));
    }
    return true;
  }),
  // Sanitize and validate title/author to be robust against oversized inputs coming from external systems (e.g., n8n)
  body('title')
    .optional()
    .isString()
    .trim()
    .customSanitizer((v) => {
      try {
        if (typeof v !== 'string') return v;
        const collapsed = v.replace(/\s+/g, ' ').trim();
        // truncate to 200 chars as API contract
        return collapsed.length > 200 ? collapsed.slice(0, 200) : collapsed;
      } catch (_) { return v; }
    })
    .isLength({ min: 1, max: 200 })
    .withMessage('Titlul trebuie să aibă între 1-200 caractere'),
  body('author')
    .optional()
    .isString()
    .trim()
    .customSanitizer((v) => {
      try {
        if (typeof v !== 'string') return v;
        const collapsed = v.replace(/\s+/g, ' ').trim();
        return collapsed.length > 100 ? collapsed.slice(0, 100) : collapsed;
      } catch (_) { return v; }
    })
    .isLength({ min: 1, max: 100 })
    .withMessage('Autorul trebuie să aibă între 1-100 caractere'),
  body('optimize').optional().isIn(['kindle', 'ipad', 'generic']).withMessage('Opțiune optimizare invalidă'),
  body('cover').optional().isBoolean().withMessage('Cover trebuie să fie boolean'),
  body('includeOriginal').optional().isBoolean().withMessage('includeOriginal trebuie să fie boolean')
];

// GET /api/templates - Lista template-urilor disponibile
router.get('/templates', (req, res) => {
  try {
    const templates = getAvailableTemplates();
    res.json({
      success: true,
      templates,
      count: Object.keys(templates).length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Eroare la obținerea template-urilor',
      code: 'TEMPLATES_ERROR',
      details: error.message
    });
  }
});

// GET /api/info - Informații publice despre serviciu
router.get('/info', (req, res) => {
  try {
    const getBaseUrl = (req) => {
      if (req.headers['cf-ray'] || req.headers['x-forwarded-for'] || process.env.PUBLIC_URL) {
        return process.env.PUBLIC_URL || 'https://ebook-converter.byinfant.com';
      }
      return `http://${req.get('host')}`;
    };

    const baseUrl = getBaseUrl(req);
    const isExternal = !!(req.headers['cf-ray'] || req.headers['x-forwarded-for']);

    res.json({
      service: 'PDF to EPUB/MOBI Converter',
      version: '1.0.0',
      status: 'operational',
      access: isExternal ? 'external' : 'internal',
      endpoints: {
        convert: `${baseUrl}/convert/single`,
        convertAlias: `${baseUrl}/api/convert/single`,
        templates: `${baseUrl}/api/templates`,
        health: `${baseUrl}/health`
      },
      features: [
        'PDF to EPUB conversion',
        'PDF to MOBI conversion', 
        'Both formats simultaneously',
        'Include original PDF',
        'Custom templates',
        'Batch processing',
        'ZIP download for multiple files'
      ],
      supportedFormats: {
        input: ['PDF'],
        output: ['EPUB', 'MOBI', 'PDF (original)']
      },
      publicUrl: process.env.PUBLIC_URL,
      cloudflareEnabled: isExternal
    });
  } catch (error) {
    res.status(500).json({
      error: 'Eroare la obținerea informațiilor serviciu',
      code: 'INFO_ERROR',
      details: error.message
    });
  }
});

// POST /api/convert/single - Conversie fișier individual
router.post('/single', 
  upload.single('file'),
  singleConversionValidation,
  async (req, res) => {
    try {
      // Validare input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Date de intrare invalide',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'Nu a fost încărcat niciun fișier',
          code: 'NO_FILE_UPLOADED'
        });
      }

      const jobId = req.jobId;
      const inputPath = req.file.path;
      
      // Validare nume fișier original pentru debugging
      logger.info('File upload details', {
        jobId,
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        inputPath: inputPath,
        hasExtension: !!path.extname(req.file.originalname),
        sanitizedName: sanitizeFilename(req.file.originalname)
      });

      logger.info('Starting single conversion', {
        jobId,
        filename: req.file.originalname,
        size: req.file.size,
        format: req.body.format || 'epub'
      });

      // Validare fișier PDF
      const isValidPdf = await validatePdfFile(inputPath);
      if (!isValidPdf) {
        await fs.remove(inputPath); // Cleanup
        return res.status(400).json({
          error: 'Fișierul încărcat nu este un PDF valid',
          code: 'INVALID_PDF'
        });
      }

      // Parametri conversie
      const safeTitle = (req.body.title && typeof req.body.title === 'string')
        ? req.body.title.toString().trim().replace(/\s+/g, ' ').slice(0, 200)
        : path.parse(req.file.originalname).name;
      const safeAuthor = (req.body.author && typeof req.body.author === 'string')
        ? req.body.author.toString().trim().replace(/\s+/g, ' ').slice(0, 100)
        : 'Unknown Author';

      const conversionParams = {
        inputPath,
        jobId,
        format: req.body.format || 'epub',
        template: req.body.template || 'default',
        title: safeTitle,
        author: safeAuthor,
        optimize: req.body.optimize || 'generic',
        extractCover: req.body.cover !== 'false',
        includeOriginal: (req.body.includeOriginal === true || req.body.includeOriginal === 'true') ? true : false,
        originalFilename: req.file.originalname
      };

      // Start conversie
      const result = await convertPdfToEbook(conversionParams);

      if (!result.success) {
        return res.status(500).json({
          error: 'Conversia a eșuat',
          code: 'CONVERSION_FAILED',
          details: result.error,
          jobId
        });
      }

      logger.info('Conversion completed successfully', {
        jobId,
        outputFiles: result.outputFiles,
        processingTime: result.processingTime
      });

      // Detectează URL-ul de bază pentru download-uri
      const getBaseUrl = (req) => {
        // Dacă cererea vine prin Cloudflare sau proxy extern
        if (req.headers['cf-ray'] || req.headers['x-forwarded-for'] || process.env.PUBLIC_URL) {
          return process.env.PUBLIC_URL || 'https://ebook-converter.byinfant.com';
        }
        // Pentru cereri interne sau locale
        return `http://${req.get('host')}`;
      };

      const baseUrl = getBaseUrl(req);

      // Răspuns success
      const response = {
        success: true,
        jobId,
        message: 'Conversia a fost finalizată cu succes',
        files: result.outputFiles.map(file => ({
          filename: path.basename(file),
          format: path.extname(file).substring(1),
          size: fs.statSync(file).size,
          downloadUrl: `/download/${path.basename(file)}`,
          fullDownloadUrl: `${baseUrl}/download/${path.basename(file)}`
        })),
        processingTime: result.processingTime,
        metadata: {
          title: conversionParams.title,
          author: conversionParams.author,
          originalFilename: conversionParams.originalFilename
        }
      };

      // Dacă sunt multiple fișiere, creează un ZIP
      if (result.outputFiles.length > 1) {
        const zipPath = await createZipFile(result.outputFiles, jobId);
        response.zipDownload = `/download/${path.basename(zipPath)}`;
        response.fullZipDownload = `${baseUrl}/download/${path.basename(zipPath)}`;
      }

      res.json(response);

    } catch (error) {
      logger.error('Single conversion error', {
        jobId: req.jobId,
        error: error.message,
        stack: error.stack
      });

      // Cleanup în caz de eroare
      if (req.file && req.file.path) {
        await fs.remove(req.file.path).catch(err => 
          logger.error('Cleanup error', { error: err.message })
        );
      }

      res.status(500).json({
        error: 'Eroare la procesarea fișierului',
        code: 'PROCESSING_ERROR',
        jobId: req.jobId,
        details: error.message
      });
    }
  }
);

// POST /api/convert/batch - Conversie batch
router.post('/batch',
  upload.array('files', 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'Nu au fost încărcate fișiere',
          code: 'NO_FILES_UPLOADED'
        });
      }

      const batchId = uuidv4();
      const results = [];
      const errors = [];

      logger.info('Starting batch conversion', {
        batchId,
        fileCount: req.files.length
      });

      // Procesează fiecare fișier
      for (const file of req.files) {
        try {
          const jobId = uuidv4();
          const inputPath = file.path;

          // Validare PDF
          const isValidPdf = await validatePdfFile(inputPath);
          if (!isValidPdf) {
            errors.push({
              filename: file.originalname,
              error: 'Fișier PDF invalid'
            });
            await fs.remove(inputPath);
            continue;
          }

          // Parametri conversie
          const conversionParams = {
            inputPath,
            jobId,
            format: req.body.format || 'epub',
            title: req.body.title || path.parse(file.originalname).name,
            author: req.body.author || 'Unknown Author',
            optimize: req.body.optimize || 'generic',
            extractCover: req.body.cover !== 'false',
            originalFilename: file.originalname
          };

          // Conversie
          const result = await convertPdfToEbook(conversionParams);

          if (result.success) {
            results.push({
              originalFilename: file.originalname,
              jobId,
              outputFiles: result.outputFiles.map(f => path.basename(f)),
              processingTime: result.processingTime
            });
          } else {
            errors.push({
              filename: file.originalname,
              error: result.error
            });
          }

        } catch (error) {
          logger.error('Batch item conversion error', {
            batchId,
            filename: file.originalname,
            error: error.message
          });

          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      // Creează ZIP cu toate fișierele convertite
      let zipDownloadUrl = null;
      if (results.length > 0) {
        const allOutputFiles = results.flatMap(r => 
          r.outputFiles.map(f => path.join(__dirname, '..', 'storage', 'output', f))
        );
        
        const zipPath = await createZipFile(allOutputFiles, batchId);
        zipDownloadUrl = `/download/${path.basename(zipPath)}`;
      }

      logger.info('Batch conversion completed', {
        batchId,
        successCount: results.length,
        errorCount: errors.length
      });

      res.json({
        success: true,
        batchId,
        message: `Batch conversie finalizată: ${results.length} succese, ${errors.length} erori`,
        results,
        errors,
        zipDownload: zipDownloadUrl,
        summary: {
          totalFiles: req.files.length,
          successful: results.length,
          failed: errors.length
        }
      });

    } catch (error) {
      logger.error('Batch conversion error', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Eroare la procesarea batch-ului',
        code: 'BATCH_PROCESSING_ERROR',
        details: error.message
      });
    }
  }
);

// Helper function pentru crearea ZIP
async function createZipFile(files, jobId) {
  const outputDir = path.join(__dirname, '..', 'storage', 'output');
  const zipPath = path.join(outputDir, `${jobId}.zip`);
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compresie maximă
    });

    output.on('close', () => {
      logger.info('ZIP created successfully', { 
        zipPath, 
        size: archive.pointer() 
      });
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      logger.error('ZIP creation error', { error: err.message });
      reject(err);
    });

    archive.pipe(output);

    // Adaugă fișierele în ZIP
    files.forEach(file => {
      if (fs.existsSync(file)) {
        archive.file(file, { name: path.basename(file) });
      }
    });

    archive.finalize();
  });
}

// Error handler pentru multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fișierul este prea mare',
        code: 'FILE_TOO_LARGE',
        maxSize: process.env.MAX_FILE_SIZE || '100MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Prea multe fișiere',
        code: 'TOO_MANY_FILES',
        maxFiles: 10
      });
    }
  }
  
  if (error.message === 'Doar fișiere PDF sunt permise') {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  next(error);
});

module.exports = router;

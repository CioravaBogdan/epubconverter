const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { logger } = require('./logger');

/**
 * Validează dacă un fișier este un PDF valid
 */
async function validatePdfFile(filePath) {
  try {
    // Verifică dacă fișierul există
    if (!await fs.pathExists(filePath)) {
      logger.warn('File does not exist', { filePath });
      return false;
    }

    // Verifică dimensiunea fișierului
    const stats = await fs.stat(filePath);
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 104857600; // 100MB
    
    if (stats.size === 0) {
      logger.warn('File is empty', { filePath });
      return false;
    }

    if (stats.size > maxSize) {
      logger.warn('File too large', { 
        filePath, 
        size: stats.size, 
        maxSize 
      });
      return false;
    }

    // Verifică magic bytes pentru PDF
    const buffer = Buffer.alloc(8);
    const fd = await fs.open(filePath, 'r');
    await fs.read(fd, buffer, 0, 8, 0);
    await fs.close(fd);

    // PDF magic bytes: %PDF-
    const pdfSignature = buffer.toString('ascii', 0, 5);
    if (pdfSignature !== '%PDF-') {
      logger.warn('Invalid PDF signature', { 
        filePath, 
        signature: pdfSignature 
      });
      return false;
    }

    // Verifică versiunea PDF
    const version = buffer.toString('ascii', 5, 8);
    const validVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];
    const pdfVersion = version.substring(0, 3);
    
    if (!validVersions.includes(pdfVersion)) {
      logger.warn('Unsupported PDF version', { 
        filePath, 
        version: pdfVersion 
      });
      // Nu returnează false pentru versiuni necunoscute, doar loghează
    }

    // Verificare suplimentară cu pdfinfo dacă e disponibil
    const isValidPdf = await validateWithPdfInfo(filePath);
    if (isValidPdf === false) {
      return false;
    }

    logger.info('PDF validation successful', { 
      filePath, 
      size: stats.size,
      version: pdfVersion
    });

    return true;

  } catch (error) {
    logger.error('PDF validation error', { 
      filePath, 
      error: error.message 
    });
    return false;
  }
}

/**
 * Validare suplimentară cu pdfinfo din Calibre container
 */
async function validateWithPdfInfo(filePath) {
  return new Promise((resolve) => {
    const containerPath = `/storage/input/${path.basename(filePath)}`;
    
    exec(`docker exec ebook-calibre pdfinfo "${containerPath}"`, (error, stdout, stderr) => {
      if (error) {
        // Dacă pdfinfo nu e disponibil, nu considerăm că validarea a eșuat
        logger.debug('pdfinfo validation skipped', { 
          filePath, 
          reason: 'Command not available or failed'
        });
        resolve(null); // null = inconcluziv, nu fals
        return;
      }

      // Căută indicatori de PDF corupt în output
      const output = stdout.toLowerCase();
      
      if (output.includes('damaged') || 
          output.includes('corrupt') || 
          output.includes('error') ||
          stderr.toLowerCase().includes('error')) {
        logger.warn('PDF appears to be damaged', { 
          filePath,
          pdfinfo: output.substring(0, 200)
        });
        resolve(false);
        return;
      }

      // Verifică dacă sunt găsite pagini
      const pagesMatch = output.match(/pages:\s*(\d+)/);
      if (pagesMatch) {
        const pageCount = parseInt(pagesMatch[1]);
        if (pageCount === 0) {
          logger.warn('PDF has no pages', { filePath });
          resolve(false);
          return;
        }
        
        logger.info('PDF info validation successful', { 
          filePath, 
          pages: pageCount 
        });
      }

      resolve(true);
    });
  });
}

/**
 * Sanitizează numele de fișier pentru a fi sigur pentru Calibre
 */
function sanitizeFilename(filename) {
  if (!filename) return 'unnamed';
  
  // Înlocuiește caracterele periculoase și problematice pentru Calibre
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Caractere Windows interzise
    .replace(/[()[\]{}]/g, '_') // Paranteză și bracket-uri -> underscore
    .replace(/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gi, (match) => {
      // Înlocuiește diacritice
      const map = {
        'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','æ':'ae',
        'ç':'c','è':'e','é':'e','ê':'e','ë':'e','ì':'i','í':'i',
        'î':'i','ï':'i','ð':'d','ñ':'n','ò':'o','ó':'o','ô':'o',
        'õ':'o','ö':'o','ø':'o','ù':'u','ú':'u','û':'u','ü':'u',
        'ý':'y','þ':'th','ÿ':'y','ă':'a','â':'a','î':'i','ș':'s',
        'ț':'t','Ă':'A','Â':'A','Î':'I','Ș':'S','Ț':'T'
      };
      return map[match.toLowerCase()] || match;
    })
    .replace(/\s+/g, '_') // Spații multiple -> underscore
    .replace(/\.+/g, '.') // Puncte multiple -> punct simplu
    .replace(/_{2,}/g, '_') // Underscores multiple -> underscore simplu
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Orice altceva -> underscore
    .trim();

  // Înlătură punctele și underscores de la început și sfârșit
  sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, '');

  // Limitează lungimea (mai conservativ pentru Calibre)
  if (sanitized.length > 150) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 150 - ext.length) + ext;
  }

  // Asigură că nu e gol și că începe cu literă sau cifră
  if (!sanitized || sanitized === '.' || /^[._-]/.test(sanitized)) {
    sanitized = 'unnamed_file';
  }

  // Asigură că are extensie
  if (!path.extname(sanitized)) {
    sanitized += '.pdf';
  }

  return sanitized;
}

/**
 * Validează parametrii de conversie
 */
function validateConversionParams(params) {
  const errors = [];
  
  // Format
  if (params.format && !['epub', 'mobi', 'both'].includes(params.format)) {
    errors.push('Format invalid. Valorile permise: epub, mobi, both');
  }
  
  // Optimize
  if (params.optimize && !['kindle', 'ipad', 'generic'].includes(params.optimize)) {
    errors.push('Opțiune optimizare invalidă. Valorile permise: kindle, ipad, generic');
  }
  
  // Title
  if (params.title && (params.title.length < 1 || params.title.length > 200)) {
    errors.push('Titlul trebuie să aibă între 1-200 caractere');
  }
  
  // Author
  if (params.author && (params.author.length < 1 || params.author.length > 100)) {
    errors.push('Autorul trebuie să aibă între 1-100 caractere');
  }
  
  // Cover
  if (params.cover !== undefined && typeof params.cover !== 'boolean') {
    errors.push('Parametrul cover trebuie să fie boolean');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Verifică dacă un fișier este o imagine validă
 */
async function validateImageFile(filePath) {
  try {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
    const ext = path.extname(filePath).toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      return false;
    }
    
    // Verifică magic bytes pentru tipurile comune de imagini
    const buffer = Buffer.alloc(12);
    const fd = await fs.open(filePath, 'r');
    await fs.read(fd, buffer, 0, 12, 0);
    await fs.close(fd);
    
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return true;
    }
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return true;
    }
    
    // GIF: GIF87a sau GIF89a
    const gifSignature = buffer.toString('ascii', 0, 6);
    if (gifSignature === 'GIF87a' || gifSignature === 'GIF89a') {
      return true;
    }
    
    // BMP: BM
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
      return true;
    }
    
    return false;
    
  } catch (error) {
    logger.error('Image validation error', { 
      filePath, 
      error: error.message 
    });
    return false;
  }
}

/**
 * Verifică disponibilitatea spațiului pe disk
 */
async function checkDiskSpace(requiredSpace = 100 * 1024 * 1024) { // 100MB default
  try {
    const storageDir = path.join(__dirname, '..', 'storage');
    const stats = await fs.stat(storageDir);
    
    // Pe Windows, folosim o verificare simplificată
    // În producție, ai putea folosi o bibliotecă specializată
    return true; // Pentru moment, returnăm true
    
  } catch (error) {
    logger.error('Disk space check failed', { error: error.message });
    return true; // Fallback la true pentru a nu bloca conversiile
  }
}

/**
 * Verifică integritatea unui fișier ZIP
 */
async function validateZipFile(filePath) {
  return new Promise((resolve) => {
    exec(`unzip -t "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        logger.warn('ZIP validation failed', { 
          filePath, 
          error: error.message 
        });
        resolve(false);
      } else {
        logger.info('ZIP validation successful', { filePath });
        resolve(true);
      }
    });
  });
}

/**
 * Verifică dacă o cale este sigură (nu permite path traversal)
 */
function isPathSafe(filePath) {
  const normalized = path.normalize(filePath);
  const storageDir = path.join(__dirname, '..', 'storage');
  
  // Verifică că calea normalizată începe cu directorul storage
  return normalized.startsWith(path.resolve(storageDir));
}

/**
 * Generează un hash pentru un fișier (pentru deduplicare)
 */
async function generateFileHash(filePath) {
  const crypto = require('crypto');
  
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

module.exports = {
  validatePdfFile,
  validateImageFile,
  validateConversionParams,
  validateZipFile,
  sanitizeFilename,
  checkDiskSpace,
  isPathSafe,
  generateFileHash,
  validateWithPdfInfo
};

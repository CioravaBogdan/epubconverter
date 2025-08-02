const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { logger, logConversionStart, logConversionEnd } = require('./logger');
const { getTemplateSettings } = require('../templates/bookTemplates');

/**
 * Convertește un fișier PDF în EPUB/MOBI folosind Calibre
 * Optimizat specific pentru cărți de copii cu imagini
 */
async function convertPdfToEbook(params) {
  const startTime = Date.now();
  const {
    inputPath,
    jobId,
    format = 'epub',
    template = 'default',
    title,
    author,
    optimize = 'generic',
    extractCover = true,
    originalFilename
  } = params;

  logConversionStart(jobId, params);

  try {
    // Log template fiind folosit
    logger.info('Using template for conversion', { 
      jobId, 
      template: template || 'default',
      format
    });

    const outputDir = path.join(__dirname, '..', 'storage', 'output');
    await fs.ensureDir(outputDir);

    // Extract cover from first page if enabled
    let extractedCoverPath = null;
    if (extractCover) {
      logger.info('Extracting cover from first page', { jobId, extractCover, template });
      extractedCoverPath = await extractCoverFromPdf(inputPath, jobId);
      if (extractedCoverPath) {
        logger.info('Cover extracted successfully', { jobId, coverPath: extractedCoverPath });
      } else {
        logger.warn('Cover extraction failed, using default', { jobId });
      }
    } else {
      logger.info('Cover extraction disabled', { jobId, extractCover });
    }

    const outputFiles = [];
    const formats = format === 'both' ? ['epub', 'mobi'] : [format];

    // Conversie pentru fiecare format cerut
    for (const targetFormat of formats) {
      const outputPath = path.join(outputDir, `${jobId}.${targetFormat}`);
      
      logger.info('Starting conversion', {
        jobId,
        format: targetFormat,
        inputPath,
        outputPath
      });

      // Construiește comanda Calibre optimizată pentru template
      const conversionResult = await executeCalibreConversion(
        inputPath,
        outputPath,
        targetFormat,
        {
          title,
          author,
          template,
          optimize,
          extractCover,
          extractedCoverPath,
          jobId
        }
      );

      if (conversionResult.success) {
        outputFiles.push(outputPath);
        logger.info('Format conversion successful', {
          jobId,
          format: targetFormat,
          outputSize: fs.statSync(outputPath).size
        });
      } else {
        throw new Error(`Conversia ${targetFormat} a eșuat: ${conversionResult.error}`);
      }
    }

    const processingTime = Date.now() - startTime;
    const result = {
      success: true,
      outputFiles,
      processingTime,
      jobId
    };

    logConversionEnd(jobId, result);
    
    // Cleanup input file DUPĂ conversie reușită
    await fs.remove(inputPath).catch(err => 
      logger.warn('Input file cleanup failed', { jobId, error: err.message })
    );

    return result;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const result = {
      success: false,
      error: error.message,
      processingTime,
      jobId
    };

    logConversionEnd(jobId, result);
    
    // Cleanup pe eroare
    await fs.remove(inputPath).catch(() => {});
    
    return result;
  }
}

/**
 * Execută conversia Calibre cu parametri optimizați
 */
async function executeCalibreConversion(inputPath, outputPath, format, options) {
  return new Promise((resolve) => {
    const {
      title,
      author,
      template,
      optimize,
      extractCover,
      extractedCoverPath,
      jobId
    } = options;

    // Construiește argumentele pentru Calibre
    const args = buildCalibreArgs(inputPath, outputPath, format, {
      title,
      author,
      template,
      optimize,
      extractCover,
      extractedCoverPath
    });

    logger.info('Executing Calibre command', {
      jobId,
      command: 'ebook-convert',
      args: args.join(' ')
    });

    // Rulează conversia în container
    const calibreProcess = spawn('docker', [
      'exec',
      'ebook-calibre',
      'ebook-convert',
      ...args
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    calibreProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    calibreProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    calibreProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Calibre conversion successful', {
          jobId,
          format,
          stdout: stdout.substring(0, 500) // Primele 500 caractere
        });
        
        resolve({
          success: true,
          stdout,
          stderr
        });
      } else {
        logger.error('Calibre conversion failed', {
          jobId,
          format,
          exitCode: code,
          stderr: stderr.substring(0, 1000)
        });
        
        resolve({
          success: false,
          error: `Calibre exit code ${code}: ${stderr}`,
          stdout,
          stderr
        });
      }
    });

    calibreProcess.on('error', (error) => {
      logger.error('Calibre process error', {
        jobId,
        format,
        error: error.message
      });
      
      resolve({
        success: false,
        error: `Process error: ${error.message}`
      });
    });

    // Timeout de siguranță (10 minute)
    setTimeout(() => {
      if (!calibreProcess.killed) {
        calibreProcess.kill();
        logger.error('Calibre process timeout', { jobId, format });
        
        resolve({
          success: false,
          error: 'Conversion timeout - process killed after 10 minutes'
        });
      }
    }, 10 * 60 * 1000);
  });
}

/**
 * Construiește argumentele pentru comanda Calibre folosind template-uri
 */
function buildCalibreArgs(inputPath, outputPath, format, options) {
  const { title, author, template, optimize, extractCover, extractedCoverPath } = options;
  
  // Obține setările template-ului pentru formatul specific
  const templateSettings = getTemplateSettings(template || 'default', format);
  
  // Mapează căile pentru container cu validare extra
  const inputBasename = path.basename(inputPath);
  const outputBasename = path.basename(outputPath);
  
  // Validează că fișierele au extensii valide
  if (!path.extname(inputBasename)) {
    logger.error('Input file missing extension', { 
      inputPath, 
      inputBasename,
      originalPath: inputPath 
    });
    throw new Error(`Input file must have an extension: ${inputBasename}`);
  }
  
  if (!path.extname(outputBasename)) {
    logger.error('Output file missing extension', { 
      outputPath, 
      outputBasename 
    });
    throw new Error(`Output file must have an extension: ${outputBasename}`);
  }
  
  const containerInputPath = `/storage/input/${inputBasename}`;
  const containerOutputPath = `/storage/output/${outputBasename}`;
  
  logger.info('File mapping for Calibre', {
    hostInput: inputPath,
    containerInput: containerInputPath,
    hostOutput: outputPath,
    containerOutput: containerOutputPath,
    inputExtension: path.extname(inputBasename),
    outputExtension: path.extname(outputBasename)
  });
  
  const args = [
    containerInputPath,
    containerOutputPath
  ];

  // Adaugă setările din template, dar exclud --no-default-epub-cover dacă avem cover custom
  Object.entries(templateSettings.calibreSettings).forEach(([key, value]) => {
    // Skip --no-default-epub-cover dacă avem un cover custom extras
    if (key === '--no-default-epub-cover' && extractedCoverPath) {
      return;
    }
    
    args.push(key);
    if (value !== '') {
      args.push(value);
    }
  });

  // Setări specifice pentru format și curățare argumente incompatibile
  if (format === 'mobi') {
    // Elimină argumentele specifice EPUB din args
    const mobiIncompatibleArgs = ['--epub-version', '--epub-flatten', '--epub-toc-at-end', '--no-chapters'];
    for (let i = args.length - 1; i >= 0; i--) {
      if (mobiIncompatibleArgs.includes(args[i])) {
        // Elimină argumentul și valoarea sa (dacă există)
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          args.splice(i, 2); // Elimină argument și valoare
        } else {
          args.splice(i, 1); // Elimină doar argumentul
        }
      }
    }
    
    // Adaugă setări specifice MOBI
    args.push('--mobi-file-type', 'both');
    args.push('--mobi-ignore-margins');
    args.push('--share-not-sync');
  }

  // Metadata - suprascrie setările din template
  if (title) {
    args.push('--title', `"${title}"`);
  }
  
  if (author) {
    args.push('--authors', `"${author}"`);
  }

  // Cover handling
  if (extractedCoverPath) {
    // Folosește cover-ul extras din prima pagină
    args.push('--cover', extractedCoverPath);
    logger.info('Using extracted cover', { coverPath: extractedCoverPath, template: options.template });
  } else if (!extractCover) {
    args.push('--no-default-epub-cover');
    logger.info('No cover requested', { extractCover, template: options.template });
  } else {
    logger.info('Default cover handling', { extractCover, extractedCoverPath, template: options.template });
  }

  // Debug pentru logging
  args.push('--verbose');

  // Log argumentele generate pentru debugging
  logger.info('Calibre arguments generated', {
    template: options.template,
    format,
    argsCount: args.length,
    hasExtraCSS: args.includes('--extra-css'),
    hasCover: args.includes('--cover'),
    extractedCoverPath: extractedCoverPath,
    fullArgs: args.join(' ')
  });

  return args;
}

/**
 * Determină profilul de output bazat pe optimizare
 */
function getOutputProfile(optimize) {
  switch (optimize) {
    case 'kindle':
      return 'kindle_pw3';
    case 'ipad':
      return 'ipad3';
    case 'generic':
    default:
      return 'tablet';
  }
}

/**
 * Verifică dacă Calibre este disponibil în container
 */
async function checkCalibreAvailability() {
  return new Promise((resolve) => {
    exec('docker exec ebook-calibre calibre --version', (error, stdout, stderr) => {
      if (error) {
        logger.error('Calibre not available', { error: error.message });
        resolve(false);
      } else {
        logger.info('Calibre available', { version: stdout.trim() });
        resolve(true);
      }
    });
  });
}

/**
 * Obține informații despre un fișier PDF
 */
async function getPdfInfo(filePath) {
  return new Promise((resolve) => {
    const containerPath = `/storage/input/${path.basename(filePath)}`;
    
    exec(`docker exec ebook-calibre pdfinfo "${containerPath}"`, (error, stdout, stderr) => {
      if (error) {
        logger.warn('Could not get PDF info', { 
          filePath, 
          error: error.message 
        });
        resolve(null);
      } else {
        const info = parsePdfInfo(stdout);
        logger.info('PDF info extracted', { filePath, info });
        resolve(info);
      }
    });
  });
}

/**
 * Parse output-ul pdfinfo
 */
function parsePdfInfo(pdfInfoOutput) {
  const lines = pdfInfoOutput.split('\n');
  const info = {};
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      info[cleanKey] = value;
    }
  });
  
  return info;
}

/**
 * Extraje cover din PDF dacă este posibil
 */
async function extractCoverFromPdf(inputPath, jobId) {
  const outputDir = path.join(__dirname, '..', 'storage', 'temp');
  await fs.ensureDir(outputDir);
  
  const coverPath = path.join(outputDir, `${jobId}_cover.jpg`);
  const containerInputPath = `/storage/input/${path.basename(inputPath)}`;
  const containerCoverPath = `/storage/temp/${jobId}_cover`;
  
  return new Promise((resolve) => {
    // Încearcă să extragă prima pagină ca imagine cu pdftoppm
    const command = `docker exec ebook-calibre pdftoppm -f 1 -l 1 -jpeg -r 300 "${containerInputPath}" "${containerCoverPath}"`;
    
    logger.info('Extracting cover from PDF', { 
      jobId, 
      command,
      inputPath: containerInputPath 
    });
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.warn('Cover extraction failed', { 
          jobId, 
          error: error.message,
          stderr 
        });
        resolve(null);
      } else {
        // pdftoppm adaugă automat -01.jpg la sfârșitul numelui (cu zero padding)
        const extractedContainerFile = `${containerCoverPath}-01.jpg`;
        const extractedLocalFile = path.join(outputDir, `${jobId}_cover-01.jpg`);
        
        // Verifică dacă fișierul a fost creat
        setTimeout(() => {
          if (fs.existsSync(extractedLocalFile)) {
            logger.info('Cover extracted successfully', { 
              jobId, 
              coverPath: extractedContainerFile 
            });
            resolve(extractedContainerFile); // Returnează calea din container pentru Calibre
          } else {
            logger.warn('Cover file not found after extraction', { 
              jobId, 
              expectedPath: extractedLocalFile 
            });
            resolve(null);
          }
        }, 1000); // Așteaptă 1 secundă să se scrie fișierul
      }
    });
  });
}

module.exports = {
  convertPdfToEbook,
  checkCalibreAvailability,
  getPdfInfo,
  extractCoverFromPdf,
  executeCalibreConversion
};

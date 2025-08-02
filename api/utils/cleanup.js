const fs = require('fs-extra');
const path = require('path');
const { logger } = require('./logger');

/**
 * Șterge fișierele mai vechi de perioada specificată
 */
async function cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 ore default
  const directories = [
    path.join(__dirname, '..', 'storage', 'input'),
    path.join(__dirname, '..', 'storage', 'output'),
    path.join(__dirname, '..', 'storage', 'temp')
  ];

  let totalCleaned = 0;
  let totalSize = 0;

  logger.info('Starting cleanup process', { 
    maxAgeHours: maxAge / (60 * 60 * 1000),
    directories 
  });

  for (const dir of directories) {
    try {
      if (!await fs.pathExists(dir)) {
        logger.debug('Directory does not exist, skipping', { dir });
        continue;
      }

      const files = await fs.readdir(dir);
      const cutoffTime = Date.now() - maxAge;

      logger.debug('Scanning directory for cleanup', { 
        dir, 
        fileCount: files.length,
        cutoffTime: new Date(cutoffTime).toISOString()
      });

      for (const file of files) {
        const filePath = path.join(dir, file);
        
        try {
          const stats = await fs.stat(filePath);
          
          // Verifică dacă fișierul este mai vechi decât cutoff-ul
          if (stats.mtime.getTime() < cutoffTime) {
            const fileSize = stats.size;
            await fs.remove(filePath);
            
            totalCleaned++;
            totalSize += fileSize;
            
            logger.debug('File cleaned up', {
              file: filePath,
              age: Date.now() - stats.mtime.getTime(),
              size: fileSize
            });
          }
          
        } catch (fileError) {
          logger.warn('Error processing file during cleanup', {
            file: filePath,
            error: fileError.message
          });
        }
      }
      
    } catch (dirError) {
      logger.error('Error scanning directory during cleanup', {
        dir,
        error: dirError.message
      });
    }
  }

  logger.info('Cleanup process completed', {
    filesRemoved: totalCleaned,
    spaceSaved: formatBytes(totalSize),
    duration: 'completed'
  });

  return {
    filesRemoved: totalCleaned,
    spaceSaved: totalSize
  };
}

/**
 * Șterge fișierele asociate cu un job specific
 */
async function cleanupJobFiles(jobId) {
  const directories = [
    path.join(__dirname, '..', 'storage', 'input'),
    path.join(__dirname, '..', 'storage', 'output'),
    path.join(__dirname, '..', 'storage', 'temp')
  ];

  let cleanedFiles = [];

  logger.info('Starting job-specific cleanup', { jobId });

  for (const dir of directories) {
    try {
      if (!await fs.pathExists(dir)) {
        continue;
      }

      const files = await fs.readdir(dir);
      
      for (const file of files) {
        if (file.includes(jobId)) {
          const filePath = path.join(dir, file);
          
          try {
            const stats = await fs.stat(filePath);
            await fs.remove(filePath);
            
            cleanedFiles.push({
              path: filePath,
              size: stats.size
            });
            
            logger.debug('Job file cleaned up', {
              jobId,
              file: filePath,
              size: stats.size
            });
            
          } catch (error) {
            logger.warn('Error removing job file', {
              jobId,
              file: filePath,
              error: error.message
            });
          }
        }
      }
      
    } catch (error) {
      logger.error('Error during job cleanup', {
        jobId,
        dir,
        error: error.message
      });
    }
  }

  logger.info('Job cleanup completed', {
    jobId,
    filesRemoved: cleanedFiles.length,
    totalSize: formatBytes(cleanedFiles.reduce((sum, f) => sum + f.size, 0))
  });

  return cleanedFiles;
}

/**
 * Șterge doar fișierele temporare
 */
async function cleanupTempFiles() {
  const tempDir = path.join(__dirname, '..', 'storage', 'temp');
  
  try {
    if (!await fs.pathExists(tempDir)) {
      logger.debug('Temp directory does not exist');
      return { filesRemoved: 0, spaceSaved: 0 };
    }

    const files = await fs.readdir(tempDir);
    let totalCleaned = 0;
    let totalSize = 0;

    logger.info('Cleaning temp directory', { 
      tempDir, 
      fileCount: files.length 
    });

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      
      try {
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;
        
        await fs.remove(filePath);
        
        totalCleaned++;
        totalSize += fileSize;
        
        logger.debug('Temp file removed', {
          file: filePath,
          size: fileSize
        });
        
      } catch (error) {
        logger.warn('Error removing temp file', {
          file: filePath,
          error: error.message
        });
      }
    }

    logger.info('Temp cleanup completed', {
      filesRemoved: totalCleaned,
      spaceSaved: formatBytes(totalSize)
    });

    return {
      filesRemoved: totalCleaned,
      spaceSaved: totalSize
    };

  } catch (error) {
    logger.error('Error during temp cleanup', {
      tempDir,
      error: error.message
    });
    
    return { filesRemoved: 0, spaceSaved: 0 };
  }
}

/**
 * Verifică spațiul disponibil și curăță dacă e necesar
 */
async function cleanupIfNeeded(thresholdMB = 1000) { // 1GB threshold
  try {
    const storageDir = path.join(__dirname, '..', 'storage');
    const usage = await getDirectorySize(storageDir);
    const usageMB = usage / (1024 * 1024);

    logger.info('Storage usage check', {
      usageMB: Math.round(usageMB),
      thresholdMB
    });

    if (usageMB > thresholdMB) {
      logger.warn('Storage threshold exceeded, starting cleanup', {
        usageMB: Math.round(usageMB),
        thresholdMB
      });

      // Cleanup în ordine: temp files -> old files
      await cleanupTempFiles();
      
      // Dacă încă avem prea mult spațiu folosit, șterge și fișierele mai vechi
      const newUsage = await getDirectorySize(storageDir);
      const newUsageMB = newUsage / (1024 * 1024);
      
      if (newUsageMB > thresholdMB) {
        // Cleanup fișiere mai vechi de 12 ore în loc de 24
        await cleanupOldFiles(12 * 60 * 60 * 1000);
      }

      const finalUsage = await getDirectorySize(storageDir);
      const finalUsageMB = finalUsage / (1024 * 1024);
      
      logger.info('Cleanup completed', {
        beforeMB: Math.round(usageMB),
        afterMB: Math.round(finalUsageMB),
        savedMB: Math.round(usageMB - finalUsageMB)
      });
    }

  } catch (error) {
    logger.error('Error during storage check and cleanup', {
      error: error.message
    });
  }
}

/**
 * Calculează dimensiunea totală a unui director
 */
async function getDirectorySize(dirPath) {
  let totalSize = 0;

  try {
    if (!await fs.pathExists(dirPath)) {
      return 0;
    }

    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

  } catch (error) {
    logger.warn('Error calculating directory size', {
      dirPath,
      error: error.message
    });
  }

  return totalSize;
}

/**
 * Generează raport despre utilizarea storage-ului
 */
async function getStorageReport() {
  const baseDir = path.join(__dirname, '..', 'storage');
  const subdirs = ['input', 'output', 'temp'];
  const report = {
    timestamp: new Date().toISOString(),
    total: { files: 0, size: 0 },
    directories: {}
  };

  for (const subdir of subdirs) {
    const dirPath = path.join(baseDir, subdir);
    
    try {
      if (!await fs.pathExists(dirPath)) {
        report.directories[subdir] = { files: 0, size: 0, exists: false };
        continue;
      }

      const files = await fs.readdir(dirPath);
      let dirSize = 0;
      let fileCount = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            dirSize += stats.size;
            fileCount++;
          }
        } catch (error) {
          logger.debug('Error stating file in report', {
            file: filePath,
            error: error.message
          });
        }
      }

      report.directories[subdir] = {
        files: fileCount,
        size: dirSize,
        sizeFormatted: formatBytes(dirSize),
        exists: true
      };

      report.total.files += fileCount;
      report.total.size += dirSize;

    } catch (error) {
      logger.warn('Error generating report for directory', {
        subdir,
        error: error.message
      });
      
      report.directories[subdir] = {
        files: 0,
        size: 0,
        exists: false,
        error: error.message
      };
    }
  }

  report.total.sizeFormatted = formatBytes(report.total.size);

  logger.info('Storage report generated', report);
  return report;
}

/**
 * Formatează bytes într-un format citibil
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Programare cleanup automat
 */
function scheduleCleanup() {
  const cron = require('cron');
  
  // Cleanup la fiecare oră
  const hourlyCleanup = new cron.CronJob('0 * * * *', async () => {
    logger.info('Running scheduled hourly cleanup');
    await cleanupTempFiles();
  });

  // Cleanup zilnic mai agresiv
  const dailyCleanup = new cron.CronJob('0 2 * * *', async () => {
    logger.info('Running scheduled daily cleanup');
    await cleanupOldFiles(24 * 60 * 60 * 1000); // 24 ore
    await cleanupIfNeeded(500); // 500MB threshold
  });

  hourlyCleanup.start();
  dailyCleanup.start();

  logger.info('Cleanup schedules activated', {
    hourly: 'Every hour - temp files',
    daily: '2 AM - old files and storage check'
  });

  return {
    hourlyCleanup,
    dailyCleanup
  };
}

module.exports = {
  cleanupOldFiles,
  cleanupJobFiles,
  cleanupTempFiles,
  cleanupIfNeeded,
  getDirectorySize,
  getStorageReport,
  formatBytes,
  scheduleCleanup
};

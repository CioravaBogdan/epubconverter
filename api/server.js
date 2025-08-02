const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const cron = require('cron');

// Import modules
const converterRoutes = require('./routes/converter');
const { logger } = require('./utils/logger');
const { cleanupOldFiles } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de securitate
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: process.env.RATE_LIMIT || 100, // limită requests per IP
  message: {
    error: 'Prea multe cereri. Încearcă din nou în 15 minute.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  logger.info(`${req.method} ${req.url}`, {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API Key middleware pentru endpoint-urile protejate
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    return next(); // Skip validation dacă nu e setat API key
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'API key invalid sau lipsă',
      code: 'UNAUTHORIZED'
    });
  }
  
  next();
};

// Routes
app.use('/api/convert', converterRoutes);
app.use('/convert', converterRoutes); // Alias fără /api pentru compatibilitate

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version,
    services: {
      api: 'running',
      calibre: 'available',
      redis: 'connected'
    }
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const stats = await getConversionStats();
    res.json({
      timestamp: new Date().toISOString(),
      conversions: stats,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });
  } catch (error) {
    logger.error('Error getting metrics', { error: error.message });
    res.status(500).json({ error: 'Eroare la obținerea metricilor' });
  }
});

// Status endpoint pentru job-uri
app.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Job nu a fost găsit',
        code: 'JOB_NOT_FOUND'
      });
    }
    
    res.json(status);
  } catch (error) {
    logger.error('Error getting job status', { 
      jobId: req.params.jobId, 
      error: error.message 
    });
    res.status(500).json({ error: 'Eroare la verificarea statusului' });
  }
});

// Download endpoint pentru fișiere convertite
app.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'storage', 'output', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Fișierul nu a fost găsit',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    // Setează headers pentru download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream fișierul
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    
    stream.on('end', () => {
      logger.info('File downloaded successfully', { filename });
    });
    
    stream.on('error', (error) => {
      logger.error('Error downloading file', { filename, error: error.message });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Eroare la descărcarea fișierului' });
      }
    });
    
  } catch (error) {
    logger.error('Download error', { 
      filename: req.params.filename, 
      error: error.message 
    });
    res.status(500).json({ error: 'Eroare la descărcarea fișierului' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { 
    requestId: req.id, 
    error: error.message, 
    stack: error.stack 
  });
  
  res.status(error.status || 500).json({
    error: error.message || 'Eroare internă de server',
    code: error.code || 'INTERNAL_ERROR',
    requestId: req.id
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint nu a fost găsit',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Funcții helper
async function getConversionStats() {
  // Implementează statistici din Redis sau filesystem
  const outputDir = path.join(__dirname, 'storage', 'output');
  const files = await fs.readdir(outputDir).catch(() => []);
  
  return {
    totalConversions: files.length,
    successfulConversions: files.filter(f => f.includes('.epub') || f.includes('.mobi')).length,
    lastConversion: files.length > 0 ? new Date().toISOString() : null
  };
}

async function getJobStatus(jobId) {
  // Implementează verificarea statusului job-ului
  // Poți folosi Redis sau o bază de date pentru persistență
  return {
    jobId,
    status: 'completed', // completed, processing, failed, queued
    progress: 100,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    result: {
      outputFiles: [`${jobId}.epub`, `${jobId}.mobi`],
      downloadUrls: [
        `/download/${jobId}.epub`,
        `/download/${jobId}.mobi`
      ]
    }
  };
}

// Cleanup scheduler - rulează la fiecare oră
const cleanupJob = new cron.CronJob('0 * * * *', async () => {
  logger.info('Running scheduled cleanup...');
  try {
    await cleanupOldFiles();
    logger.info('Cleanup completed successfully');
  } catch (error) {
    logger.error('Cleanup failed', { error: error.message });
  }
});

// Asigură că directoarele există
async function ensureDirectories() {
  const directories = [
    path.join(__dirname, 'storage'),
    path.join(__dirname, 'storage', 'input'),
    path.join(__dirname, 'storage', 'output'),
    path.join(__dirname, 'storage', 'temp'),
    path.join(__dirname, 'logs')
  ];
  
  for (const dir of directories) {
    await fs.ensureDir(dir);
  }
}

// Start server
async function startServer() {
  try {
    await ensureDirectories();
    
    app.listen(PORT, () => {
      logger.info(`Ebook Converter API started on port ${PORT}`);
      logger.info('Available endpoints:');
      logger.info('  POST /api/convert/single - Conversie fișier individual');
      logger.info('  POST /api/convert/batch - Conversie batch');
      logger.info('  GET /health - Health check');
      logger.info('  GET /metrics - Statistici');
      logger.info('  GET /status/:jobId - Status job');
      logger.info('  GET /download/:filename - Download fișier');
      
      // Start cleanup job
      cleanupJob.start();
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  cleanupJob.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  cleanupJob.destroy();
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

startServer();

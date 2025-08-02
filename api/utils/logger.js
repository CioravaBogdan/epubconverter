const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Configurare formatare log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Configurare transport pentru fișiere rotative
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, '..', 'logs', 'ebook-converter-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Configurare transport pentru erori
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, '..', 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Configurare logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'ebook-converter-api',
    version: require('../package.json').version
  },
  transports: [
    fileRotateTransport,
    errorRotateTransport
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '..', 'logs', 'exceptions.log'),
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '..', 'logs', 'rejections.log'),
      format: logFormat
    })
  ]
});

// În development, adaugă și console logging
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return logMessage;
      })
    )
  }));
}

// Logger pentru conversii specifice
const conversionLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'ebook-converter-conversion',
    version: require('../package.json').version
  },
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '..', 'logs', 'conversions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '30d',
      format: logFormat
    })
  ]
});

// Logger pentru performanță
const performanceLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'ebook-converter-performance',
    version: require('../package.json').version
  },
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '..', 'logs', 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: logFormat
    })
  ]
});

// Helper functions pentru logging performanță
const logConversionStart = (jobId, params) => {
  conversionLogger.info('Conversion started', {
    jobId,
    inputFile: params.originalFilename,
    format: params.format,
    optimize: params.optimize,
    startTime: new Date().toISOString()
  });
};

const logConversionEnd = (jobId, result) => {
  conversionLogger.info('Conversion completed', {
    jobId,
    success: result.success,
    outputFiles: result.outputFiles ? result.outputFiles.map(f => path.basename(f)) : [],
    processingTime: result.processingTime,
    endTime: new Date().toISOString(),
    error: result.error || null
  });
};

const logPerformanceMetric = (metric, value, metadata = {}) => {
  performanceLogger.info(`Performance metric: ${metric}`, {
    metric,
    value,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Middleware pentru logging cereri HTTP
const httpLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log cererea
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
  
  // Override res.end pentru a loga răspunsul
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
    
    // Log performanță pentru cereri lente
    if (responseTime > 5000) {
      performanceLogger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        requestId: req.id
      });
    }
    
    originalEnd.call(res, chunk, encoding);
  };
  
  next();
};

// Funcție pentru monitoring sistem
const logSystemStats = () => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  };
  
  performanceLogger.info('System stats', stats);
  
  // Alertă pentru memoria mare
  if (stats.memory.heapUsed > 500 * 1024 * 1024) { // 500MB
    logger.warn('High memory usage detected', {
      heapUsed: `${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(stats.memory.heapTotal / 1024 / 1024)}MB`
    });
  }
};

// Rulează monitoring sistem la fiecare 5 minute
setInterval(logSystemStats, 5 * 60 * 1000);

module.exports = {
  logger,
  conversionLogger,
  performanceLogger,
  httpLogger,
  logConversionStart,
  logConversionEnd,
  logPerformanceMetric,
  logSystemStats
};

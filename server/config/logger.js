const winston = require('winston');
const path = require('path');

// Custom format dla developmentu
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    // Dodaj stack trace dla błędów
    if (stack) {
      log += `\n${stack}`;
    }

    // Dodaj metadata jeśli istnieją
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Format JSON dla produkcji
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Konfiguracja transportów
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  })
];

// W produkcji dodaj file transports
if (process.env.NODE_ENV === 'production') {
  // Log wszystkich poziomów do pliku
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/app.log'),
      format: productionFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      level: 'info'
    })
  );

  // Log tylko błędów do osobnego pliku
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      format: productionFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      level: 'error'
    })
  );
}

// Stwórz logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: productionFormat,
  transports,
  // Nie exit przy uncaught exceptions
  exitOnError: false
});

// HTTP request logging middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Override res.end aby zalogować response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;

    // Log request/response
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id,
      contentLength: res.get('Content-Length')
    });

    originalEnd.apply(this, args);
  };

  next();
};

// Security logger - dla ważnych zdarzeń bezpieczeństwa
const securityLogger = {
  logAuthAttempt: (email, success, ip, userAgent) => {
    logger.warn('Authentication Attempt', {
      event: 'auth_attempt',
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  logRateLimitHit: (ip, endpoint) => {
    logger.warn('Rate Limit Hit', {
      event: 'rate_limit_hit',
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    });
  },

  logUnauthorizedAccess: (ip, endpoint, userId) => {
    logger.warn('Unauthorized Access Attempt', {
      event: 'unauthorized_access',
      ip,
      endpoint,
      userId,
      timestamp: new Date().toISOString()
    });
  },

  logDataAccess: (userId, action, resource, resourceId) => {
    logger.info('Data Access', {
      event: 'data_access',
      userId,
      action,
      resource,
      resourceId,
      timestamp: new Date().toISOString()
    });
  }
};

// Stwórz folder logs jeśli nie istnieje (dla produkcji)
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

module.exports = {
  logger,
  httpLogger,
  securityLogger
};

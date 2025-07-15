// CRITICAL: Sentry must be imported and initialized first
const { initSentry, sentryRequestHandler, sentryErrorHandler, addBreadcrumb } = require('./config/sentry');

// Initialize Sentry error tracking
initSentry();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const http = require('http');

// Load environment variables
dotenv.config();

// Import logger
const { logger, httpLogger } = require('./config/logger');

// Import metrics system
const { startMetricsCollection } = require('./config/metrics');
const {
  metricsMiddleware,
  errorMetricsMiddleware,
  createPrismaMiddleware: _createPrismaMiddleware,
  rateLimitMetricsMiddleware
} = require('./middleware/metricsMiddleware');

// Import passport configuration
const passport = require('./config/passport');

// Import Swagger configuration
const { specs, swaggerUi } = require('./config/swagger');

// ETAP 11 - Socket.io configuration
const socketManager = require('./config/socket');

// ETAP 12 - i18n configuration
const { i18next, middleware: i18nMiddleware } = require('./config/i18n');

// Import schedulers
const backupScheduler = require('./scripts/backup-scheduler');
const subscriptionNotificationScheduler = require('./scripts/subscription-notification-scheduler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Debug middleware - loguje wszystkie requesty
app.use((req, res, next) => {
  console.log('[DEBUG] REQUEST:', req.method, req.originalUrl, req.query, req.headers);
  next();
});

// Sentry request handler (must be first middleware)
app.use(sentryRequestHandler());

// Metrics middleware (early in the stack for accurate timing)
app.use(metricsMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // maksymalnie 100 requestów na IP w ciągu 15 minut
  message: {
    error: 'Zbyt wiele requestów z tego IP, spróbuj ponownie za 15 minut.',
    success: false
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting dla uwierzytelniania (bardziej restrykcyjne)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // 50 requestów w dev, 5 w prod
  message: {
    error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
    success: false
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Zastosuj podstawowy rate limiting do wszystkich requestów (tylko w produkcji)
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
  app.use(rateLimitMetricsMiddleware);
} else {
  console.log('🚀 Development mode - rate limiting disabled');
}

// Cookie parser
app.use(cookieParser());

// HTTP request logging
app.use(httpLogger);

// CORS configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://127.0.0.1:5173', // Dodane: Vite dev server na 127.0.0.1
    'http://localhost:3000'  // Create React App
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
}));

// ETAP 12 - i18n middleware
app.use(i18nMiddleware.handle(i18next));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'siteboss.sid', // Zmiana nazwy cookie dla bezpieczeństwa
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only w prod
    httpOnly: true, // Zapobiega dostępowi z JS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax' // CSRF protection
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === SPA static serving (Vite/React build) ===
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback: serve index.html for all non-API, non-static routes (SPA support)
app.get(/^\/(?!api|uploads|api-docs|plans-admin).*/, (req, res, next) => {
  // Jeśli żądanie nie jest do API ani do plików statycznych, zwróć index.html
  res.sendFile(path.join(clientBuildPath, 'index.html'), err => {
    if (err) next();
  });
});

// API Documentation with Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customSiteTitle: 'BuildBoss API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Health check routes
app.use('/api/health', require('./routes/health'));

// Version endpoint
app.get('/api/version', (req, res) => {
  // Pobierz wersję backendu z package.json
  const backendPackage = require('./package.json');

  // Pobierz wersję frontendu z package.json frontendu
  let frontendPackage;
  try {
    frontendPackage = require('../client/package.json');
  } catch (error) {
    console.warn('Nie można odczytać package.json frontendu:', error.message);
  }

  res.json({
    backendVersion: process.env.npm_package_version || process.env.APP_VERSION || backendPackage.version || '1.0.0',
    frontendVersion: process.env.FRONTEND_APP_VERSION || (frontendPackage ? frontendPackage.version : null) || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Metrics routes
app.use('/api/metrics', require('./routes/metrics'));

// API Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/materials', require('./routes/materials'));
// ETAP 8 - Jobs & Work Requests
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/messages', require('./routes/messages'));
// ETAP 10 - Subscriptions & Payments
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/webhooks', require('./routes/webhooks'));
// ETAP 11 - Notifications
app.use('/api/notifications', require('./routes/notifications').router);
// ETAP 14 - Legal Documents & GDPR
app.use('/api/legal', require('./routes/legal'));
app.use('/api/gdpr', require('./routes/gdpr'));
// ETAP 15 - Analytics & Reports
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));
// ETAP 15C - Search & Tags
app.use('/api/search', require('./routes/search'));
app.use('/api/tags', require('./routes/tags'));
// Database Backups
app.use('/api/backups', require('./routes/backups'));
// Panel admina do zarządzania planami (tajna ścieżka)
app.use('/plans-admin', require('./routes/plansAdmin'));
// Admin messages system
app.use('/api/admin/messages', require('./routes/adminMessages'));
app.use('/api/admin/users', require('./routes/adminUsers'));

// 404 handler
app.use((req, res) => {
  // Track 404s in Sentry
  addBreadcrumb(`404 Error: ${req.method} ${req.originalUrl}`, 'navigation', 'warning', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: req.t ? req.t('errors:general.not_found') : 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// Metrics error handler
app.use(errorMetricsMiddleware);

// Global error handler
app.use((err, req, res, _next) => {
  logger.error('Global error handler', {
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: req.t ? req.t('errors:database.duplicate_entry') : 'Duplicate entry',
      message: req.t ? req.t('errors:database.duplicate_entry') : 'This record already exists'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: req.t ? req.t('errors:auth.token_invalid') : 'Invalid token',
      message: req.t ? req.t('errors:auth.token_invalid') : 'Please login again'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || (req.t ? req.t('errors:general.internal_server_error') : 'Internal server error'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize Socket.io
socketManager.initialize(server);

// Initialize metrics collection
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
startMetricsCollection(prisma);

// Start schedulers in production
if (process.env.NODE_ENV === 'production') {
  try {
    // Start backup scheduler
    backupScheduler.start();
    console.log('✅ Backup scheduler started');

    // Start subscription notification scheduler
    subscriptionNotificationScheduler.start();
    console.log('✅ Subscription notification scheduler started');
  } catch (error) {
    console.error('❌ Failed to start schedulers:', error);
  }
}

// Start server
server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/api/health`,
    metricsEndpoint: `http://localhost:${PORT}/api/metrics`,
    features: {
      socketIO: true,
      i18n: ['pl', 'de', 'en', 'ua'],
      rateLimit: true,
      logging: true,
      metrics: true
    }
  });
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const http = require('http');

// Load environment variables
dotenv.config();

// Import passport configuration
const passport = require('./config/passport');

// ETAP 11 - Socket.io configuration
const socketManager = require('./config/socket');

// ETAP 12 - i18n configuration
const { i18next, middleware: i18nMiddleware } = require('./config/i18n');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
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
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SiteBoss Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    language: req.language || 'pl'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: req.t ? req.t('errors:general.not_found') : 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SiteBoss Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔔 Socket.io notifications enabled`);
  console.log(`🌍 i18n enabled with languages: pl, de, en, ua`);
}); 
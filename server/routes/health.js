const express = require('express');
const { PrismaClient } = require('@prisma/client');
const os = require('os');
const fs = require('fs').promises;
const { logger } = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SiteBoss Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    language: req.language || 'pl'
  });
});

// Comprehensive health check
router.get('/detailed', async (req, res) => {
  const checks = {};
  let overallStatus = 'OK';
  
  try {
    // 1. Database connectivity check
    checks.database = await checkDatabase();
    
    // 2. Redis connectivity check (if configured)
    checks.redis = await checkRedis();
    
    // 3. Disk space check
    checks.diskSpace = await checkDiskSpace();
    
    // 4. Memory usage check
    checks.memory = checkMemory();
    
    // 5. System load check
    checks.systemLoad = checkSystemLoad();
    
    // 6. Dependencies check
    checks.dependencies = await checkDependencies();
    
    // 7. External services check
    checks.externalServices = await checkExternalServices();
    
    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status !== 'OK');
    if (failedChecks.length > 0) {
      overallStatus = failedChecks.some(check => check.status === 'CRITICAL') ? 'CRITICAL' : 'WARNING';
    }
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks
    };
    
    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'CRITICAL' ? 503 : 
                      overallStatus === 'WARNING' ? 200 : 200;
    
    res.status(httpStatus).json(response);
    
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(503).json({
      status: 'CRITICAL',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      message: error.message
    });
  }
});

// Individual component health checks
router.get('/database', async (req, res) => {
  try {
    const result = await checkDatabase();
    res.json(result);
  } catch (error) {
    res.status(503).json({
      status: 'CRITICAL',
      component: 'database',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/redis', async (req, res) => {
  try {
    const result = await checkRedis();
    res.json(result);
  } catch (error) {
    res.status(503).json({
      status: 'CRITICAL',
      component: 'redis',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/system', (req, res) => {
  try {
    const result = {
      memory: checkMemory(),
      diskSpace: checkDiskSpace(),
      systemLoad: checkSystemLoad()
    };
    res.json(result);
  } catch (error) {
    res.status(503).json({
      status: 'CRITICAL',
      component: 'system',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions for health checks
async function checkDatabase() {
  try {
    const start = Date.now();
    
    // Simple connection test
    await prisma.$queryRaw`SELECT 1`;
    
    // Test basic operations
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'OK',
      component: 'database',
      responseTime: `${responseTime}ms`,
      details: {
        connection: 'connected',
        users: userCount,
        companies: companyCount,
        version: await getDatabaseVersion()
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'CRITICAL',
      component: 'database',
      error: error.message,
      details: {
        connection: 'failed'
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function checkRedis() {
  try {
    // If Redis is not configured, mark as N/A
    if (!process.env.REDIS_URL) {
      return {
        status: 'N/A',
        component: 'redis',
        message: 'Redis not configured',
        timestamp: new Date().toISOString()
      };
    }
    
    // This is a placeholder - you'd need to implement actual Redis connectivity
    // const redis = require('redis');
    // const client = redis.createClient(process.env.REDIS_URL);
    // await client.ping();
    
    return {
      status: 'OK',
      component: 'redis',
      message: 'Redis check placeholder - implement based on your Redis setup',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'CRITICAL',
      component: 'redis',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkDiskSpace() {
  try {
    const stats = await fs.stat(__dirname);
    const diskUsage = {
      total: 'N/A - requires implementation',
      used: 'N/A - requires implementation',
      available: 'N/A - requires implementation'
    };
    
    // Note: Node.js doesn't have built-in disk space checking
    // You could use a library like 'diskusage' or implement platform-specific commands
    
    return {
      status: 'OK',
      component: 'diskSpace',
      details: diskUsage,
      message: 'Disk space monitoring placeholder',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'WARNING',
      component: 'diskSpace',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function checkMemory() {
  try {
    const memUsage = process.memoryUsage();
    const systemMem = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };
    
    const memUsagePercent = (systemMem.used / systemMem.total) * 100;
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // Warning if memory usage > 80%
    const status = memUsagePercent > 80 ? 'WARNING' : 'OK';
    
    return {
      status,
      component: 'memory',
      details: {
        process: {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsagePercent: `${Math.round(heapUsagePercent)}%`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        system: {
          total: `${Math.round(systemMem.total / 1024 / 1024 / 1024)}GB`,
          free: `${Math.round(systemMem.free / 1024 / 1024 / 1024)}GB`,
          used: `${Math.round(systemMem.used / 1024 / 1024 / 1024)}GB`,
          usagePercent: `${Math.round(memUsagePercent)}%`
        }
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'WARNING',
      component: 'memory',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function checkSystemLoad() {
  try {
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    
    // Load average should ideally be below CPU count
    const load1min = loadAvg[0];
    const loadPercent = (load1min / cpuCount) * 100;
    
    const status = loadPercent > 80 ? 'WARNING' : 'OK';
    
    return {
      status,
      component: 'systemLoad',
      details: {
        loadAverage: {
          '1min': loadAvg[0].toFixed(2),
          '5min': loadAvg[1].toFixed(2),
          '15min': loadAvg[2].toFixed(2)
        },
        cpuCount,
        loadPercent: `${Math.round(loadPercent)}%`,
        uptime: `${Math.round(os.uptime() / 3600)}h`
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'WARNING',
      component: 'systemLoad',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkDependencies() {
  try {
    const dependencies = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development'
    };
    
    return {
      status: 'OK',
      component: 'dependencies',
      details: dependencies,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'WARNING',
      component: 'dependencies',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkExternalServices() {
  try {
    const services = {};
    
    // Check Stripe API if configured
    if (process.env.STRIPE_SECRET_KEY) {
      services.stripe = await checkStripeAPI();
    }
    
    // Check Email service if configured
    if (process.env.EMAIL_HOST) {
      services.email = await checkEmailService();
    }
    
    // Check Google OAuth if configured
    if (process.env.GOOGLE_CLIENT_ID) {
      services.googleOAuth = { status: 'CONFIGURED', message: 'OAuth credentials present' };
    }
    
    const allServicesOK = Object.values(services).every(service => 
      service.status === 'OK' || service.status === 'CONFIGURED'
    );
    
    return {
      status: allServicesOK ? 'OK' : 'WARNING',
      component: 'externalServices',
      details: services,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'WARNING',
      component: 'externalServices',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkStripeAPI() {
  try {
    // This is a placeholder - implement actual Stripe API check
    return {
      status: 'OK',
      message: 'Stripe API check placeholder',
      configured: !!process.env.STRIPE_SECRET_KEY
    };
  } catch (error) {
    return {
      status: 'WARNING',
      error: error.message
    };
  }
}

async function checkEmailService() {
  try {
    // This is a placeholder - implement actual email service check
    return {
      status: 'OK',
      message: 'Email service check placeholder',
      configured: !!(process.env.EMAIL_HOST && process.env.EMAIL_USER)
    };
  } catch (error) {
    return {
      status: 'WARNING',
      error: error.message
    };
  }
}

async function getDatabaseVersion() {
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    return result[0]?.version || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

module.exports = router;
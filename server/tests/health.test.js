const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Mock app dla testów
const createTestApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check routes
  app.use('/api/health', require('../routes/health'));

  return app;
};

describe('Health Check API', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  // Basic health check tests
  describe('Basic Health Check', () => {
    test('GET /api/health should return OK status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        message: 'SiteBoss Server is running!',
        environment: 'test'
      });

      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/health should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });

  // Detailed health check tests
  describe('Detailed Health Check', () => {
    test('GET /api/health/detailed should return comprehensive status', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('checks');

      // Check that all expected components are present
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('redis');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks).toHaveProperty('systemLoad');
      expect(response.body.checks).toHaveProperty('dependencies');
      expect(response.body.checks).toHaveProperty('externalServices');
    });

    test('Database check should have proper structure', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      const dbCheck = response.body.checks.database;
      expect(dbCheck).toHaveProperty('status');
      expect(dbCheck).toHaveProperty('component', 'database');
      expect(dbCheck).toHaveProperty('timestamp');

      if (dbCheck.status === 'OK') {
        expect(dbCheck).toHaveProperty('responseTime');
        expect(dbCheck).toHaveProperty('details');
      }
    });

    test('Memory check should include usage statistics', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      const memCheck = response.body.checks.memory;
      expect(memCheck).toHaveProperty('status');
      expect(memCheck).toHaveProperty('component', 'memory');
      expect(memCheck).toHaveProperty('details');

      if (memCheck.status === 'OK' || memCheck.status === 'WARNING') {
        expect(memCheck.details).toHaveProperty('process');
        expect(memCheck.details).toHaveProperty('system');
        expect(memCheck.details.process).toHaveProperty('heapUsed');
        expect(memCheck.details.system).toHaveProperty('total');
      }
    });

    test('System load check should include CPU information', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      const loadCheck = response.body.checks.systemLoad;
      expect(loadCheck).toHaveProperty('status');
      expect(loadCheck).toHaveProperty('component', 'systemLoad');
      expect(loadCheck).toHaveProperty('details');

      if (loadCheck.status === 'OK' || loadCheck.status === 'WARNING') {
        expect(loadCheck.details).toHaveProperty('loadAverage');
        expect(loadCheck.details).toHaveProperty('cpuCount');
        expect(loadCheck.details).toHaveProperty('uptime');
      }
    });
  });

  // Individual component tests
  describe('Individual Component Health Checks', () => {
    test('GET /api/health/database should return database status', async () => {
      const response = await request(app)
        .get('/api/health/database');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('component', 'database');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/health/redis should return Redis status', async () => {
      const response = await request(app)
        .get('/api/health/redis');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('component', 'redis');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/health/system should return system metrics', async () => {
      const response = await request(app)
        .get('/api/health/system')
        .expect(200);

      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('systemLoad');
      expect(response.body.memory).toHaveProperty('status');
      expect(response.body.systemLoad).toHaveProperty('status');
    });
  });

  // Status validation tests
  describe('Health Status Validation', () => {
    test('Should return valid status values', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      const validStatuses = ['OK', 'WARNING', 'CRITICAL', 'N/A'];

      expect(validStatuses).toContain(response.body.status);

      Object.values(response.body.checks).forEach(check => {
        expect(validStatuses).toContain(check.status);
      });
    });

    test('Overall status should reflect component statuses', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      const componentStatuses = Object.values(response.body.checks)
        .map(check => check.status)
        .filter(status => status !== 'N/A');

      const hasCritical = componentStatuses.includes('CRITICAL');
      const hasWarning = componentStatuses.includes('WARNING');

      if (hasCritical) {
        expect(response.body.status).toBe('CRITICAL');
      } else if (hasWarning) {
        expect(['WARNING', 'OK']).toContain(response.body.status);
      } else {
        expect(['WARNING', 'OK']).toContain(response.body.status);
      }
    });
  });

  // Response format validation
  describe('Response Format Validation', () => {
    test('All timestamps should be valid ISO strings', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      // Main timestamp
      expect(() => new Date(response.body.timestamp)).not.toThrow();

      // Component timestamps
      Object.values(response.body.checks).forEach(check => {
        expect(() => new Date(check.timestamp)).not.toThrow();
      });
    });

    test('Uptime should be a number', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('Environment should be set', async () => {
      const response = await request(app)
        .get('/api/health/detailed');

      expect(response.body.environment).toBeDefined();
      expect(typeof response.body.environment).toBe('string');
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    test('Should handle invalid endpoint gracefully', async () => {
      await request(app)
        .get('/api/health/invalid')
        .expect(404);
    });

    test('Should return proper content-type for all endpoints', async () => {
      const endpoints = ['/', '/detailed', '/database', '/redis', '/system'];

      for (const endpoint of endpoints) {
        await request(app)
          .get(`/api/health${endpoint}`)
          .expect('Content-Type', /json/);
      }
    });
  });
});

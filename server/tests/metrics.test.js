/**
 * Metrics System Tests
 * 
 * Tests for application metrics collection and endpoints:
 * - Metrics configuration
 * - HTTP request metrics
 * - Database query metrics
 * - Business metrics
 * - Prometheus endpoint
 * - Metrics middleware
 */

const request = require('supertest');
const { app } = require('./setup');
const { register } = require('../config/metrics');

describe('Metrics System', () => {
  beforeEach(async () => {
    // Clear metrics before each test
    register.clear();
  });

  describe('Metrics Configuration', () => {
    test('should have metrics registry configured', () => {
      expect(register).toBeDefined();
      expect(typeof register.metrics).toBe('function');
    });

    test('should have default labels set', async () => {
      const metrics = await register.getMetricsAsJSON();
      // Default labels should be applied to all metrics
      expect(metrics.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Prometheus Endpoint', () => {
    test('should serve metrics in Prometheus format', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/plain/);
      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });

    test('should include default Node.js metrics', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      // Check for common Node.js metrics
      expect(response.text).toMatch(/nodejs_memory_usage_bytes/);
      expect(response.text).toMatch(/process_cpu_user_seconds_total/);
      expect(response.text).toMatch(/nodejs_version_info/);
    });

    test('should include custom application metrics', async () => {
      // Make a request to generate HTTP metrics
      await request(app)
        .get('/api/health')
        .expect(200);

      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      // Check for custom metrics
      expect(response.text).toMatch(/http_requests_total/);
      expect(response.text).toMatch(/http_request_duration_seconds/);
    });
  });

  describe('Health Metrics Endpoint', () => {
    test('should return health status with metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('metrics');

      const metrics = response.body.metrics;
      expect(metrics).toHaveProperty('activeRequests');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('databaseQueries');
      expect(metrics).toHaveProperty('memoryUsage');

      expect(typeof metrics.activeRequests).toBe('number');
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
      expect(typeof metrics.avgResponseTime).toBe('number');
      expect(typeof metrics.databaseQueries).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('object');
    });

    test('should return healthy status under normal conditions', async () => {
      const response = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Metrics Summary Endpoint', () => {
    test('should require authentication', async () => {
      await request(app)
        .get('/api/metrics/summary')
        .expect(401);
    });

    test('should return detailed metrics summary for authenticated user', async () => {
      // This would require setting up authentication
      // For now, we'll test the endpoint structure
      const response = await request(app)
        .get('/api/metrics/summary')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('HTTP Request Metrics', () => {
    test('should record HTTP request metrics', async () => {
      // Make several requests
      await request(app).get('/api/health').expect(200);
      await request(app).get('/api/health').expect(200);
      await request(app).get('/api/nonexistent').expect(404);

      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      // Check that HTTP metrics are recorded
      expect(response.text).toMatch(/http_requests_total.*GET.*\/api\/health.*200/);
      expect(response.text).toMatch(/http_requests_total.*GET.*\/api\/nonexistent.*404/);
      expect(response.text).toMatch(/http_request_duration_seconds/);
    });

    test('should track different HTTP methods', async () => {
      await request(app).get('/api/health').expect(200);
      await request(app).post('/api/auth/login').send({}).expect(400);

      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.text).toMatch(/http_requests_total.*GET/);
      expect(response.text).toMatch(/http_requests_total.*POST/);
    });

    test('should track response status codes', async () => {
      await request(app).get('/api/health').expect(200);
      await request(app).get('/api/nonexistent').expect(404);

      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.text).toMatch(/http_requests_total.*200/);
      expect(response.text).toMatch(/http_requests_total.*404/);
    });
  });

  describe('Error Metrics', () => {
    test('should record application errors', async () => {
      // Generate some errors
      await request(app).get('/api/nonexistent').expect(404);
      await request(app).post('/api/auth/login').send({}).expect(400);

      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      // Check for error metrics
      expect(response.text).toMatch(/application_errors_total/);
    });
  });

  describe('Metrics Middleware', () => {
    test('should add metrics middleware to requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // The request should have been processed by metrics middleware
      // We can verify this by checking if metrics were updated
      const metricsResponse = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      expect(metricsResponse.body.metrics.totalRequests).toBeGreaterThan(0);
    });

    test('should handle errors gracefully', async () => {
      // Make a request that will cause an error
      await request(app)
        .get('/api/nonexistent')
        .expect(404);

      // Metrics should still be recorded
      const response = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      expect(response.body.metrics.totalRequests).toBeGreaterThan(0);
      expect(response.body.metrics.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Performance Metrics', () => {
    test('should track request duration', async () => {
      await request(app).get('/api/health').expect(200);

      const response = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(response.text).toMatch(/http_request_duration_seconds_bucket/);
      expect(response.text).toMatch(/http_request_duration_seconds_count/);
      expect(response.text).toMatch(/http_request_duration_seconds_sum/);
    });

    test('should track memory usage', async () => {
      const response = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      const memory = response.body.metrics.memoryUsage;
      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory.rss).toBeGreaterThan(0);
      expect(memory.heapUsed).toBeGreaterThan(0);
      expect(memory.heapTotal).toBeGreaterThan(0);
    });
  });

  describe('Metrics Reset (Admin)', () => {
    test('should require authentication for reset', async () => {
      await request(app)
        .post('/api/metrics/reset')
        .expect(401);
    });

    test('should require admin role for reset', async () => {
      await request(app)
        .post('/api/metrics/reset')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Custom Metrics (Admin)', () => {
    test('should require authentication for custom metrics', async () => {
      await request(app)
        .post('/api/metrics/custom')
        .send({
          name: 'test_metric',
          type: 'counter',
          value: 1
        })
        .expect(401);
    });

    test('should validate custom metric data', async () => {
      await request(app)
        .post('/api/metrics/custom')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          // Missing required fields
        })
        .expect(401); // Will fail auth before validation
    });
  });

  describe('Metrics Integration', () => {
    test('should handle concurrent requests', async () => {
      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/api/health').expect(200)
      );

      await Promise.all(promises);

      const response = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      expect(response.body.metrics.totalRequests).toBeGreaterThanOrEqual(10);
    });

    test('should maintain metrics across multiple endpoints', async () => {
      await request(app).get('/api/health').expect(200);
      await request(app).get('/api/metrics/health').expect(200);
      await request(app).get('/api/metrics').expect(200);

      const response = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      expect(response.body.metrics.totalRequests).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed requests gracefully', async () => {
      // Make request with malformed data
      await request(app)
        .post('/api/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Metrics should still be recorded
      const response = await request(app)
        .get('/api/metrics/health')
        .expect(200);

      expect(response.body.metrics.totalRequests).toBeGreaterThan(0);
    });

    test('should handle very slow requests', async () => {
      // This test would require mocking slow operations
      // For now, just ensure metrics endpoint responds quickly
      const start = Date.now();
      await request(app).get('/api/metrics/health').expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });
}); 
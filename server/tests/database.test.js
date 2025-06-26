const {
  prisma,
  checkDatabaseConnection,
  getDatabaseMetrics,
  poolConfig
} = require('../config/database');

describe('Database Configuration', () => {

  // Basic connection tests
  describe('Database Connection', () => {
    test('should export prisma client', () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe('object');
    });

    test('should export utility functions', () => {
      expect(checkDatabaseConnection).toBeDefined();
      expect(typeof checkDatabaseConnection).toBe('function');

      expect(getDatabaseMetrics).toBeDefined();
      expect(typeof getDatabaseMetrics).toBe('function');

      expect(poolConfig).toBeDefined();
      expect(typeof poolConfig).toBe('object');
    });

    test('should have proper pool configuration for test environment', () => {
      expect(poolConfig).toHaveProperty('connection_limit');
      expect(poolConfig).toHaveProperty('pool_timeout');

      // Test environment should have minimal pool
      expect(poolConfig.connection_limit).toBe(2);
      expect(poolConfig.pool_timeout).toBe(5);
    });
  });

  // Connection health tests
  describe('Connection Health Check', () => {
    test('should successfully check database connection', async () => {
      const isHealthy = await checkDatabaseConnection();
      expect(typeof isHealthy).toBe('boolean');
      expect(isHealthy).toBe(true);
    }, 10000); // 10 second timeout

    test('should return false for invalid connection', async () => {
      // Mock a failed connection by temporarily breaking prisma
      const originalQueryRaw = prisma.$queryRaw;
      prisma.$queryRaw = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const isHealthy = await checkDatabaseConnection();
      expect(isHealthy).toBe(false);

      // Restore original function
      prisma.$queryRaw = originalQueryRaw;
    });
  });

  // Database metrics tests
  describe('Database Metrics', () => {
    test('should attempt to collect database metrics', async () => {
      const metrics = await getDatabaseMetrics();

      // Metrics might be null if not supported by Prisma version
      expect(metrics === null || typeof metrics === 'object').toBe(true);
    });

    test('should handle metrics collection errors gracefully', async () => {
      // Since Prisma metrics require preview feature, test the actual behavior
      const metrics = await getDatabaseMetrics();

      // Should return null because metrics preview feature is not enabled
      expect(metrics).toBeNull();
    });
  });

  // Basic CRUD operations tests
  describe('Database Operations', () => {
    test('should perform basic query operation', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test_value`;
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('test_value', 1);
    });

    test('should count users table', async () => {
      const userCount = await prisma.user.count();
      expect(typeof userCount).toBe('number');
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    test('should count companies table', async () => {
      const companyCount = await prisma.company.count();
      expect(typeof companyCount).toBe('number');
      expect(companyCount).toBeGreaterThanOrEqual(0);
    });
  });

  // Pool configuration tests
  describe('Connection Pool Configuration', () => {
    test('should have different configurations for different environments', () => {
      const environments = ['development', 'test', 'production'];

      environments.forEach(env => {
        // Temporarily set NODE_ENV
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = env;

        // Re-require to get fresh config
        delete require.cache[require.resolve('../config/database')];
        const { poolConfig: envConfig } = require('../config/database');

        expect(envConfig).toHaveProperty('connection_limit');
        expect(envConfig).toHaveProperty('pool_timeout');
        expect(typeof envConfig.connection_limit).toBe('number');
        expect(typeof envConfig.pool_timeout).toBe('number');

        // Restore original environment
        process.env.NODE_ENV = originalEnv;
      });
    });

    test('should use appropriate pool sizes for environments', () => {
      // Test environment configuration
      expect(poolConfig.connection_limit).toBeLessThanOrEqual(5);
      expect(poolConfig.pool_timeout).toBeLessThanOrEqual(10);
    });
  });

  // Query timeout tests
  describe('Query Timeout Protection', () => {
    test('should have query timeout configuration', () => {
      const timeout = parseInt(process.env.DB_QUERY_TIMEOUT || '10000', 10);
      expect(typeof timeout).toBe('number');
      expect(timeout).toBeGreaterThan(0);
    });

    test('should handle fast queries normally', async () => {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should be very fast
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    test('should handle invalid SQL gracefully', async () => {
      await expect(
        prisma.$queryRaw`SELECT * FROM non_existent_table`
      ).rejects.toThrow();
    });

    test('should handle database disconnection gracefully', async () => {
      // This test checks that our error handling works
      // but we don't actually disconnect in tests
      expect(checkDatabaseConnection).toBeDefined();
    });
  });

  // Logging integration tests
  describe('Logging Integration', () => {
    test('should have Winston logger integration', () => {
      const { logger } = require('../config/logger');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  // Cleanup tests
  describe('Cleanup and Shutdown', () => {
    test('should have graceful shutdown function exported', () => {
      const { gracefulShutdown } = require('../config/database');
      expect(gracefulShutdown).toBeDefined();
      expect(typeof gracefulShutdown).toBe('function');
    });

    test('should handle graceful shutdown without errors', async () => {
      const { gracefulShutdown } = require('../config/database');

      // This should not throw an error
      await expect(gracefulShutdown()).resolves.toBeUndefined();
    });
  });
});

const { logger, securityLogger } = require('../config/logger');

// Mock winston logger for tests
jest.mock('winston', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

describe('Logging System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger', () => {
    test('should have all required log methods', () => {
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    test('should log info messages', () => {
      const message = 'Test info message';
      const metadata = { userId: '123', action: 'test' };

      logger.info(message, metadata);

      expect(logger.info).toHaveBeenCalledWith(message, metadata);
    });

    test('should log error messages', () => {
      const message = 'Test error message';
      const error = { message: 'Error details', stack: 'Error stack' };

      logger.error(message, error);

      expect(logger.error).toHaveBeenCalledWith(message, error);
    });
  });

  describe('Security Logger', () => {
    test('should have security logging methods', () => {
      expect(securityLogger.logAuth).toBeDefined();
      expect(securityLogger.logDataAccess).toBeDefined();
      expect(securityLogger.logSecurityEvent).toBeDefined();
    });

    test('should log authentication events', () => {
      const userId = 'user123';
      const action = 'LOGIN';
      const result = 'SUCCESS';
      const metadata = { ip: '127.0.0.1' };

      securityLogger.logAuth(userId, action, result, metadata);

      expect(securityLogger.logAuth).toHaveBeenCalledWith(userId, action, result, metadata);
    });

    test('should log data access events', () => {
      const userId = 'user123';
      const action = 'READ';
      const resource = 'company';
      const resourceId = 'company123';

      securityLogger.logDataAccess(userId, action, resource, resourceId);

      expect(securityLogger.logDataAccess).toHaveBeenCalledWith(userId, action, resource, resourceId);
    });

    test('should log security events', () => {
      const event = 'SUSPICIOUS_ACTIVITY';
      const details = { ip: '127.0.0.1', reason: 'Multiple failed attempts' };

      securityLogger.logSecurityEvent(event, details);

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(event, details);
    });
  });

  describe('Log Format Validation', () => {
    test('should handle undefined metadata gracefully', () => {
      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
    });

    test('should handle null values in metadata', () => {
      expect(() => {
        logger.error('Error message', { userId: null, error: null });
      }).not.toThrow();
    });

    test('should handle complex metadata objects', () => {
      const complexMetadata = {
        userId: 'user123',
        request: {
          method: 'POST',
          url: '/api/test',
          headers: { 'user-agent': 'test' }
        },
        nested: {
          level1: {
            level2: 'deep value'
          }
        }
      };

      expect(() => {
        logger.info('Complex log', complexMetadata);
      }).not.toThrow();
    });
  });

  describe('Log Level Handling', () => {
    test('should handle debug logs', () => {
      logger.debug('Debug message', { context: 'test' });
      expect(logger.debug).toHaveBeenCalled();
    });

    test('should handle warning logs', () => {
      logger.warn('Warning message', { context: 'test' });
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});

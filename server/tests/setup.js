// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Mock logger for tests
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  securityLogger: {
    logAuth: jest.fn(),
    logDataAccess: jest.fn(),
    logSecurityEvent: jest.fn()
  }
}));

// Global test timeouts
jest.setTimeout(30000);

// Suppress console warnings in tests
console.warn = jest.fn();
console.error = jest.fn(); 
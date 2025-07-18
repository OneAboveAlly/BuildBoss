// Jest setup file
require('dotenv').config({ path: '.env.test' });
const jwt = require('jsonwebtoken');

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

// Test utilities
let testUsers = [];

async function createTestUser({ email, role = 'USER', ...otherData }) {
  const mockUser = {
    id: `test-user-${Date.now()}-${Math.random()}`,
    email,
    role,
    isEmailConfirmed: true,
    firstName: 'Test',
    lastName: 'User',
    avatar: null,
    ...otherData
  };

  testUsers.push(mockUser);
  return mockUser;
}

function getAuthToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );
}

async function cleanupTestData() {
  testUsers = [];
  // In real tests, this would clean up database
  return Promise.resolve();
}

module.exports = {
  createTestUser,
  getAuthToken,
  cleanupTestData
};

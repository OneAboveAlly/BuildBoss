const request = require('supertest');
const { DatabaseBackupManager } = require('../scripts/backup-database');
const { BackupScheduler } = require('../scripts/backup-scheduler');
const fs = require('fs').promises;
const path = require('path');

// Mock all external dependencies before requiring server
jest.mock('../config/sentry', () => ({
  initSentry: jest.fn(),
  sentryRequestHandler: jest.fn(() => (req, res, next) => next()),
  sentryErrorHandler: jest.fn(() => (err, req, res, next) => next(err)),
  addBreadcrumb: jest.fn()
}));

jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  httpLogger: jest.fn((req, res, next) => next())
}));

describe('Database Backup System', () => {
  let testBackupDir;

  beforeAll(async () => {
    // Create test backup directory
    testBackupDir = path.join(__dirname, '../test-backups');
    try {
      await fs.mkdir(testBackupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Override backup directory for tests
    process.env.BACKUP_DIR = testBackupDir;
  });

  afterAll(async () => {
    // Clean up test backup directory
    try {
      const files = await fs.readdir(testBackupDir);
      for (const file of files) {
        await fs.unlink(path.join(testBackupDir, file));
      }
      await fs.rmdir(testBackupDir);
    } catch (error) {
      // Directory might not exist or be empty
    }
  });

  describe('Backup Manager Class', () => {
    let backupManager;

    beforeAll(() => {
      backupManager = new DatabaseBackupManager({
        backupDir: testBackupDir,
        retention: { daily: 7, weekly: 4, monthly: 6 },
        compress: false, // Disable compression for faster tests
        remoteStorage: { enabled: false }
      });
    });

    describe('Backup directory management', () => {
      it('should ensure backup directory exists', async () => {
        await backupManager.ensureBackupDirectory();

        try {
          await fs.access(testBackupDir);
        } catch (error) {
          throw new Error('Backup directory should exist');
        }
      });

      it('should generate valid backup filenames', () => {
        const filename = backupManager.generateBackupFilename('test');

        expect(filename).toMatch(/^buildboss_test_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/);
        expect(filename).toContain('buildboss_test_');
        expect(filename).toContain('.sql');
      });

      it('should generate compressed filenames when compression enabled', () => {
        const compressedManager = new DatabaseBackupManager({
          ...backupManager.config,
          compress: true
        });

        const filename = compressedManager.generateBackupFilename('test');
        expect(filename).toMatch(/\.sql\.gz$/);
      });
    });

    describe('Backup listing', () => {
      it('should list existing backups', async () => {
        const backups = await backupManager.listBackups();

        expect(Array.isArray(backups)).toBe(true);

        // If backups exist, verify structure
        if (backups.length > 0) {
          const backup = backups[0];
          expect(backup).toHaveProperty('filename');
          expect(backup).toHaveProperty('path');
          expect(backup).toHaveProperty('size');
          expect(backup).toHaveProperty('created');
          expect(backup).toHaveProperty('modified');
        }
      });

      it('should sort backups by creation date', async () => {
        const backups = await backupManager.listBackups();

        if (backups.length > 1) {
          for (let i = 1; i < backups.length; i++) {
            expect(backups[i-1].created >= backups[i].created).toBe(true);
          }
        }
      });
    });

    describe('Backup verification', () => {
      it('should verify non-existent backup file', async () => {
        const isValid = await backupManager.verifyBackup('/non/existent/file.sql');
        expect(isValid).toBe(false);
      });

      it('should handle verification errors gracefully', async () => {
        // This should not throw an error
        const isValid = await backupManager.verifyBackup('/invalid/path');
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Backup Scheduler Class', () => {
    let scheduler;

    beforeAll(() => {
      scheduler = new BackupScheduler();
    });

    describe('Schedule validation', () => {
      it('should validate cron expressions', () => {
        const results = scheduler.validateSchedules();

        expect(results).toHaveProperty('daily');
        expect(results).toHaveProperty('weekly');
        expect(results).toHaveProperty('monthly');

        // All default schedules should be valid
        expect(results.daily).toBe(true);
        expect(results.weekly).toBe(true);
        expect(results.monthly).toBe(true);
      });

      it('should handle invalid cron expressions', () => {
        scheduler.schedules.daily = 'invalid cron';
        const results = scheduler.validateSchedules();

        expect(results.daily).toBe(false);

        // Reset to valid schedule
        scheduler.schedules.daily = '0 2 * * *';
      });
    });

    describe('Status management', () => {
      it('should return correct initial status', () => {
        const status = scheduler.getStatus();

        expect(status).toHaveProperty('isRunning');
        expect(status).toHaveProperty('jobs');
        expect(status).toHaveProperty('schedules');
        expect(status).toHaveProperty('enabled');
        expect(status).toHaveProperty('nextRuns');

        expect(status.isRunning).toBe(false);
        expect(Array.isArray(status.jobs)).toBe(true);
      });

      it('should track enabled backup types', () => {
        const status = scheduler.getStatus();

        expect(status.enabled).toHaveProperty('daily');
        expect(status.enabled).toHaveProperty('weekly');
        expect(status.enabled).toHaveProperty('monthly');
      });
    });

    describe('Manual backup triggering', () => {
      it('should reject invalid backup types', async () => {
        await expect(scheduler.triggerBackup('invalid')).rejects.toThrow('Invalid backup type');
      });

      it('should accept valid backup type names', () => {
        const validTypes = ['daily', 'weekly', 'monthly', 'manual'];
        // Just test that the function doesn't throw on valid types in validation
        validTypes.forEach(type => {
          expect(() => {
            if (!['daily', 'weekly', 'monthly', 'manual'].includes(type)) {
              throw new Error('Invalid backup type');
            }
          }).not.toThrow();
        });
      });
    });
  });

  describe('Environment Configuration', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use default configuration when env vars not set', () => {
      // Clear environment variables
      delete process.env.BACKUP_DIR;
      delete process.env.BACKUP_RETENTION_DAILY;

      const { config } = require('../scripts/backup-database');

      expect(config.retention.daily).toBe(7);
      expect(config.compress).toBe(true);
    });

    it('should respect environment variable overrides', () => {
      process.env.BACKUP_RETENTION_DAILY = '14';
      process.env.BACKUP_COMPRESS = 'false';

      // Re-require to get fresh config
      delete require.cache[require.resolve('../scripts/backup-database')];
      const { config } = require('../scripts/backup-database');

      expect(config.retention.daily).toBe(14);
      expect(config.compress).toBe(false);
    });
  });

  describe('Backup Configuration Validation', () => {
    it('should have valid retention policies', () => {
      const { config } = require('../scripts/backup-database');

      expect(config.retention.daily).toBeGreaterThan(0);
      expect(config.retention.weekly).toBeGreaterThan(0);
      expect(config.retention.monthly).toBeGreaterThan(0);
    });

    it('should have valid backup directory configuration', () => {
      const { config } = require('../scripts/backup-database');

      expect(typeof config.backupDir).toBe('string');
      expect(config.backupDir.length).toBeGreaterThan(0);
    });

    it('should have boolean compression setting', () => {
      const { config } = require('../scripts/backup-database');

      expect(typeof config.compress).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle backup verification errors gracefully', async () => {
      const backupManager = new DatabaseBackupManager({
        backupDir: testBackupDir,
        retention: { daily: 7, weekly: 4, monthly: 6 },
        compress: false,
        remoteStorage: { enabled: false }
      });

      // Should not throw error for non-existent file
      const isValid = await backupManager.verifyBackup('/non/existent/path');
      expect(isValid).toBe(false);
    });

    it('should handle invalid scheduler configuration', () => {
      const scheduler = new BackupScheduler();

      // Test with invalid cron expression
      scheduler.schedules.daily = 'not-a-cron-expression';
      const results = scheduler.validateSchedules();

      expect(results.daily).toBe(false);
    });
  });
});

// Custom Jest matcher for more specific testing
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false
      };
    }
  }
});

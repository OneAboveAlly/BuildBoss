#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { createReadStream, createWriteStream } = require('fs');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');

// Configuration
const config = {
  // Database connection from environment
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || '5432',
  database: process.env.DATABASE_NAME || 'buildboss',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,

  // Backup configuration
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
  retention: {
    daily: parseInt(process.env.BACKUP_RETENTION_DAILY) || 7,    // Keep 7 daily backups
    weekly: parseInt(process.env.BACKUP_RETENTION_WEEKLY) || 4,  // Keep 4 weekly backups
    monthly: parseInt(process.env.BACKUP_RETENTION_MONTHLY) || 6 // Keep 6 monthly backups
  },

  // Compression and encryption
  compress: process.env.BACKUP_COMPRESS !== 'false',
  encrypt: process.env.BACKUP_ENCRYPT === 'true',
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,

  // Remote storage
  remoteStorage: {
    enabled: process.env.BACKUP_REMOTE_ENABLED === 'true',
    type: process.env.BACKUP_REMOTE_TYPE, // 's3', 'gcs', 'azure', 'ftp'
    config: {
      bucket: process.env.BACKUP_S3_BUCKET,
      region: process.env.BACKUP_S3_REGION,
      accessKey: process.env.BACKUP_S3_ACCESS_KEY,
      secretKey: process.env.BACKUP_S3_SECRET_KEY
    }
  }
};

const pipelineAsync = promisify(pipeline);

/**
 * Logger utility
 */
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`,
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
  }

  static info(message, data) { this.log('info', message, data); }
  static warn(message, data) { this.log('warn', message, data); }
  static error(message, data) { this.log('error', message, data); }
  static success(message, data) { this.log('success', message, data); }
}

/**
 * Backup manager class
 */
class DatabaseBackupManager {
  constructor(config) {
    this.config = config;
  }

  /**
   * Ensure backup directory exists
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.config.backupDir);
    } catch (error) {
      Logger.info('Creating backup directory', { path: this.config.backupDir });
      await fs.mkdir(this.config.backupDir, { recursive: true });
    }
  }

  /**
   * Generate backup filename
   */
  generateBackupFilename(type = 'manual') {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] +
                     '_' + now.toTimeString().split(' ')[0].replace(/:/g, '-');

    const basename = `buildboss_${type}_${timestamp}`;
    const extension = this.config.compress ? '.sql.gz' : '.sql';

    return basename + extension;
  }

  /**
   * Execute pg_dump command
   */
  async executePgDump(outputPath) {
    return new Promise((resolve, reject) => {
      // Build pg_dump command
      const pgDumpCmd = [
        'pg_dump',
        `--host=${this.config.host}`,
        `--port=${this.config.port}`,
        `--username=${this.config.username}`,
        `--dbname=${this.config.database}`,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=custom',
        '--no-password'
      ].join(' ');

      // Set environment variables for password
      const env = { ...process.env };
      if (this.config.password) {
        env.PGPASSWORD = this.config.password;
      }

      Logger.info('Starting database dump', {
        command: pgDumpCmd.replace(this.config.password || '', '***'),
        outputPath
      });

      const child = exec(pgDumpCmd, { env }, (error, stdout, stderr) => {
        if (error) {
          Logger.error('pg_dump failed', { error: error.message, stderr });
          reject(error);
          return;
        }

        Logger.success('Database dump completed', { outputPath });
        resolve({ stdout, stderr });
      });

      // Pipe stdout to file
      if (this.config.compress) {
        const writeStream = createWriteStream(outputPath);
        const gzipStream = createGzip();

        child.stdout.pipe(gzipStream).pipe(writeStream);

        writeStream.on('error', reject);
        gzipStream.on('error', reject);
      } else {
        const writeStream = createWriteStream(outputPath);
        child.stdout.pipe(writeStream);
        writeStream.on('error', reject);
      }
    });
  }

  /**
   * Create database backup
   */
  async createBackup(type = 'manual') {
    try {
      Logger.info('Starting database backup', { type });

      await this.ensureBackupDirectory();

      const filename = this.generateBackupFilename(type);
      const backupPath = path.join(this.config.backupDir, filename);

      // Create the backup
      await this.executePgDump(backupPath);

      // Get backup file size
      const stats = await fs.stat(backupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      Logger.success('Backup completed successfully', {
        filename,
        path: backupPath,
        size: `${sizeInMB} MB`,
        compressed: this.config.compress
      });

      // Upload to remote storage if enabled
      if (this.config.remoteStorage.enabled) {
        await this.uploadToRemoteStorage(backupPath, filename);
      }

      return {
        filename,
        path: backupPath,
        size: stats.size,
        type,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      Logger.error('Backup failed', { error: error.message, type });
      throw error;
    }
  }

  /**
   * Upload backup to remote storage
   */
  async uploadToRemoteStorage(localPath, filename) {
    if (!this.config.remoteStorage.enabled) {
      return;
    }

    try {
      Logger.info('Uploading backup to remote storage', {
        type: this.config.remoteStorage.type,
        filename
      });

      switch (this.config.remoteStorage.type) {
      case 's3':
        await this.uploadToS3(localPath, filename);
        break;
      case 'gcs':
        await this.uploadToGCS(localPath, filename);
        break;
      default:
        Logger.warn('Unknown remote storage type', {
          type: this.config.remoteStorage.type
        });
      }

    } catch (error) {
      Logger.error('Remote upload failed', { error: error.message });
      // Don't throw error - local backup is still valid
    }
  }

  /**
   * Upload to AWS S3 (placeholder - requires aws-sdk)
   */
  async uploadToS3(localPath, filename) {
    Logger.info('S3 upload would be implemented here', { localPath, filename });
    // Implementation would require aws-sdk package
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3({...});
    // await s3.upload({...}).promise();
  }

  /**
   * Upload to Google Cloud Storage (placeholder)
   */
  async uploadToGCS(localPath, filename) {
    Logger.info('GCS upload would be implemented here', { localPath, filename });
    // Implementation would require @google-cloud/storage package
  }

  /**
   * List existing backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.config.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.sql.gz')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created - a.created);

      return backups;

    } catch (error) {
      Logger.error('Failed to list backups', { error: error.message });
      return [];
    }
  }

  /**
   * Clean old backups according to retention policy
   */
  async cleanOldBackups() {
    try {
      Logger.info('Starting backup cleanup', { retention: this.config.retention });

      const backups = await this.listBackups();
      const now = new Date();
      let deletedCount = 0;

      for (const backup of backups) {
        const ageInDays = Math.floor((now - backup.created) / (1000 * 60 * 60 * 24));
        let shouldDelete = false;

        // Determine if backup should be deleted based on retention policy
        if (backup.filename.includes('_daily_') && ageInDays > this.config.retention.daily) {
          shouldDelete = true;
        } else if (backup.filename.includes('_weekly_') && ageInDays > (this.config.retention.weekly * 7)) {
          shouldDelete = true;
        } else if (backup.filename.includes('_monthly_') && ageInDays > (this.config.retention.monthly * 30)) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          await fs.unlink(backup.path);
          Logger.info('Deleted old backup', {
            filename: backup.filename,
            ageInDays
          });
          deletedCount++;
        }
      }

      Logger.success('Backup cleanup completed', { deletedCount });

    } catch (error) {
      Logger.error('Backup cleanup failed', { error: error.message });
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupPath) {
    return new Promise((resolve, reject) => {
      Logger.info('Starting database restore', { backupPath });

      const pgRestoreCmd = [
        'pg_restore',
        `--host=${this.config.host}`,
        `--port=${this.config.port}`,
        `--username=${this.config.username}`,
        `--dbname=${this.config.database}`,
        '--verbose',
        '--clean',
        '--if-exists',
        '--no-password',
        backupPath
      ].join(' ');

      const env = { ...process.env };
      if (this.config.password) {
        env.PGPASSWORD = this.config.password;
      }

      exec(pgRestoreCmd, { env }, (error, stdout, stderr) => {
        if (error) {
          Logger.error('pg_restore failed', { error: error.message, stderr });
          reject(error);
          return;
        }

        Logger.success('Database restore completed', { backupPath });
        resolve({ stdout, stderr });
      });
    });
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath) {
    try {
      // Check if file exists and is readable
      await fs.access(backupPath, fs.constants.R_OK);

      const stats = await fs.stat(backupPath);

      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // For .gz files, test decompression
      if (backupPath.endsWith('.gz')) {
        // Test if gzip file is valid (simplified check)
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
          exec(`gzip -t "${backupPath}"`, (error) => {
            if (error) {
              reject(new Error('Backup file is corrupted (gzip test failed)'));
            } else {
              resolve(true);
            }
          });
        });
      }

      return true;

    } catch (error) {
      Logger.error('Backup verification failed', {
        backupPath,
        error: error.message
      });
      return false;
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const backupManager = new DatabaseBackupManager(config);

  try {
    switch (command) {
    case 'create':
    case 'backup': {
      const type = args[1] || 'manual';
      const result = await backupManager.createBackup(type);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'list': {
      const backups = await backupManager.listBackups();
      console.log(JSON.stringify(backups, null, 2));
      break;
    }

    case 'cleanup': {
      await backupManager.cleanOldBackups();
      break;
    }

    case 'restore': {
      const backupPath = args[1];
      if (!backupPath) {
        console.error('Please provide backup file path');
        process.exit(1);
      }
      await backupManager.restoreFromBackup(backupPath);
      break;
    }

    case 'verify': {
      const backupPath = args[1];
      if (!backupPath) {
        console.error('Please provide backup file path');
        process.exit(1);
      }
      const isValid = await backupManager.verifyBackup(backupPath);
      console.log(isValid ? 'Backup is valid' : 'Backup is corrupted');
      process.exit(isValid ? 0 : 1);
      break;
    }

    default: {
      console.log(`
Usage: node backup-database.js <command> [options]

Commands:
  create [type]     Create a new backup (types: manual, daily, weekly, monthly)
  list             List all existing backups
  cleanup          Remove old backups according to retention policy
  restore <path>   Restore database from backup file
  verify <path>    Verify backup file integrity

Examples:
  node backup-database.js create daily
  node backup-database.js list
  node backup-database.js cleanup
  node backup-database.js restore ./backups/buildboss_daily_2023-12-01_10-30-00.sql.gz
  node backup-database.js verify ./backups/buildboss_daily_2023-12-01_10-30-00.sql.gz

Environment Variables:
  DATABASE_HOST              PostgreSQL host (default: localhost)
  DATABASE_PORT              PostgreSQL port (default: 5432)
  DATABASE_NAME              Database name (default: buildboss)
  DATABASE_USER              Database username (default: postgres)
  DATABASE_PASSWORD          Database password
  BACKUP_DIR                 Backup directory (default: ../backups)
  BACKUP_RETENTION_DAILY     Daily backup retention in days (default: 7)
  BACKUP_RETENTION_WEEKLY    Weekly backup retention in weeks (default: 4)
  BACKUP_RETENTION_MONTHLY   Monthly backup retention in months (default: 6)
  BACKUP_COMPRESS            Enable compression (default: true)
  BACKUP_REMOTE_ENABLED      Enable remote storage (default: false)
  BACKUP_REMOTE_TYPE         Remote storage type (s3, gcs, azure, ftp)
        `);
      break;
    }
    }
  } catch (error) {
    Logger.error('Command failed', { error: error.message });
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { DatabaseBackupManager, config };

// Run CLI if called directly
if (require.main === module) {
  main();
}

#!/usr/bin/env node

const cron = require('node-cron');
const { DatabaseBackupManager, config } = require('./backup-database');
const { logger } = require('../config/logger');

/**
 * Backup Scheduler - Automated database backups
 */
class BackupScheduler {
  constructor() {
    this.backupManager = new DatabaseBackupManager(config);
    this.jobs = new Map();
    this.isRunning = false;

    // Default schedules (can be overridden by environment variables)
    this.schedules = {
      daily: process.env.BACKUP_SCHEDULE_DAILY || '0 2 * * *',     // 2:00 AM every day
      weekly: process.env.BACKUP_SCHEDULE_WEEKLY || '0 3 * * 0',   // 3:00 AM every Sunday
      monthly: process.env.BACKUP_SCHEDULE_MONTHLY || '0 4 1 * *'  // 4:00 AM on 1st of every month
    };

    this.enabled = {
      daily: process.env.BACKUP_ENABLE_DAILY !== 'false',
      weekly: process.env.BACKUP_ENABLE_WEEKLY !== 'false',
      monthly: process.env.BACKUP_ENABLE_MONTHLY !== 'false'
    };
  }

  /**
   * Validate cron expressions
   */
  validateSchedules() {
    const validationResults = {};

    for (const [type, schedule] of Object.entries(this.schedules)) {
      try {
        validationResults[type] = cron.validate(schedule);
        if (validationResults[type]) {
          logger.info(`${type} backup schedule is valid`, { schedule });
        } else {
          logger.error(`${type} backup schedule is invalid`, { schedule });
        }
      } catch (error) {
        logger.error(`Error validating ${type} schedule`, { schedule, error: error.message });
        validationResults[type] = false;
      }
    }

    return validationResults;
  }

  /**
   * Create backup with error handling and logging
   */
  async createScheduledBackup(type) {
    const startTime = Date.now();

    try {
      logger.info(`Starting scheduled ${type} backup`);

      const result = await this.backupManager.createBackup(type);

      const duration = Date.now() - startTime;
      const sizeInMB = (result.size / (1024 * 1024)).toFixed(2);

      logger.info(`Scheduled ${type} backup completed successfully`, {
        filename: result.filename,
        size: `${sizeInMB} MB`,
        duration: `${duration}ms`,
        path: result.path
      });

      // Clean old backups after successful backup
      await this.backupManager.cleanOldBackups();

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Scheduled ${type} backup failed`, {
        error: error.message,
        duration: `${duration}ms`,
        stack: error.stack
      });

      // Optionally send alert/notification here
      await this.handleBackupFailure(type, error);

      throw error;
    }
  }

  /**
   * Handle backup failures (alerts, notifications, etc.)
   */
  async handleBackupFailure(type, error) {
    try {
      // Log failure to separate error log
      logger.error('BACKUP FAILURE ALERT', {
        type,
        error: error.message,
        timestamp: new Date().toISOString(),
        severity: 'HIGH'
      });

      // Here you could implement:
      // - Email notifications
      // - Slack/Discord webhooks
      // - SMS alerts
      // - System monitoring alerts

      // Example: Simple webhook notification (if configured)
      if (process.env.BACKUP_FAILURE_WEBHOOK) {
        await this.sendWebhookAlert(type, error);
      }

    } catch (alertError) {
      logger.error('Failed to send backup failure alert', {
        originalError: error.message,
        alertError: alertError.message
      });
    }
  }

  /**
   * Send webhook alert on backup failure
   */
  async sendWebhookAlert(type, error) {
    try {
      const { default: fetch } = await import('node-fetch');

      const payload = {
        text: '🚨 Database Backup Failed',
        attachments: [{
          color: 'danger',
          fields: [
            {
              title: 'Backup Type',
              value: type,
              short: true
            },
            {
              title: 'Error',
              value: error.message,
              short: false
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            },
            {
              title: 'Server',
              value: process.env.SERVER_NAME || 'buildboss-api',
              short: true
            }
          ]
        }]
      };

      const response = await fetch(process.env.BACKUP_FAILURE_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      logger.info('Backup failure webhook sent successfully');

    } catch (error) {
      logger.error('Failed to send webhook alert', { error: error.message });
    }
  }

  /**
   * Setup cron jobs for automated backups
   */
  setupCronJobs() {
    // Daily backup
    if (this.enabled.daily && cron.validate(this.schedules.daily)) {
      const dailyJob = cron.schedule(this.schedules.daily, async () => {
        await this.createScheduledBackup('daily');
      }, {
        scheduled: false,
        timezone: process.env.BACKUP_TIMEZONE || 'UTC'
      });

      this.jobs.set('daily', dailyJob);
      logger.info('Daily backup job scheduled', {
        schedule: this.schedules.daily,
        timezone: process.env.BACKUP_TIMEZONE || 'UTC'
      });
    }

    // Weekly backup
    if (this.enabled.weekly && cron.validate(this.schedules.weekly)) {
      const weeklyJob = cron.schedule(this.schedules.weekly, async () => {
        await this.createScheduledBackup('weekly');
      }, {
        scheduled: false,
        timezone: process.env.BACKUP_TIMEZONE || 'UTC'
      });

      this.jobs.set('weekly', weeklyJob);
      logger.info('Weekly backup job scheduled', {
        schedule: this.schedules.weekly,
        timezone: process.env.BACKUP_TIMEZONE || 'UTC'
      });
    }

    // Monthly backup
    if (this.enabled.monthly && cron.validate(this.schedules.monthly)) {
      const monthlyJob = cron.schedule(this.schedules.monthly, async () => {
        await this.createScheduledBackup('monthly');
      }, {
        scheduled: false,
        timezone: process.env.BACKUP_TIMEZONE || 'UTC'
      });

      this.jobs.set('monthly', monthlyJob);
      logger.info('Monthly backup job scheduled', {
        schedule: this.schedules.monthly,
        timezone: process.env.BACKUP_TIMEZONE || 'UTC'
      });
    }
  }

  /**
   * Start the backup scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Backup scheduler is already running');
      return;
    }

    logger.info('Starting backup scheduler');

    // Validate schedules first
    const validation = this.validateSchedules();
    const hasValidSchedules = Object.values(validation).some(isValid => isValid);

    if (!hasValidSchedules) {
      logger.error('No valid backup schedules found, scheduler not started');
      return;
    }

    // Setup cron jobs
    this.setupCronJobs();

    // Start all jobs
    for (const [type, job] of this.jobs.entries()) {
      job.start();
      logger.info(`${type} backup job started`);
    }

    this.isRunning = true;

    logger.info('Backup scheduler started successfully', {
      enabledBackups: Object.entries(this.enabled)
        .filter(([, enabled]) => enabled)
        .map(([type]) => type),
      totalJobs: this.jobs.size
    });

    // Initial health check
    setTimeout(() => {
      this.healthCheck();
    }, 5000);
  }

  /**
   * Stop the backup scheduler
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Backup scheduler is not running');
      return;
    }

    logger.info('Stopping backup scheduler');

    // Stop all jobs
    for (const [type, job] of this.jobs.entries()) {
      job.stop();
      logger.info(`${type} backup job stopped`);
    }

    this.jobs.clear();
    this.isRunning = false;

    logger.info('Backup scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      schedules: this.schedules,
      enabled: this.enabled,
      nextRuns: this.getNextRuns()
    };
  }

  /**
   * Get next run times for scheduled jobs
   */
  getNextRuns() {
    const nextRuns = {};

    for (const [type, job] of this.jobs.entries()) {
      if (job && typeof job.getStatus === 'function') {
        const status = job.getStatus();
        nextRuns[type] = status.next;
      }
    }

    return nextRuns;
  }

  /**
   * Health check for scheduler
   */
  async healthCheck() {
    try {
      const status = this.getStatus();

      logger.info('Backup scheduler health check', {
        status: status.isRunning ? 'healthy' : 'stopped',
        activeJobs: status.jobs.length,
        nextRuns: status.nextRuns
      });

      // Check backup directory
      const backups = await this.backupManager.listBackups();
      const recentBackups = backups.filter(backup => {
        const age = Date.now() - backup.created.getTime();
        return age < (24 * 60 * 60 * 1000); // Last 24 hours
      });

      logger.info('Recent backups status', {
        totalBackups: backups.length,
        recentBackups: recentBackups.length,
        lastBackup: backups[0] ? {
          filename: backups[0].filename,
          created: backups[0].created,
          size: `${(backups[0].size / (1024 * 1024)).toFixed(2)} MB`
        } : null
      });

    } catch (error) {
      logger.error('Backup scheduler health check failed', {
        error: error.message
      });
    }
  }

  /**
   * Manual trigger for specific backup type
   */
  async triggerBackup(type) {
    if (!['daily', 'weekly', 'monthly', 'manual'].includes(type)) {
      throw new Error(`Invalid backup type: ${type}`);
    }

    logger.info(`Manually triggering ${type} backup`);
    return await this.createScheduledBackup(type);
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const scheduler = new BackupScheduler();

  try {
    switch (command) {
    case 'start': {
      scheduler.start();

      // Keep process running
      process.on('SIGINT', () => {
        logger.info('Received SIGINT, stopping scheduler...');
        scheduler.stop();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        logger.info('Received SIGTERM, stopping scheduler...');
        scheduler.stop();
        process.exit(0);
      });

      break;
    }

    case 'stop': {
      scheduler.stop();
      break;
    }

    case 'status': {
      const status = scheduler.getStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
    }

    case 'health': {
      await scheduler.healthCheck();
      break;
    }

    case 'trigger': {
      const type = args[1] || 'manual';
      const result = await scheduler.triggerBackup(type);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default: {
      console.log(`
Usage: node backup-scheduler.js <command> [options]

Commands:
  start            Start the backup scheduler daemon
  stop             Stop the backup scheduler
  status           Show scheduler status and next run times
  health           Perform health check
  trigger <type>   Manually trigger a backup (daily, weekly, monthly, manual)

Examples:
  node backup-scheduler.js start
  node backup-scheduler.js status
  node backup-scheduler.js trigger daily

Environment Variables:
  BACKUP_SCHEDULE_DAILY      Daily backup cron schedule (default: "0 2 * * *")
  BACKUP_SCHEDULE_WEEKLY     Weekly backup cron schedule (default: "0 3 * * 0")
  BACKUP_SCHEDULE_MONTHLY    Monthly backup cron schedule (default: "0 4 1 * *")
  BACKUP_ENABLE_DAILY        Enable daily backups (default: true)
  BACKUP_ENABLE_WEEKLY       Enable weekly backups (default: true)
  BACKUP_ENABLE_MONTHLY      Enable monthly backups (default: true)
  BACKUP_TIMEZONE            Timezone for schedules (default: UTC)
  BACKUP_FAILURE_WEBHOOK     Webhook URL for failure notifications
        `);
      break;
    }
    }
  } catch (error) {
    logger.error('Scheduler command failed', { error: error.message });
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { BackupScheduler };

// Run CLI if called directly
if (require.main === module) {
  main();
}

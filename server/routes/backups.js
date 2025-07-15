const express = require('express');
const path = require('path');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { DatabaseBackupManager, config } = require('../scripts/backup-database');
const { BackupScheduler } = require('../scripts/backup-scheduler');
const { logger } = require('../config/logger');
const router = express.Router();

// Initialize backup manager and scheduler
const backupManager = new DatabaseBackupManager(config);
const backupScheduler = new BackupScheduler();

/**
 * @swagger
 * tags:
 *   name: Backups
 *   description: Database backup management
 */

/**
 * @swagger
 * /api/backups:
 *   get:
 *     summary: List all backups
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of backups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 backups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       path:
 *                         type: string
 *                       size:
 *                         type: number
 *                       created:
 *                         type: string
 *                         format: date-time
 *                       modified:
 *                         type: string
 *                         format: date-time
 */
router.get('/', authenticateToken, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const backups = await backupManager.listBackups();

    // Add human-readable size and relative dates
    const enrichedBackups = backups.map(backup => ({
      ...backup,
      sizeFormatted: `${(backup.size / (1024 * 1024)).toFixed(2)} MB`,
      ageInDays: Math.floor((Date.now() - backup.created.getTime()) / (1000 * 60 * 60 * 24))
    }));

    logger.info('Backup list requested', {
      userId: req.user.id,
      backupCount: backups.length
    });

    res.json({
      success: true,
      backups: enrichedBackups,
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0)
    });

  } catch (error) {
    logger.error('Failed to list backups', {
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list backups',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backups/create:
 *   post:
 *     summary: Create a new backup
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [manual, daily, weekly, monthly]
 *                 default: manual
 *     responses:
 *       200:
 *         description: Backup created successfully
 *       500:
 *         description: Backup creation failed
 */
router.post('/create', authenticateToken, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { type = 'manual' } = req.body;

    logger.info('Backup creation requested', {
      userId: req.user.id,
      type,
      userEmail: req.user.email
    });

    const result = await backupManager.createBackup(type);

    logger.info('Backup created successfully', {
      userId: req.user.id,
      filename: result.filename,
      size: result.size,
      type: result.type
    });

    res.json({
      success: true,
      backup: {
        ...result,
        sizeFormatted: `${(result.size / (1024 * 1024)).toFixed(2)} MB`
      },
      message: 'Backup created successfully'
    });

  } catch (error) {
    logger.error('Backup creation failed', {
      error: error.message,
      userId: req.user.id,
      type: req.body.type
    });

    res.status(500).json({
      success: false,
      error: 'Backup creation failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backups/cleanup:
 *   post:
 *     summary: Clean up old backups
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
router.post('/cleanup', authenticateToken, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    logger.info('Backup cleanup requested', {
      userId: req.user.id,
      userEmail: req.user.email
    });

    await backupManager.cleanOldBackups();

    logger.info('Backup cleanup completed', {
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Backup cleanup completed successfully'
    });

  } catch (error) {
    logger.error('Backup cleanup failed', {
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Backup cleanup failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backups/verify/{filename}:
 *   post:
 *     summary: Verify backup integrity
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup verification result
 */
router.post('/verify/:filename', authenticateToken, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(config.backupDir, filename);

    logger.info('Backup verification requested', {
      userId: req.user.id,
      filename
    });

    const isValid = await backupManager.verifyBackup(backupPath);

    logger.info('Backup verification completed', {
      userId: req.user.id,
      filename,
      isValid
    });

    res.json({
      success: true,
      filename,
      isValid,
      message: isValid ? 'Backup is valid' : 'Backup is corrupted'
    });

  } catch (error) {
    logger.error('Backup verification failed', {
      error: error.message,
      userId: req.user.id,
      filename: req.params.filename
    });

    res.status(500).json({
      success: false,
      error: 'Backup verification failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backups/scheduler/status:
 *   get:
 *     summary: Get backup scheduler status
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler status
 */
router.get('/scheduler/status', authenticateToken, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const status = backupScheduler.getStatus();

    logger.info('Scheduler status requested', {
      userId: req.user.id
    });

    res.json({
      success: true,
      scheduler: status
    });

  } catch (error) {
    logger.error('Failed to get scheduler status', {
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backups/scheduler/trigger:
 *   post:
 *     summary: Manually trigger scheduled backup
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [daily, weekly, monthly, manual]
 *                 required: true
 *     responses:
 *       200:
 *         description: Backup triggered successfully
 */
router.post('/scheduler/trigger', authenticateToken, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['daily', 'weekly', 'monthly', 'manual'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup type',
        message: 'Type must be one of: daily, weekly, monthly, manual'
      });
    }

    logger.info('Scheduled backup trigger requested', {
      userId: req.user.id,
      type,
      userEmail: req.user.email
    });

    const result = await backupScheduler.triggerBackup(type);

    logger.info('Scheduled backup triggered successfully', {
      userId: req.user.id,
      type,
      filename: result.filename
    });

    res.json({
      success: true,
      backup: {
        ...result,
        sizeFormatted: `${(result.size / (1024 * 1024)).toFixed(2)} MB`
      },
      message: `${type} backup triggered successfully`
    });

  } catch (error) {
    logger.error('Scheduled backup trigger failed', {
      error: error.message,
      userId: req.user.id,
      type: req.body.type
    });

    res.status(500).json({
      success: false,
      error: 'Scheduled backup trigger failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/backups/config:
 *   get:
 *     summary: Get backup configuration
 *     tags: [Backups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup configuration
 */
router.get('/config', authenticateToken, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    // Return safe configuration (without sensitive data)
    const safeConfig = {
      backupDir: config.backupDir,
      retention: config.retention,
      compress: config.compress,
      remoteStorage: {
        enabled: config.remoteStorage.enabled,
        type: config.remoteStorage.type
      },
      schedules: backupScheduler.schedules,
      enabled: backupScheduler.enabled
    };

    logger.info('Backup configuration requested', {
      userId: req.user.id
    });

    res.json({
      success: true,
      config: safeConfig
    });

  } catch (error) {
    logger.error('Failed to get backup configuration', {
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get backup configuration',
      message: error.message
    });
  }
});

module.exports = router;

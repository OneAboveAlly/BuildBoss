#!/usr/bin/env node

const cron = require('node-cron');
const { prisma } = require('../config/database');
const { logger } = require('../config/logger');
const socketManager = require('../config/socket');

/**
 * Subscription Notification Scheduler - Automated subscription notifications
 */
class SubscriptionNotificationScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;

    // Schedules for different notification types
    this.schedules = {
      trialEnding: process.env.SUBSCRIPTION_TRIAL_NOTIFICATION_SCHEDULE || '0 9 * * *', // 9:00 AM daily
      trialExpired: process.env.SUBSCRIPTION_EXPIRED_NOTIFICATION_SCHEDULE || '0 10 * * *', // 10:00 AM daily
      paymentDue: process.env.SUBSCRIPTION_PAYMENT_NOTIFICATION_SCHEDULE || '0 11 * * *', // 11:00 AM daily
      subscriptionExpiring: process.env.SUBSCRIPTION_EXPIRING_NOTIFICATION_SCHEDULE || '0 12 * * *' // 12:00 PM daily
    };
  }

  /**
   * Check for trial subscriptions ending soon (3, 2, 1 days before)
   */
  async checkTrialEndingSoon() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

      // Find subscriptions ending in next 3 days
      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: 'TRIAL',
          trialEndDate: {
            gte: now,
            lte: threeDaysFromNow
          }
        },
        include: {
          user: true,
          plan: true
        }
      });

      for (const subscription of subscriptions) {
        const daysLeft = Math.ceil((new Date(subscription.trialEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Check if we already sent notification for this day
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: subscription.userId,
            type: 'SUBSCRIPTION_TRIAL_ENDING',
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        });

        if (!existingNotification) {
          await this.sendTrialEndingNotification(subscription, daysLeft);
        }
      }

      logger.info(`Checked ${subscriptions.length} trial subscriptions ending soon`);
    } catch (error) {
      logger.error('Error checking trial subscriptions ending soon:', error);
    }
  }

  /**
   * Check for expired trial subscriptions
   */
  async checkTrialExpired() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      // Find subscriptions that expired yesterday
      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: 'TRIAL',
          trialEndDate: {
            gte: yesterday,
            lt: now
          }
        },
        include: {
          user: true,
          plan: true
        }
      });

      for (const subscription of subscriptions) {
        // Check if we already sent notification
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: subscription.userId,
            type: 'SUBSCRIPTION_EXPIRED',
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        });

        if (!existingNotification) {
          await this.sendTrialExpiredNotification(subscription);
        }
      }

      logger.info(`Checked ${subscriptions.length} expired trial subscriptions`);
    } catch (error) {
      logger.error('Error checking expired trial subscriptions:', error);
    }
  }

  /**
   * Check for past due payments
   */
  async checkPaymentDue() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

      // Find subscriptions with past due status
      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: 'PAST_DUE',
          updatedAt: {
            gte: threeDaysAgo
          }
        },
        include: {
          user: true,
          plan: true
        }
      });

      for (const subscription of subscriptions) {
        // Check if we already sent notification today
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: subscription.userId,
            type: 'PAYMENT_FAILED',
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        });

        if (!existingNotification) {
          await this.sendPaymentDueNotification(subscription);
        }
      }

      logger.info(`Checked ${subscriptions.length} past due subscriptions`);
    } catch (error) {
      logger.error('Error checking past due payments:', error);
    }
  }

  /**
   * Check for subscriptions expiring soon
   */
  async checkSubscriptionExpiring() {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      // Find active subscriptions expiring soon
      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          nextBillingDate: {
            gte: now,
            lte: sevenDaysFromNow
          }
        },
        include: {
          user: true,
          plan: true
        }
      });

      for (const subscription of subscriptions) {
        const daysLeft = Math.ceil((new Date(subscription.nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Send notification only once per week
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: subscription.userId,
            type: 'SUBSCRIPTION_TRIAL_ENDING',
            createdAt: {
              gte: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
            }
          }
        });

        if (!existingNotification && daysLeft <= 7) {
          await this.sendSubscriptionExpiringNotification(subscription, daysLeft);
        }
      }

      logger.info(`Checked ${subscriptions.length} subscriptions expiring soon`);
    } catch (error) {
      logger.error('Error checking expiring subscriptions:', error);
    }
  }

  /**
   * Send trial ending notification
   */
  async sendTrialEndingNotification(subscription, daysLeft) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION_TRIAL_ENDING',
          title: 'Okres próbny kończy się wkrótce',
          message: `Twój okres próbny kończy się za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}. Wybierz plan płatny, aby kontynuować korzystanie z SiteBoss.`,
          data: {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            daysLeft,
            planName: subscription.plan.displayName
          }
        }
      });

      // Send real-time notification via Socket.io
      await socketManager.sendNotificationToUser(subscription.userId, {
        type: 'SUBSCRIPTION_TRIAL_ENDING',
        title: 'Okres próbny kończy się wkrótce',
        message: `Twój okres próbny kończy się za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`,
        data: {
          subscriptionId: subscription.id,
          planId: subscription.planId,
          daysLeft,
          planName: subscription.plan.displayName
        }
      });

      logger.info(`Trial ending notification sent to user ${subscription.userId}`, {
        daysLeft,
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Error sending trial ending notification:', error);
    }
  }

  /**
   * Send trial expired notification
   */
  async sendTrialExpiredNotification(subscription) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION_EXPIRED',
          title: 'Okres próbny wygasł',
          message: 'Twój okres próbny wygasł. Wybierz plan płatny, aby odzyskać dostęp do wszystkich funkcji SiteBoss.',
          data: {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            planName: subscription.plan.displayName
          }
        }
      });

      // Send real-time notification via Socket.io
      await socketManager.sendNotificationToUser(subscription.userId, {
        type: 'SUBSCRIPTION_EXPIRED',
        title: 'Okres próbny wygasł',
        message: 'Twój okres próbny wygasł. Wybierz plan płatny, aby odzyskać dostęp.',
        data: {
          subscriptionId: subscription.id,
          planId: subscription.planId,
          planName: subscription.plan.displayName
        }
      });

      logger.info(`Trial expired notification sent to user ${subscription.userId}`, {
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Error sending trial expired notification:', error);
    }
  }

  /**
   * Send payment due notification
   */
  async sendPaymentDueNotification(subscription) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'PAYMENT_FAILED',
          title: 'Płatność nie powiodła się',
          message: 'Nie udało się zrealizować płatności za subskrypcję. Sprawdź dane płatności i spróbuj ponownie.',
          data: {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            planName: subscription.plan.displayName
          }
        }
      });

      // Send real-time notification via Socket.io
      await socketManager.sendNotificationToUser(subscription.userId, {
        type: 'PAYMENT_FAILED',
        title: 'Płatność nie powiodła się',
        message: 'Nie udało się zrealizować płatności za subskrypcję.',
        data: {
          subscriptionId: subscription.id,
          planId: subscription.planId,
          planName: subscription.plan.displayName
        }
      });

      logger.info(`Payment due notification sent to user ${subscription.userId}`, {
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Error sending payment due notification:', error);
    }
  }

  /**
   * Send subscription expiring notification
   */
  async sendSubscriptionExpiringNotification(subscription, daysLeft) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION_TRIAL_ENDING',
          title: 'Subskrypcja kończy się wkrótce',
          message: `Twoja subskrypcja kończy się za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}. Odnów ją, aby kontynuować korzystanie z SiteBoss.`,
          data: {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            daysLeft,
            planName: subscription.plan.displayName
          }
        }
      });

      // Send real-time notification via Socket.io
      await socketManager.sendNotificationToUser(subscription.userId, {
        type: 'SUBSCRIPTION_TRIAL_ENDING',
        title: 'Subskrypcja kończy się wkrótce',
        message: `Twoja subskrypcja kończy się za ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'}`,
        data: {
          subscriptionId: subscription.id,
          planId: subscription.planId,
          daysLeft,
          planName: subscription.plan.displayName
        }
      });

      logger.info(`Subscription expiring notification sent to user ${subscription.userId}`, {
        daysLeft,
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Error sending subscription expiring notification:', error);
    }
  }

  /**
   * Setup cron jobs
   */
  setupCronJobs() {
    // Trial ending notifications
    if (cron.validate(this.schedules.trialEnding)) {
      const trialJob = cron.schedule(this.schedules.trialEnding, async () => {
        await this.checkTrialEndingSoon();
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      this.jobs.set('trialEnding', trialJob);
      logger.info('Trial ending notification job scheduled', { schedule: this.schedules.trialEnding });
    }

    // Trial expired notifications
    if (cron.validate(this.schedules.trialExpired)) {
      const expiredJob = cron.schedule(this.schedules.trialExpired, async () => {
        await this.checkTrialExpired();
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      this.jobs.set('trialExpired', expiredJob);
      logger.info('Trial expired notification job scheduled', { schedule: this.schedules.trialExpired });
    }

    // Payment due notifications
    if (cron.validate(this.schedules.paymentDue)) {
      const paymentJob = cron.schedule(this.schedules.paymentDue, async () => {
        await this.checkPaymentDue();
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      this.jobs.set('paymentDue', paymentJob);
      logger.info('Payment due notification job scheduled', { schedule: this.schedules.paymentDue });
    }

    // Subscription expiring notifications
    if (cron.validate(this.schedules.subscriptionExpiring)) {
      const expiringJob = cron.schedule(this.schedules.subscriptionExpiring, async () => {
        await this.checkSubscriptionExpiring();
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      this.jobs.set('subscriptionExpiring', expiringJob);
      logger.info('Subscription expiring notification job scheduled', { schedule: this.schedules.subscriptionExpiring });
    }
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Subscription notification scheduler is already running');
      return;
    }

    try {
      this.setupCronJobs();

      // Start all jobs
      for (const [name, job] of this.jobs) {
        job.start();
        logger.info(`Started ${name} notification job`);
      }

      this.isRunning = true;
      logger.info('Subscription notification scheduler started successfully');

    } catch (error) {
      logger.error('Failed to start subscription notification scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Subscription notification scheduler is not running');
      return;
    }

    try {
      // Stop all jobs
      for (const [name, job] of this.jobs) {
        job.stop();
        logger.info(`Stopped ${name} notification job`);
      }

      this.jobs.clear();
      this.isRunning = false;
      logger.info('Subscription notification scheduler stopped successfully');

    } catch (error) {
      logger.error('Failed to stop subscription notification scheduler:', error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.size,
      schedules: this.schedules
    };
  }

  /**
   * Manual trigger for testing
   */
  async triggerCheck(type) {
    try {
      switch (type) {
        case 'trialEnding':
          await this.checkTrialEndingSoon();
          break;
        case 'trialExpired':
          await this.checkTrialExpired();
          break;
        case 'paymentDue':
          await this.checkPaymentDue();
          break;
        case 'subscriptionExpiring':
          await this.checkSubscriptionExpiring();
          break;
        default:
          throw new Error(`Unknown check type: ${type}`);
      }

      logger.info(`Manual trigger completed for ${type}`);
    } catch (error) {
      logger.error(`Manual trigger failed for ${type}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
const scheduler = new SubscriptionNotificationScheduler();

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, stopping subscription notification scheduler...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping subscription notification scheduler...');
  scheduler.stop();
  process.exit(0);
});

module.exports = scheduler;

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const type = process.argv[3];

  async function main() {
    try {
      switch (command) {
        case 'start':
          scheduler.start();
          console.log('Subscription notification scheduler started');
          break;
        case 'stop':
          scheduler.stop();
          console.log('Subscription notification scheduler stopped');
          break;
        case 'status':
          console.log('Status:', scheduler.getStatus());
          break;
        case 'trigger':
          if (!type) {
            console.error('Please specify check type: trialEnding, trialExpired, paymentDue, subscriptionExpiring');
            process.exit(1);
          }
          await scheduler.triggerCheck(type);
          console.log(`Triggered ${type} check`);
          break;
        default:
          console.log('Usage: node subscription-notification-scheduler.js [start|stop|status|trigger <type>]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  main();
} 
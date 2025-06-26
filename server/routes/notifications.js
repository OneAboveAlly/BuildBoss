const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, validateParams, validateQuery } = require('../middleware/validation');
const { logger, securityLogger } = require('../config/logger');
const { notificationFiltersSchema, testNotificationSchema } = require('../schemas/notificationSchemas');
const { idSchema } = require('../schemas/commonSchemas');
const socketManager = require('../config/socket');

const router = express.Router();
// GET /api/notifications - Pobierz powiadomienia użytkownika
router.get('/', authenticateToken, validateQuery(notificationFiltersSchema), async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      userId: req.user.userId
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count - Liczba nieprzeczytanych powiadomień
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PUT /api/notifications/:id/read - Oznacz powiadomienie jako przeczytane
router.put('/:id/read', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/mark-all-read - Oznacz wszystkie jako przeczytane
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/notifications/:id - Usuń powiadomienie
router.delete('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    logger.info('Notification deleted', {
      userId: req.user.userId,
      notificationId: id
    });

    securityLogger.logDataAccess(req.user.userId, 'DELETE', 'notification', id);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Error deleting notification', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      notificationId: req.params.id
    });
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// DELETE /api/notifications/clear-all - Usuń wszystkie powiadomienia
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        userId: req.user.userId
      }
    });

    logger.info('All notifications cleared', {
      userId: req.user.userId,
      count: result.count
    });

    securityLogger.logDataAccess(req.user.userId, 'DELETE', 'notification', 'ALL');

    res.json({
      message: 'All notifications cleared',
      count: result.count
    });
  } catch (error) {
    logger.error('Error clearing all notifications', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    res.status(500).json({ error: 'Failed to clear all notifications' });
  }
});

// POST /api/notifications/test - Testowe powiadomienie (tylko dla developmentu)
router.post('/test', authenticateToken, validate(testNotificationSchema), async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test notifications not allowed in production' });
    }

    const { type = 'SYSTEM_UPDATE', title, message } = req.body;

    const notification = await socketManager.sendNotificationToUser(
      req.user.userId,
      {
        type,
        title: title || 'Test Notification',
        message: message || 'This is a test notification from the system.',
        data: { test: true }
      }
    );

    res.json({
      message: 'Test notification sent',
      notification
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Funkcje pomocnicze do tworzenia powiadomień

// Powiadomienie o przypisaniu zadania
async function notifyTaskAssigned(taskId, assignedToId, assignedById) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        createdBy: true
      }
    });

    if (!task || !assignedToId || assignedToId === assignedById) return;

    await socketManager.sendNotificationToUser(assignedToId, {
      type: 'TASK_ASSIGNED',
      title: 'Nowe zadanie przypisane',
      message: `Zostało Ci przypisane zadanie "${task.title}" w projekcie "${task.project.name}"`,
      data: {
        taskId: task.id,
        projectId: task.projectId,
        assignedBy: task.createdBy.firstName + ' ' + task.createdBy.lastName
      }
    });
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
  }
}

// Powiadomienie o ukończeniu zadania
async function notifyTaskCompleted(taskId, completedById) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { include: { company: { include: { workers: true } } } },
        assignedTo: true
      }
    });

    if (!task) return;

    // Powiadom wszystkich w firmie oprócz osoby, która ukończyła zadanie
    await socketManager.sendNotificationToCompany(
      task.project.company.id,
      {
        type: 'TASK_COMPLETED',
        title: 'Zadanie ukończone',
        message: `Zadanie "${task.title}" zostało ukończone przez ${task.assignedTo?.firstName || 'Nieznany użytkownik'}`,
        data: {
          taskId: task.id,
          projectId: task.projectId,
          completedBy: task.assignedTo?.firstName + ' ' + task.assignedTo?.lastName
        }
      },
      completedById
    );
  } catch (error) {
    console.error('Error sending task completion notification:', error);
  }
}

// Powiadomienie o nowej wiadomości
async function notifyNewMessage(messageId, receiverId, senderId) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        jobOffer: true,
        workRequest: true
      }
    });

    if (!message || receiverId === senderId) return;

    const context = message.jobOffer
      ? `w sprawie oferty pracy "${message.jobOffer.title}"`
      : message.workRequest
        ? `w sprawie zlecenia "${message.workRequest.title}"`
        : '';

    await socketManager.sendNotificationToUser(receiverId, {
      type: 'MESSAGE_RECEIVED',
      title: 'Nowa wiadomość',
      message: `${message.sender.firstName || message.sender.email} wysłał(a) Ci wiadomość ${context}`,
      data: {
        messageId: message.id,
        senderId: message.senderId,
        jobOfferId: message.jobOfferId,
        workRequestId: message.workRequestId
      }
    });
  } catch (error) {
    console.error('Error sending message notification:', error);
  }
}

// Powiadomienie o niskim stanie materiału
async function notifyLowMaterial(materialId) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        company: { include: { workers: { include: { user: true } } } }
      }
    });

    if (!material || !material.minQuantity || material.quantity > material.minQuantity) return;

    // Powiadom wszystkich w firmie
    await socketManager.sendNotificationToCompany(
      material.companyId,
      {
        type: 'MATERIAL_LOW',
        title: 'Niski stan materiału',
        message: `Materiał "${material.name}" ma niski stan: ${material.quantity} ${material.unit}`,
        data: {
          materialId: material.id,
          currentQuantity: material.quantity,
          minQuantity: material.minQuantity,
          unit: material.unit
        }
      }
    );
  } catch (error) {
    console.error('Error sending low material notification:', error);
  }
}

// Eksportuj funkcje pomocnicze
module.exports = {
  router,
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyNewMessage,
  notifyLowMaterial
};

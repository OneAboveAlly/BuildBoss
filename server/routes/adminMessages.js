const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticateAdminToken } = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validation');
const { logger } = require('../config/logger');
const { idSchema } = require('../schemas/commonSchemas');
const socketManager = require('../config/socket');

const router = express.Router();

// Schemat walidacji wiadomości
const createMessageSchema = Joi.object({
  recipientId: Joi.string().required(),
  subject: Joi.string().max(200).required(),
  content: Joi.string().max(2000).required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH').default('NORMAL')
});

const replyMessageSchema = Joi.object({
  content: Joi.string().max(2000).required()
});

// GET /api/admin/messages - Lista wiadomości admina
router.get('/', authenticateAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const skip = (page - 1) * limit;

    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();

    const messages = await prisma.adminMessage.findMany({
      where,
      include: {
        senderUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        senderAdmin: { select: { id: true, email: true, firstName: true, lastName: true } },
        recipient: { select: { id: true, email: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const mappedMessages = messages.map(message => ({
      ...message,
      sender: message.senderType === 'ADMIN' ? message.senderAdmin : message.senderUser
    }));

    const total = await prisma.adminMessage.count({ where });

    res.json({
      messages: mappedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching admin messages:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania wiadomości' });
  }
});

// POST /api/admin/messages - Wysyłanie wiadomości do użytkownika
router.post('/', authenticateAdminToken, validate(createMessageSchema), async (req, res) => {
  try {
    const { recipientId, subject, content, priority = 'NORMAL' } = req.body;

    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      return res.status(404).json({ error: 'Odbiorca nie został znaleziony' });
    }

    // Sprawdź czy admin ma powiązanego użytkownika w tabeli User
    let senderUserId = null;
    if (req.user.role === 'SUPERADMIN') {
      const linkedUser = await prisma.user.findUnique({ where: { email: req.user.email } });
      senderUserId = linkedUser?.id || null;
    } else {
      senderUserId = req.user.id;
    }

    const message = await prisma.adminMessage.create({
      data: {
        subject,
        content,
        priority: priority.toUpperCase(),
        senderId: senderUserId, // Może być null dla adminów bez powiązanego usera
        senderType: 'ADMIN', // Używamy enum SenderType
        senderAdminId: req.user.id, // ID admina z plansAdmin
        recipientId,
        status: 'UNREAD'
      },
      include: {
        senderUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        senderAdmin: { select: { id: true, email: true, firstName: true, lastName: true } },
        recipient: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    });

    // Utwórz powiadomienie w bazie przed wysłaniem socketu
    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'ADMIN_MESSAGE',
        title: 'Nowa wiadomość od administratora',
        message: subject,
        data: { adminMessageId: message.id, subject, content }
      }
    });

    const mappedMessage = {
      ...message,
      sender: message.senderType === 'ADMIN' ? message.senderAdmin : message.senderUser
    };

    try {
      // Teraz wyślij socket z już utworzonym powiadomieniem
      await socketManager.sendNotificationToUser(recipientId, {
        ...notification,
        // Dla kompatybilności z frontendem
        data: { adminMessageId: message.id, subject, content }
      });
    } catch (notificationError) {
      logger.error('Error sending admin message notification:', notificationError);
    }

    logger.info('Admin message sent', { adminId: req.user.id, recipientId, messageId: message.id });
    res.status(201).json(mappedMessage);
  } catch (error) {
    logger.error('Error sending admin message:', error);
    res.status(500).json({ error: 'Błąd podczas wysyłania wiadomości' });
  }
});

// GET /api/admin/messages/search-users - Wyszukiwanie użytkowników
router.get('/search-users', authenticateAdminToken, async (req, res) => {
  try {
    const { query } = req.query;
    logger.info('SEARCH USERS QUERY:', query, typeof query, req.query);

    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }

    if (typeof query !== 'string' || query.length < 2) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { createdCompanies: { some: { name: { contains: query, mode: 'insensitive' } } } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdCompanies: { select: { id: true, name: true } }
      },
      take: 10
    });

    res.setHeader('Content-Type', 'application/json');
    res.json({ users });
  } catch (error) {
    logger.error('Error searching users:', error);
    res.status(500).json({ error: 'Błąd podczas wyszukiwania użytkowników' });
  }
});

// GET /api/admin/messages/stats - Statystyki wiadomości
router.get('/stats/overview', authenticateAdminToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }

    const [totalMessages, unreadMessages, highPriorityMessages, todayMessages] = await Promise.all([
      prisma.adminMessage.count(),
      prisma.adminMessage.count({ where: { status: 'UNREAD' } }),
      prisma.adminMessage.count({ where: { priority: 'HIGH' } }),
      prisma.adminMessage.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } })
    ]);

    res.json({ totalMessages, unreadMessages, highPriorityMessages, todayMessages });
  } catch (error) {
    logger.error('Error fetching admin message stats:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk' });
  }
});

// GET /api/admin/messages/:id - Szczegóły wiadomości
router.get('/:id', authenticateAdminToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }
    const message = await prisma.adminMessage.findUnique({
      where: { id },
      include: {
        senderUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        senderAdmin: { select: { id: true, email: true, firstName: true, lastName: true } },
        recipient: { select: { id: true, email: true, firstName: true, lastName: true } },
        replies: {
          include: {
            senderUser: { select: { id: true, email: true, firstName: true, lastName: true } },
            senderAdmin: { select: { id: true, email: true, firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!message) {
      return res.status(404).json({ error: 'Wiadomość nie została znaleziona' });
    }
    const mappedMessage = {
      ...message,
      sender: message.senderType === 'ADMIN' ? message.senderAdmin : message.senderUser,
      replies: message.replies.map(reply => ({
        ...reply,
        sender: reply.senderType === 'ADMIN' ? reply.senderAdmin : reply.senderUser
      }))
    };
    if (mappedMessage.recipientId === req.user.id && mappedMessage.status === 'UNREAD') {
      await prisma.adminMessage.update({ where: { id }, data: { status: 'READ' } });
      mappedMessage.status = 'READ';
    }
    res.json(mappedMessage);
  } catch (error) {
    logger.error('Error fetching admin message:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania wiadomości' });
  }
});

// POST /api/admin/messages/:id/reply - Odpowiedź na wiadomość
router.post('/:id/reply', authenticateAdminToken, validateParams(idSchema), validate(replyMessageSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Brak uprawnień administratora' });
    }
    const originalMessage = await prisma.adminMessage.findUnique({ where: { id } });
    if (!originalMessage) {
      return res.status(404).json({ error: 'Wiadomość nie została znaleziona' });
    }
    let replySenderUserId = null;
    if (req.user.role === 'SUPERADMIN') {
      const linkedUser = await prisma.user.findUnique({ where: { email: req.user.email } });
      replySenderUserId = linkedUser?.id || null;
    } else {
      replySenderUserId = req.user.id;
    }
    const reply = await prisma.adminMessageReply.create({
      data: {
        content,
        messageId: id,
        senderId: replySenderUserId, // Może być null dla adminów bez powiązanego usera
        senderType: 'ADMIN', // Używamy enum SenderType
        senderAdminId: req.user.id // ID admina z plansAdmin
      },
      include: {
        senderUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        senderAdmin: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    });
    const mappedReply = {
      ...reply,
      sender: reply.senderType === 'ADMIN' ? reply.senderAdmin : reply.senderUser
    };

    try {
      await socketManager.sendNotificationToUser(originalMessage.recipientId, {
        type: 'ADMIN_MESSAGE_REPLY',
        title: 'Odpowiedź na wiadomość od administratora',
        message: `Odpowiedź na: ${originalMessage.subject}`,
        data: { adminMessageId: id, replyId: reply.id, content }
      });
    } catch (notificationError) {
      logger.error('Error sending admin message reply notification:', notificationError);
    }

    logger.info('Admin message reply sent', { adminId: req.user.id, messageId: id, replyId: reply.id });
    res.status(201).json(mappedReply);
  } catch (error) {
    logger.error('Error sending admin message reply:', error);
    res.status(500).json({ error: 'Błąd podczas wysyłania odpowiedzi' });
  }
});

module.exports = router;
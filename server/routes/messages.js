const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateParams } = require('../middleware/validation');
const { _logger, _securityLogger } = require('../config/logger');
const { notifyNewMessage } = require('./notifications');
const { idSchema } = require('../schemas/commonSchemas');
const multer = require('multer');
const path = require('path');

const router = express.Router();
// GET /api/messages - Lista konwersacji użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Pobierz wszystkie wiadomości użytkownika
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        jobOffer: {
          select: {
            id: true,
            title: true
          }
        },
        workRequest: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Grupuj wiadomości według konwersacji
    const conversations = {};

    messages.forEach(message => {
      // Określ partnera konwersacji
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;

      // Klucz konwersacji: partner + kontekst (jobOffer lub workRequest)
      const contextKey = message.jobOfferId || message.workRequestId || 'direct';
      const conversationKey = `${partnerId}_${contextKey}`;

      if (!conversations[conversationKey]) {
        conversations[conversationKey] = {
          otherUser: partner,
          jobOffer: message.jobOffer || null,
          workRequest: message.workRequest || null,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }

      conversations[conversationKey].messages.push(message);

      // Aktualizuj ostatnią wiadomość
      if (!conversations[conversationKey].lastMessage ||
          message.createdAt > conversations[conversationKey].lastMessage.createdAt) {
        conversations[conversationKey].lastMessage = message;
      }

      // Policz nieprzeczytane wiadomości
      if (message.receiverId === userId && !message.isRead) {
        conversations[conversationKey].unreadCount++;
      }
    });

    // Konwertuj na tablicę i posortuj według ostatniej wiadomości
    const conversationList = Object.values(conversations).sort((a, b) =>
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json(conversationList);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania konwersacji' });
  }
});

// GET /api/messages/thread - Wiadomości w konkretnej konwersacji
router.get('/thread', authenticateToken, async (req, res) => {
  try {
    const { otherUserId, jobOfferId, workRequestId } = req.query;
    const userId = req.user.id;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Wymagany parametr otherUserId' });
    }

    // Buduj warunki wyszukiwania
    const where = {
      OR: [
        {
          senderId: userId,
          receiverId: parseInt(otherUserId)
        },
        {
          senderId: parseInt(otherUserId),
          receiverId: userId
        }
      ]
    };

    // Dodaj kontekst jeśli podany
    if (jobOfferId) {
      where.jobOfferId = parseInt(jobOfferId);
    } else if (workRequestId) {
      where.workRequestId = parseInt(workRequestId);
    } else {
      // Bezpośrednia konwersacja (bez kontekstu)
      where.jobOfferId = null;
      where.workRequestId = null;
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Oznacz wiadomości jako przeczytane
    await prisma.message.updateMany({
      where: {
        ...where,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania wiadomości' });
  }
});

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozwolone są tylko pliki PDF, DOC, DOCX'));
    }
  }
});

// POST /api/messages - Wysyłanie nowej wiadomości z opcjonalnym CV
router.post('/', authenticateToken, upload.single('cv'), async (req, res) => {
  try {
    const { receiverId, content, jobOfferId, workRequestId } = req.body;
    const senderId = req.user.id;

    // Walidacja
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Wymagane pola: receiverId, content' });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Nie możesz wysłać wiadomości do siebie' });
    }

    // Obsługa załącznika CV
    const attachments = [];
    if (req.file) {
      attachments.push({
        filename: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimeType: req.file.mimetype
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: parseInt(receiverId),
        content,
        jobOfferId: jobOfferId ? parseInt(jobOfferId) : null,
        workRequestId: workRequestId ? parseInt(workRequestId) : null,
        attachments: attachments.length > 0 ? attachments : undefined
      },
      include: {
        sender: true,
        receiver: true,
        jobOffer: true,
        workRequest: true
      }
    });

    // Powiadom odbiorcę
    try {
      await notifyNewMessage(message.id, message.receiverId, message.senderId);
    } catch (notificationError) {
      console.error('Error sending message notification:', notificationError);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Błąd podczas wysyłania wiadomości' });
  }
});

// PUT /api/messages/:id/read - Oznaczanie wiadomości jako przeczytanej
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy wiadomość istnieje i czy użytkownik jest odbiorcą
    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Wiadomość nie została znaleziona' });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({ error: 'Brak uprawnień do oznaczenia tej wiadomości' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Błąd podczas oznaczania wiadomości' });
  }
});

// PUT /api/messages/thread/read - Oznaczanie całej konwersacji jako przeczytanej
router.put('/thread/read', authenticateToken, async (req, res) => {
  try {
    const { otherUserId, jobOfferId, workRequestId } = req.body;
    const userId = req.user.id;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Wymagany parametr otherUserId' });
    }

    // Buduj warunki
    const where = {
      senderId: parseInt(otherUserId),
      receiverId: userId,
      isRead: false
    };

    if (jobOfferId) {
      where.jobOfferId = parseInt(jobOfferId);
    } else if (workRequestId) {
      where.workRequestId = parseInt(workRequestId);
    } else {
      where.jobOfferId = null;
      where.workRequestId = null;
    }

    const result = await prisma.message.updateMany({
      where,
      data: { isRead: true }
    });

    res.json({ updatedCount: result.count });
  } catch (error) {
    console.error('Error marking thread as read:', error);
    res.status(500).json({ error: 'Błąd podczas oznaczania konwersacji' });
  }
});

// GET /api/messages/unread-count - Liczba nieprzeczytanych wiadomości
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({ total: unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania liczby nieprzeczytanych wiadomości' });
  }
});

// DELETE /api/messages/:id - Usuwanie wiadomości (tylko dla nadawcy)
router.delete('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy wiadomość istnieje i czy użytkownik jest nadawcą
    const message = await prisma.message.findUnique({
      where: { id: parseInt(id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Wiadomość nie została znaleziona' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Możesz usuwać tylko swoje wiadomości' });
    }

    await prisma.message.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Wiadomość została usunięta' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania wiadomości' });
  }
});

// GET /api/messages/admin - Wiadomości od admina dla użytkownika
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    const where = {
      recipientId: userId
    };

    if (status) where.status = status.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();

    const messages = await prisma.adminMessage.findMany({
      where,
      include: {
        senderUser: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        senderAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        recipient: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        replies: {
          include: {
            senderUser: {
              select: { id: true, email: true, firstName: true, lastName: true }
            },
            senderAdmin: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Mapuj wiadomości, aby miały jednolite pole sender
    const mappedMessages = messages.map(message => ({
      ...message,
      sender: message.senderType === 'ADMIN' ? message.senderAdmin : message.senderUser,
      replies: message.replies.map(reply => ({
        ...reply,
        sender: reply.senderType === 'ADMIN' ? reply.senderAdmin : reply.senderUser
      }))
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
    console.error('Error fetching admin messages for user:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania wiadomości od admina' });
  }
});

// GET /api/messages/admin/unread-count - Liczba nieprzeczytanych wiadomości od admina
router.get('/admin/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await prisma.adminMessage.count({
      where: {
        recipientId: userId,
        status: 'UNREAD'
      }
    });
    res.json({ total: unreadCount });
  } catch (error) {
    console.error('Error fetching admin unread count:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania liczby nieprzeczytanych wiadomości od admina' });
  }
});

// GET /api/messages/admin/:id - Szczegóły wiadomości od admina
router.get('/admin/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.adminMessage.findUnique({
      where: { id },
      include: {
        senderUser: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        senderAdmin: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        recipient: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        replies: {
          include: {
            senderUser: {
              select: { id: true, email: true, firstName: true, lastName: true }
            },
            senderAdmin: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Wiadomość nie została znaleziona' });
    }

    // Mapuj wiadomość i odpowiedzi
    const mappedMessage = {
      ...message,
      sender: message.senderType === 'ADMIN' ? message.senderAdmin : message.senderUser,
      replies: message.replies.map(reply => ({
        ...reply,
        sender: reply.senderType === 'ADMIN' ? reply.senderAdmin : reply.senderUser
      }))
    };

    // Sprawdź czy użytkownik jest odbiorcą wiadomości
    if (mappedMessage.recipientId !== userId) {
      return res.status(403).json({ error: 'Brak dostępu do tej wiadomości' });
    }

    // Oznacz jako przeczytaną jeśli nie jest jeszcze przeczytana
    if (mappedMessage.status === 'UNREAD') {
      await prisma.adminMessage.update({
        where: { id },
        data: { status: 'READ' }
      });
      mappedMessage.status = 'READ';
    }

    res.json(mappedMessage);
  } catch (error) {
    console.error('Error fetching admin message:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania wiadomości' });
  }
});

// DELETE /api/messages/admin/:id - Usuwanie wiadomości od admina przez odbiorcę
router.delete('/admin/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy wiadomość istnieje i czy użytkownik jest odbiorcą
    const adminMessage = await prisma.adminMessage.findUnique({
      where: { id }
    });

    if (!adminMessage) {
      return res.status(404).json({ error: 'Wiadomość od admina nie została znaleziona' });
    }

    if (adminMessage.recipientId !== userId) {
      return res.status(403).json({ error: 'Możesz usuwać tylko swoje wiadomości od admina' });
    }

    await prisma.adminMessage.delete({
      where: { id }
    });

    res.json({ message: 'Wiadomość od admina została usunięta' });
  } catch (error) {
    console.error('Error deleting admin message:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania wiadomości od admina' });
  }
});

module.exports = router;

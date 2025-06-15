const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
          partnerId,
          partner,
          context: message.jobOfferId ? 
            { type: 'job', data: message.jobOffer } : 
            message.workRequestId ? 
            { type: 'request', data: message.workRequest } : 
            { type: 'direct', data: null },
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
    const { partnerId, jobOfferId, workRequestId } = req.query;
    const userId = req.user.id;

    if (!partnerId) {
      return res.status(400).json({ error: 'Wymagany parametr partnerId' });
    }

    // Buduj warunki wyszukiwania
    const where = {
      OR: [
        {
          senderId: userId,
          receiverId: partnerId
        },
        {
          senderId: partnerId,
          receiverId: userId
        }
      ]
    };

    // Dodaj kontekst jeśli podany
    if (jobOfferId) {
      where.jobOfferId = jobOfferId;
    } else if (workRequestId) {
      where.workRequestId = workRequestId;
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

// POST /api/messages - Wysyłanie nowej wiadomości
router.post('/', authenticateToken, async (req, res) => {
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

    // Sprawdź czy odbiorca istnieje
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Odbiorca nie został znaleziony' });
    }

    // Sprawdź kontekst jeśli podany
    if (jobOfferId) {
      const jobOffer = await prisma.jobOffer.findUnique({
        where: { id: jobOfferId }
      });
      if (!jobOffer) {
        return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' });
      }
    }

    if (workRequestId) {
      const workRequest = await prisma.workRequest.findUnique({
        where: { id: workRequestId }
      });
      if (!workRequest) {
        return res.status(404).json({ error: 'Zlecenie nie zostało znalezione' });
      }
    }

    // Utwórz wiadomość
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        jobOfferId: jobOfferId || null,
        workRequestId: workRequestId || null
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
      }
    });

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
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Wiadomość nie została znaleziona' });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({ error: 'Brak uprawnień do oznaczenia tej wiadomości' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
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
    const { partnerId, jobOfferId, workRequestId } = req.body;
    const userId = req.user.id;

    if (!partnerId) {
      return res.status(400).json({ error: 'Wymagany parametr partnerId' });
    }

    // Buduj warunki
    const where = {
      senderId: partnerId,
      receiverId: userId,
      isRead: false
    };

    if (jobOfferId) {
      where.jobOfferId = jobOfferId;
    } else if (workRequestId) {
      where.workRequestId = workRequestId;
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

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania liczby nieprzeczytanych wiadomości' });
  }
});

// DELETE /api/messages/:id - Usuwanie wiadomości (tylko dla nadawcy)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy wiadomość istnieje i czy użytkownik jest nadawcą
    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Wiadomość nie została znaleziona' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Możesz usuwać tylko swoje wiadomości' });
    }

    await prisma.message.delete({
      where: { id }
    });

    res.json({ message: 'Wiadomość została usunięta' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania wiadomości' });
  }
});

module.exports = router; 
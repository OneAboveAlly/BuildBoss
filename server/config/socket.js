const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Middleware do autoryzacji
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.email} connected (${socket.id})`);

      // Zapisz połączenie użytkownika
      this.connectedUsers.set(socket.userId, socket.id);

      // Dołącz do pokoju użytkownika (dla prywatnych powiadomień)
      socket.join(`user_${socket.userId}`);

      // Obsługa rozłączenia
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.email} disconnected`);
        this.connectedUsers.delete(socket.userId);
      });

      // Oznacz powiadomienia jako przeczytane
      socket.on('mark_notifications_read', async (notificationIds) => {
        try {
          await prisma.notification.updateMany({
            where: {
              id: { in: notificationIds },
              userId: socket.userId
            },
            data: { isRead: true }
          });

          socket.emit('notifications_marked_read', notificationIds);
        } catch (error) {
          console.error('Error marking notifications as read:', error);
          socket.emit('error', 'Failed to mark notifications as read');
        }
      });

      // Pobierz nieprzeczytane powiadomienia
      socket.on('get_unread_notifications', async () => {
        try {
          const notifications = await prisma.notification.findMany({
            where: {
              userId: socket.userId,
              isRead: false
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          });

          socket.emit('unread_notifications', notifications);
        } catch (error) {
          console.error('Error fetching notifications:', error);
          socket.emit('error', 'Failed to fetch notifications');
        }
      });
    });

    console.log('Socket.io server initialized');
    return this.io;
  }

  // Wyślij powiadomienie do konkretnego użytkownika
  async sendNotificationToUser(userId, notification) {
    try {
      // Zapisz powiadomienie w bazie danych
      const savedNotification = await prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || null
        }
      });

      // Wyślij przez Socket.io jeśli użytkownik jest online
      if (this.io) {
        this.io.to(`user_${userId}`).emit('new_notification', savedNotification);
      }

      return savedNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Wyślij powiadomienie do wszystkich użytkowników firmy
  async sendNotificationToCompany(companyId, notification, excludeUserId = null) {
    try {
      // Pobierz wszystkich pracowników firmy
      const workers = await prisma.worker.findMany({
        where: {
          companyId,
          status: 'ACTIVE',
          userId: excludeUserId ? { not: excludeUserId } : undefined
        },
        include: { user: true }
      });

      // Wyślij powiadomienie do każdego pracownika
      const promises = workers.map(worker =>
        this.sendNotificationToUser(worker.userId, notification)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending company notification:', error);
      throw error;
    }
  }

  // Wyślij powiadomienie systemowe do wszystkich
  async sendSystemNotification(notification) {
    try {
      // Pobierz wszystkich aktywnych użytkowników
      const users = await prisma.user.findMany({
        where: { isEmailConfirmed: true },
        select: { id: true }
      });

      // Wyślij powiadomienie do każdego użytkownika
      const promises = users.map(user =>
        this.sendNotificationToUser(user.id, notification)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error sending system notification:', error);
      throw error;
    }
  }

  // Sprawdź czy użytkownik jest online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Pobierz liczbę połączonych użytkowników
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }
}

// Singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;

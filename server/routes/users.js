const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/search?email= - Wyszukiwanie użytkowników do zaproszenia
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { email, companyId } = req.query;

    if (!email || email.trim().length < 3) {
      return res.status(400).json({ error: 'Email musi mieć co najmniej 3 znaki' });
    }

    const searchEmail = email.trim().toLowerCase();

    // Znajdź użytkowników pasujących do wyszukiwania
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: searchEmail,
          mode: 'insensitive'
        },
        isEmailConfirmed: true,
        // Wykluczamy siebie
        NOT: {
          id: req.user.id
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true
      },
      take: 10 // Limit wyników
    });

    // Jeśli podano companyId, sprawdź które użytkownicy już są w firmie
    let usersWithStatus = users;
    if (companyId) {
      const existingWorkers = await prisma.worker.findMany({
        where: {
          companyId,
          userId: {
            in: users.map(u => u.id)
          }
        },
        select: {
          userId: true,
          status: true
        }
      });

      const workerMap = new Map(existingWorkers.map(w => [w.userId, w.status]));

      usersWithStatus = users.map(user => ({
        ...user,
        isInCompany: workerMap.has(user.id),
        companyStatus: workerMap.get(user.id) || null
      }));
    }

    res.json(usersWithStatus);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Błąd podczas wyszukiwania użytkowników' });
  }
});

// GET /api/users/profile - Profil użytkownika
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isEmailConfirmed: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie został znaleziony' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania profilu' });
  }
});

// PUT /api/users/profile - Aktualizacja profilu użytkownika
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        avatar: avatar?.trim() || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isEmailConfirmed: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji profilu' });
  }
});

module.exports = router; 
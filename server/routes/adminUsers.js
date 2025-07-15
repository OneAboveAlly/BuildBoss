const express = require('express');
const { prisma } = require('../config/database');
const { logger } = require('../config/logger');

const router = express.Router();

// Middleware sprawdzający uprawnienia admina
const authenticateAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token dostępu wymagany' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'supersecret_admin_key';
    const decoded = jwt.verify(token, JWT_SECRET);

    // Sprawdź czy admin istnieje
    const admin = await prisma.plansAdmin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Admin nie istnieje' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    return res.status(403).json({ error: 'Nieprawidłowy token admina' });
  }
};

// GET /api/admin/users - Lista wszystkich użytkowników
router.get('/', authenticateAdminToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, subscription: _subscriptionFilter, search } = req.query;
    const skip = (page - 1) * limit;

    // Buduj warunki wyszukiwania
    const where = {};

    if (role) where.role = role;
    if (status === 'confirmed') where.isEmailConfirmed = true;
    if (status === 'unconfirmed') where.isEmailConfirmed = false;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Pobierz użytkowników z relacjami
    const users = await prisma.user.findMany({
      where,
      include: {
        subscription: {
          include: {
            plan: true
          }
        },
        createdCompanies: {
          select: {
            id: true,
            name: true
          }
        },
        createdProjects: {
          select: {
            id: true
          }
        },
        createdTasks: {
          select: {
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Pobierz statystyki dla każdego użytkownika
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Liczba projektów
        const projectsCount = user.createdProjects.length;

        // Liczba zadań
        const tasksCount = user.createdTasks.length;

        // Suma wydatków (symulacja - w rzeczywistości z tabeli płatności)
        const totalSpent = user.subscription?.plan?.price || 0;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailConfirmed: user.isEmailConfirmed,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          companies: user.createdCompanies,
          subscription: user.subscription ? {
            planName: user.subscription.plan.displayName,
            status: user.subscription.status,
            endDate: user.subscription.endDate,
            plan: user.subscription.plan
          } : null,
          stats: {
            projectsCount,
            tasksCount,
            totalSpent: totalSpent / 100 // Konwersja z groszy
          }
        };
      })
    );

    const total = await prisma.user.count({ where });

    res.json({
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania użytkowników' });
  }
});

// GET /api/admin/users/:id - Szczegóły użytkownika
router.get('/:id', authenticateAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true
          }
        },
        createdCompanies: {
          include: {
            workers: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            projects: {
              select: {
                id: true,
                name: true,
                status: true,
                createdAt: true
              }
            }
          }
        },
        createdProjects: {
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true
              }
            }
          }
        },
        createdTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Oblicz statystyki
    const stats = {
      projectsCount: user.createdProjects.length,
      tasksCount: user.createdTasks.length,
      companiesCount: user.createdCompanies.length,
      totalSpent: user.subscription?.plan?.price ? user.subscription.plan.price / 100 : 0,
      activeProjects: user.createdProjects.filter(p => p.status === 'ACTIVE').length,
      completedTasks: user.createdTasks.filter(t => t.status === 'COMPLETED').length
    };

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailConfirmed: user.isEmailConfirmed,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        subscription: user.subscription,
        companies: user.createdCompanies,
        projects: user.createdProjects,
        tasks: user.createdTasks,
        payments: [],
        stats
      }
    });
  } catch (error) {
    logger.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania szczegółów użytkownika' });
  }
});

// PUT /api/admin/users/:id - Aktualizacja użytkownika
router.put('/:id', authenticateAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isEmailConfirmed } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        role,
        isEmailConfirmed
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    logger.info(`Admin ${req.admin.email} updated user ${user.email}`);

    res.json({ user });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji użytkownika' });
  }
});

// PATCH /api/admin/users/:id/subscription - Aktualizacja subskrypcji użytkownika
router.patch('/:id/subscription', authenticateAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, trialEndDate, endDate, status } = req.body;

    let _subscription = await prisma.subscription.findUnique({
      where: { userId: id }
    });

    if (!_subscription) {
      // Utwórz nową subskrypcję
      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { name: 'free' }
      });

      if (!freePlan) {
        return res.status(500).json({ error: 'Nie znaleziono planu free' });
      }

      _subscription = await prisma.subscription.create({
        data: {
          userId: id,
          planId: planId || freePlan.id,
          status: status || 'ACTIVE',
          trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
          endDate: endDate ? new Date(endDate) : null
        },
        include: {
          plan: true
        }
      });
    } else {
      // Aktualizuj istniejącą subskrypcję
      const updateData = {};
      if (planId) updateData.planId = planId;
      if (trialEndDate) updateData.trialEndDate = new Date(trialEndDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (status) updateData.status = status;

      _subscription = await prisma.subscription.update({
        where: { id: _subscription.id },
        data: updateData,
        include: {
          plan: true
        }
      });
    }

    logger.info(`Admin ${req.admin.email} updated subscription for user ${id}`);

    res.json({ subscription: _subscription });
  } catch (error) {
    logger.error('Error updating user subscription:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji subskrypcji' });
  }
});

// DELETE /api/admin/users/:id - Usunięcie użytkownika
router.delete('/:id', authenticateAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    await prisma.user.delete({
      where: { id }
    });

    logger.info(`Admin ${req.admin.email} deleted user ${user.email}`);

    res.json({ message: 'Użytkownik został usunięty' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania użytkownika' });
  }
});

// GET /api/admin/users/stats/overview - Statystyki użytkowników
router.get('/stats/overview', authenticateAdminToken, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Wszyscy użytkownicy
    const totalUsers = await prisma.user.count();

    // Aktywni użytkownicy (ostatnie 30 dni)
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Nowi użytkownicy w tym miesiącu
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: thisMonth
        }
      }
    });

    // Użytkownicy z subskrypcjami premium
    const premiumUsers = await prisma.user.count({
      where: {
        subscription: {
          plan: {
            name: {
              in: ['pro', 'enterprise']
            }
          }
        }
      }
    });

    // Użytkownicy według roli
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Użytkownicy według planu - poprawione zapytanie
    const usersWithSubscriptions = await prisma.user.findMany({
      where: {
        subscription: {
          isNot: null
        }
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    // Grupuj użytkowników według planu
    const usersByPlan = usersWithSubscriptions.reduce((acc, user) => {
      const planName = user.subscription?.plan?.name || 'unknown';
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      premiumUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {}),
      usersByPlan
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk użytkowników' });
  }
});

module.exports = router;
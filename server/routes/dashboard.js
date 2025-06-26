const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/dashboard/stats - Statystyki dla dashboardu
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Pobierz podstawowe statystyki
    const [
      companiesCount,
      companiesAsOwner,
      companiesAsWorker,
      pendingInvitations
    ] = await Promise.all([
      // Wszystkie firmy użytkownika
      prisma.company.count({
        where: {
          OR: [
            { createdById: userId },
            {
              workers: {
                some: {
                  userId: userId,
                  status: 'ACTIVE'
                }
              }
            }
          ]
        }
      }),

      // Firmy gdzie jest właścicielem
      prisma.company.count({
        where: { createdById: userId }
      }),

      // Firmy gdzie jest pracownikiem
      prisma.worker.count({
        where: {
          userId: userId,
          status: 'ACTIVE'
        }
      }),

      // Oczekujące zaproszenia
      prisma.worker.count({
        where: {
          userId: userId,
          status: 'INVITED'
        }
      })
    ]);

    res.json({
      companies: {
        total: companiesCount,
        asOwner: companiesAsOwner,
        asWorker: companiesAsWorker
      },
      pendingInvitations
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk' });
  }
});

// GET /api/dashboard/recent-activity - Ostatnie aktywności
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Pobierz ostatnie firmy
    const recentCompanies = await prisma.company.findMany({
      where: {
        OR: [
          { createdById: userId },
          {
            workers: {
              some: {
                userId: userId,
                status: 'ACTIVE'
              }
            }
          }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            workers: true
          }
        }
      }
    });

    // Pobierz ostatnie zaproszenia
    const recentInvitations = await prisma.worker.findMany({
      where: {
        userId: userId,
        status: 'INVITED'
      },
      orderBy: { invitedAt: 'desc' },
      take: 5,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    res.json({
      recentCompanies,
      recentInvitations
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania ostatnich aktywności' });
  }
});

// GET /api/dashboard/invitations - Zaproszenia użytkownika
router.get('/invitations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const invitations = await prisma.worker.findMany({
      where: {
        userId: userId,
        status: 'INVITED'
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { invitedAt: 'desc' }
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania zaproszeń' });
  }
});

// GET /api/dashboard/company-stats/:id - Statystyki konkretnej firmy
router.get('/company-stats/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy użytkownik ma dostęp do firmy
    const company = await prisma.company.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          {
            workers: {
              some: {
                userId: userId,
                status: 'ACTIVE'
              }
            }
          }
        ]
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona' });
    }

    // Pobierz statystyki firmy
    const [
      totalWorkers,
      activeWorkers,
      invitedWorkers,
      inactiveWorkers
    ] = await Promise.all([
      prisma.worker.count({
        where: { companyId: id }
      }),
      prisma.worker.count({
        where: {
          companyId: id,
          status: 'ACTIVE'
        }
      }),
      prisma.worker.count({
        where: {
          companyId: id,
          status: 'INVITED'
        }
      }),
      prisma.worker.count({
        where: {
          companyId: id,
          status: { in: ['INACTIVE', 'LEFT'] }
        }
      })
    ]);

    res.json({
      workers: {
        total: totalWorkers,
        active: activeWorkers,
        invited: invitedWorkers,
        inactive: inactiveWorkers
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk firmy' });
  }
});

module.exports = router;

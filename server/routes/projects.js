const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateParams } = require('../middleware/validation');
const { logger, securityLogger } = require('../config/logger');
const {
  _createProjectSchema,
  _updateProjectSchema
} = require('../schemas/projectSchemas');
const { idSchema, _paginationSchema } = require('../schemas/commonSchemas');

const router = express.Router();
// GET /api/projects - Lista projektów firmy
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { companyId, status, priority, search } = req.query;
    const userId = req.user.id;

    // Sprawdź czy użytkownik ma dostęp do firmy (jako właściciel lub aktywny pracownik)
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
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
      return res.status(403).json({ error: 'Brak dostępu do tej firmy' });
    }

    // Buduj warunki filtrowania
    const where = {
      companyId
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Dodaj statystyki zadań do każdego projektu
    const projectsWithStats = projects.map(project => ({
      ...project,
      stats: {
        totalTasks: project._count.tasks,
        todoTasks: project.tasks.filter(t => t.status === 'TODO').length,
        inProgressTasks: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
        doneTasks: project.tasks.filter(t => t.status === 'DONE').length,
        highPriorityTasks: project.tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length
      }
    }));

    logger.info('Projects fetched', {
      userId,
      companyId,
      projectsCount: projectsWithStats.length,
      filters: { status, priority, search }
    });

    res.json(projectsWithStats);
  } catch (error) {
    logger.error('Error fetching projects', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      companyId: req.query?.companyId
    });
    res.status(500).json({ error: 'Błąd podczas pobierania projektów' });
  }
});

// GET /api/projects/:id - Szczegóły projektu
router.get('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }

    // Sprawdź czy użytkownik ma dostęp do firmy (jako właściciel lub aktywny pracownik)
    const company = await prisma.company.findFirst({
      where: {
        id: project.companyId,
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
      return res.status(403).json({ error: 'Brak dostępu do tego projektu' });
    }

    // Dodaj statystyki
    const stats = {
      totalTasks: project.tasks.length,
      todoTasks: project.tasks.filter(t => t.status === 'TODO').length,
      inProgressTasks: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      reviewTasks: project.tasks.filter(t => t.status === 'REVIEW').length,
      doneTasks: project.tasks.filter(t => t.status === 'DONE').length,
      totalEstimatedHours: project.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      totalActualHours: project.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
    };

    securityLogger.logDataAccess(userId, 'READ', 'project', id);

    res.json({ ...project, stats });
  } catch (error) {
    logger.error('Error fetching project', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      projectId: req.params?.id
    });
    res.status(500).json({ error: 'Błąd podczas pobierania projektu' });
  }
});

// POST /api/projects - Tworzenie nowego projektu
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      companyId,
      priority = 'MEDIUM',
      startDate,
      endDate,
      deadline,
      budget,
      location,
      clientName,
      clientEmail,
      clientPhone
    } = req.body;
    const userId = req.user.id;

    // Walidacja
    if (!name || !companyId) {
      return res.status(400).json({ error: 'Nazwa projektu i firma są wymagane' });
    }

    // Sprawdź czy użytkownik może tworzyć projekty w tej firmie
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { createdById: userId },
          {
            workers: {
              some: {
                userId: userId,
                status: 'ACTIVE',
                canEdit: true
              }
            }
          }
        ]
      }
    });

    if (!company) {
      return res.status(403).json({ error: 'Brak uprawnień do tworzenia projektów w tej firmie' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        companyId,
        createdById: userId,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget ? parseFloat(budget) : null,
        location,
        clientName,
        clientEmail,
        clientPhone
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia projektu' });
  }
});

// PUT /api/projects/:id - Aktualizacja projektu
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      deadline,
      budget,
      location,
      clientName,
      clientEmail,
      clientPhone
    } = req.body;
    const userId = req.user.id;

    // Sprawdź czy projekt istnieje
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }

    // Sprawdź uprawnienia
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: existingProject.companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker || !worker.canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego projektu' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget ? parseFloat(budget) : null,
        location,
        clientName,
        clientEmail,
        clientPhone
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji projektu' });
  }
});

// DELETE /api/projects/:id - Usuwanie projektu
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy projekt istnieje
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }

    // Sprawdź uprawnienia - tylko właściciel firmy lub twórca projektu
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: existingProject.companyId,
        status: 'ACTIVE'
      },
      include: {
        company: true
      }
    });

    const isOwner = worker?.company.createdById === userId;
    const isCreator = existingProject.createdById === userId;

    if (!worker || (!isOwner && !isCreator)) {
      return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego projektu' });
    }

    // Sprawdź czy projekt ma zadania
    if (existingProject._count.tasks > 0) {
      return res.status(400).json({
        error: 'Nie można usunąć projektu zawierającego zadania. Usuń najpierw wszystkie zadania.'
      });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Projekt został usunięty' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania projektu' });
  }
});

// GET /api/projects/:id/stats - Statystyki projektu
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          select: {
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
            createdAt: true,
            dueDate: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }

    // Sprawdź dostęp
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: project.companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Brak dostępu do tego projektu' });
    }

    const now = new Date();
    const stats = {
      totalTasks: project.tasks.length,
      tasksByStatus: {
        TODO: project.tasks.filter(t => t.status === 'TODO').length,
        IN_PROGRESS: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
        REVIEW: project.tasks.filter(t => t.status === 'REVIEW').length,
        DONE: project.tasks.filter(t => t.status === 'DONE').length,
        CANCELLED: project.tasks.filter(t => t.status === 'CANCELLED').length
      },
      tasksByPriority: {
        LOW: project.tasks.filter(t => t.priority === 'LOW').length,
        MEDIUM: project.tasks.filter(t => t.priority === 'MEDIUM').length,
        HIGH: project.tasks.filter(t => t.priority === 'HIGH').length,
        URGENT: project.tasks.filter(t => t.priority === 'URGENT').length
      },
      hours: {
        totalEstimated: project.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
        totalActual: project.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
      },
      overdueTasks: project.tasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
      ).length,
      completionRate: project.tasks.length > 0
        ? Math.round((project.tasks.filter(t => t.status === 'DONE').length / project.tasks.length) * 100)
        : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania statystyk projektu' });
  }
});

module.exports = router;

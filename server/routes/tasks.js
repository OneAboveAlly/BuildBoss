const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks - Lista zadań (z filtrowaniem)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, companyId, status, priority, assignedToId, search } = req.query;
    const userId = req.user.id;

    // Buduj warunki filtrowania
    const where = {};

    if (projectId) {
      where.projectId = projectId;
      
      // Sprawdź dostęp do projektu
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return res.status(404).json({ error: 'Projekt nie został znaleziony' });
      }

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
    } else if (companyId) {
      // Filtrowanie po firmie - sprawdź dostęp
      const worker = await prisma.worker.findFirst({
        where: {
          userId,
          companyId,
          status: 'ACTIVE'
        }
      });

      if (!worker) {
        return res.status(403).json({ error: 'Brak dostępu do tej firmy' });
      }

      where.project = {
        companyId
      };
    } else {
      // Bez filtrów - pokaż zadania ze wszystkich firm użytkownika
      const userCompanies = await prisma.worker.findMany({
        where: {
          userId,
          status: 'ACTIVE'
        },
        select: {
          companyId: true
        }
      });

      where.project = {
        companyId: {
          in: userCompanies.map(w => w.companyId)
        }
      };
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
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
            email: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania zadań' });
  }
});

// GET /api/tasks/:id - Szczegóły zadania
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
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
            email: true,
            avatar: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: task.project.company.id,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Brak dostępu do tego zadania' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania zadania' });
  }
});

// POST /api/tasks - Tworzenie nowego zadania
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      priority = 'MEDIUM',
      assignedToId,
      startDate,
      dueDate,
      estimatedHours
    } = req.body;
    const userId = req.user.id;

    // Walidacja
    if (!title || !projectId) {
      return res.status(400).json({ error: 'Tytuł zadania i projekt są wymagane' });
    }

    // Sprawdź czy projekt istnieje i czy użytkownik ma dostęp
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }

    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: project.companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker || !worker.canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do tworzenia zadań w tym projekcie' });
    }

    // Sprawdź czy assignedToId jest prawidłowy (jeśli podany)
    if (assignedToId) {
      const assignedWorker = await prisma.worker.findFirst({
        where: {
          userId: assignedToId,
          companyId: project.companyId,
          status: 'ACTIVE'
        }
      });

      if (!assignedWorker) {
        return res.status(400).json({ error: 'Wybrany użytkownik nie jest pracownikiem tej firmy' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        createdById: userId,
        assignedToId,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
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
            email: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia zadania' });
  }
});

// PUT /api/tasks/:id - Aktualizacja zadania
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignedToId,
      startDate,
      dueDate,
      estimatedHours,
      actualHours
    } = req.body;
    const userId = req.user.id;

    // Sprawdź czy zadanie istnieje
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }

    // Sprawdź uprawnienia
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: existingTask.project.companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Brak dostępu do tego zadania' });
    }

    // Sprawdź czy może edytować (właściciel, twórca, lub przypisany)
    const canEdit = worker.canEdit || 
                   existingTask.createdById === userId || 
                   existingTask.assignedToId === userId;

    if (!canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego zadania' });
    }

    // Sprawdź czy assignedToId jest prawidłowy (jeśli podany)
    if (assignedToId) {
      const assignedWorker = await prisma.worker.findFirst({
        where: {
          userId: assignedToId,
          companyId: existingTask.project.companyId,
          status: 'ACTIVE'
        }
      });

      if (!assignedWorker) {
        return res.status(400).json({ error: 'Wybrany użytkownik nie jest pracownikiem tej firmy' });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        assignedToId,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        actualHours: actualHours ? parseFloat(actualHours) : null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
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
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji zadania' });
  }
});

// DELETE /api/tasks/:id - Usuwanie zadania
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy zadanie istnieje
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }

    // Sprawdź uprawnienia - tylko twórca lub właściciel firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: existingTask.project.companyId,
        status: 'ACTIVE'
      },
      include: {
        company: true
      }
    });

    const isOwner = worker?.company.createdById === userId;
    const isCreator = existingTask.createdById === userId;

    if (!worker || (!isOwner && !isCreator && !worker.canEdit)) {
      return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego zadania' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Zadanie zostało usunięte' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania zadania' });
  }
});

// PATCH /api/tasks/:id/status - Zmiana statusu zadania (szybka akcja)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({ error: 'Status jest wymagany' });
    }

    // Sprawdź czy zadanie istnieje
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Zadanie nie zostało znalezione' });
    }

    // Sprawdź dostęp
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: existingTask.project.companyId,
        status: 'ACTIVE'
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Brak dostępu do tego zadania' });
    }

    // Sprawdź czy może zmieniać status
    const canChangeStatus = worker.canEdit || 
                           existingTask.createdById === userId || 
                           existingTask.assignedToId === userId;

    if (!canChangeStatus) {
      return res.status(403).json({ error: 'Brak uprawnień do zmiany statusu tego zadania' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Błąd podczas zmiany statusu zadania' });
  }
});

// GET /api/tasks/my - Moje zadania (przypisane do mnie)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { status, priority } = req.query;
    const userId = req.user.id;

    const where = {
      assignedToId: userId
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
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
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania moich zadań' });
  }
});

module.exports = router; 
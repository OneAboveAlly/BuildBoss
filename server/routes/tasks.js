const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validate, validateParams, validateQuery } = require('../middleware/validation');
const { logger, securityLogger } = require('../config/logger');
const { notifyTaskAssigned, notifyTaskCompleted } = require('./notifications');
const { 
  createTaskSchema, 
  updateTaskSchema, 
  updateTaskStatusSchema,
  taskFiltersSchema 
} = require('../schemas/taskSchemas');
const { idSchema } = require('../schemas/commonSchemas');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks - Lista zadań (z filtrowaniem)
router.get('/', authenticateToken, validateQuery(taskFiltersSchema), async (req, res) => {
  try {
    const { projectId, companyId, status, priority, assignedToId, search } = req.query;
    const userId = req.user.id;

    // Buduj warunki filtrowania
    const where = {};

    if (projectId) {
      where.projectId = projectId;
      
      // Sprawdź dostęp do projektu
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          company: {
            select: {
              id: true,
              createdById: true
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
          id: project.company.id,
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
    } else if (companyId) {
      // Filtrowanie po firmie - sprawdź dostęp (jako właściciel lub aktywny pracownik)
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

      where.project = {
        companyId
      };
    } else {
      // Bez filtrów - pokaż zadania ze wszystkich firm użytkownika (jako właściciel lub aktywny pracownik)
      const companies = await prisma.company.findMany({
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
        select: {
          id: true
        }
      });

      where.project = {
        companyId: {
          in: companies.map(c => c.id)
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

    logger.info('Tasks fetched', {
      userId,
      tasksCount: tasks.length,
      filters: { projectId, companyId, status, priority, assignedToId, search }
    });

    res.json(tasks);
  } catch (error) {
    logger.error('Error fetching tasks', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      filters: req.query
    });
    res.status(500).json({ error: 'Błąd podczas pobierania zadań' });
  }
});

// GET /api/tasks/:id - Szczegóły zadania
router.get('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
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

    // Sprawdź dostęp do firmy (jako właściciel lub aktywny pracownik)
    const company = await prisma.company.findFirst({
      where: {
        id: task.project.company.id,
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
      return res.status(403).json({ error: 'Brak dostępu do tego zadania' });
    }

    securityLogger.logDataAccess(userId, 'READ', 'task', id);

    res.json(task);
  } catch (error) {
    logger.error('Error fetching task', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      taskId: req.params?.id
    });
    res.status(500).json({ error: 'Błąd podczas pobierania zadania' });
  }
});

// POST /api/tasks - Tworzenie nowego zadania
router.post('/', authenticateToken, validate(createTaskSchema), async (req, res) => {
  try {
    logger.debug('Creating new task', {
      userId: req.user.id,
      requestBody: req.body
    });
    
    const {
      title,
      description,
      projectId,
      priority = 'MEDIUM',
      assignedToId: rawAssignedToId,
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
      where: { id: projectId },
      include: {
        company: {
          select: {
            id: true,
            createdById: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projekt nie został znaleziony' });
    }

    // Sprawdź czy użytkownik ma dostęp do firmy (jako właściciel lub aktywny pracownik z prawem edycji)
    const company = await prisma.company.findFirst({
      where: {
        id: project.company.id,
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
      return res.status(403).json({ error: 'Brak uprawnień do tworzenia zadań w tym projekcie' });
    }

    // Process assignedToId
    let assignedToId = rawAssignedToId;
    
    // Sprawdź czy assignedToId jest prawidłowy (jeśli podany)
    if (assignedToId) {
      logger.debug('Processing assignedToId for task creation', { assignedToId, userId });
      
      // Handle special case for "current-user"
      if (assignedToId === 'current-user') {
        assignedToId = userId;
        logger.debug('Converted current-user to actual userId', { assignedToId });
      }
      
      const assignedUserCompany = await prisma.company.findFirst({
        where: {
          id: project.company.id,
          OR: [
            { createdById: assignedToId },
            { 
              workers: {
                some: {
                  userId: assignedToId,
                  status: 'ACTIVE'
                }
              }
            }
          ]
        }
      });

      if (!assignedUserCompany) {
        logger.warn('User not found in company for task assignment', { 
          assignedToId, 
          companyId: project.company.id,
          userId 
        });
        return res.status(400).json({ error: 'Wybrany użytkownik nie jest członkiem tej firmy' });
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

    // ETAP 11 - Wyślij powiadomienie o przypisaniu zadania
    if (assignedToId && assignedToId !== userId) {
      try {
        await notifyTaskAssigned(task.id, assignedToId, userId);
      } catch (notificationError) {
        logger.error('Error sending task assignment notification', {
          error: notificationError.message,
          taskId: task.id,
          assignedToId,
          userId: req.user.id
        });
        // Nie przerywamy procesu jeśli powiadomienie się nie powiedzie
      }
    }

    logger.info('Task created successfully', {
      taskId: task.id,
      projectId,
      userId: req.user.id,
      assignedToId
    });

    res.status(201).json(task);
  } catch (error) {
    logger.error('Error creating task', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      projectId: req.body?.projectId
    });
    res.status(500).json({ error: 'Błąd podczas tworzenia zadania' });
  }
});

// PUT /api/tasks/:id - Aktualizacja zadania
router.put('/:id', authenticateToken, validateParams(idSchema), validate(updateTaskSchema), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PUT /api/tasks/:id - Request body:', req.body);
    console.log('PUT /api/tasks/:id - User ID:', req.user.id);
    
    const {
      title,
      description,
      status,
      priority,
      assignedToId: rawAssignedToId,
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

    // Sprawdź uprawnienia - użytkownik musi mieć dostęp do firmy
    const company = await prisma.company.findFirst({
      where: {
        id: existingTask.project.companyId,
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
      include: {
        workers: {
          where: {
            userId: userId,
            status: 'ACTIVE'
          },
          select: {
            canEdit: true
          }
        }
      }
    });

    if (!company) {
      return res.status(403).json({ error: 'Brak dostępu do tego zadania' });
    }

    // Sprawdź czy może edytować (właściciel firmy, pracownik z prawem edycji, twórca zadania, lub przypisany)
    const isOwner = company.createdById === userId;
    const workerCanEdit = company.workers.length > 0 && company.workers[0].canEdit;
    const isCreator = existingTask.createdById === userId;
    const isAssigned = existingTask.assignedToId === userId;
    
    const canEdit = isOwner || workerCanEdit || isCreator || isAssigned;

    if (!canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego zadania' });
    }

    // Process assignedToId
    let assignedToId = rawAssignedToId;
    
    // Sprawdź czy assignedToId jest prawidłowy (jeśli podany)
    if (assignedToId) {
      console.log('Checking assignedToId for update:', assignedToId);
      
      // Handle special case for "current-user"
      if (assignedToId === 'current-user') {
        assignedToId = userId;
        console.log('Converting current-user to actual userId:', assignedToId);
      }
      
      const assignedUserCompany = await prisma.company.findFirst({
        where: {
          id: existingTask.project.companyId,
          OR: [
            { createdById: assignedToId },
            { 
              workers: {
                some: {
                  userId: assignedToId,
                  status: 'ACTIVE'
                }
              }
            }
          ]
        }
      });

      if (!assignedUserCompany) {
        console.log('User not found in company for update. AssignedToId:', assignedToId, 'CompanyId:', existingTask.project.companyId);
        return res.status(400).json({ error: 'Wybrany użytkownik nie jest członkiem tej firmy' });
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

    // ETAP 11 - Powiadomienia o zmianach w zadaniu
    try {
      // Powiadomienie o nowym przypisaniu
      if (assignedToId && assignedToId !== existingTask.assignedToId && assignedToId !== userId) {
        await notifyTaskAssigned(task.id, assignedToId, userId);
      }

      // Powiadomienie o ukończeniu zadania
      if (status === 'DONE' && existingTask.status !== 'DONE') {
        await notifyTaskCompleted(task.id, userId);
      }
    } catch (notificationError) {
      console.error('Error sending task update notifications:', notificationError);
      // Nie przerywamy procesu jeśli powiadomienie się nie powiedzie
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji zadania' });
  }
});

// DELETE /api/tasks/:id - Usuwanie zadania
router.delete('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
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

    // Sprawdź uprawnienia - właściciel firmy, pracownik z prawem edycji lub twórca zadania
    const company = await prisma.company.findFirst({
      where: {
        id: existingTask.project.companyId,
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
      include: {
        workers: {
          where: {
            userId: userId,
            status: 'ACTIVE'
          },
          select: {
            canEdit: true
          }
        }
      }
    });

    if (!company) {
      return res.status(403).json({ error: 'Brak dostępu do tego zadania' });
    }

    const isOwner = company.createdById === userId;
    const workerCanEdit = company.workers.length > 0 && company.workers[0].canEdit;
    const isCreator = existingTask.createdById === userId;

    if (!isOwner && !isCreator && !workerCanEdit) {
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
router.patch('/:id/status', authenticateToken, validateParams(idSchema), validate(updateTaskStatusSchema), async (req, res) => {
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

    // Sprawdź dostęp do firmy
    const company = await prisma.company.findFirst({
      where: {
        id: existingTask.project.companyId,
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
      include: {
        workers: {
          where: {
            userId: userId,
            status: 'ACTIVE'
          },
          select: {
            canEdit: true
          }
        }
      }
    });

    if (!company) {
      return res.status(403).json({ error: 'Brak dostępu do tego zadania' });
    }

    // Sprawdź czy może zmieniać status
    const isOwner = company.createdById === userId;
    const workerCanEdit = company.workers.length > 0 && company.workers[0].canEdit;
    const isCreator = existingTask.createdById === userId;
    const isAssigned = existingTask.assignedToId === userId;
    
    const canChangeStatus = isOwner || workerCanEdit || isCreator || isAssigned;

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

    // ETAP 11 - Powiadomienie o ukończeniu zadania
    if (status === 'DONE' && existingTask.status !== 'DONE') {
      try {
        await notifyTaskCompleted(task.id, userId);
      } catch (notificationError) {
        console.error('Error sending task completion notification:', notificationError);
        // Nie przerywamy procesu jeśli powiadomienie się nie powiedzie
      }
    }

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
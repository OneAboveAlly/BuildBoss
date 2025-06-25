const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tags - Lista tagów firmy
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.query;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(400).json({ error: 'ID firmy jest wymagane' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId
      }
    });

    if (!worker) {
      return res.status(403).json({ error: 'Brak dostępu do tej firmy' });
    }

    const tags = await prisma.tag.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            projects: true,
            tasks: true,
            materials: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const tagsWithUsage = tags.map(tag => ({
      ...tag,
      usage: tag._count.projects + tag._count.tasks + tag._count.materials,
      usageDetails: {
        projects: tag._count.projects,
        tasks: tag._count.tasks,
        materials: tag._count.materials
      }
    }));

    res.json({ tags: tagsWithUsage });

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania tagów' });
  }
});

// POST /api/tags - Tworzenie nowego tagu
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, color, description, companyId } = req.body;
    const userId = req.user.id;

    if (!name || !companyId) {
      return res.status(400).json({ 
        error: 'Nazwa tagu i ID firmy są wymagane' 
      });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId,
        canEdit: true
      }
    });

    if (!worker) {
      return res.status(403).json({ 
        error: 'Brak uprawnień do tworzenia tagów w tej firmie' 
      });
    }

    // Sprawdź czy tag o tej nazwie już istnieje w firmie
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: name.trim(),
        companyId
      }
    });

    if (existingTag) {
      return res.status(400).json({ 
        error: 'Tag o tej nazwie już istnieje w firmie' 
      });
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || '#3B82F6',
        description: description?.trim(),
        companyId
      }
    });

    res.status(201).json({ tag });

  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia tagu' });
  }
});

// PUT /api/tags/:id - Aktualizacja tagu
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Nazwa tagu jest wymagana' });
    }

    // Sprawdź czy tag istnieje i użytkownik ma dostęp
    const existingTag = await prisma.tag.findFirst({
      where: { id },
      include: { company: true }
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag nie został znaleziony' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: existingTag.companyId,
        canEdit: true
      }
    });

    if (!worker) {
      return res.status(403).json({ 
        error: 'Brak uprawnień do edycji tagów w tej firmie' 
      });
    }

    // Sprawdź czy nowa nazwa nie koliduje z innym tagiem
    if (name.trim() !== existingTag.name) {
      const nameConflict = await prisma.tag.findFirst({
        where: {
          name: name.trim(),
          companyId: existingTag.companyId,
          id: { not: id }
        }
      });

      if (nameConflict) {
        return res.status(400).json({ 
          error: 'Tag o tej nazwie już istnieje w firmie' 
        });
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name: name.trim(),
        color: color || existingTag.color,
        description: description?.trim()
      }
    });

    res.json({ tag: updatedTag });

  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji tagu' });
  }
});

// DELETE /api/tags/:id - Usuwanie tagu
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy tag istnieje i użytkownik ma dostęp
    const existingTag = await prisma.tag.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            tasks: true,
            materials: true
          }
        }
      }
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag nie został znaleziony' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: existingTag.companyId,
        canEdit: true
      }
    });

    if (!worker) {
      return res.status(403).json({ 
        error: 'Brak uprawnień do usuwania tagów w tej firmie' 
      });
    }

    const totalUsage = existingTag._count.projects + existingTag._count.tasks + existingTag._count.materials;

    if (totalUsage > 0) {
      return res.status(400).json({ 
        error: `Nie można usunąć tagu używanego w ${totalUsage} elementach. Najpierw usuń tag z projektów, zadań i materiałów.`,
        usage: {
          projects: existingTag._count.projects,
          tasks: existingTag._count.tasks,
          materials: existingTag._count.materials
        }
      });
    }

    await prisma.tag.delete({
      where: { id }
    });

    res.json({ message: 'Tag został usunięty' });

  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania tagu' });
  }
});

// POST /api/tags/assign - Przypisywanie tagów do obiektów
router.post('/assign', authenticateToken, async (req, res) => {
  try {
    const { tagIds, objectType, objectId, companyId } = req.body;
    const userId = req.user.id;

    if (!tagIds || !Array.isArray(tagIds) || !objectType || !objectId || !companyId) {
      return res.status(400).json({ 
        error: 'Wymagane: tagIds (array), objectType, objectId, companyId' 
      });
    }

    const validObjectTypes = ['project', 'task', 'material'];
    if (!validObjectTypes.includes(objectType)) {
      return res.status(400).json({ 
        error: 'Nieprawidłowy typ obiektu. Dozwolone: project, task, material' 
      });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId,
        canEdit: true
      }
    });

    if (!worker) {
      return res.status(403).json({ 
        error: 'Brak uprawnień do przypisywania tagów w tej firmie' 
      });
    }

    // Sprawdź czy tagi istnieją i należą do firmy
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        companyId
      }
    });

    if (tags.length !== tagIds.length) {
      return res.status(400).json({ 
        error: 'Niektóre tagi nie istnieją lub nie należą do tej firmy' 
      });
    }

    // Sprawdź czy obiekt istnieje i należy do firmy
    let objectExists = false;
    let currentTags = [];

    switch (objectType) {
      case 'project':
        const project = await prisma.project.findFirst({
          where: { id: objectId, companyId },
          include: { tags: true }
        });
        objectExists = !!project;
        currentTags = project?.tags || [];
        break;

      case 'task':
        const task = await prisma.task.findFirst({
          where: { 
            id: objectId,
            project: { companyId }
          },
          include: { tags: true }
        });
        objectExists = !!task;
        currentTags = task?.tags || [];
        break;

      case 'material':
        const material = await prisma.material.findFirst({
          where: { id: objectId, companyId },
          include: { tags: true }
        });
        objectExists = !!material;
        currentTags = material?.tags || [];
        break;
    }

    if (!objectExists) {
      return res.status(404).json({ 
        error: `${objectType} nie został znaleziony lub nie należy do tej firmy` 
      });
    }

    // Aktualizuj tagi obiektu
    const modelName = objectType === 'material' ? 'material' : objectType;
    
    await prisma[modelName].update({
      where: { id: objectId },
      data: {
        tags: {
          set: tagIds.map(tagId => ({ id: tagId }))
        }
      }
    });

    // Pobierz zaktualizowany obiekt z tagami
    const updatedObject = await prisma[modelName].findUnique({
      where: { id: objectId },
      include: { tags: true }
    });

    res.json({ 
      message: 'Tagi zostały przypisane',
      object: updatedObject
    });

  } catch (error) {
    console.error('Error assigning tags:', error);
    res.status(500).json({ error: 'Błąd podczas przypisywania tagów' });
  }
});

// DELETE /api/tags/assign - Usuwanie tagów z obiektów
router.delete('/assign', authenticateToken, async (req, res) => {
  try {
    const { tagIds, objectType, objectId, companyId } = req.body;
    const userId = req.user.id;

    if (!tagIds || !Array.isArray(tagIds) || !objectType || !objectId || !companyId) {
      return res.status(400).json({ 
        error: 'Wymagane: tagIds (array), objectType, objectId, companyId' 
      });
    }

    const validObjectTypes = ['project', 'task', 'material'];
    if (!validObjectTypes.includes(objectType)) {
      return res.status(400).json({ 
        error: 'Nieprawidłowy typ obiektu. Dozwolone: project, task, material' 
      });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId,
        canEdit: true
      }
    });

    if (!worker) {
      return res.status(403).json({ 
        error: 'Brak uprawnień do usuwania tagów w tej firmie' 
      });
    }

    // Pobierz obecne tagi obiektu
    const modelName = objectType === 'material' ? 'material' : objectType;
    
    const currentObject = await prisma[modelName].findFirst({
      where: { 
        id: objectId,
        ...(objectType === 'task' ? { project: { companyId } } : { companyId })
      },
      include: { tags: true }
    });

    if (!currentObject) {
      return res.status(404).json({ 
        error: `${objectType} nie został znaleziony lub nie należy do tej firmy` 
      });
    }

    // Usuń wybrane tagi
    const remainingTagIds = currentObject.tags
      .filter(tag => !tagIds.includes(tag.id))
      .map(tag => tag.id);

    await prisma[modelName].update({
      where: { id: objectId },
      data: {
        tags: {
          set: remainingTagIds.map(tagId => ({ id: tagId }))
        }
      }
    });

    // Pobierz zaktualizowany obiekt z tagami
    const updatedObject = await prisma[modelName].findUnique({
      where: { id: objectId },
      include: { tags: true }
    });

    res.json({ 
      message: 'Tagi zostały usunięte',
      object: updatedObject
    });

  } catch (error) {
    console.error('Error removing tags:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania tagów' });
  }
});

// GET /api/tags/:id/objects - Obiekty przypisane do tagu
router.get('/:id/objects', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user.id;

    // Sprawdź czy tag istnieje i użytkownik ma dostęp
    const tag = await prisma.tag.findFirst({
      where: { id },
      include: { company: true }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag nie został znaleziony' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId,
        companyId: tag.companyId
      }
    });

    if (!worker) {
      return res.status(403).json({ 
        error: 'Brak dostępu do tego tagu' 
      });
    }

    const searchLimit = Math.min(parseInt(limit), 100);

    // Pobierz obiekty przypisane do tagu
    const [projects, tasks, materials] = await Promise.all([
      prisma.project.findMany({
        where: {
          tags: {
            some: { id }
          }
        },
        include: {
          company: { select: { name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { tasks: true } }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      }),

      prisma.task.findMany({
        where: {
          tags: {
            some: { id }
          }
        },
        include: {
          project: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
          createdBy: { select: { firstName: true, lastName: true } }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      }),

      prisma.material.findMany({
        where: {
          tags: {
            some: { id }
          }
        },
        include: {
          company: { select: { name: true } },
          project: { select: { name: true } },
          createdBy: { select: { firstName: true, lastName: true } }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      })
    ]);

    const objects = {
      projects: projects.map(project => ({
        id: project.id,
        type: 'project',
        title: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        company: project.company.name,
        createdBy: `${project.createdBy.firstName} ${project.createdBy.lastName}`,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        metadata: {
          tasksCount: project._count.tasks,
          budget: project.budget,
          deadline: project.deadline
        },
        url: `/projects/${project.id}`
      })),

      tasks: tasks.map(task => ({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        project: task.project.name,
        assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : null,
        createdBy: `${task.createdBy.firstName} ${task.createdBy.lastName}`,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        metadata: {
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours,
          dueDate: task.dueDate
        },
        url: `/projects/${task.projectId}/tasks/${task.id}`
      })),

      materials: materials.map(material => ({
        id: material.id,
        type: 'material',
        title: material.name,
        description: material.description,
        category: material.category,
        company: material.company.name,
        project: material.project?.name,
        createdBy: `${material.createdBy.firstName} ${material.createdBy.lastName}`,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
        metadata: {
          quantity: material.quantity,
          unit: material.unit,
          price: material.price,
          supplier: material.supplier
        },
        url: `/materials/${material.id}`
      }))
    };

    const total = objects.projects.length + objects.tasks.length + objects.materials.length;

    res.json({
      tag,
      objects,
      total
    });

  } catch (error) {
    console.error('Error fetching tag objects:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania obiektów tagu' });
  }
});

module.exports = router; 
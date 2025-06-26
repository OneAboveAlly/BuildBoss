const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
// GET /api/search/global - Globalne wyszukiwanie
router.get('/global', authenticateToken, async (req, res) => {
  try {
    const { q: query, category, companyId, limit = 50, includeArchived = false } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Zapytanie musi mieć co najmniej 2 znaki'
      });
    }

    const searchQuery = query.trim();
    const searchLimit = Math.min(parseInt(limit), 100);

    // Sprawdź dostęp do firm użytkownika
    const userCompanies = await prisma.worker.findMany({
      where: { userId },
      select: { companyId: true }
    });
    const companyIds = userCompanies.map(w => w.companyId);

    if (companyId && !companyIds.includes(companyId)) {
      return res.status(403).json({ error: 'Brak dostępu do tej firmy' });
    }

    const whereCompany = companyId ? { companyId } : { companyId: { in: companyIds } };
    const searchConditions = {
      contains: searchQuery,
      mode: 'insensitive'
    };

    const results = {
      projects: [],
      tasks: [],
      materials: [],
      users: [],
      companies: [],
      total: 0
    };

    // Wyszukiwanie projektów
    if (!category || category === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          ...whereCompany,
          OR: [
            { name: searchConditions },
            { description: searchConditions },
            { clientName: searchConditions },
            { location: searchConditions }
          ]
        },
        include: {
          company: { select: { name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { tasks: true } },
          tags: { select: { name: true, color: true } }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      });

      results.projects = projects.map(project => ({
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
          deadline: project.deadline,
          location: project.location,
          clientName: project.clientName
        },
        tags: project.tags,
        url: `/projects/${project.id}`
      }));
    }

    // Wyszukiwanie zadań
    if (!category || category === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: {
          project: whereCompany,
          OR: [
            { title: searchConditions },
            { description: searchConditions }
          ]
        },
        include: {
          project: { select: { name: true, companyId: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          tags: { select: { name: true, color: true } }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      });

      results.tasks = tasks.map(task => ({
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
        tags: task.tags,
        url: `/projects/${task.projectId}/tasks/${task.id}`
      }));
    }

    // Wyszukiwanie materiałów
    if (!category || category === 'materials') {
      const materials = await prisma.material.findMany({
        where: {
          ...whereCompany,
          OR: [
            { name: searchConditions },
            { description: searchConditions },
            { category: searchConditions },
            { supplier: searchConditions }
          ]
        },
        include: {
          company: { select: { name: true } },
          project: { select: { name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          tags: { select: { name: true, color: true } }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      });

      results.materials = materials.map(material => ({
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
          supplier: material.supplier,
          location: material.location,
          isLowStock: material.minQuantity && material.quantity <= material.minQuantity
        },
        tags: material.tags,
        url: `/materials/${material.id}`
      }));
    }

    // Wyszukiwanie użytkowników (tylko w firmach użytkownika)
    if (!category || category === 'users') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: searchConditions },
            { lastName: searchConditions },
            { email: searchConditions }
          ],
          workerProfiles: {
            some: {
              companyId: companyId ? companyId : { in: companyIds }
            }
          }
        },
        include: {
          workerProfiles: {
            where: {
              companyId: companyId ? companyId : { in: companyIds }
            },
            include: {
              company: { select: { name: true } }
            }
          }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      });

      results.users = users.map(user => ({
        id: user.id,
        type: 'user',
        title: `${user.firstName} ${user.lastName}`,
        description: user.email,
        companies: user.workerProfiles.map(wp => wp.company.name),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        metadata: {
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        url: `/users/${user.id}`
      }));
    }

    // Wyszukiwanie firm (tylko te do których użytkownik ma dostęp)
    if (!category || category === 'companies') {
      const companies = await prisma.company.findMany({
        where: {
          id: { in: companyIds },
          OR: [
            { name: searchConditions },
            { description: searchConditions },
            { nip: searchConditions },
            { address: searchConditions }
          ]
        },
        include: {
          _count: {
            select: {
              projects: true,
              workers: true,
              materials: true
            }
          }
        },
        take: searchLimit,
        orderBy: { updatedAt: 'desc' }
      });

      results.companies = companies.map(company => ({
        id: company.id,
        type: 'company',
        title: company.name,
        description: company.description,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        metadata: {
          nip: company.nip,
          address: company.address,
          phone: company.phone,
          email: company.email,
          website: company.website,
          projectsCount: company._count.projects,
          workersCount: company._count.workers,
          materialsCount: company._count.materials
        },
        url: `/companies/${company.id}`
      }));
    }

    // Oblicz całkowitą liczbę wyników
    results.total = results.projects.length + results.tasks.length +
                   results.materials.length + results.users.length + results.companies.length;

    // Zapisz historię wyszukiwania
    await prisma.searchHistory.create({
      data: {
        userId,
        query: searchQuery,
        category: category || 'all',
        results: results.total,
        filters: {
          companyId,
          includeArchived
        }
      }
    });

    res.json({
      query: searchQuery,
      results,
      pagination: {
        limit: searchLimit,
        total: results.total
      }
    });

  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({ error: 'Błąd podczas wyszukiwania' });
  }
});

// GET /api/search/suggestions - Sugestie wyszukiwania
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 1) {
      return res.json({ suggestions: [] });
    }

    const searchQuery = query.trim();
    const searchLimit = Math.min(parseInt(limit), 20);

    // Sprawdź dostęp do firm użytkownika
    const userCompanies = await prisma.worker.findMany({
      where: { userId },
      select: { companyId: true }
    });
    const companyIds = userCompanies.map(w => w.companyId);

    const suggestions = [];

    // Sugestie z projektów
    const projects = await prisma.project.findMany({
      where: {
        companyId: { in: companyIds },
        name: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      },
      select: { name: true, id: true },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    suggestions.push(...projects.map(p => ({
      text: p.name,
      type: 'project',
      id: p.id,
      category: 'Projekty'
    })));

    // Sugestie z zadań
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          companyId: { in: companyIds }
        },
        title: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      },
      select: { title: true, id: true },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    suggestions.push(...tasks.map(t => ({
      text: t.title,
      type: 'task',
      id: t.id,
      category: 'Zadania'
    })));

    // Sugestie z materiałów
    const materials = await prisma.material.findMany({
      where: {
        companyId: { in: companyIds },
        name: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      },
      select: { name: true, id: true },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    suggestions.push(...materials.map(m => ({
      text: m.name,
      type: 'material',
      id: m.id,
      category: 'Materiały'
    })));

    // Sugestie z tagów
    const tags = await prisma.tag.findMany({
      where: {
        companyId: { in: companyIds },
        name: {
          contains: searchQuery,
          mode: 'insensitive'
        }
      },
      select: { name: true, id: true, color: true },
      take: 5
    });

    suggestions.push(...tags.map(t => ({
      text: t.name,
      type: 'tag',
      id: t.id,
      category: 'Tagi',
      color: t.color
    })));

    // Ogranicz do limitu i posortuj
    const limitedSuggestions = suggestions
      .slice(0, searchLimit)
      .sort((a, b) => a.text.localeCompare(b.text));

    res.json({ suggestions: limitedSuggestions });

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania sugestii' });
  }
});

// GET /api/search/history - Historia wyszukiwań
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const userId = req.user.id;

    const history = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ history });

  } catch (error) {
    console.error('Error getting search history:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania historii' });
  }
});

// DELETE /api/search/history/:id - Usuń wpis z historii
router.delete('/history/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.searchHistory.deleteMany({
      where: {
        id,
        userId
      }
    });

    res.json({ message: 'Wpis usunięty z historii' });

  } catch (error) {
    console.error('Error deleting search history:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania z historii' });
  }
});

// GET /api/search/trending - Popularne wyszukiwania
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    // Sprawdź dostęp do firm użytkownika
    const userCompanies = await prisma.worker.findMany({
      where: { userId },
      select: { companyId: true }
    });
    const companyIds = userCompanies.map(w => w.companyId);

    // Pobierz popularne wyszukiwania z ostatnich 30 dni
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await prisma.searchHistory.groupBy({
      by: ['query'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        user: {
          workerProfiles: {
            some: {
              companyId: { in: companyIds }
            }
          }
        }
      },
      _count: {
        query: true
      },
      orderBy: {
        _count: {
          query: 'desc'
        }
      },
      take: parseInt(limit)
    });

    const trendingQueries = trending.map(item => ({
      query: item.query,
      count: item._count.query
    }));

    res.json({ trending: trendingQueries });

  } catch (error) {
    console.error('Error getting trending searches:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania popularnych wyszukiwań' });
  }
});

// POST /api/search/save - Zapisz wyszukiwanie
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { name, query, filters, category } = req.body;
    const userId = req.user.id;

    if (!name || !query) {
      return res.status(400).json({
        error: 'Nazwa i zapytanie są wymagane'
      });
    }

    // Sprawdź czy użytkownik nie ma już zapisanego wyszukiwania o tej nazwie
    const existing = await prisma.savedSearch.findFirst({
      where: {
        userId,
        name
      }
    });

    if (existing) {
      return res.status(400).json({
        error: 'Wyszukiwanie o tej nazwie już istnieje'
      });
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        name,
        query,
        filters: filters || {},
        category: category || 'all'
      }
    });

    res.status(201).json({ savedSearch });

  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({ error: 'Błąd podczas zapisywania wyszukiwania' });
  }
});

// GET /api/search/saved - Zapisane wyszukiwania
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ savedSearches });

  } catch (error) {
    console.error('Error getting saved searches:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania zapisanych wyszukiwań' });
  }
});

// PUT /api/search/saved/:id - Aktualizuj zapisane wyszukiwanie
router.put('/saved/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, query, filters, category } = req.body;
    const userId = req.user.id;

    const savedSearch = await prisma.savedSearch.updateMany({
      where: {
        id,
        userId
      },
      data: {
        name,
        query,
        filters: filters || {},
        category: category || 'all',
        updatedAt: new Date()
      }
    });

    if (savedSearch.count === 0) {
      return res.status(404).json({ error: 'Zapisane wyszukiwanie nie zostało znalezione' });
    }

    res.json({ message: 'Wyszukiwanie zaktualizowane' });

  } catch (error) {
    console.error('Error updating saved search:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji wyszukiwania' });
  }
});

// DELETE /api/search/saved/:id - Usuń zapisane wyszukiwanie
router.delete('/saved/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await prisma.savedSearch.deleteMany({
      where: {
        id,
        userId
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Zapisane wyszukiwanie nie zostało znalezione' });
    }

    res.json({ message: 'Zapisane wyszukiwanie usunięte' });

  } catch (error) {
    console.error('Error deleting saved search:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania zapisanego wyszukiwania' });
  }
});

module.exports = router;

const express = require('express');
const { prisma } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validate, validateParams, validateQuery } = require('../middleware/validation');
const { logger, securityLogger } = require('../config/logger');
const {
  createRequestSchema,
  updateRequestSchema,
  requestFiltersSchema,
  myRequestFiltersSchema
} = require('../schemas/requestSchemas');
const { idSchema } = require('../schemas/commonSchemas');

const router = express.Router();
// Stałe dla kategorii
const WORK_CATEGORIES = {
  CONSTRUCTION: 'Budowa',
  RENOVATION: 'Remont',
  REPAIR: 'Naprawa',
  INSTALLATION: 'Instalacja',
  MAINTENANCE: 'Konserwacja',
  DEMOLITION: 'Rozbiórka',
  LANDSCAPING: 'Ogrodnictwo',
  CLEANING: 'Sprzątanie',
  PAINTING: 'Malowanie',
  ELECTRICAL: 'Elektryka',
  PLUMBING: 'Hydraulika',
  ROOFING: 'Dekarstwo',
  FLOORING: 'Podłogi',
  WINDOWS_DOORS: 'Okna i drzwi',
  OTHER: 'Inne'
};

const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
];

// ===== PUBLICZNE ENDPOINTY =====

// GET /api/requests - Lista publicznych zleceń (bez autoryzacji)
router.get('/', optionalAuth, validateQuery(requestFiltersSchema), async (req, res) => {
  try {
    const {
      category,
      voivodeship,
      city,
      type,
      budgetMin,
      budgetMax,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Budowanie filtrów
    const where = {
      isActive: true,
      isPublic: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    if (category) where.category = category;
    if (voivodeship) where.voivodeship = voivodeship;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (type) where.type = type;
    if (budgetMin) where.budgetMin = { gte: parseFloat(budgetMin) };
    if (budgetMax) where.budgetMax = { lte: parseFloat(budgetMax) };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Sortowanie
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [requests, total] = await Promise.all([
      prisma.workRequest.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              description: true
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.workRequest.count({ where })
    ]);

    // Dodaj informację o kontakcie użytkownika (jeśli zalogowany)
    const requestsWithContactInfo = requests.map(request => ({
      ...request,
      messageCount: request._count.messages,
      canContact: !!req.user && req.user.id !== request.createdById
    }));

    res.json({
      requests: requestsWithContactInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania zleceń' });
  }
});

// GET /api/requests/categories - Lista kategorii
router.get('/categories', (req, res) => {
  res.json(WORK_CATEGORIES);
});

// GET /api/requests/voivodeships - Lista województw
router.get('/voivodeships', (req, res) => {
  res.json(VOIVODESHIPS);
});

// GET /api/requests/:id - Szczegóły zlecenia (publiczne)
router.get('/:id', optionalAuth, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.workRequest.findFirst({
      where: {
        id,
        isActive: true,
        isPublic: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
            website: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Zlecenie nie zostało znalezione' });
    }

    res.json({
      ...request,
      messageCount: request._count.messages,
      canContact: !!req.user && req.user.id !== request.createdById
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania zlecenia' });
  }
});

// ===== PRYWATNE ENDPOINTY (dla użytkowników) =====

// GET /api/requests/my/requests - Moje zlecenia (wymaga autoryzacji)
router.get('/my/requests', authenticateToken, validateQuery(myRequestFiltersSchema), async (req, res) => {
  try {
    const {
      companyId,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Filtrowanie
    const where = {
      createdById: req.user.id
    };

    if (companyId) where.companyId = companyId;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const requests = await prisma.workRequest.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania zleceń' });
  }
});

// POST /api/requests - Tworzenie nowego zlecenia (wymaga autoryzacji)
router.post('/', authenticateToken, validate(createRequestSchema), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      voivodeship,
      city,
      address,
      latitude,
      longitude,
      budgetMin,
      budgetMax,
      currency,
      deadline,
      requirements,
      materials,
      contactEmail,
      contactPhone,
      isPublic,
      expiresAt,
      companyId
    } = req.body;

    // Walidacja wymaganych pól
    if (!title || !description || !category || !voivodeship || !city) {
      return res.status(400).json({
        error: 'Wymagane pola: title, description, category, voivodeship, city'
      });
    }

    // Jeśli podano companyId, sprawdź uprawnienia
    if (companyId) {
      const worker = await prisma.worker.findUnique({
        where: {
          userId_companyId: {
            userId: req.user.id,
            companyId
          }
        }
      });

      if (!worker) {
        return res.status(403).json({ error: 'Brak uprawnień do tworzenia zleceń w tej firmie' });
      }
    }

    const request = await prisma.workRequest.create({
      data: {
        title,
        description,
        category,
        type: type || 'ONE_TIME',
        voivodeship,
        city,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        currency: currency || 'PLN',
        deadline: deadline ? new Date(deadline) : null,
        requirements,
        materials,
        contactEmail,
        contactPhone,
        isPublic: isPublic !== false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        companyId: companyId || null,
        createdById: req.user.id
      },
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

    logger.info('Work request created', {
      userId: req.user.id,
      requestId: request.id,
      companyId: request.companyId,
      title: request.title,
      category: request.category
    });

    securityLogger.logDataAccess(req.user.id, 'CREATE', 'work_request', request.id);

    res.status(201).json(request);
  } catch (error) {
    logger.error('Error creating request', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      requestData: req.body
    });
    res.status(500).json({ error: 'Błąd podczas tworzenia zlecenia' });
  }
});

// PUT /api/requests/:id - Aktualizacja zlecenia (wymaga autoryzacji)
router.put('/:id', authenticateToken, validateParams(idSchema), validate(updateRequestSchema), async (req, res) => {
  try {
    const { id } = req.params;

    // Sprawdź czy zlecenie istnieje i czy użytkownik ma uprawnienia
    const existingRequest = await prisma.workRequest.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      return res.status(404).json({ error: 'Zlecenie nie zostało znalezione' });
    }

    if (existingRequest.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego zlecenia' });
    }

    const {
      title,
      description,
      category,
      type,
      voivodeship,
      city,
      address,
      latitude,
      longitude,
      budgetMin,
      budgetMax,
      currency,
      deadline,
      requirements,
      materials,
      contactEmail,
      contactPhone,
      isActive,
      isPublic,
      expiresAt
    } = req.body;

    const updatedRequest = await prisma.workRequest.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(type && { type }),
        ...(voivodeship && { voivodeship }),
        ...(city && { city }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(budgetMin !== undefined && { budgetMin: budgetMin ? parseFloat(budgetMin) : null }),
        ...(budgetMax !== undefined && { budgetMax: budgetMax ? parseFloat(budgetMax) : null }),
        ...(currency && { currency }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(requirements !== undefined && { requirements }),
        ...(materials !== undefined && { materials }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    logger.info('Work request updated', {
      userId: req.user.id,
      requestId: updatedRequest.id,
      changes: Object.keys(req.body)
    });

    res.json(updatedRequest);
  } catch (error) {
    logger.error('Error updating request', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      requestId: req.params.id,
      updateData: req.body
    });
    res.status(500).json({ error: 'Błąd podczas aktualizacji zlecenia' });
  }
});

// DELETE /api/requests/:id - Usuwanie zlecenia (wymaga autoryzacji)
router.delete('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    // Sprawdź czy zlecenie istnieje i czy użytkownik ma uprawnienia
    const existingRequest = await prisma.workRequest.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      return res.status(404).json({ error: 'Zlecenie nie zostało znalezione' });
    }

    if (existingRequest.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego zlecenia' });
    }

    await prisma.workRequest.delete({
      where: { id }
    });

    logger.info('Work request deleted', {
      userId: req.user.id,
      requestId: id,
      companyId: existingRequest.companyId
    });

    securityLogger.logDataAccess(req.user.id, 'DELETE', 'work_request', id);

    res.json({ message: 'Zlecenie zostało usunięte' });
  } catch (error) {
    logger.error('Error deleting request', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      requestId: req.params.id
    });
    res.status(500).json({ error: 'Błąd podczas usuwania zlecenia' });
  }
});

module.exports = router;

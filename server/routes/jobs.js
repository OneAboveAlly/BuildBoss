const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validate, validateParams, validateQuery } = require('../middleware/validation');
const { logger, securityLogger } = require('../config/logger');
const {
  createJobSchema,
  updateJobSchema,
  jobFiltersSchema,
  _applyJobSchema
} = require('../schemas/jobSchemas');
const { idSchema } = require('../schemas/commonSchemas');

const router = express.Router();
const prisma = new PrismaClient();

// Stałe dla kategorii i lokalizacji
const JOB_CATEGORIES = {
  CONSTRUCTION_WORKER: 'Robotnik budowlany',
  ELECTRICIAN: 'Elektryk',
  PLUMBER: 'Hydraulik',
  PAINTER: 'Malarz',
  CARPENTER: 'Stolarz',
  MASON: 'Murarz',
  ROOFER: 'Dekarz',
  TILER: 'Glazurnik',
  FOREMAN: 'Kierownik budowy',
  ARCHITECT: 'Architekt',
  ENGINEER: 'Inżynier',
  HEAVY_EQUIPMENT: 'Operator sprzętu',
  LANDSCAPING: 'Ogrodnictwo',
  DEMOLITION: 'Rozbiórki',
  OTHER: 'Inne'
};

const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'
];

// ===== PUBLICZNE ENDPOINTY =====

// GET /api/jobs - Lista publicznych ogłoszeń o pracę (bez autoryzacji)
router.get('/', optionalAuth, validateQuery(jobFiltersSchema), async (req, res) => {
  try {
    const {
      category,
      voivodeship,
      city,
      type,
      experience,
      salaryMin,
      salaryMax,
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
    if (experience) where.experience = experience;
    if (salaryMin) where.salaryMin = { gte: parseFloat(salaryMin) };
    if (salaryMax) where.salaryMax = { lte: parseFloat(salaryMax) };

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

    const [jobs, total] = await Promise.all([
      prisma.jobOffer.findMany({
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
              applications: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.jobOffer.count({ where })
    ]);

    // Dodaj informację czy użytkownik już aplikował (jeśli zalogowany)
    const jobsWithApplicationStatus = await Promise.all(
      jobs.map(async (job) => {
        let hasApplied = false;
        if (req.user) {
          const application = await prisma.jobApplication.findUnique({
            where: {
              jobOfferId_applicantId: {
                jobOfferId: job.id,
                applicantId: req.user.id
              }
            }
          });
          hasApplied = !!application;
        }

        return {
          ...job,
          hasApplied,
          applicationCount: job._count.applications
        };
      })
    );

    logger.info('Jobs fetched', {
      userId: req.user?.id,
      filtersUsed: { category, voivodeship, city, type, experience, salaryMin, salaryMax, search },
      jobsCount: jobsWithApplicationStatus.length,
      totalJobs: total,
      page: parseInt(page)
    });

    res.json({
      jobs: jobsWithApplicationStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching jobs', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      filters: req.query
    });
    res.status(500).json({ error: 'Błąd podczas pobierania ogłoszeń' });
  }
});

// GET /api/jobs/categories - Lista kategorii
router.get('/categories', (req, res) => {
  res.json(JOB_CATEGORIES);
});

// GET /api/jobs/voivodeships - Lista województw
router.get('/voivodeships', (req, res) => {
  res.json(VOIVODESHIPS);
});

// GET /api/jobs/:id - Szczegóły ogłoszenia (publiczne)
router.get('/:id', optionalAuth, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.jobOffer.findFirst({
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
            applications: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' });
    }

    // Zwiększ licznik wyświetleń per IP (asynchronicznie, żeby nie blokować odpowiedzi)
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || null;

    // Sprawdź czy to IP już oglądało to ogłoszenie w ciągu ostatnich 24h
    const existingView = await prisma.jobView.findUnique({
      where: {
        jobOfferId_ipAddress: {
          jobOfferId: id,
          ipAddress: clientIp
        }
      }
    }).catch(() => null);

    // Jeśli nie ma wpisu lub minęło więcej niż 24h, dodaj nowy view
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const shouldCountView = !existingView || existingView.viewedAt < twentyFourHoursAgo;

    if (shouldCountView) {
      // Dodaj/aktualizuj wpis o wyświetleniu
      prisma.jobView.upsert({
        where: {
          jobOfferId_ipAddress: {
            jobOfferId: id,
            ipAddress: clientIp
          }
        },
        update: {
          viewedAt: new Date(),
          userAgent,
          userId: req.user?.id || null
        },
        create: {
          jobOfferId: id,
          ipAddress: clientIp,
          userAgent,
          userId: req.user?.id || null
        }
      }).then(() => {
        // Zwiększ licznik tylko jeśli to nowy view
        if (!existingView) {
          return prisma.jobOffer.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
          });
        }
      }).catch(error => {
        console.error('Error tracking job view:', error);
      });
    }

    // Sprawdź czy użytkownik już aplikował
    let hasApplied = false;
    let userApplication = null;
    if (req.user) {
      userApplication = await prisma.jobApplication.findUnique({
        where: {
          jobOfferId_applicantId: {
            jobOfferId: job.id,
            applicantId: req.user.id
          }
        }
      });
      hasApplied = !!userApplication;
    }

    res.json({
      ...job,
      hasApplied,
      userApplication,
      applicationCount: job._count.applications
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania ogłoszenia' });
  }
});

// POST /api/jobs/:id/apply - Aplikowanie na stanowisko (wymaga autoryzacji)
router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, cvUrl } = req.body;

    // Sprawdź czy ogłoszenie istnieje i jest aktywne
    const job = await prisma.jobOffer.findFirst({
      where: {
        id,
        isActive: true,
        isPublic: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' });
    }

    // Sprawdź czy użytkownik już aplikował
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobOfferId_applicantId: {
          jobOfferId: id,
          applicantId: req.user.id
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Już aplikowałeś na to stanowisko' });
    }

    // Utwórz aplikację
    const application = await prisma.jobApplication.create({
      data: {
        jobOfferId: id,
        applicantId: req.user.id,
        message,
        cvUrl
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: 'Błąd podczas aplikowania na stanowisko' });
  }
});

// ===== PRYWATNE ENDPOINTY (dla firm) =====

// GET /api/jobs/my/offers - Moje ogłoszenia (wymaga autoryzacji)
router.get('/my/offers', authenticateToken, async (req, res) => {
  try {
    const {
      companyId,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Sprawdź uprawnienia do firm
    const userCompanies = await prisma.worker.findMany({
      where: { userId: req.user.id },
      include: { company: true }
    });

    const companyIds = userCompanies.map(w => w.companyId);

    if (companyIds.length === 0) {
      return res.json([]);
    }

    // Filtrowanie
    const where = {
      companyId: companyId ? companyId : { in: companyIds }
    };

    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const jobs = await prisma.jobOffer.findMany({
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
            applications: true
          }
        }
      },
      orderBy
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching my jobs:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania ogłoszeń' });
  }
});

// POST /api/jobs - Tworzenie nowego ogłoszenia (wymaga autoryzacji)
router.post('/', authenticateToken, validate(createJobSchema), async (req, res) => {
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
      salaryMin,
      salaryMax,
      currency,
      experience,
      requirements,
      benefits,
      contactEmail,
      contactPhone,
      isPublic,
      expiresAt,
      companyId
    } = req.body;

    // Walidacja wymaganych pól
    if (!title || !description || !category || !voivodeship || !city || !companyId) {
      return res.status(400).json({
        error: 'Wymagane pola: title, description, category, voivodeship, city, companyId'
      });
    }

    // Sprawdź uprawnienia do firmy
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { createdById: req.user.id }, // właściciel firmy
          {
            workers: {
              some: {
                userId: req.user.id,
                status: 'ACTIVE',
                canEdit: true
              }
            }
          }
        ]
      }
    });

    if (!company) {
      return res.status(403).json({ error: 'Brak uprawnień do tworzenia ogłoszeń w tej firmie' });
    }

    const job = await prisma.jobOffer.create({
      data: {
        title,
        description,
        category,
        type: type || 'FULL_TIME',
        voivodeship,
        city,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        currency: currency || 'PLN',
        experience: experience || 'JUNIOR',
        requirements,
        benefits,
        contactEmail,
        contactPhone,
        isPublic: isPublic !== false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        companyId,
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

    logger.info('Job created', {
      userId: req.user.id,
      jobId: job.id,
      companyId: job.companyId,
      title: job.title,
      category: job.category
    });

    securityLogger.logDataAccess(req.user.id, 'CREATE', 'job', job.id);

    res.status(201).json(job);
  } catch (error) {
    logger.error('Error creating job', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      jobData: req.body
    });
    res.status(500).json({ error: 'Błąd podczas tworzenia ogłoszenia' });
  }
});

// PUT /api/jobs/:id - Aktualizacja ogłoszenia (wymaga autoryzacji)
router.put('/:id', authenticateToken, validateParams(idSchema), validate(updateJobSchema), async (req, res) => {
  try {
    const { id } = req.params;

    // Sprawdź czy ogłoszenie istnieje i czy użytkownik ma uprawnienia
    const existingJob = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            workers: {
              where: { userId: req.user.id }
            }
          }
        }
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' });
    }

    const worker = existingJob.company.workers[0];
    const canEdit = existingJob.createdById === req.user.id ||
                   (worker && (worker.canEdit || req.user.role === 'BOSS'));

    if (!canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego ogłoszenia' });
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
      salaryMin,
      salaryMax,
      currency,
      experience,
      requirements,
      benefits,
      contactEmail,
      contactPhone,
      isActive,
      isPublic,
      expiresAt
    } = req.body;

    const updatedJob = await prisma.jobOffer.update({
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
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? parseFloat(salaryMin) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? parseFloat(salaryMax) : null }),
        ...(currency && { currency }),
        ...(experience && { experience }),
        ...(requirements !== undefined && { requirements }),
        ...(benefits !== undefined && { benefits }),
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
            applications: true
          }
        }
      }
    });

    logger.info('Job updated', {
      userId: req.user.id,
      jobId: updatedJob.id,
      changes: Object.keys(req.body)
    });

    res.json(updatedJob);
  } catch (error) {
    logger.error('Error updating job', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      jobId: req.params.id,
      updateData: req.body
    });
    res.status(500).json({ error: 'Błąd podczas aktualizacji ogłoszenia' });
  }
});

// DELETE /api/jobs/:id - Usuwanie ogłoszenia (wymaga autoryzacji)
router.delete('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;

    // Sprawdź czy ogłoszenie istnieje i czy użytkownik ma uprawnienia
    const existingJob = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            workers: {
              where: { userId: req.user.id }
            }
          }
        }
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' });
    }

    const worker = existingJob.company.workers[0];
    const canDelete = existingJob.createdById === req.user.id ||
                     (worker && (worker.canEdit || req.user.role === 'BOSS'));

    if (!canDelete) {
      return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego ogłoszenia' });
    }

    await prisma.jobOffer.delete({
      where: { id }
    });

    logger.info('Job deleted', {
      userId: req.user.id,
      jobId: id,
      companyId: existingJob.companyId
    });

    securityLogger.logDataAccess(req.user.id, 'DELETE', 'job', id);

    res.json({ message: 'Ogłoszenie zostało usunięte' });
  } catch (error) {
    logger.error('Error deleting job', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      jobId: req.params.id
    });
    res.status(500).json({ error: 'Błąd podczas usuwania ogłoszenia' });
  }
});

// GET /api/jobs/:id/applications - Lista aplikacji do ogłoszenia (wymaga autoryzacji)
router.get('/:id/applications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sortBy = 'appliedAt', sortOrder = 'desc' } = req.query;

    // Sprawdź czy ogłoszenie istnieje i czy użytkownik ma uprawnienia
    const job = await prisma.jobOffer.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            workers: {
              where: { userId: req.user.id }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' });
    }

    const worker = job.company.workers[0];
    const canView = job.createdById === req.user.id ||
                   (worker && (worker.canView || req.user.role === 'BOSS'));

    if (!canView) {
      return res.status(403).json({ error: 'Brak uprawnień do przeglądania aplikacji' });
    }

    // Filtrowanie
    const where = { jobOfferId: id };
    if (status) where.status = status;

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania aplikacji' });
  }
});

// PUT /api/jobs/:jobId/applications/:applicationId - Aktualizacja statusu aplikacji
router.put('/:jobId/applications/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { status, notes } = req.body;

    // Sprawdź uprawnienia
    const job = await prisma.jobOffer.findUnique({
      where: { id: jobId },
      include: {
        company: {
          include: {
            workers: {
              where: { userId: req.user.id }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' });
    }

    const worker = job.company.workers[0];
    const canEdit = job.createdById === req.user.id ||
                   (worker && (worker.canEdit || req.user.role === 'BOSS'));

    if (!canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do zarządzania aplikacjami' });
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        ...(status && { status, reviewedAt: new Date() }),
        ...(notes !== undefined && { notes })
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji aplikacji' });
  }
});

module.exports = router;

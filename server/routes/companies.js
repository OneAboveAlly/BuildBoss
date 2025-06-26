const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, _requireRole } = require('../middleware/auth');
const { validate, validateParams, _validateQuery } = require('../middleware/validation');
const { logger, securityLogger } = require('../config/logger');
const { sendEmail } = require('../utils/email');
const {
  createCompanySchema,
  _updateCompanySchema,
  _inviteWorkerSchema,
  _updateWorkerSchema,
  _searchUsersSchema
} = require('../schemas/companySchemas');
const { idSchema, _paginationSchema } = require('../schemas/commonSchemas');

const prisma = new PrismaClient();

// GET /api/companies - Lista firm użytkownika
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Pobierz firmy gdzie użytkownik jest twórcą lub pracownikiem
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
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        workers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            workers: true
          }
        }
      }
    });

    // Dodaj informację o roli użytkownika w każdej firmie
    const companiesWithRole = companies.map(company => {
      const isOwner = company.createdById === userId;
      const workerProfile = company.workers.find(w => w.userId === userId);

      return {
        ...company,
        userRole: isOwner ? 'OWNER' : 'WORKER',
        userPermissions: isOwner ? {
          canEdit: true,
          canView: true,
          canManageFinance: true
        } : workerProfile ? {
          canEdit: workerProfile.canEdit,
          canView: workerProfile.canView,
          canManageFinance: workerProfile.canManageFinance
        } : null
      };
    });

    logger.info('Companies fetched', {
      userId,
      companiesCount: companiesWithRole.length
    });

    res.json(companiesWithRole);
  } catch (error) {
    logger.error('Error fetching companies', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Błąd podczas pobierania firm' });
  }
});

// GET /api/companies/:id - Szczegóły firmy
router.get('/:id', authenticateToken, validateParams(idSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        workers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona' });
    }

    // Sprawdź uprawnienia użytkownika
    const isOwner = company.createdById === userId;
    const workerProfile = company.workers.find(w => w.userId === userId);

    const userRole = isOwner ? 'OWNER' : 'WORKER';
    const userPermissions = isOwner ? {
      canEdit: true,
      canView: true,
      canManageFinance: true
    } : workerProfile ? {
      canEdit: workerProfile.canEdit,
      canView: workerProfile.canView,
      canManageFinance: workerProfile.canManageFinance
    } : null;

    securityLogger.logDataAccess(userId, 'READ', 'company', id);

    res.json({
      ...company,
      userRole,
      userPermissions
    });
  } catch (error) {
    logger.error('Error fetching company', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      companyId: req.params?.id
    });
    res.status(500).json({ error: 'Błąd podczas pobierania firmy' });
  }
});

// POST /api/companies - Tworzenie nowej firmy
router.post('/', authenticateToken, validate(createCompanySchema), async (req, res) => {
  try {
    const { name, nip, address, latitude, longitude, phone, email, website, description } = req.body;
    const userId = req.user.id;

    // Sprawdź czy NIP nie jest już zajęty (jeśli podany)
    if (nip) {
      const existingCompany = await prisma.company.findUnique({
        where: { nip }
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Firma z tym NIP już istnieje'
        });
      }
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        nip: nip?.trim() || null,
        address: address?.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        description: description?.trim() || null,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            workers: true
          }
        }
      }
    });

    res.status(201).json({
      ...company,
      userRole: 'OWNER',
      userPermissions: {
        canEdit: true,
        canView: true,
        canManageFinance: true
      }
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia firmy' });
  }
});

// PUT /api/companies/:id - Aktualizacja firmy
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nip, address, latitude, longitude, phone, email, website, description } = req.body;
    const userId = req.user.id;

    // Sprawdź czy użytkownik ma uprawnienia do edycji
    const company = await prisma.company.findFirst({
      where: {
        id,
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
      return res.status(404).json({ error: 'Firma nie została znaleziona lub brak uprawnień' });
    }

    // Walidacja
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Nazwa firmy musi mieć co najmniej 2 znaki' });
    }

    // Sprawdź czy NIP nie jest już zajęty przez inną firmę
    if (nip && nip !== company.nip) {
      const existingCompany = await prisma.company.findUnique({
        where: { nip }
      });
      if (existingCompany) {
        return res.status(400).json({ error: 'Firma z tym NIP już istnieje' });
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: name.trim(),
        nip: nip?.trim() || null,
        address: address?.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        description: description?.trim() || null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        workers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            workers: true
          }
        }
      }
    });

    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji firmy' });
  }
});

// DELETE /api/companies/:id - Usuwanie firmy (tylko właściciel)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const company = await prisma.company.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona lub brak uprawnień' });
    }

    await prisma.company.delete({
      where: { id }
    });

    res.json({ message: 'Firma została usunięta' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania firmy' });
  }
});

// POST /api/companies/:id/invite - Zapraszanie pracownika
router.post('/:id/invite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, position, canEdit, canView, canManageFinance } = req.body;
    const userId = req.user.id;

    // Sprawdź czy użytkownik jest właścicielem firmy
    const company = await prisma.company.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona lub brak uprawnień' });
    }

    // Walidacja email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Podaj prawidłowy adres email' });
    }

    // Sprawdź czy użytkownik istnieje
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!invitedUser) {
      return res.status(404).json({ error: 'Użytkownik z tym adresem email nie istnieje' });
    }

    // Sprawdź czy użytkownik już nie jest w firmie
    const existingWorker = await prisma.worker.findUnique({
      where: {
        userId_companyId: {
          userId: invitedUser.id,
          companyId: id
        }
      }
    });

    if (existingWorker) {
      return res.status(400).json({ error: 'Ten użytkownik już jest w firmie' });
    }

    // Utwórz zaproszenie
    const worker = await prisma.worker.create({
      data: {
        userId: invitedUser.id,
        companyId: id,
        position: position?.trim() || null,
        canEdit: canEdit || false,
        canView: canView !== false, // domyślnie true
        canManageFinance: canManageFinance || false,
        status: 'INVITED'
      },
      include: {
        user: {
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

    // Wyślij email z zaproszeniem
    try {
      await sendEmail(
        invitedUser.email,
        'Zaproszenie do firmy',
        `
        <h2>Zaproszenie do firmy ${company.name}</h2>
        <p>Zostałeś zaproszony do dołączenia do firmy <strong>${company.name}</strong>.</p>
        <p>Zaloguj się do aplikacji SiteBoss, aby zaakceptować zaproszenie.</p>
        <p>Stanowisko: ${position || 'Nie określono'}</p>
        `
      );
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Nie przerywamy procesu jeśli email się nie wyśle
    }

    res.status(201).json(worker);
  } catch (error) {
    console.error('Error inviting worker:', error);
    res.status(500).json({ error: 'Błąd podczas zapraszania pracownika' });
  }
});

// PUT /api/companies/:id/workers/:workerId - Aktualizacja uprawnień pracownika
router.put('/:id/workers/:workerId', authenticateToken, async (req, res) => {
  try {
    const { id, workerId } = req.params;
    const { position, canEdit, canView, canManageFinance, status } = req.body;
    const userId = req.user.id;

    // Sprawdź czy użytkownik jest właścicielem firmy
    const company = await prisma.company.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona lub brak uprawnień' });
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        position: position?.trim() || null,
        canEdit: canEdit || false,
        canView: canView !== false,
        canManageFinance: canManageFinance || false,
        status: status || 'ACTIVE',
        ...(status === 'ACTIVE' && { joinedAt: new Date() })
      },
      include: {
        user: {
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

    res.json(updatedWorker);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji pracownika' });
  }
});

// DELETE /api/companies/:id/workers/:workerId - Usuwanie pracownika
router.delete('/:id/workers/:workerId', authenticateToken, async (req, res) => {
  try {
    const { id, workerId } = req.params;
    const userId = req.user.id;

    // Sprawdź czy użytkownik jest właścicielem firmy
    const company = await prisma.company.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona lub brak uprawnień' });
    }

    await prisma.worker.delete({
      where: { id: workerId }
    });

    res.json({ message: 'Pracownik został usunięty z firmy' });
  } catch (error) {
    console.error('Error removing worker:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania pracownika' });
  }
});

// POST /api/companies/:id/accept-invitation - Akceptowanie zaproszenia
router.post('/:id/accept-invitation', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const worker = await prisma.worker.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId: id
        }
      },
      include: {
        company: true
      }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Zaproszenie nie zostało znalezione' });
    }

    if (worker.status !== 'INVITED') {
      return res.status(400).json({ error: 'Zaproszenie już zostało przetworzone' });
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: worker.id },
      data: {
        status: 'ACTIVE',
        joinedAt: new Date()
      },
      include: {
        company: true,
        user: {
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

    res.json(updatedWorker);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Błąd podczas akceptowania zaproszenia' });
  }
});

// POST /api/companies/:id/reject-invitation - Odrzucanie zaproszenia
router.post('/:id/reject-invitation', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const worker = await prisma.worker.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId: id
        }
      }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Zaproszenie nie zostało znalezione' });
    }

    if (worker.status !== 'INVITED') {
      return res.status(400).json({ error: 'Zaproszenie już zostało przetworzone' });
    }

    await prisma.worker.delete({
      where: { id: worker.id }
    });

    res.json({ message: 'Zaproszenie zostało odrzucone' });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ error: 'Błąd podczas odrzucania zaproszenia' });
  }
});

// GET /api/companies/:id/workers - Lista pracowników firmy
router.get('/:id/workers', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Sprawdź czy użytkownik ma dostęp do firmy
    const company = await prisma.company.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { workers: { some: { userId, status: 'ACTIVE' } } }
        ]
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona lub brak uprawnień' });
    }

    const workers = await prisma.worker.findMany({
      where: { companyId: id },
      include: {
        user: {
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
        { status: 'asc' },
        { joinedAt: 'desc' },
        { invitedAt: 'desc' }
      ]
    });

    res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania listy pracowników' });
  }
});

// POST /api/companies/:id/workers/bulk-invite - Zapraszanie wielu pracowników
router.post('/:id/workers/bulk-invite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { invitations } = req.body; // Array of { email, position?, canEdit?, canView?, canManageFinance? }
    const userId = req.user.id;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({ error: 'Lista zaproszeń jest wymagana' });
    }

    // Sprawdź czy użytkownik jest właścicielem firmy
    const company = await prisma.company.findFirst({
      where: {
        id,
        createdById: userId
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Firma nie została znaleziona lub brak uprawnień' });
    }

    const results = [];
    const errors = [];

    for (const invitation of invitations) {
      try {
        const { email, position, canEdit, canView, canManageFinance } = invitation;

        if (!email || !email.trim()) {
          errors.push({ email: email || 'brak', error: 'Email jest wymagany' });
          continue;
        }

        // Sprawdź czy użytkownik istnieje
        const invitedUser = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() }
        });

        if (!invitedUser) {
          errors.push({ email, error: 'Użytkownik o podanym emailu nie istnieje' });
          continue;
        }

        // Sprawdź czy użytkownik już nie jest w firmie
        const existingWorker = await prisma.worker.findUnique({
          where: {
            userId_companyId: {
              userId: invitedUser.id,
              companyId: id
            }
          }
        });

        if (existingWorker) {
          errors.push({ email, error: 'Użytkownik już jest w firmie' });
          continue;
        }

        // Utwórz zaproszenie
        const worker = await prisma.worker.create({
          data: {
            userId: invitedUser.id,
            companyId: id,
            status: 'INVITED',
            position: position?.trim() || null,
            canEdit: canEdit || false,
            canView: canView !== false,
            canManageFinance: canManageFinance || false,
            invitedAt: new Date()
          },
          include: {
            user: {
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

        results.push(worker);

        // Wyślij email z zaproszeniem
        try {
          await sendEmail(
            invitedUser.email,
            'Zaproszenie do firmy',
            `
            <h2>Zaproszenie do firmy ${company.name}</h2>
            <p>Zostałeś zaproszony do dołączenia do firmy <strong>${company.name}</strong>.</p>
            <p>Zaloguj się do aplikacji SiteBoss, aby zaakceptować zaproszenie.</p>
            <p>Stanowisko: ${position || 'Nie określono'}</p>
            `
          );
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
          // Nie przerywamy procesu jeśli email się nie wyśle
        }

      } catch (error) {
        console.error('Error processing invitation:', error);
        errors.push({ email: invitation.email, error: 'Błąd podczas przetwarzania zaproszenia' });
      }
    }

    res.status(201).json({
      success: results,
      errors,
      summary: {
        total: invitations.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk inviting workers:', error);
    res.status(500).json({ error: 'Błąd podczas zapraszania pracowników' });
  }
});

module.exports = router;

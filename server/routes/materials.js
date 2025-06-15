const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/materials - Lista materiałów firmy z filtrami
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { companyId, projectId, category, lowStock, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Sprawdź czy użytkownik ma dostęp do firmy
    if (companyId) {
      const worker = await prisma.worker.findFirst({
        where: {
          userId: req.user.id,
          companyId: companyId,
          status: 'ACTIVE'
        }
      });
      
      if (!worker) {
        return res.status(403).json({ error: 'Brak dostępu do tej firmy' });
      }
    }

    // Buduj warunki filtrowania
    const where = {
      ...(companyId && { companyId }),
      ...(projectId && { projectId }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { supplier: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Filtr dla niskiego stanu - będzie obsłużony po pobraniu danych
    const shouldFilterLowStock = lowStock === 'true';

    const materials = await prisma.material.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    // Dodaj flagę niskiego stanu i filtruj jeśli potrzeba
    let materialsWithAlerts = materials.map(material => ({
      ...material,
      isLowStock: material.minQuantity && material.quantity <= material.minQuantity
    }));

    // Filtruj materiały z niskim stanem jeśli wymagane
    if (shouldFilterLowStock) {
      materialsWithAlerts = materialsWithAlerts.filter(material => material.isLowStock);
    }

    res.json(materialsWithAlerts);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania materiałów' });
  }
});

// GET /api/materials/alerts - Materiały z niskim stanem
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId jest wymagane' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        companyId: companyId,
        status: 'ACTIVE'
      }
    });
    
    if (!worker) {
      return res.status(403).json({ error: 'Brak dostępu do tej firmy' });
    }

    const allMaterials = await prisma.material.findMany({
      where: {
        companyId,
        minQuantity: { not: null }
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    // Filtruj materiały z niskim stanem
    const lowStockMaterials = allMaterials.filter(material => 
      material.minQuantity && material.quantity <= material.minQuantity
    );

    res.json(lowStockMaterials);
  } catch (error) {
    console.error('Error fetching material alerts:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania alertów' });
  }
});

// GET /api/materials/categories - Lista kategorii materiałów
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId jest wymagane' });
    }

    const categories = await prisma.material.findMany({
      where: {
        companyId,
        category: { not: null }
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category).filter(Boolean);
    res.json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania kategorii' });
  }
});

// GET /api/materials/:id - Szczegóły materiału
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Materiał nie został znaleziony' });
    }

    // Sprawdź dostęp do firmy
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        companyId: material.companyId,
        status: 'ACTIVE'
      }
    });
    
    if (!worker) {
      return res.status(403).json({ error: 'Brak dostępu do tego materiału' });
    }

    // Dodaj flagę niskiego stanu
    const materialWithAlert = {
      ...material,
      isLowStock: material.minQuantity && material.quantity <= material.minQuantity
    };

    res.json(materialWithAlert);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Błąd podczas pobierania materiału' });
  }
});

// POST /api/materials - Tworzenie nowego materiału
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      unit = 'szt',
      quantity = 0,
      minQuantity,
      price,
      supplier,
      location,
      barcode,
      notes,
      companyId,
      projectId
    } = req.body;

    // Walidacja
    if (!name || !companyId) {
      return res.status(400).json({ error: 'Nazwa i firma są wymagane' });
    }

    // Sprawdź dostęp do firmy i uprawnienia
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        companyId: companyId,
        status: 'ACTIVE'
      }
    });
    
    if (!worker || !worker.canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do tworzenia materiałów' });
    }

    // Sprawdź czy projekt należy do firmy (jeśli podano)
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId: companyId
        }
      });
      
      if (!project) {
        return res.status(400).json({ error: 'Projekt nie należy do tej firmy' });
      }
    }

    const material = await prisma.material.create({
      data: {
        name,
        description,
        category,
        unit,
        quantity: parseFloat(quantity),
        minQuantity: minQuantity ? parseFloat(minQuantity) : null,
        price: price ? parseFloat(price) : null,
        supplier,
        location,
        barcode,
        notes,
        companyId,
        projectId: projectId || null,
        createdById: req.user.id
      },
      include: {
        company: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Błąd podczas tworzenia materiału' });
  }
});

// PUT /api/materials/:id - Aktualizacja materiału
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      unit,
      quantity,
      minQuantity,
      price,
      supplier,
      location,
      barcode,
      notes,
      projectId
    } = req.body;

    // Sprawdź czy materiał istnieje
    const existingMaterial = await prisma.material.findUnique({
      where: { id }
    });

    if (!existingMaterial) {
      return res.status(404).json({ error: 'Materiał nie został znaleziony' });
    }

    // Sprawdź uprawnienia
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        companyId: existingMaterial.companyId,
        status: 'ACTIVE'
      }
    });
    
    if (!worker || (!worker.canEdit && existingMaterial.createdById !== req.user.id)) {
      return res.status(403).json({ error: 'Brak uprawnień do edycji tego materiału' });
    }

    // Sprawdź czy projekt należy do firmy (jeśli podano)
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          companyId: existingMaterial.companyId
        }
      });
      
      if (!project) {
        return res.status(400).json({ error: 'Projekt nie należy do tej firmy' });
      }
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(unit && { unit }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(minQuantity !== undefined && { minQuantity: minQuantity ? parseFloat(minQuantity) : null }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(supplier !== undefined && { supplier }),
        ...(location !== undefined && { location }),
        ...(barcode !== undefined && { barcode }),
        ...(notes !== undefined && { notes }),
        ...(projectId !== undefined && { projectId: projectId || null })
      },
      include: {
        company: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji materiału' });
  }
});

// PATCH /api/materials/:id/quantity - Aktualizacja ilości materiału
router.patch('/:id/quantity', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Ilość jest wymagana' });
    }

    const existingMaterial = await prisma.material.findUnique({
      where: { id }
    });

    if (!existingMaterial) {
      return res.status(404).json({ error: 'Materiał nie został znaleziony' });
    }

    // Sprawdź uprawnienia
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        companyId: existingMaterial.companyId,
        status: 'ACTIVE'
      }
    });
    
    if (!worker || !worker.canEdit) {
      return res.status(403).json({ error: 'Brak uprawnień do modyfikacji ilości' });
    }

    let newQuantity;
    const qty = parseFloat(quantity);

    switch (operation) {
      case 'add':
        newQuantity = existingMaterial.quantity + qty;
        break;
      case 'subtract':
        newQuantity = Math.max(0, existingMaterial.quantity - qty);
        break;
      default:
        newQuantity = qty;
    }

    const material = await prisma.material.update({
      where: { id },
      data: { quantity: newQuantity },
      include: {
        company: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(material);
  } catch (error) {
    console.error('Error updating material quantity:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji ilości' });
  }
});

// DELETE /api/materials/:id - Usuwanie materiału
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existingMaterial = await prisma.material.findUnique({
      where: { id }
    });

    if (!existingMaterial) {
      return res.status(404).json({ error: 'Materiał nie został znaleziony' });
    }

    // Sprawdź uprawnienia
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        companyId: existingMaterial.companyId,
        status: 'ACTIVE'
      }
    });
    
    if (!worker || (!worker.canEdit && existingMaterial.createdById !== req.user.id)) {
      return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego materiału' });
    }

    await prisma.material.delete({
      where: { id }
    });

    res.json({ message: 'Materiał został usunięty' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Błąd podczas usuwania materiału' });
  }
});

module.exports = router; 
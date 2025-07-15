const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { getUsageStats } = require('../middleware/subscription');
const prisma = new PrismaClient();
const router = express.Router();

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'supersecret_admin_key';
const JWT_EXPIRES = '2h';

// Middleware: sprawdza JWT admina
function requireAdminAuth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Brak tokena autoryzacyjnego' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Nieprawidłowy token' });
  }
}

// POST /plans-admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await prisma.plansAdmin.findUnique({ where: { email } });
  if (!admin || !admin.isActive) return res.status(401).json({ error: 'Błędny email lub hasło' });
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(401).json({ error: 'Błędny email lub hasło' });
  await prisma.plansAdmin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ token, admin: { email: admin.email, firstName: admin.firstName, lastName: admin.lastName } });
});

// POST /plans-admin/change-password
router.post('/change-password', requireAdminAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const admin = await prisma.plansAdmin.findUnique({ where: { id: req.admin.id } });
  if (!admin) return res.status(404).json({ error: 'Admin nie znaleziony' });
  const valid = await bcrypt.compare(oldPassword, admin.password);
  if (!valid) return res.status(401).json({ error: 'Stare hasło nieprawidłowe' });
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.plansAdmin.update({ where: { id: admin.id }, data: { password: hash, passwordChangedAt: new Date() } });
  res.json({ success: true });
});

// GET /plans-admin/plans
router.get('/plans', requireAdminAuth, async (req, res) => {
  const plans = await prisma.subscriptionPlan.findMany({});
  res.json(plans);
});

// POST /plans-admin/initialize-plans
router.post('/initialize-plans', requireAdminAuth, async (req, res) => {
  try {
    console.log('🔧 Inicjalizacja planów subskrypcji...');
    
    // Sprawdź czy plany już istnieją
    const existingPlans = await prisma.subscriptionPlan.findMany();
    if (existingPlans.length > 0) {
      console.log('📋 Plany już istnieją w bazie danych:', existingPlans.length);
      return res.json({ 
        message: 'Plany już istnieją', 
        plans: existingPlans.length 
      });
    }

    // Plan Darmowy
    const freePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'free',
        displayName: 'Plan Darmowy',
        description: 'Podstawowe funkcje dla małych firm',
        price: 0,
        currency: 'PLN',
        maxCompanies: 1,
        maxProjects: 3,
        maxWorkers: 5,
        maxJobOffers: 1,
        maxWorkRequests: 2,
        maxStorageGB: 0.5,
        hasAdvancedReports: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
        hasCustomBranding: false,
        hasTeamManagement: false,
        isActive: true
      }
    });

    // Plan Podstawowy
    const basicPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'basic',
        displayName: 'Plan Podstawowy',
        description: 'Idealny dla małych zespołów',
        price: 2900,
        currency: 'PLN',
        maxCompanies: 3,
        maxProjects: 10,
        maxWorkers: 15,
        maxJobOffers: 5,
        maxWorkRequests: 10,
        maxStorageGB: 2.0,
        hasAdvancedReports: false,
        hasApiAccess: false,
        hasPrioritySupport: false,
        hasCustomBranding: false,
        hasTeamManagement: true,
        isActive: true
      }
    });

    // Plan Pro
    const proPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'pro',
        displayName: 'Plan Pro',
        description: 'Dla średnich i dużych firm',
        price: 7900,
        currency: 'PLN',
        maxCompanies: 10,
        maxProjects: 50,
        maxWorkers: 50,
        maxJobOffers: 20,
        maxWorkRequests: 50,
        maxStorageGB: 10.0,
        hasAdvancedReports: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasCustomBranding: false,
        hasTeamManagement: true,
        isActive: true
      }
    });

    // Plan Enterprise
    const enterprisePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'enterprise',
        displayName: 'Plan Enterprise',
        description: 'Dla dużych organizacji',
        price: 19900,
        currency: 'PLN',
        maxCompanies: -1,
        maxProjects: -1,
        maxWorkers: -1,
        maxJobOffers: -1,
        maxWorkRequests: -1,
        maxStorageGB: 100.0,
        hasAdvancedReports: true,
        hasApiAccess: true,
        hasPrioritySupport: true,
        hasCustomBranding: true,
        hasTeamManagement: true,
        isActive: true
      }
    });

    // Dodaj wpisy do logu zmian
    await prisma.planChange.create({
      data: {
        planId: freePlan.id,
        planName: freePlan.name,
        changeType: 'initialized',
        newValues: freePlan,
        adminId: req.admin.id
      }
    });

    await prisma.planChange.create({
      data: {
        planId: basicPlan.id,
        planName: basicPlan.name,
        changeType: 'initialized',
        newValues: basicPlan,
        adminId: req.admin.id
      }
    });

    await prisma.planChange.create({
      data: {
        planId: proPlan.id,
        planName: proPlan.name,
        changeType: 'initialized',
        newValues: proPlan,
        adminId: req.admin.id
      }
    });

    await prisma.planChange.create({
      data: {
        planId: enterprisePlan.id,
        planName: enterprisePlan.name,
        changeType: 'initialized',
        newValues: enterprisePlan,
        adminId: req.admin.id
      }
    });

    console.log('✅ Plany subskrypcji zostały utworzone:');
    console.log(`   🆓 ${freePlan.displayName} - ${(freePlan.price / 100).toFixed(2)} ${freePlan.currency}`);
    console.log(`   📦 ${basicPlan.displayName} - ${(basicPlan.price / 100).toFixed(2)} ${basicPlan.currency}`);
    console.log(`   🚀 ${proPlan.displayName} - ${(proPlan.price / 100).toFixed(2)} ${proPlan.currency}`);
    console.log(`   🏢 ${enterprisePlan.displayName} - ${(enterprisePlan.price / 100).toFixed(2)} ${enterprisePlan.currency}`);

    res.json({ 
      message: 'Plany zostały zainicjalizowane',
      plans: [freePlan, basicPlan, proPlan, enterprisePlan]
    });
  } catch (error) {
    console.error('❌ Błąd inicjalizacji planów:', error);
    res.status(500).json({ error: 'Błąd inicjalizacji planów' });
  }
});

// POST /plans-admin/plans
router.post('/plans', requireAdminAuth, async (req, res) => {
  // Zablokuj tworzenie nowych planów - tylko 4 stałe plany są dozwolone
  res.status(403).json({ 
    error: 'Tworzenie nowych planów jest zablokowane. Można edytować tylko 4 stałe plany: free, basic, pro, enterprise.' 
  });
});

// PUT /plans-admin/plans/:id
router.put('/plans/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const oldPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!oldPlan) return res.status(404).json({ error: 'Plan nie znaleziony' });
  
  const plan = await prisma.subscriptionPlan.update({ where: { id }, data: req.body });
  
  await prisma.planChange.create({
    data: {
      planId: plan.id,
      planName: plan.name,
      changeType: 'updated',
      oldValues: oldPlan,
      newValues: plan,
      adminId: req.admin.id
    }
  });

  console.log(`✅ Plan ${plan.name} zaktualizowany przez admina ${req.admin.email}`);
  console.log(`   Stare wartości:`, oldPlan);
  console.log(`   Nowe wartości:`, plan);
  console.log(`   Zmiany będą natychmiast widoczne na stronie głównej i pricingu`);

  res.json(plan);
});

// DELETE /plans-admin/plans/:id
router.delete('/plans/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const oldPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!oldPlan) return res.status(404).json({ error: 'Plan nie znaleziony' });
  
  // Zablokuj usuwanie planów - tylko 4 stałe plany są dozwolone
  res.status(403).json({ 
    error: 'Usuwanie planów jest zablokowane. Można edytować tylko 4 stałe plany: free, basic, pro, enterprise.' 
  });
});

// GET /plans-admin/changes
router.get('/changes', requireAdminAuth, async (req, res) => {
  const changes = await prisma.planChange.findMany({
    include: { admin: { select: { email: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json(changes);
});

// PATCH /plans-admin/plans/:id/active
router.patch('/plans/:id/active', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const oldPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!oldPlan) return res.status(404).json({ error: 'Plan nie znaleziony' });
  const plan = await prisma.subscriptionPlan.update({ where: { id }, data: { isActive } });
  await prisma.planChange.create({
    data: {
      planId: plan.id,
      planName: plan.name,
      changeType: isActive ? 'activated' : 'deactivated',
      oldValues: oldPlan,
      newValues: plan,
      adminId: req.admin.id
    }
  });
  res.json(plan);
});

// PATCH /plans-admin/plans/:id/toggle
router.patch('/plans/:id/toggle', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const oldPlan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!oldPlan) return res.status(404).json({ error: 'Plan nie znaleziony' });
  
  const newActiveStatus = !oldPlan.isActive;
  const plan = await prisma.subscriptionPlan.update({ 
    where: { id }, 
    data: { isActive: newActiveStatus } 
  });
  
  await prisma.planChange.create({
    data: {
      planId: plan.id,
      planName: plan.name,
      changeType: newActiveStatus ? 'activated' : 'deactivated',
      oldValues: oldPlan,
      newValues: plan,
      adminId: req.admin.id
    }
  });
  
  res.json(plan);
});

// GET /plans-admin/user-by-email?email=...
router.get('/user-by-email', requireAdminAuth, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email wymagany' });
  const user = await prisma.user.findUnique({
    where: { email: String(email) },
    include: {
      subscription: {
        include: { 
          plan: true 
        }
      }
    }
  });
  if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
  res.json(user);
});

// PATCH /plans-admin/user-subscription/:userId
router.patch('/user-subscription/:userId', requireAdminAuth, async (req, res) => {
  const { userId } = req.params;
  const { planId, trialEndDate, endDate } = req.body;
  
  console.log('Admin updating user subscription:', { userId, planId, trialEndDate, endDate });
  
  // Znajdź użytkownika
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
  }

  let subscription = user.subscription;

  // Jeśli użytkownik nie ma subskrypcji, utwórz domyślną
  if (!subscription) {
    console.log('User has no subscription, creating default');
    // Znajdź plan free jako domyślny
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'free' }
    });

    if (!freePlan) {
      return res.status(500).json({ error: 'Nie znaleziono planu free do utworzenia domyślnej subskrypcji' });
    }

    // Utwórz domyślną subskrypcję
    subscription = await prisma.subscription.create({
      data: {
        userId: userId,
        planId: freePlan.id,
        status: 'ACTIVE',
        trialEndDate: null,
        endDate: null
      }
    });

    // Dodaj wpis do logu zmian
    await prisma.planChange.create({
      data: {
        planId: freePlan.id,
        planName: freePlan.name,
        changeType: 'admin_user_created',
        newValues: subscription,
        adminId: req.admin.id
      }
    });
  }

  // Aktualizuj subskrypcję
  const data = {};
  if (planId) data.planId = planId;
  if (trialEndDate) data.trialEndDate = new Date(trialEndDate);
  if (endDate) data.endDate = new Date(endDate);

  console.log('Updating subscription with data:', data);

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data,
    include: {
      plan: true
    }
  });

  console.log('Subscription updated successfully:', updated.id, 'with plan:', updated.plan.name);

  // Dodaj wpis do logu zmian
  await prisma.planChange.create({
    data: {
      planId: planId || subscription.planId,
      planName: planId ? (await prisma.subscriptionPlan.findUnique({ where: { id: planId } }))?.name : subscription.planId,
      changeType: 'admin_user_update',
      oldValues: subscription,
      newValues: updated,
      adminId: req.admin.id
    }
  });

  res.json(updated);
});

// GET /plans-admin/user-stats
router.get('/user-stats', requireAdminAuth, async (req, res) => {
  try {
    // Pobierz wszystkich użytkowników z ich subskrypcjami
    const users = await prisma.user.findMany({
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    // Oblicz statystyki
    const totalUsers = users.length;
    const usersWithoutSubscription = users.filter(user => !user.subscription).length;

    // Grupuj użytkowników według planów
    const usersByPlan = {};
    users.forEach(user => {
      if (user.subscription?.plan) {
        const planName = user.subscription.plan.name;
        usersByPlan[planName] = (usersByPlan[planName] || 0) + 1;
      }
    });

    res.json({
      totalUsers,
      usersWithoutSubscription,
      usersByPlan
    });
  } catch (error) {
    console.error('Błąd pobierania statystyk użytkowników:', error);
    res.status(500).json({ error: 'Błąd pobierania statystyk użytkowników' });
  }
});

// GET /plans-admin/search-users
router.get('/search-users', requireAdminAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchQuery = String(q);
    
    // Wyszukaj użytkowników po email, imieniu lub nazwisku
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      },
      take: 10, // Limit wyników
      orderBy: {
        email: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Błąd wyszukiwania użytkowników:', error);
    res.status(500).json({ error: 'Błąd wyszukiwania użytkowników' });
  }
});

// GET /plans-admin/user-usage/:userId
router.get('/user-usage/:userId', requireAdminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Sprawdź czy użytkownik istnieje
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    // Pobierz statystyki użycia
    const usage = await getUsageStats(userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      subscription: user.subscription,
      usage
    });
  } catch (error) {
    console.error('Błąd pobierania statystyk użycia użytkownika:', error);
    res.status(500).json({ error: 'Błąd pobierania statystyk użycia' });
  }
});

// GET /plans-admin/cancelled-subscriptions
router.get('/cancelled-subscriptions', requireAdminAuth, async (req, res) => {
  try {
    const cancelledSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'CANCELED'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(cancelledSubscriptions);
  } catch (error) {
    console.error('Błąd pobierania anulowanych subskrypcji:', error);
    res.status(500).json({ error: 'Błąd pobierania anulowanych subskrypcji' });
  }
});

// GET /plans-admin/cancellation-reasons
router.get('/cancellation-reasons', requireAdminAuth, async (req, res) => {
  try {
    const cancellationReasons = await prisma.subscription.findMany({
      where: {
        status: 'CANCELED',
        cancelReason: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      },
      orderBy: {
        canceledAt: 'desc'
      }
    });

    res.json(cancellationReasons);
  } catch (error) {
    console.error('Błąd pobierania powodów anulowania:', error);
    res.status(500).json({ error: 'Błąd pobierania powodów anulowania' });
  }
});

module.exports = router; 
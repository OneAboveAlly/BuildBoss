const express = require('express');
const { prisma } = require('../config/database');
const { stripe, SUBSCRIPTION_PLANS: _SUBSCRIPTION_PLANS, getAllPlans: _getAllPlans, getPlanByName: _getPlanByName } = require('../config/stripe');

// Middleware do sprawdzania czy Stripe jest skonfigurowany
const checkStripeConfig = (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({
      error: 'Płatności niedostępne',
      message: 'System płatności nie jest skonfigurowany. Skontaktuj się z administratorem.'
    });
  }
  next();
};
const { authenticateToken } = require('../middleware/auth');
const { checkActiveSubscription, getUsageStats } = require('../middleware/subscription');

const router = express.Router();
// GET /api/subscriptions/plans - Pobierz dostępne plany
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        priceFormatted: `${(plan.price / 100).toFixed(2)} ${plan.currency.toUpperCase()}`,
        features: {
          maxCompanies: plan.maxCompanies,
          maxProjects: plan.maxProjects,
          maxWorkers: plan.maxWorkers,
          maxJobOffers: plan.maxJobOffers,
          maxWorkRequests: plan.maxWorkRequests,
          maxStorageGB: plan.maxStorageGB,
          hasAdvancedReports: plan.hasAdvancedReports,
          hasApiAccess: plan.hasApiAccess,
          hasPrioritySupport: plan.hasPrioritySupport,
          hasCustomBranding: plan.hasCustomBranding,
          hasTeamManagement: plan.hasTeamManagement
        }
      }))
    });
  } catch (error) {
    console.error('Błąd pobierania planów:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania planów' });
  }
});

// GET /api/subscriptions/current - Pobierz aktualną subskrypcję użytkownika
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const _userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId: _userId },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        message: 'Brak aktywnej subskrypcji'
      });
    }

    // Pobierz statystyki użycia
    const usage = await getUsageStats(_userId);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndDate: subscription.trialEndDate,
        nextBillingDate: subscription.nextBillingDate,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
          description: subscription.plan.description,
          price: subscription.plan.price,
          currency: subscription.plan.currency,
          priceFormatted: `${(subscription.plan.price / 100).toFixed(2)} ${subscription.plan.currency.toUpperCase()}`,
          features: {
            maxCompanies: subscription.plan.maxCompanies,
            maxProjects: subscription.plan.maxProjects,
            maxWorkers: subscription.plan.maxWorkers,
            maxJobOffers: subscription.plan.maxJobOffers,
            maxWorkRequests: subscription.plan.maxWorkRequests,
            maxStorageGB: subscription.plan.maxStorageGB,
            hasAdvancedReports: subscription.plan.hasAdvancedReports,
            hasApiAccess: subscription.plan.hasApiAccess,
            hasPrioritySupport: subscription.plan.hasPrioritySupport,
            hasCustomBranding: subscription.plan.hasCustomBranding,
            hasTeamManagement: subscription.plan.hasTeamManagement
          }
        },
        usage,
        recentPayments: subscription.payments
      }
    });
  } catch (error) {
    console.error('Błąd pobierania subskrypcji:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania subskrypcji' });
  }
});

// POST /api/subscriptions/create-checkout-session - Utwórz sesję płatności
router.post('/create-checkout-session', authenticateToken, checkStripeConfig, async (req, res) => {
  try {
    const { planId } = req.body;
    const _userId = req.user.id;
    const userEmail = req.user.email;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID jest wymagany' });
    }

    // Sprawdź czy plan istnieje
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan nie został znaleziony' });
    }

    // Sprawdź czy użytkownik już ma subskrypcję
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: _userId }
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return res.status(400).json({
        error: 'Masz już aktywną subskrypcję',
        message: 'Aby zmienić plan, najpierw anuluj obecną subskrypcję.'
      });
    }

    // Utwórz lub pobierz klienta Stripe
    let stripeCustomer;
    if (existingSubscription?.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: _userId
        }
      });
    }

    // Utwórz sesję checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.displayName,
              description: plan.description || `Subskrypcja ${plan.displayName}`
            },
            unit_amount: plan.price,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        userId: _userId,
        planId: planId
      },
      subscription_data: {
        metadata: {
          userId: _userId,
          planId: planId
        },
        trial_period_days: existingSubscription ? 0 : 14 // 14 dni trial dla nowych użytkowników
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Błąd tworzenia sesji checkout:', error);
    res.status(500).json({ error: 'Błąd serwera podczas tworzenia sesji płatności' });
  }
});

// POST /api/subscriptions/cancel - Anuluj subskrypcję
router.post('/cancel', authenticateToken, checkActiveSubscription, checkStripeConfig, async (req, res) => {
  try {
    const { reason } = req.body;
    const _userId = req.user.id;
    const subscription = req.subscription;

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'Brak ID subskrypcji Stripe',
        message: 'Nie można anulować subskrypcji bez ID Stripe.'
      });
    }

    // Anuluj subskrypcję w Stripe (na końcu okresu rozliczeniowego)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Zaktualizuj subskrypcję w bazie danych
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelReason: reason || 'Anulowana przez użytkownika'
      },
      include: { plan: true }
    });

    res.json({
      success: true,
      message: 'Subskrypcja zostanie anulowana na końcu okresu rozliczeniowego',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        nextBillingDate: updatedSubscription.nextBillingDate,
        plan: updatedSubscription.plan
      }
    });
  } catch (error) {
    console.error('Błąd anulowania subskrypcji:', error);
    res.status(500).json({ error: 'Błąd serwera podczas anulowania subskrypcji' });
  }
});

// POST /api/subscriptions/reactivate - Reaktywuj anulowaną subskrypcję
router.post('/reactivate', authenticateToken, checkActiveSubscription, checkStripeConfig, async (req, res) => {
  try {
    const _userId = req.user.id;
    const subscription = req.subscription;

    if (!subscription.cancelAtPeriodEnd) {
      return res.status(400).json({
        error: 'Subskrypcja nie jest anulowana',
        message: 'Subskrypcja nie wymaga reaktywacji.'
      });
    }

    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'Brak ID subskrypcji Stripe',
        message: 'Nie można reaktywować subskrypcji bez ID Stripe.'
      });
    }

    // Reaktywuj subskrypcję w Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    // Zaktualizuj subskrypcję w bazie danych
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        cancelReason: null
      },
      include: { plan: true }
    });

    res.json({
      success: true,
      message: 'Subskrypcja została reaktywowana',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        nextBillingDate: updatedSubscription.nextBillingDate,
        plan: updatedSubscription.plan
      }
    });
  } catch (error) {
    console.error('Błąd reaktywacji subskrypcji:', error);
    res.status(500).json({ error: 'Błąd serwera podczas reaktywacji subskrypcji' });
  }
});

// GET /api/subscriptions/usage - Pobierz statystyki użycia
router.get('/usage', authenticateToken, checkActiveSubscription, async (req, res) => {
  try {
    const _userId = req.user.id;
    const planLimits = req.planLimits;

    const usage = await getUsageStats(_userId);

    res.json({
      success: true,
      usage,
      limits: {
        maxCompanies: planLimits.maxCompanies,
        maxProjects: planLimits.maxProjects,
        maxWorkers: planLimits.maxWorkers,
        maxJobOffers: planLimits.maxJobOffers,
        maxWorkRequests: planLimits.maxWorkRequests,
        maxStorageGB: planLimits.maxStorageGB
      },
      percentages: {
        companies: planLimits.maxCompanies === -1 ? 0 : (usage.companies / planLimits.maxCompanies) * 100,
        projects: planLimits.maxProjects === -1 ? 0 : (usage.projects / planLimits.maxProjects) * 100,
        workers: planLimits.maxWorkers === -1 ? 0 : (usage.workers / planLimits.maxWorkers) * 100,
        jobOffers: planLimits.maxJobOffers === -1 ? 0 : (usage.jobOffers / planLimits.maxJobOffers) * 100,
        workRequests: planLimits.maxWorkRequests === -1 ? 0 : (usage.workRequests / planLimits.maxWorkRequests) * 100
      }
    });
  } catch (error) {
    console.error('Błąd pobierania statystyk użycia:', error);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania statystyk' });
  }
});

module.exports = router;

const { prisma } = require('../config/database');
const { SUBSCRIPTION_PLANS: _SUBSCRIPTION_PLANS } = require('../config/stripe');

// Sprawdza czy użytkownik ma aktywną subskrypcję
const checkActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    });

    if (!subscription) {
      return res.status(403).json({
        error: 'Brak aktywnej subskrypcji',
        message: 'Aby korzystać z tej funkcji, musisz mieć aktywną subskrypcję.'
      });
    }

    // Sprawdź czy subskrypcja jest aktywna lub w okresie próbnym
    const now = new Date();
    const isTrialActive = subscription.status === 'TRIAL' &&
                         subscription.trialEndDate &&
                         subscription.trialEndDate > now;
    const isSubscriptionActive = subscription.status === 'ACTIVE';

    if (!isTrialActive && !isSubscriptionActive) {
      return res.status(403).json({
        error: 'Nieaktywna subskrypcja',
        message: 'Twoja subskrypcja wygasła. Odnów ją, aby kontynuować korzystanie z platformy.',
        subscriptionStatus: subscription.status
      });
    }

    // Dodaj informacje o subskrypcji do request
    req.subscription = subscription;
    req.planLimits = subscription.plan;

    next();
  } catch (error) {
    console.error('Błąd sprawdzania subskrypcji:', error);
    res.status(500).json({ error: 'Błąd serwera podczas sprawdzania subskrypcji' });
  }
};

// Sprawdza limit dla konkretnego zasobu
const checkResourceLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const planLimits = req.planLimits;

      if (!planLimits) {
        return res.status(403).json({
          error: 'Brak informacji o planie',
          message: 'Nie można sprawdzić limitów planu.'
        });
      }

      // Sprawdź limit dla danego zasobu
      let currentCount = 0;
      let maxAllowed = 0;
      let resourceName = '';

      switch (resourceType) {
      case 'companies': {
        currentCount = await prisma.company.count({
          where: { createdById: userId }
        });
        maxAllowed = planLimits.maxCompanies;
        resourceName = 'firm';
        break;
      }

      case 'projects': {
        // Zlicz projekty we wszystkich firmach użytkownika
        const userCompanies = await prisma.company.findMany({
          where: { createdById: userId },
          select: { id: true }
        });
        const companyIds = userCompanies.map(c => c.id);

        currentCount = await prisma.project.count({
          where: { companyId: { in: companyIds } }
        });
        maxAllowed = planLimits.maxProjects;
        resourceName = 'projektów';
        break;
      }

      case 'workers': {
        const companies = await prisma.company.findMany({
          where: { createdById: userId },
          select: { id: true }
        });
        const compIds = companies.map(c => c.id);

        currentCount = await prisma.worker.count({
          where: { companyId: { in: compIds } }
        });
        maxAllowed = planLimits.maxWorkers;
        resourceName = 'pracowników';
        break;
      }

      case 'jobOffers': {
        currentCount = await prisma.jobOffer.count({
          where: { createdById: userId, isActive: true }
        });
        maxAllowed = planLimits.maxJobOffers;
        resourceName = 'ogłoszeń o pracę';
        break;
      }

      case 'workRequests': {
        currentCount = await prisma.workRequest.count({
          where: { createdById: userId, isActive: true }
        });
        maxAllowed = planLimits.maxWorkRequests;
        resourceName = 'zleceń pracy';
        break;
      }

      default:
        return res.status(400).json({
          error: 'Nieznany typ zasobu',
          message: 'Nie można sprawdzić limitu dla tego typu zasobu.'
        });
      }

      // -1 oznacza unlimited (plan Enterprise)
      if (maxAllowed !== -1 && currentCount >= maxAllowed) {
        return res.status(403).json({
          error: 'Przekroczono limit planu',
          message: `Osiągnąłeś maksymalną liczbę ${resourceName} (${maxAllowed}) dla Twojego planu. Rozważ upgrade do wyższego planu.`,
          currentCount,
          maxAllowed,
          planName: planLimits.displayName
        });
      }

      // Dodaj informacje o limitach do request
      req.resourceLimits = {
        current: currentCount,
        max: maxAllowed,
        resourceType,
        resourceName
      };

      next();
    } catch (error) {
      console.error('Błąd sprawdzania limitu zasobu:', error);
      res.status(500).json({ error: 'Błąd serwera podczas sprawdzania limitów' });
    }
  };
};

// Sprawdza czy użytkownik ma dostęp do funkcji premium
const checkPremiumFeature = (featureName) => {
  return (req, res, next) => {
    const planLimits = req.planLimits;

    if (!planLimits) {
      return res.status(403).json({
        error: 'Brak informacji o planie',
        message: 'Nie można sprawdzić dostępu do funkcji premium.'
      });
    }

    const hasFeature = planLimits[featureName];

    if (!hasFeature) {
      return res.status(403).json({
        error: 'Funkcja premium niedostępna',
        message: 'Ta funkcja jest dostępna tylko w wyższych planach subskrypcji.',
        requiredFeature: featureName,
        currentPlan: planLimits.displayName
      });
    }

    next();
  };
};

// Pobiera informacje o wykorzystaniu limitów
const getUsageStats = async (userId) => {
  try {
    const userCompanies = await prisma.company.findMany({
      where: { createdById: userId },
      select: { id: true }
    });
    const companyIds = userCompanies.map(c => c.id);

    const [
      companiesCount,
      projectsCount,
      workersCount,
      jobOffersCount,
      workRequestsCount
    ] = await Promise.all([
      prisma.company.count({ where: { createdById: userId } }),
      prisma.project.count({ where: { companyId: { in: companyIds } } }),
      prisma.worker.count({ where: { companyId: { in: companyIds } } }),
      prisma.jobOffer.count({ where: { createdById: userId, isActive: true } }),
      prisma.workRequest.count({ where: { createdById: userId, isActive: true } })
    ]);

    return {
      companies: companiesCount,
      projects: projectsCount,
      workers: workersCount,
      jobOffers: jobOffersCount,
      workRequests: workRequestsCount
    };
  } catch (error) {
    console.error('Błąd pobierania statystyk użycia:', error);
    throw error;
  }
};

module.exports = {
  checkActiveSubscription,
  checkResourceLimit,
  checkPremiumFeature,
  getUsageStats
};

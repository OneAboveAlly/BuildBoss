const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('🌱 Seedowanie planów subskrypcji...');

  // Sprawdź czy plany już istnieją
  const existingPlans = await prisma.subscriptionPlan.findMany();
  if (existingPlans.length > 0) {
    console.log('📋 Plany już istnieją w bazie danych:');
    existingPlans.forEach(plan => {
      console.log(`   - ${plan.displayName} (${plan.name}) - ${(plan.price / 100).toFixed(2)} ${plan.currency}`);
    });
    return;
  }

  // Plan Darmowy
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'free' },
    update: {},
    create: {
      name: 'free',
      displayName: 'Plan Darmowy',
      description: 'Podstawowe funkcje dla małych firm',
      price: 0, // 0.00 PLN
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
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'basic' },
    update: {},
    create: {
      name: 'basic',
      displayName: 'Plan Podstawowy',
      description: 'Idealny dla małych firm budowlanych rozpoczynających działalność',
      price: 2900, // 29.00 PLN
      currency: 'PLN',
      maxCompanies: 1,
      maxProjects: 5,
      maxWorkers: 10,
      maxJobOffers: 3,
      maxWorkRequests: 5,
      maxStorageGB: 1.0,
      hasAdvancedReports: false,
      hasApiAccess: false,
      hasPrioritySupport: false,
      hasCustomBranding: false,
      hasTeamManagement: false,
      isActive: true
    }
  });

  // Plan Pro
  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'pro' },
    update: {},
    create: {
      name: 'pro',
      displayName: 'Plan Pro',
      description: 'Dla rozwijających się firm z większymi potrzebami',
      price: 7900, // 79.00 PLN
      currency: 'PLN',
      maxCompanies: 3,
      maxProjects: 25,
      maxWorkers: 50,
      maxJobOffers: 15,
      maxWorkRequests: 25,
      maxStorageGB: 10.0,
      hasAdvancedReports: true,
      hasApiAccess: false,
      hasPrioritySupport: true,
      hasCustomBranding: false,
      hasTeamManagement: true,
      isActive: true
    }
  });

  // Plan Enterprise
  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'enterprise' },
    update: {},
    create: {
      name: 'enterprise',
      displayName: 'Plan Enterprise',
      description: 'Dla dużych firm z zaawansowanymi wymaganiami',
      price: 19900, // 199.00 PLN
      currency: 'PLN',
      maxCompanies: -1, // unlimited
      maxProjects: -1, // unlimited
      maxWorkers: -1, // unlimited
      maxJobOffers: -1, // unlimited
      maxWorkRequests: -1, // unlimited
      maxStorageGB: 100.0,
      hasAdvancedReports: true,
      hasApiAccess: true,
      hasPrioritySupport: true,
      hasCustomBranding: true,
      hasTeamManagement: true,
      isActive: true
    }
  });

  console.log('✅ Plany subskrypcji zostały utworzone:');
  console.log(`   🆓 ${freePlan.displayName} - ${(freePlan.price / 100).toFixed(2)} ${freePlan.currency}`);
  console.log(`   📦 ${basicPlan.displayName} - ${(basicPlan.price / 100).toFixed(2)} ${basicPlan.currency}`);
  console.log(`   🚀 ${proPlan.displayName} - ${(proPlan.price / 100).toFixed(2)} ${proPlan.currency}`);
  console.log(`   🏢 ${enterprisePlan.displayName} - ${(enterprisePlan.price / 100).toFixed(2)} ${enterprisePlan.currency}`);
}

async function main() {
  try {
    await seedSubscriptionPlans();
    console.log('🎉 Seedowanie zakończone pomyślnie!');
  } catch (error) {
    console.error('❌ Błąd podczas seedowania:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom tylko jeśli plik jest wykonywany bezpośrednio
if (require.main === module) {
  main();
}

module.exports = { seedSubscriptionPlans };

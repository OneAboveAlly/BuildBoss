const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkPlansAdmin() {
  try {
    console.log('🔍 Sprawdzanie użytkowników plansAdmin...');
    
    const plansAdmins = await prisma.plansAdmin.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true
      }
    });

    if (plansAdmins.length === 0) {
      console.log('❌ Brak użytkowników plansAdmin!');
      console.log('💡 Uruchom: node scripts/create-superadmin.js');
    } else {
      console.log(`✅ Znaleziono ${plansAdmins.length} użytkowników plansAdmin:`);
      plansAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Aktywny: ${admin.isActive}`);
        console.log(`   Utworzony: ${admin.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlansAdmin(); 
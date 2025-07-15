const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Sprawdzanie użytkowników SUPERADMIN...');

    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailConfirmed: true,
        createdAt: true
      }
    });

    if (superAdmins.length === 0) {
      console.log('❌ Brak użytkowników z rolą SUPERADMIN!');
      console.log('💡 Uruchom: node scripts/create-superadmin.js');
    } else {
      console.log(`✅ Znaleziono ${superAdmins.length} użytkowników SUPERADMIN:`);
      superAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.firstName} ${admin.lastName})`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Email potwierdzony: ${admin.isEmailConfirmed}`);
        console.log(`   Utworzony: ${admin.createdAt}`);
        console.log('');
      });
    }

    // Sprawdź też wszystkich użytkowników
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailConfirmed: true
      },
      take: 10
    });

    console.log('📋 Ostatni 10 użytkowników:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} (${user.isEmailConfirmed ? 'potwierdzony' : 'niepotwierdzony'})`);
    });

  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin(); 
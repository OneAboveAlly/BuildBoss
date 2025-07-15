const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Tworzenie superadministratora (plansAdmin)...');

    // Dane superadmina
    const email = 'admin@buildboss.pl';
    const password = 'AdminBuildBoss2024!'; // ZMIEŃ TO W PRODUKCJI!
    const firstName = 'Admin';
    const lastName = 'BuildBoss';

    // Sprawdź czy superadmin już istnieje
    const existingAdmin = await prisma.plansAdmin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('❌ Superadmin już istnieje!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      return;
    }

    // Hashuj hasło
    const hashedPassword = await bcrypt.hash(password, 12);

    // Utwórz superadmina
    const superAdmin = await prisma.plansAdmin.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log('✅ Superadmin został utworzony pomyślnie!');
    console.log('📋 Dane logowania:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Hasło: ${password}`);
    console.log(`🆔 ID: ${superAdmin.id}`);
    console.log('⚠️  WAŻNE: Zmień hasło po pierwszym logowaniu!');
    console.log('🌐 Zaloguj się na: http://localhost:3000/login');
  } catch (error) {
    console.error('❌ Błąd podczas tworzenia superadmina:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
typeof require !== 'undefined' && require.main === module && createSuperAdmin();

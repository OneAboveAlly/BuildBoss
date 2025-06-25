const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/password');
require('dotenv').config();

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Tworzenie superadministratora...');

    // Dane superadmina
    const email = 'admin@siteboss.com';
    const password = 'admin123'; // ZMIEŃ TO W PRODUKCJI!
    const firstName = 'Super';
    const lastName = 'Admin';

    // Sprawdź czy superadmin już istnieje
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('❌ Superadmin już istnieje!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Rola: ${existingAdmin.role}`);
      return;
    }

    // Hashuj hasło
    const hashedPassword = await hashPassword(password);

    // Utwórz superadmina
    const superAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'SUPERADMIN',
        isEmailConfirmed: true, // Automatycznie potwierdź email
      },
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

    console.log('✅ Superadmin został utworzony pomyślnie!');
    console.log('📋 Dane logowania:');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Hasło: ${password}`);
    console.log(`👤 Rola: ${superAdmin.role}`);
    console.log(`🆔 ID: ${superAdmin.id}`);
    console.log('');
    console.log('⚠️  WAŻNE: Zmień hasło po pierwszym logowaniu!');
    console.log('🌐 Zaloguj się na: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Błąd podczas tworzenia superadmina:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
createSuperAdmin(); 
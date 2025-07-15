const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function resetAdmins() {
  try {
    console.log('--- USUWANIE WSZYSTKICH ADMINÓW I WIADOMOŚCI ---');
    // Usuń wszystkie wiadomości admina i odpowiedzi
    await prisma.adminMessageReply.deleteMany();
    await prisma.adminMessage.deleteMany();
    // Usuń wszystkich adminów z plansAdmin
    await prisma.plansAdmin.deleteMany();
    // Usuń wszystkich superadminów z user
    await prisma.user.deleteMany({ where: { role: 'SUPERADMIN' } });
    console.log('✅ Usunięto wszystkich adminów i wiadomości.');

    // Tworzenie nowego superadmina
    const email = 'admin@buildboss.pl';
    const password = 'AdminBuildBoss2024!'; // ZMIEŃ TO W PRODUKCJI!
    const firstName = 'Admin';
    const lastName = 'BuildBoss';
    const hashedPassword = await bcrypt.hash(password, 12);
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
    console.log('✅ Nowy superadmin utworzony!');
    console.log('📧 Email:', email);
    console.log('🔑 Hasło:', password);
    console.log('🆔 ID:', superAdmin.id);
    console.log('⚠️  WAŻNE: Zmień hasło po pierwszym logowaniu!');
    console.log('🌐 Zaloguj się na: http://localhost:3000/login');
  } catch (error) {
    console.error('❌ Błąd podczas resetowania adminów:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
typeof require !== 'undefined' && require.main === module && resetAdmins(); 
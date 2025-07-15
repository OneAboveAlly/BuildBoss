const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleJobs = [
  {
    title: 'Murarz z doświadczeniem',
    description: 'Poszukujemy doświadczonego murarza do pracy przy budowie domów jednorodzinnych. Wymagane min. 3 lata doświadczenia w branży. Oferujemy konkurencyjne wynagrodzenie i stabilne zatrudnienie.',
    category: 'MASON',
    type: 'FULL_TIME',
    voivodeship: 'mazowieckie',
    city: 'Warszawa',
    address: 'ul. Budowlana 15',
    salaryMin: 4500,
    salaryMax: 6500,
    currency: 'PLN',
    experience: 'MID',
    requirements: '- Min. 3 lata doświadczenia w murarzystwie\n- Umiejętność czytania planów budowlanych\n- Prawo jazdy kat. B\n- Dyspozycyjność',
    benefits: '- Konkurencyjne wynagrodzenie\n- Praca w stabilnej firmie\n- Możliwość rozwoju zawodowego\n- Dofinansowanie do szkoleń',
    contactEmail: 'praca@budowlanka.pl',
    contactPhone: '+48 123 456 789',
    isActive: true,
    isPublic: true,
    companyName: 'BudowlanKa Sp. z o.o.',
    companyDescription: 'Firma budowlana działająca od 15 lat, specjalizująca się w budowie domów jednorodzinnych.'
  },
  {
    title: 'Elektryk - instalacje elektryczne',
    description: 'Firma elektrotechniczna poszukuje elektryka do wykonywania instalacji elektrycznych w nowych budynkach mieszkalnych. Praca na terenie Krakowa i okolic.',
    category: 'ELECTRICIAN',
    type: 'FULL_TIME',
    voivodeship: 'małopolskie',
    city: 'Kraków',
    salaryMin: 5000,
    salaryMax: 7000,
    currency: 'PLN',
    experience: 'SENIOR',
    requirements: '- Wykształcenie techniczne elektryczne\n- Min. 5 lat doświadczenia\n- Uprawnienia SEP do 1kV\n- Znajomość norm i przepisów',
    benefits: '- Atrakcyjne wynagrodzenie\n- Samochód służbowy\n- Telefon służbowy\n- Elastyczne godziny pracy',
    contactEmail: 'rekrutacja@elektro-krak.pl',
    contactPhone: '+48 987 654 321',
    isActive: true,
    isPublic: true,
    companyName: 'Elektro-Krak Sp. z o.o.',
    companyDescription: 'Specjalistyczna firma elektrotechniczna działająca na rynku krakowskim od 20 lat.'
  },
  {
    title: 'Kierownik budowy - domy mieszkalne',
    description: 'Poszukujemy doświadczonego kierownika budowy do nadzoru nad realizacją projektów budownictwa mieszkaniowego. Wymagane uprawnienia budowlane.',
    category: 'FOREMAN',
    type: 'FULL_TIME',
    voivodeship: 'dolnośląskie',
    city: 'Wrocław',
    salaryMin: 8000,
    salaryMax: 12000,
    currency: 'PLN',
    experience: 'EXPERT',
    requirements: '- Wykształcenie techniczne budowlane\n- Uprawnienia budowlane\n- Min. 10 lat doświadczenia\n- Znajomość programów CAD\n- Umiejętności organizacyjne',
    benefits: '- Wysokie wynagrodzenie\n- Premia za realizację projektów\n- Samochód służbowy\n- Pakiet medyczny\n- Szkolenia zawodowe',
    contactEmail: 'hr@mega-bud.pl',
    contactPhone: '+48 555 777 999',
    isActive: true,
    isPublic: true,
    companyName: 'Mega-Bud Construction',
    companyDescription: 'Wiodący deweloper na rynku wrocławskim, realizujący prestiżowe projekty mieszkaniowe.'
  },
  {
    title: 'Hydraulik - instalacje sanitarne',
    description: 'Oferujemy pracę dla hydraulika przy montażu instalacji sanitarnych w nowych budynkach. Doświadczenie mile widziane, ale nie wymagane.',
    category: 'PLUMBER',
    type: 'FULL_TIME',
    voivodeship: 'śląskie',
    city: 'Katowice',
    salaryMin: 4000,
    salaryMax: 5500,
    currency: 'PLN',
    experience: 'JUNIOR',
    requirements: '- Podstawowa znajomość instalacji sanitarnych\n- Chęć do nauki\n- Dyspozycyjność\n- Prawo jazdy mile widziane',
    benefits: '- Szkolenia na koszt pracodawcy\n- Stabilne zatrudnienie\n- Praca w młodym zespole\n- Możliwość awansu',
    contactEmail: 'praca@hydro-install.pl',
    contactPhone: '+48 666 888 111',
    isActive: true,
    isPublic: true,
    companyName: 'Hydro-Install Sp. z o.o.',
    companyDescription: 'Firma specjalizująca się w montażu nowoczesnych instalacji sanitarnych.'
  },
  {
    title: 'Malarz budowlany - elewacje',
    description: 'Poszukujemy malarza budowlanego do malowania elewacji budynków mieszkalnych. Praca sezonowa od marca do października.',
    category: 'PAINTER',
    type: 'TEMPORARY',
    voivodeship: 'wielkopolskie',
    city: 'Poznań',
    salaryMin: 25,
    salaryMax: 35,
    currency: 'PLN',
    experience: 'MID',
    requirements: '- Min. 2 lata doświadczenia w malarstwie budowlanym\n- Znajomość technik malowania elewacji\n- Brak lęku wysokości\n- Własne podstawowe narzędzia',
    benefits: '- Wynagrodzenie za godzinę\n- Praca w doświadczonym zespole\n- Możliwość pracy przez cały sezon\n- Premie za jakość',
    contactEmail: 'elewacje@color-pro.pl',
    contactPhone: '+48 777 333 555',
    isActive: true,
    isPublic: true,
    companyName: 'Color-Pro Elewacje',
    companyDescription: 'Firma malarska specjalizująca się w odnawianiu elewacji budynków mieszkalnych i użyteczności publicznej.'
  }
];

async function seedJobs() {
  console.log('🌱 Rozpoczynam seedowanie ogłoszeń o pracę...');

  try {
    // Sprawdź czy istnieją już jakieś użytkownicy i firmy
    const users = await prisma.user.findMany();
    const companies = await prisma.company.findMany();

    if (users.length === 0) {
      console.log('❌ Brak użytkowników w bazie. Najpierw utwórz użytkowników.');
      return;
    }

    if (companies.length === 0) {
      console.log('❌ Brak firm w bazie. Najpierw utwórz firmy.');
      return;
    }

    // Usuń istniejące przykładowe ogłoszenia
    const deletedJobs = await prisma.jobOffer.deleteMany({
      where: {
        title: {
          in: sampleJobs.map(job => job.title)
        }
      }
    });
    console.log(`🗑️  Usunięto ${deletedJobs.count} istniejących przykładowych ogłoszeń`);

    // Dla każdego przykładowego ogłoszenia
    for (let i = 0; i < sampleJobs.length; i++) {
      const jobData = sampleJobs[i];

      // Znajdź lub utwórz firmę
      let company = await prisma.company.findFirst({
        where: { name: jobData.companyName }
      });

      if (!company) {
        // Utwórz firmę jeśli nie istnieje
        const randomUser = users[Math.floor(Math.random() * users.length)];
        company = await prisma.company.create({
          data: {
            name: jobData.companyName,
            description: jobData.companyDescription,
            createdById: randomUser.id
          }
        });
        console.log(`🏢 Utworzono firmę: ${company.name}`);
      }

      // Utwórz ogłoszenie o pracę
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const jobOffer = await prisma.jobOffer.create({
        data: {
          title: jobData.title,
          description: jobData.description,
          category: jobData.category,
          type: jobData.type,
          voivodeship: jobData.voivodeship,
          city: jobData.city,
          address: jobData.address,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency,
          experience: jobData.experience,
          requirements: jobData.requirements,
          benefits: jobData.benefits,
          contactEmail: jobData.contactEmail,
          contactPhone: jobData.contactPhone,
          isActive: jobData.isActive,
          isPublic: jobData.isPublic,
          companyId: company.id,
          createdById: randomUser.id,
          // Ustaw różne daty utworzenia dla bardziej realistycznego wyglądu
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // losowo w ciągu ostatniego tygodnia
        }
      });

      console.log(`✅ Utworzono ogłoszenie: ${jobOffer.title} w ${company.name}`);
    }

    const totalJobs = await prisma.jobOffer.count();
    console.log(`🎉 Zakończono seedowanie! Łącznie ogłoszeń w bazie: ${totalJobs}`);

  } catch (error) {
    console.error('❌ Błąd podczas seedowania:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom funkcję jeśli skrypt jest wywołany bezpośrednio
if (require.main === module) {
  seedJobs()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedJobs }; 
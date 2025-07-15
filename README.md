# 🏗️ BuildBoss

**Nowoczesna platforma SaaS dla małych i średnich firm budowlanych**

Kompleksowe rozwiązanie do zarządzania projektami, zespołem, materiałami i dokumentacją budowlaną. Wszystko w jednym miejscu.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://typescriptlang.org/)

## 🚀 Funkcjonalności

### 🏢 Zarządzanie firmą
- ✅ Tworzenie i zarządzanie profilami firm budowlanych
- ✅ Zapraszanie i zarządzanie pracownikami
- ✅ System uprawnień (właściciel/administrator/pracownik)
- ✅ Monitoring aktywności zespołu

### 📋 Projekty i zadania
- ✅ Tablica Kanban z przeciągnij i upuść
- ✅ Kalendarz projektów z widokiem miesięcznym
- ✅ Przypisywanie zadań do pracowników
- ✅ Śledzenie postępów w czasie rzeczywistym
- ✅ System tagów i kategorii

### 🧱 Zarządzanie materiałami
- ✅ Inwentaryzacja materiałów budowlanych
- ✅ Alerty o niskich stanach magazynowych
- ✅ Historia wykorzystania materiałów
- ✅ Kalkulacja kosztów projektów

### 💼 Oferty pracy
- ✅ Publikowanie ogłoszeń o pracę
- ✅ Zarządzanie aplikacjami
- ✅ Formularz kontaktowy dla kandydatów

### 💳 Subskrypcje i płatności
- ✅ Integracja ze Stripe
- ✅ Plany subskrypcyjne (Starter, Professional, Enterprise)
- ✅ Automatyczne fakturowanie
- ✅ Panel administratora subskrypcji

### 📊 Analityka i raporty
- ✅ Dashboard z kluczowymi metrykami
- ✅ Raporty wydajności zespołu
- ✅ Analiza kosztów projektów
- ✅ Eksport danych do PDF/Excel

### 🔒 Bezpieczeństwo i prywatność
- ✅ GDPR compliance
- ✅ Eksport i usuwanie danych osobowych
- ✅ Dwustopniowa autoryzacja (2FA)
- ✅ Szyfrowanie danych wrażliwych

### 🌍 Wielojęzyczność
- ✅ Polski (PL)
- ✅ Angielski (EN)
- ✅ Niemiecki (DE)
- ✅ Ukraiński (UA)

### 📱 Progressive Web App (PWA)
- ✅ Instalacja na urządzeniach mobilnych
- ✅ Tryb offline
- ✅ Powiadomienia push
- ✅ Responsive design

## 🛠️ Technologie

### Backend
- **Node.js + Express** - Serwer HTTP
- **Prisma ORM + PostgreSQL** - Baza danych
- **JWT + Google OAuth** - Autoryzacja
- **Stripe API** - Płatności
- **Socket.io** - Komunikacja w czasie rzeczywistym
- **Nodemailer** - Wysyłanie emaili
- **Jest** - Testy jednostkowe

### Frontend
- **React 18 + TypeScript** - Interfejs użytkownika
- **Vite** - Build tool i dev server
- **TailwindCSS** - Styling
- **React Router** - Routing SPA
- **React Query** - Cache i synchronizacja danych
- **React Hook Form** - Zarządzanie formularzami
- **i18next** - Internacjonalizacja

### DevOps i infrastruktura
- **Docker + Docker Compose** - Konteneryzacja
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy
- **Sentry** - Monitoring błędów

## 📁 Struktura projektu

```
BuildBoss/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Komponenty React
│   │   ├── pages/         # Strony aplikacji
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   └── locales/       # Tłumaczenia
│   └── public/            # Statyczne pliki
├── server/                # Backend Node.js
│   ├── prisma/           # Schema i migracje bazy danych
│   ├── routes/           # Endpointy API
│   ├── middleware/       # Express middleware
│   ├── config/           # Konfiguracja
│   ├── tests/            # Testy jednostkowe
│   └── uploads/          # Przesyłane pliki
├── docs/                 # Dokumentacja
├── deployment-scripts/   # Skrypty deploymentu
└── docker-compose.yml    # Konfiguracja Docker
```

## 🚀 Szybki start

### Wymagania
- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm >= 9.0.0

### Instalacja

1. **Klonowanie repozytorium**
```bash
git clone https://github.com/OneAboveAlly/BuildBoss.git
cd BuildBoss
```

2. **Instalacja zależności**
```bash
npm install
```

3. **Konfiguracja bazy danych**
```bash
# Skopiuj i edytuj pliki środowiskowe
cp server/env.example server/.env
cp client/env.example client/.env

# Skonfiguruj bazę danych
cd server
npx prisma generate
npx prisma db push
```

4. **Uruchomienie aplikacji**
```bash
# Z katalogu głównego
npm start
```

Aplikacja będzie dostępna na:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Docker (alternatywa)

```bash
# Uruchomienie z Docker Compose
docker-compose up -d

# Aplikacja dostępna na http://localhost
```

## ⚙️ Konfiguracja

### Server (.env w katalogu /server)
```env
# Baza danych
DATABASE_URL="postgresql://username:password@localhost:5432/buildboss"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# API URLs
CLIENT_URL="http://localhost:5173"
SERVER_URL="http://localhost:5000"

# Stripe (opcjonalne)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (opcjonalne)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Google OAuth (opcjonalne)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Sentry monitoring (opcjonalne)
SENTRY_DSN="your-sentry-dsn"
```

### Client (.env w katalogu /client)
```env
VITE_API_URL="http://localhost:5000/api"
VITE_SENTRY_DSN="your-sentry-dsn"
```

## 📚 Dokumentacja API

Pełna dokumentacja API dostępna jest pod adresem `/api/docs` po uruchomieniu serwera.

### Główne endpointy:
- `POST /api/auth/login` - Logowanie użytkownika
- `GET /api/companies` - Lista firm
- `GET /api/projects` - Lista projektów
- `GET /api/tasks` - Lista zadań
- `GET /api/materials` - Zarządzanie materiałami
- `GET /api/analytics` - Dane analityczne

## 🧪 Testowanie

```bash
# Testy jednostkowe (backend)
cd server
npm test

# Testy z coverage
npm run test:coverage

# Testy integracyjne
npm run test:integration
```

## 🚀 Deployment

### Produkcja z Docker

```bash
# Build obrazów produkcyjnych
docker-compose -f docker-compose.yml build

# Uruchomienie w trybie produkcyjnym
docker-compose -f docker-compose.yml up -d
```

### Deployment manualny

```bash
# Build frontendu
cd client
npm run build

# Start serwera produkcyjnego
cd ../server
npm run start:prod
```

## 🔧 Dostępne komendy

```bash
# Rozwój
npm start              # Uruchom całą aplikację
npm run dev            # Tryb rozwoju z hot reload

# Build
npm run build          # Build produkcyjny
npm run build:client   # Build tylko frontendu
npm run build:server   # Build tylko backendu

# Baza danych
npm run db:generate    # Generuj klienta Prismy
npm run db:push        # Wypchnij schemat do bazy
npm run db:migrate     # Uruchom migracje
npm run db:studio      # Otwórz Prisma Studio
npm run db:seed        # Seed bazy danych testowymi danymi

# Testy
npm test               # Uruchom testy
npm run test:watch     # Testy w trybie watch
npm run test:coverage  # Testy z pokryciem kodu

# Linting i formatowanie
npm run lint           # Sprawdź kod ESLintem
npm run lint:fix       # Popraw automatyczne błędy
npm run format         # Formatuj kod Prettierem
```

## 🐛 Rozwiązywanie problemów

### Problem: Błąd połączenia z bazą danych
1. Sprawdź czy PostgreSQL jest uruchomiony
2. Zweryfikuj `DATABASE_URL` w `.env`
3. Uruchom `npx prisma db push`

### Problem: Błąd CORS
1. Sprawdź `CLIENT_URL` w konfiguracji serwera
2. Upewnij się, że porty są poprawne

### Problem: Stripe webhooks nie działają
1. Zainstaluj Stripe CLI
2. Uruchom `stripe listen --forward-to localhost:5000/api/webhooks/stripe`

## 📈 Monitoring i metryki

Aplikacja zbiera metryki wydajności i błędów za pomocą:
- **Sentry** - Monitoring błędów i wydajności
- **Custom metrics** - Metryki biznesowe
- **Health checks** - Status aplikacji

Endpoint health check: `GET /api/health`

## 🤝 Wkład w rozwój

1. Fork repozytorium
2. Stwórz branch dla nowej funkcjonalności (`git checkout -b feature/amazing-feature`)
3. Commit zmian (`git commit -m 'Add amazing feature'`)
4. Push do branch (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📄 Licencja

Ten projekt jest licencjonowany na [MIT License](LICENSE).

## 🆘 Wsparcie

Jeśli napotkasz problemy lub masz pytania:

1. Sprawdź [dokumentację](docs/)
2. Przeszukaj [Issues](https://github.com/OneAboveAlly/BuildBoss/issues)
3. Stwórz nowy [Issue](https://github.com/OneAboveAlly/BuildBoss/issues/new)

## 🎯 Roadmapa

### Q1 2025
- [ ] Aplikacja mobilna (React Native)
- [ ] Integracja z popularnymi narzędziami CAD
- [ ] Advanced analytics z AI insights

### Q2 2025
- [ ] API dla integracji z systemami ERP
- [ ] Marketplace dla materiałów budowlanych
- [ ] Video calls dla zespołów

---

**BuildBoss** - Twój partner w cyfrowej transformacji branży budowlanej 🏗️ 
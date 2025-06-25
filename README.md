# 🏗️ SiteBoss

Kompleksowe rozwiązanie SaaS dla małych ekip budowlanych. Zarządzaj zadaniami, dokumentami, fakturami i zespołem w jednym miejscu.

## 🚀 Etap 1 - UKOŃCZONY ✅

### ✅ Backend (Node.js + Express + Prisma)
- ✅ Struktura projektu
- ✅ Konfiguracja Express z middleware
- ✅ Modele Prisma (User, Company, Worker)
- ✅ Konfiguracja PostgreSQL
- ✅ Podstawowe endpointy API (przygotowane)

### ✅ Frontend (React + Vite + TailwindCSS)
- ✅ Struktura projektu React z TypeScript
- ✅ Konfiguracja TailwindCSS
- ✅ React Router setup
- ✅ AuthContext i zarządzanie stanem
- ✅ Strony: Home, Login, Register, Dashboard
- ✅ Komponenty: Layout, Header, Sidebar, ProtectedRoute
- ✅ Konfiguracja i18n (PL/EN)

## 🛠️ Technologie

**Backend:**
- Node.js + Express
- Prisma ORM + PostgreSQL
- JWT Authentication
- Bcrypt, Helmet, CORS
- Nodemailer, Passport (Google OAuth)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router (routing)
- Axios (HTTP client)
- i18next (internationalization)

## 📁 Struktura projektu

```
SiteBoss/
├── server/                 # Backend
│   ├── prisma/            # Database schema
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   ├── uploads/           # File uploads
│   └── server.js          # Main server file
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── i18n/          # Internationalization
│   └── public/            # Static files
├── agent_config.md        # Agent configuration
├── copilot_instructions.md # Project instructions
└── README.md              # This file
```

## 🚀 Uruchamianie projektu

### Opcja 1: Szybkie uruchomienie (zalecane)
```bash
# W katalogu głównym projektu
npm install
npm start
```

### Opcja 2: Uruchomienie ręczne
```bash
# Terminal 1 - Server (backend)
cd server
npm install
npm run dev

# Terminal 2 - Client (frontend)
cd client
npm install
npm run dev
```

## 🛠️ Dostępne komendy

```bash
# Uruchomienie całego projektu
npm start

# Uruchomienie tylko frontendu
npm run start:client

# Uruchomienie tylko backendu
npm run start:server

# Instalacja zależności
npm run install

# Build produkcyjny
npm run build

# Baza danych
npm run db:generate    # Generuj klienta Prismy
npm run db:push        # Wypchnij zmiany do bazy
npm run db:migrate     # Migracje
npm run db:studio      # Studio Prismy
```

## 🔧 Konfiguracja

### Wymagania
- Node.js >= 18.0.0
- PostgreSQL
- npm >= 9.0.0

### Zmienne środowiskowe

#### Server (.env w katalogu /server)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/siteboss"
JWT_SECRET="your-jwt-secret"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"

# Opcjonalne - płatności Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Opcjonalne - email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"

# Opcjonalne - Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Client (.env w katalogu /client)
```env
VITE_API_URL="http://localhost:5000/api"
```

## 📚 Funkcjonalności

- ✅ Zarządzanie firmami budowlanymi
- ✅ Zapraszanie i zarządzanie pracownikami
- ✅ Projekty i zadania w systemie Kanban
- ✅ Materiały budowlane z alertami stanów
- ✅ System uprawnień (właściciel/pracownik)
- ✅ Subskrypcje i płatności (Stripe)
- ✅ Publiczne ogłoszenia o pracę
- ✅ Wielojęzyczność (PL, EN, DE, UA)
- ✅ Responsive design

## 🐛 Rozwiązywanie problemów

### Problem: "npm start" zwraca błąd "Missing script"
**Rozwiązanie:** Upewnij się, że jesteś w katalogu głównym projektu (nie w /client ani /server).

### Problem: Błąd połączenia z bazą danych
**Rozwiązanie:** 
1. Sprawdź czy PostgreSQL jest uruchomiony
2. Zweryfikuj `DATABASE_URL` w pliku `.env`
3. Uruchom `npm run db:generate` i `npm run db:push`

### Problem: Utrata uprawnień po subskrypcji
**Rozwiązanie:** Odśwież stronę lub przejdź do Dashboard - system automatycznie odświeży dane użytkownika.

## 🔗 Porty
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Prisma Studio: http://localhost:5555 (gdy uruchomione)

## 📞 Wsparcie
W razie problemów skontaktuj się z zespołem rozwoju.

## 🎯 Następne kroki (Etap 2)

W następnym chacie będziemy implementować:
- ✅ Pełną autoryzację (JWT + Google OAuth)
- ✅ API endpoints dla auth
- ✅ Email confirmation
- ✅ Middleware autoryzacji
- ✅ Testy podstawowych funkcji

## 📝 Notatki

- Projekt używa PowerShell (Windows)
- Komendy używają `;` zamiast `&&`
- Backend na porcie 5000, Frontend na porcie 3000
- Wszystkie błędy TypeScript naprawione
- TailwindCSS skonfigurowany z custom kolorami

## 🤖 Status agenta

**Chat #1 - UKOŃCZONY** ✅
- Etap 1: Konfiguracja projektu ✅
- Podstawy Etapu 2: Przygotowane ✅

**Następny chat:** Implementacja autoryzacji i API endpoints 
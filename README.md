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

## 🚀 Jak uruchomić

### Wymagania
- Node.js 18+
- PostgreSQL 14+
- npm lub yarn

### Backend
```bash
cd server
npm install
# Skopiuj env.example do .env i skonfiguruj
cp env.example .env
# Skonfiguruj bazę danych w .env
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend
```bash
cd client
npm install
# Skopiuj env.example do .env
cp env.example .env
npm run dev
```

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
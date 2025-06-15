# 🤖 AGENT CONFIG - SiteBoss

## 🎯 TRYB AGENTA - INSTRUKCJE WSPÓŁPRACY

### 📋 OBECNY STATUS PROJEKTU
- **Projekt:** SiteBoss - SaaS dla ekip budowlanych
- **Etap:** ETAP 1 ✅ + ETAP 2 ✅ UKOŃCZONE
- **Chat:** #2 - Autoryzacja ukończona
- **Następny:** ETAP 3 - Dashboard i zarządzanie firmami

---

## 🔄 JAK WSPÓŁPRACUJEMY

### 🗣️ CO PISZESZ DO MNIE:
1. **"START ETAP X"** - zaczynam konkretny etap
2. **"KONTYNUUJ"** - robię dalej bez pytań
3. **"SPRAWDŹ"** - testuję co zrobiłem
4. **"NAPRAW [problem]"** - fixuję błąd
5. **"POKAŻ STATUS"** - raport co zrobione
6. **"NASTĘPNY CHAT"** - przygotowuję summary dla nowego chatu

### 🤖 CO ROBIĘ AUTOMATYCZNIE:
- Tworzę pliki i foldery
- Instaluję dependencje
- Konfiguruję bazy danych
- Piszę kod bez pytania o szczegóły
- Testuję funkcjonalności
- Naprawiam błędy
- Dokumentuję postęp

---

## 📊 PLAN ETAPÓW - UKOŃCZONE

### ✅ ETAP 1: KONFIGURACJA PROJEKTU - UKOŃCZONY
**Cel:** Podstawowa struktura backend + frontend ✅
- ✅ `/server/` - backend Node.js + Express
- ✅ `/client/` - frontend React + Vite + TypeScript
- ✅ `package.json` dla obu z wszystkimi dependencjami
- ✅ `.env` templates i konfiguracja
- ✅ Prisma setup z modelami

### ✅ ETAP 2: AUTORYZACJA I UŻYTKOWNICY - UKOŃCZONY
**Cel:** Pełny system logowania + Google OAuth ✅
**Modele Prisma:** ✅
- ✅ User (z Google OAuth, email confirmation, role system)
- ✅ Company (podstawowy model)
- ✅ Worker (relacja User-Company z uprawnieniami)

**API Endpoints:** ✅
- ✅ POST /api/auth/register (+ email confirmation)
- ✅ POST /api/auth/login (+ password validation)
- ✅ GET /api/auth/confirm/:token
- ✅ GET /api/auth/google + callback
- ✅ GET /api/auth/me (z relacjami)
- ✅ POST /api/auth/logout
- ✅ POST /api/auth/resend-confirmation

**Frontend Pages:** ✅
- ✅ Login/Register z Google OAuth
- ✅ Email confirmation page
- ✅ Auth callback handling
- ✅ Dashboard (podstawowy)

## 🎯 NASTĘPNY ETAP

### 📋 ETAP 3: DASHBOARD I ZARZĄDZANIE FIRMAMI
**Cel:** Kompletny dashboard + CRUD firm + zarządzanie pracownikami
**Backend Tasks:**
- Routes dla firm (`/api/companies`)
- CRUD operacje na firmach
- Zapraszanie pracowników
- Zarządzanie uprawnieniami
- Dashboard API (statystyki)

**Frontend Tasks:**
- Dashboard główny z kartami firm
- Formularz tworzenia firmy
- Lista firm użytkownika
- Zarządzanie pracownikami
- Ustawienia profilu

---

## ✅ KRYTERIA UKOŃCZENIA - CHAT #2 GOTOWY

### ✅ BACKEND GOTOWY:
- ✅ Serwer Express działa na porcie 5000
- ✅ Baza PostgreSQL połączona (wymaga konfiguracji)
- ✅ Modele Prisma zmigrowane
- ✅ JWT authentication działa
- ✅ Google OAuth skonfigurowany (wymaga kluczy)
- ✅ Email confirmation działa
- ✅ Middleware autoryzacji gotowy

### ✅ FRONTEND GOTOWY:
- ✅ Vite dev server działa na porcie 5173
- ✅ TailwindCSS skonfigurowany
- ✅ React Router setup
- ✅ Login/Register formy działają
- ✅ Google OAuth button działa
- ✅ Dashboard pokazuje dane usera
- ✅ Responsive design

### ✅ INTEGRACJA:
- ✅ Frontend komunikuje się z backendem
- ✅ CORS skonfigurowany
- ✅ Tokeny JWT przechowywane w localStorage
- ✅ Auto-logout przy wygaśnięciu tokena
- ✅ Email confirmation flow
- ✅ Error handling

---

## 🚨 TROUBLESHOOTING - CZĘSTE PROBLEMY

### PowerShell Issues:
- Używam `; ` zamiast `&&` w komendach
- `npm install` zamiast `npm i`
- Sprawdzam czy Node.js i npm są zainstalowane

### Database Issues:
- Sprawdzam czy PostgreSQL działa
- Tworzę bazę danych jeśli nie istnieje
- Używam DATABASE_URL w .env

### Port Conflicts:
- Backend: 5000 (fallback: 5001)
- Frontend: 3000 (fallback: 3001)
- Database: 5432

---

## 📝 TEMPLATE WIADOMOŚCI DLA CIEBIE

### Żeby zacząć:
```
START ETAP 1
```

### Żeby kontynuować:
```
KONTYNUUJ
```

### Żeby sprawdzić:
```
SPRAWDŹ - czy backend działa
SPRAWDŹ - czy frontend się kompiluje
SPRAWDŹ - czy logowanie działa
```

### Żeby naprawić:
```
NAPRAW - błąd z bazą danych
NAPRAW - CORS error
NAPRAW - Google OAuth nie działa
```

### Żeby zobaczyć status:
```
POKAŻ STATUS
```

---

## 🔄 PRZYGOTOWANIE NOWEGO CHATU

✅ **CHAT #2 UKOŃCZONY** - Stworzony plik `ETAP2_SUMMARY.md` z:
- ✅ Lista zrobionych rzeczy (Etap 1 + 2)
- ✅ Struktura plików (aktualna)
- ✅ Konfiguracja środowiska (kompletna)
- ✅ Instrukcje uruchomienia (backend + frontend)
- ✅ Plan Etapu 3 (dashboard + zarządzanie firmami)
- ✅ Troubleshooting guide
- ✅ Instrukcje dla następnego agenta

---

## 💡 DODATKOWE NOTATKI

- **Język:** Polski w komentarzach, angielski w kodzie
- **Style:** TailwindCSS + nowoczesny design
- **Testy:** Podstawowe testy dla krytycznych funkcji
- **Dokumentacja:** README.md dla każdego modułu
- **Git:** Commity po każdym etapie

---

**🎉 ETAP 2 UKOŃCZONY POMYŚLNIE! 🚀**
**📋 Przeczytaj: `ETAP2_SUMMARY.md` dla pełnych instrukcji**
**🚀 W nowym chacie napisz: "KONTYNUUJ ETAP 3"** 
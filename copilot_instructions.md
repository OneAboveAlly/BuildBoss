# Copilot Instructions – SiteBoss - //TERMINAL TO POWERSHELL WIEC NIE DZIALAJA AMPERSANTY &&

## 🎯 Cel projektu
Stworzyć pełnoprawną aplikację SaaS dla małych ekip budowlanych (do 10 osób) z obsługą użytkowników, firm, zadań, dokumentów, materiałów, faktur, ogłoszeń o pracę, subskrypcji i paneli (boss/superadmin).

Technologie: React, Vite, TailwindCSS, Node.js, Express, Prisma, PostgreSQL, JWT, Google OAuth, Stripe, PayPal, Przelewy24.

---

## 🧱 Etap 1: Konfiguracja projektu
1. Utwórz backend (Node.js + Express):
   - folder `/server`
   - zainstaluj Express, dotenv, cors, prisma, bcrypt, jsonwebtoken, nodemailer, passport-google-oauth20
2. Utwórz frontend (React + Vite):
   - folder `/client`
   - TailwindCSS, react-router, axios, i18next
3. Zainicjuj Prisma i PostgreSQL:
   - `npx prisma init`
   - połączenie z lokalną bazą PostgreSQL lub z `.env`

---

## 🔐 Etap 2: Autoryzacja i użytkownicy
1. `User` model w Prisma:
   - id, email, password (hashed), role ("superadmin" | "boss" | "worker"), isEmailConfirmed, confirmationToken, createdAt
2. Endpointy:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `GET /api/auth/confirm/:token`
   - `GET /api/auth/google`
3. Hash hasła (bcrypt), generowanie JWT, middleware do ochrony tras
4. Email z linkiem aktywacyjnym (Nodemailer / Resend)

---

## 🏗️ Etap 3: Firma i pracownicy
1. `Company` model:
   - id, name, nip, address, phone, createdByUserId, createdAt
2. `Worker` model:
   - userId, companyId, status ("invited" | "active"), invitedAt
3. Endpointy:
   - `POST /api/company`
   - `POST /api/company/invite`
   - `GET /api/company/:id/users`

---

## 📋 Etap 4: Zadania
1. `Task` model:
   - title, description, status, deadline, priority, assignedToId, createdById
2. Endpointy:
   - `POST /api/tasks`, `GET /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
3. Komentarze opcjonalne (model `Comment` z `taskId`)

---

## 📁 Etap 5: Dokumenty
1. `Document` model:
   - title, type, fileUrl, uploadedById, companyId, createdAt
2. Endpointy:
   - `POST /api/documents/upload`
   - `GET /api/documents`
   - Obsługa uploadu i podglądu PDF
   - Wersjonowanie dokumentów (model DocumentVersion)

---

## 🧾 Etap 6: Faktury
1. `Invoice` model:
   - clientName, items[], total, pdfUrl, createdById
2. Endpointy:
   - `POST /api/invoices/create`
   - Generowanie PDF (np. pdfkit)
   - Eksport do CSV / Excel
   - Wysyłka e-mail faktury (opcjonalnie)

---

## 🧱 Etap 7: Magazyn / Materiały
1. `Material` model:
   - name, quantity, location, assignedProjectId
2. Endpointy:
   - `POST /api/materials`
   - `GET /api/materials`
   - Alert przy niskim stanie

---

## 💼 Etap 8: Ogłoszenia o pracę i zlecenia
1. `JobOffer`, `JobApplication`, `WorkRequest` modele
2. Publiczne API:
   - `GET /api/jobs`, `GET /api/jobs/:id`, `POST /api/jobs/:id/apply`
   - `GET /api/requests`, `POST /api/requests`
3. Wewnętrzne API:
   - `POST /api/jobs`, `GET /api/jobs/:id/applications`
4. Kategorie ogłoszeń:
   - „Szukam pracownika”, „Szukam pracy”, „Zlecenie pracy”
5. Lokalizacja:
   - wybór województwa, miasta, kraju
   - integracja z API adresowym (np. Google Places, Nominatim, OpenCage)
6. Mapa lokalizacji (np. leaflet.js, react-leaflet)

---

## 💬 Etap 9: Wiadomości (messenger ogłoszeń)
- Model `Message`: senderId, receiverId, content, jobId/requestId, timestamp
- API:
  - `GET /api/messages?thread=xxx`
  - `POST /api/messages`
- Obsługa powiadomień przy nowej wiadomości

---

## 💳 Etap 10: Subskrypcje
1. Stripe / PayPal / Przelewy24 integracja
2. `Subscription` model:
   - userId, planType, status, startDate, endDate
3. Webhooki + aktualizacja kont
4. Endpoint: `/api/subscription/status`, `/api/subscription/cancel`

---

## 📊 Etap 11: Dashboardy
- Boss: aktywność, liczba pracowników, zadania, faktury
- Superadmin: lista firm, użytkowników, statystyki, kontrola planów

---

## 🌍 Etap 12: Tłumaczenia (i18n)
- i18next na frontendzie i backendzie
- Przełącznik języka
- Terms of Service, RODO i Privacy po polsku, angielsku, niemiecku

---

## 🔒 Etap 13: Bezpieczeństwo i DevOps
- JWT z refresh tokenem
- HTTPS + Nginx
- Certbot (auto SSL)
- Backupy PostgreSQL (skrypt cron)
- PM2 do uruchamiania backendu
- Git deploy + SSH pull + Prisma deploy + restart pm2

---

## 📃 Etap 14: Terms & RODO
- Pliki statyczne HTML lub markdown z Terms, Privacy i RODO
- Zgoda checkboxem przy rejestracji
- Endpoints do pobrania/usunięcia danych (RODO compliance)

---

## 🌟 Etap 15: Dodatki produkcyjne

### Tryb offline / PWA:
- Service worker + cache + fallback UI w React
- Synchronizacja lokalnych zadań/dokumentów po reconnect

### Uprawnienia użytkowników:
- Właściwości `canEdit`, `canView`, `canManageFinance` w modelu Worker
- Middleware sprawdzające prawa dostępu do endpointów

### Import / Eksport danych:
- Eksport CSV / Excel (zadania, faktury, dokumenty)
- Import użytkowników lub dokumentów z CSV

### Wyszukiwarka i tagi:
- `GET /api/documents?search=&tag=`
- Model `Tag`, wiele tagów do zadania, dokumentu

### Ustawienia konta:
- Edycja emaila, hasła, języka interfejsu, logo firmy, dane kontaktowe

### Raporty PDF i CSV:
- `GET /api/reports` – ilość zadań, czas pracy, kosztorysy, aktywność

### System aktualizacji (Changelog):
- Model `ChangelogEntry`, lista aktualizacji + dashboard z bannerem
- API: `GET /api/changelog`

### FAQ / Pomoc / Kontakt:
- Panel pomocowy z kategoriami, wyszukiwarką i formularzem
- Model `HelpArticle`

### Integracje (np. GDrive):
- OAuth do Google Drive
- Przesyłanie plików do folderów firmowych przez API

### Powiadomienia systemowe:
- Model `Notification`: userId, type, message, isRead, createdAt
- Panel powiadomień (frontend + badge + popup)
- Typy: nowe zadanie, dokument, wiadomość, nowy kandydat, nowa subskrypcja

🚀 Etap 16: Funkcje zaawansowane / premiumDynamiczne role i uprawnienia:Model Role + Permission
Możliwość tworzenia ról z zestawami praw (np. "księgowa", "kierownik")
Interfejs do zarządzania dostępem per firma
Dwuskładnikowe logowanie (2FA):Google Authenticator (TOTP)
Ustawienie z poziomu konta
Kod zapasowy / backupowy do odzyskiwania
System zgłaszania błędów i sugestii:Formularz: typ, opis, zrzut ekranu (opcjonalnie)
Model Feedback z kategorią (bug/sugestia)
Dashboard dla superadmina do podglądu
Obsługa stref czasowych:Wybór strefy czasowej przez użytkownika (Europe/Warsaw itd.)
Konwersja dat w zadaniach i dokumentach
Powiadomienia SMS:Integracja z Twilio, SMSAPI lub inna usługa
Szablony SMS: przypomnienia o zadaniach, nowe faktury, wiadomości
Panel testowania SMSów dla bossa
Tryb demo:Użytkownik demo_user z ograniczonymi uprawnieniami
Przycisk „Wypróbuj bez rejestracji”
Dane czyszczone automatycznie (np. codziennie przez cron)
Przeniesienie właściciela firmy / zamknięcie konta:Panel szefa z opcją przekazania konta
Możliwość dezaktywacji firmy / konta z opcją reaktywacji
Statystyki platformy (dla superadmina):Nowe firmy / użytkownicy dziennie
Użytkownicy aktywni / nieaktywni
Najczęściej używane moduły
Panel statystyk aplikacji
Obsługa faktur wielojęzycznych / walutowych:Faktura po PL/EN/UA w zależności od ustawień firmy
Waluta: PLN / EUR / USD w zależności od lokalizacji
System onboardingowy:Modal/wizard krok po kroku: Dodaj firmę → Dodaj pracownika → Dodaj zadanie
Zapisywanie stanu progresu
Wskazówki narzędziowe (tooltipy, onboarding UI)
OCR dla faktur i skanów:Upload zdjęcia/skanu → rozpoznanie danych (OCR)
Wstępne uzupełnienie pól (np. z dokumentów klientów)
OpenCV / Tesseract.js jako silnik
Każdy etap może być realizowany osobno. Jeśli się wykrzaczy, opisz błąd i wykonaj poprawkę zgodnie z logiką działania aplikacji.
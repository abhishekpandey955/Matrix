# MediCare — Online Healthcare Management System

A full-stack web application for managing healthcare services built for Galgotias University.

Patients find doctors, book appointments, and view prescriptions.  
Doctors manage availability, appointments, and write prescriptions.  
Admins approve doctor accounts, manage appointments, and monitor statistics.

> **Galgotias University Project** — Built by Abhishek Pandey and team.

---

## 📁 Project Structure

```
Medicare/
├── Frontend/    ← React web app  (TanStack Start, TypeScript, Tailwind CSS v4, Bun)
└── Backend/     ← Java Spring Boot REST API + PostgreSQL
```

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16 with Flyway migrations |
| Auth | BCrypt password hashing + signed JWT tokens |
| API Docs | Swagger UI / OpenAPI |
| Build | Maven |

### Frontend
| Layer | Technology |
|---|---|
| Framework | TanStack Start (SSR + file-based routing) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| Data Fetching | TanStack Query |
| Testing | Vitest + Testing Library |
| Package Manager | Bun |

---

## 🚀 Running Locally — Step by Step

> You need **two terminals** — one for the Backend, one for the Frontend.

---

### Prerequisites — Install These First

#### 1. Install Docker
```sh
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-plugin -y

# Add yourself to the docker group (so you don't need sudo every time)
sudo usermod -aG docker $USER
newgrp docker    # apply group without logging out

# Verify
docker --version
```

#### 2. Install Node.js 22 via nvm
```sh
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

# Install Node 22
nvm install 22
nvm use 22
node --version   # should show v22.x.x
```

#### 3. Install Bun
```sh
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version    # should show 1.x.x
```

#### 4. Install Java 21 (only needed if running without Docker)
```sh
sudo apt install openjdk-21-jdk -y
java -version
```

---

### Terminal 1 — Start the Backend

```sh
# 1. Go to the backend api-server folder
cd Medicare/Backend/artifacts/api-server

# 2. Create your .env file (only needed once)
cp .env.example .env

# 3. Open .env and fill in your values
nano .env
```

Your `.env` should look like this:
```env
DB_PASSWORD=choose-any-strong-password
JWT_SECRET=choose-a-random-string-at-least-32-characters-long
BOOTSTRAP_ADMIN_EMAIL=admin@medicare.com
BOOTSTRAP_ADMIN_PASSWORD=Admin@12345
BOOTSTRAP_ADMIN_NAME=System Administrator
CORS_ALLOWED_ORIGINS=http://localhost:8080
```

> **Tip:** Generate a strong JWT secret with:
> ```sh
> openssl rand -base64 48
> ```

```sh
# 4. Start the backend (API + PostgreSQL database together)
docker compose up --build
```

Wait until you see:
```
Started MedicareApplication in X.XXX seconds
```

✅ **Backend is running at:** `http://localhost:8090/api`  
📖 **Swagger UI:** `http://localhost:8090/api/swagger-ui.html`

---

### Terminal 2 — Start the Frontend

```sh
# 1. Go to the frontend folder
cd Medicare/Frontend

# 2. Load bun and node into the terminal (if not already in .bashrc)
source ~/.bashrc

# 3. Install dependencies (only needed once or after adding new packages)
bun install

# 4. Check your .env is correct
cat .env
# Should show: VITE_API_BASE_URL=http://localhost:8090/api

# 5. Start the development server
bun run dev
```

✅ **Frontend is running at:** `http://localhost:8080`

---

### Verify Everything Works

Open your browser and go to: **http://localhost:8080**

Login with your admin credentials you set in `.env`:
- **Email**: the `BOOTSTRAP_ADMIN_EMAIL` you set
- **Password**: the `BOOTSTRAP_ADMIN_PASSWORD` you set

Test the API directly:
```sh
# Should return a list of doctors (empty at first)
curl http://localhost:8090/api/doctors/search?size=10
```

---

## 🗺️ Features

| Role | What they can do |
|---|---|
| **Patient** | Register, search doctors by specialty/name, book appointments, view prescriptions, update profile |
| **Doctor** | Register (pending admin approval), set availability, manage appointments, write prescriptions |
| **Admin** | Approve/reject doctors, manage all appointments, view system-wide statistics |

---

## 🔌 API Endpoints

All routes are prefixed with `/api`. Full docs at `http://localhost:8090/api/swagger-ui.html`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register/patient`, `POST /auth/register/doctor`, `POST /auth/login` |
| Patient | `GET/PATCH /patients/me`, appointments & prescriptions |
| Doctor | Search, profile, availability management |
| Appointments | Book, cancel, check availability |
| Prescriptions | Create (doctor only, after completed visit) |
| Admin | Doctor approvals, appointment management, statistics |

---

## 🔐 Security Notes

- Passwords hashed with **BCrypt** — never stored plain text
- JWT tokens kept **in memory** on the frontend — never in localStorage
- **CORS** restricted to the exact frontend origin
- All credentials via **environment variables** — nothing hardcoded
- Never commit your `.env` file

---

## 🧪 Running Tests

```sh
# Backend tests
cd Backend
mvn -f artifacts/api-server/pom.xml test

# Frontend tests
cd Frontend
bun run test
```

---

## 📂 Code Layout

```
Backend/artifacts/api-server/src/main/java/com/medicare/
├── auth/          # Login, registration, JWT
├── config/        # Security, CORS, data source
├── doctor/        # Doctor profile, availability, search
├── patient/       # Patient profile, appointments, prescriptions
├── appointment/   # Booking logic
├── admin/         # Admin dashboard endpoints
└── common/        # Shared DTOs, exceptions

Frontend/src/
├── components/    # Header, footer, shared UI
├── hooks/         # Custom React hooks
├── lib/           # API client, auth context, utilities
├── routes/        # Pages (TanStack file-based routing)
└── styles.css     # Global styles & Tailwind theme
```

# MediCare — Online Healthcare Management System

A full-stack web application for managing healthcare services built for Galgotias University.

Patients find doctors, book appointments, and view prescriptions.  
Doctors manage availability, appointments, and write prescriptions.  
Admins approve doctor accounts, manage appointments, and monitor statistics.

> **Galgotias University Project** — Built by TEAM MATRIX.

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

### ✅ Prerequisites — Install These First

---

#### 🐧 Linux (Ubuntu / Debian)

**1. Install Docker**
```sh
sudo apt update
sudo apt install docker.io docker-compose-plugin -y

# Add yourself to the docker group (avoids sudo every time)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

**2. Install Node.js 22 via nvm**
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use 22
node --version   # v22.x.x
```

**3. Install Bun**
```sh
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version    # 1.x.x
```

**4. Install Java 21** *(only needed if running backend without Docker)*
```sh
sudo apt install openjdk-21-jdk -y
java -version
```

---

#### 🍎 macOS

**1. Install Docker**

Download and install **Docker Desktop for Mac** from:  
👉 https://www.docker.com/products/docker-desktop/

Then verify:
```sh
docker --version
docker compose version
```

**2. Install Node.js 22 via nvm**
```sh
# Install nvm (zsh is default on modern macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc        # or ~/.bash_profile if using bash

nvm install 22
nvm use 22
node --version   # v22.x.x
```

**3. Install Bun**
```sh
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc        # or ~/.bash_profile
bun --version    # 1.x.x
```

**4. Install Java 21** *(only needed if running backend without Docker)*
```sh
# Using Homebrew (recommended)
brew install openjdk@21

# Add to PATH (also add this line to your ~/.zshrc)
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"

java -version
```

---

#### 🪟 Windows

> **Recommended:** Use **Windows Terminal** + **PowerShell**.  
> All commands below run in **PowerShell** unless noted.

**1. Install Docker Desktop**

Download and install **Docker Desktop for Windows** from:  
👉 https://www.docker.com/products/docker-desktop/

Enable **WSL 2 backend** during installation (recommended).

```powershell
# Verify in PowerShell
docker --version
docker compose version
```

**2. Install Node.js 22 via nvm-windows**

Download the nvm-windows installer from:  
👉 https://github.com/coreybutler/nvm-windows/releases

Then in PowerShell:
```powershell
nvm install 22
nvm use 22
node --version   # v22.x.x
```

**3. Install Bun**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"

# Restart PowerShell, then verify
bun --version    # 1.x.x
```

**4. Install Java 21** *(only needed if running backend without Docker)*

Option A — using winget:
```powershell
winget install EclipseAdoptium.Temurin.21.JDK

# Open a new terminal, then verify
java -version
```

Option B — download the installer manually:  
👉 https://adoptium.net/temurin/releases/?version=21

**5. Install Git** *(if not already installed)*
```powershell
winget install Git.Git
# Or download from https://git-scm.com/download/win
```

---

### Terminal 1 — Start the Backend

#### 🐧 Linux / 🍎 macOS
```sh
# 1. Go to the backend api-server folder
cd Medicare/Backend/artifacts/api-server

# 2. Create your .env file (only needed once)
cp .env.example .env

# 3. Open .env and fill in your values
nano .env          # or: code .env  (VS Code)
```

#### 🪟 Windows (PowerShell)
```powershell
# 1. Go to the backend api-server folder
cd Medicare\Backend\artifacts\api-server

# 2. Create your .env file (only needed once)
Copy-Item .env.example .env

# 3. Open .env in Notepad (or any editor)
notepad .env       # or: code .env  (VS Code)
```

---

Your `.env` should look like this *(same content on all platforms)*:
```env
DB_PASSWORD=choose-any-strong-password
JWT_SECRET=choose-a-random-string-at-least-32-characters-long
BOOTSTRAP_ADMIN_EMAIL=admin@medicare.com
BOOTSTRAP_ADMIN_PASSWORD=Admin@12345
BOOTSTRAP_ADMIN_NAME=System Administrator
CORS_ALLOWED_ORIGINS=http://localhost:8080
```

> **Tip — Generate a strong JWT secret:**
>
> **Linux / macOS:**
> ```sh
> openssl rand -base64 48
> ```
>
> **Windows (PowerShell):**
> ```powershell
> [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
> ```

---

#### Start the Backend (all platforms — same command)
```sh
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

#### 🐧 Linux
```sh
# 1. Go to the frontend folder
cd Medicare/Frontend

# 2. Reload shell config (if bun/nvm not loaded)
source ~/.bashrc

# 3. Install dependencies (only needed once)
bun install

# 4. Check your .env is correct
cat .env
# Should show: VITE_API_BASE_URL=http://localhost:8090/api

# 5. Start the dev server
bun run dev
```

#### 🍎 macOS
```sh
# 1. Go to the frontend folder
cd Medicare/Frontend

# 2. Reload shell config
source ~/.zshrc        # or ~/.bash_profile

# 3. Install dependencies (only needed once)
bun install

# 4. Check your .env is correct
cat .env
# Should show: VITE_API_BASE_URL=http://localhost:8090/api

# 5. Start the dev server
bun run dev
```

#### 🪟 Windows (PowerShell)
```powershell
# 1. Go to the frontend folder
cd Medicare\Frontend

# 2. Install dependencies (only needed once)
bun install

# 3. Check your .env is correct
Get-Content .env
# Should show: VITE_API_BASE_URL=http://localhost:8090/api

# 4. Start the dev server
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

**Linux / macOS:**
```sh
curl http://localhost:8090/api/doctors/search?size=10
```

**Windows PowerShell:**
```powershell
Invoke-RestMethod "http://localhost:8090/api/doctors/search?size=10"
```

**Windows (Git Bash / WSL):**
```sh
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

#### 🐧 Linux / 🍎 macOS
```sh
# Backend tests (requires Java 21 + Maven)
cd Backend
mvn -f artifacts/api-server/pom.xml test

# Frontend tests
cd Frontend
bun run test
```

#### 🪟 Windows (PowerShell)
```powershell
# Backend tests (requires Java 21 + Maven)
cd Backend
mvn -f artifacts\api-server\pom.xml test

# Frontend tests
cd Frontend
bun run test
```

---

## 🛑 Stopping the Services

#### All platforms
```sh
# Stop backend Docker containers (run from Backend/artifacts/api-server)
docker compose down

# Stop and also delete the database volume (fresh start)
docker compose down -v
```

---

## 🔧 Troubleshooting

### `bun: command not found`

**Linux:**
```sh
source ~/.bashrc
# OR use the full path
~/.bun/bin/bun run dev
```

**macOS:**
```sh
source ~/.zshrc
# OR use the full path
~/.bun/bin/bun run dev
```

**Windows:**
```powershell
# Restart PowerShell, or re-run the install script
powershell -c "irm bun.sh/install.ps1 | iex"
```

---

### `docker compose` command not found

**Linux:**
```sh
sudo apt install docker-compose-plugin -y
docker compose version
```

**macOS / Windows:**  
Make sure **Docker Desktop** is installed and **running** (check the taskbar icon).

---

### Port already in use (8080 or 8090)

**Linux / macOS:**
```sh
# Find what is using the port
lsof -i :8090

# Kill it (replace <PID> with the actual number shown)
kill -9 <PID>
```

**Windows (PowerShell):**
```powershell
# Find what is using the port
netstat -ano | findstr :8090

# Kill it (replace <PID> with the actual number)
taskkill /PID <PID> /F
```

---

### CORS error in browser console

- Ensure `CORS_ALLOWED_ORIGINS=http://localhost:8080` is in the backend `.env`
- Restart Docker after changing the backend `.env`:
```sh
docker compose down
docker compose up --build
```

---

### API calls fail / 404 on doctor search

- Make sure the **backend Docker container is running**
- Check `Frontend/.env` has `VITE_API_BASE_URL=http://localhost:8090/api`
- Restart `bun run dev` after editing `.env`

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

---

## 📋 Quick Reference — All Commands

| Task | Linux / macOS | Windows (PowerShell) |
|---|---|---|
| Copy backend env file | `cp .env.example .env` | `Copy-Item .env.example .env` |
| Copy frontend env file | `cp .env.example .env` | `Copy-Item .env.example .env` |
| Start backend | `docker compose up --build` | `docker compose up --build` |
| Stop backend | `docker compose down` | `docker compose down` |
| Stop + wipe database | `docker compose down -v` | `docker compose down -v` |
| Install frontend deps | `bun install` | `bun install` |
| Start frontend | `bun run dev` | `bun run dev` |
| Build frontend | `bun run build` | `bun run build` |
| Preview production build | `bun run preview` | `bun run preview` |
| Run frontend tests | `bun run test` | `bun run test` |
| Run backend tests | `mvn -f artifacts/api-server/pom.xml test` | `mvn -f artifacts\api-server\pom.xml test` |
| Lint frontend | `bun run lint` | `bun run lint` |
| Format code | `bun run format` | `bun run format` |
| Generate JWT secret | `openssl rand -base64 48` | `[Convert]::ToBase64String((1..48 \| ForEach-Object { Get-Random -Maximum 256 }))` |
| Check port usage | `lsof -i :8090` | `netstat -ano \| findstr :8090` |
| Kill process by PID | `kill -9 <PID>` | `taskkill /PID <PID> /F` |

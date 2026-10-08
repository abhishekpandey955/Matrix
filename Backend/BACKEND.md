# MediCare — Backend

Java 21 Spring Boot REST API for the MediCare healthcare management system.  
Handles patients, doctors, appointments, prescriptions, and administrator workflows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16 with Flyway migrations |
| Auth | BCrypt password hashing + signed JWT bearer tokens |
| API Docs | Swagger UI / OpenAPI |
| Build | Maven |

---

## Prerequisites

### Option A — Docker (recommended, no Java needed)
```sh
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-plugin -y

# Add yourself to the docker group (avoids needing sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### Option B — Maven + local PostgreSQL
```sh
# Java 21
sudo apt install openjdk-21-jdk -y
java -version   # must show 21.x

# Maven
sudo apt install maven -y
mvn -version

# PostgreSQL
sudo apt install postgresql -y
```

---

## Local Setup & Run

### Using Docker (Option A — Recommended)

#### Step 1 — Go to the api-server folder
```sh
cd Medicare/Backend/artifacts/api-server
```

#### Step 2 — Create your `.env` file
```sh
cp .env.example .env
```

#### Step 3 — Edit `.env` with your values
```sh
nano .env
```

Fill in these values:
```env
# Strong random password for PostgreSQL
DB_PASSWORD=MySecureDbPass123

# Random string, minimum 32 characters
# Generate with: openssl rand -base64 48
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# First admin account (created automatically on startup)
BOOTSTRAP_ADMIN_EMAIL=admin@medicare.com
BOOTSTRAP_ADMIN_PASSWORD=Admin@12345
BOOTSTRAP_ADMIN_NAME=System Administrator

# Frontend origin for CORS (where your frontend runs)
CORS_ALLOWED_ORIGINS=http://localhost:8080
```

> **Generate a strong JWT secret:**
> ```sh
> openssl rand -base64 48
> ```

#### Step 4 — Start the backend
```sh
docker compose up --build
```

This starts **two containers**:
- `database` — PostgreSQL 16
- `api` — Spring Boot REST API

Wait until you see:
```
Started MedicareApplication in X.XXX seconds (JVM running for X.XXX)
```

✅ **API is running at:** `http://localhost:8090/api`  
📖 **Swagger UI:** `http://localhost:8090/api/swagger-ui.html`  
📄 **OpenAPI JSON:** `http://localhost:8090/api/v3/api-docs`

#### Stop the backend
```sh
# Stop (keeps data)
Ctrl+C
docker compose down

# Stop and delete all data (clean slate)
docker compose down -v
```

---

### Using Maven (Option B)

```sh
cd Medicare/Backend/artifacts/api-server

# Set environment variables
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/medicare
export SPRING_DATASOURCE_USERNAME=medicare
export SPRING_DATASOURCE_PASSWORD=yourpassword
export JWT_SECRET=your-secret-key-minimum-32-chars
export BOOTSTRAP_ADMIN_EMAIL=admin@medicare.com
export BOOTSTRAP_ADMIN_PASSWORD=Admin@12345
export CORS_ALLOWED_ORIGINS=http://localhost:8080
export PORT=8090

# Run tests
mvn test

# Build and run
mvn package
java -jar target/medicare-api.jar
```

---

## Verify It's Working

```sh
# Should return HTTP 200 with a list (empty at first)
curl http://localhost:8090/api/doctors/search?size=10

# Login as admin
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medicare.com","password":"Admin@12345"}'
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DB_PASSWORD` | ✅ | PostgreSQL password |
| `JWT_SECRET` | ✅ | Random secret, minimum 32 characters |
| `BOOTSTRAP_ADMIN_EMAIL` | ✅ | Email for the first admin account |
| `BOOTSTRAP_ADMIN_PASSWORD` | ✅ | Password for the first admin account |
| `BOOTSTRAP_ADMIN_NAME` | ❌ | Admin display name (default: System Administrator) |
| `CORS_ALLOWED_ORIGINS` | ✅ | Exact frontend origin, e.g. `http://localhost:8080` |
| `PORT` | ❌ | HTTP port inside the container (default: `8080`) |
| `JWT_TTL` | ❌ | Token lifetime, ISO-8601 (default: `PT2H` = 2 hours) |
| `SPRING_DATASOURCE_URL` | ❌ | Full JDBC URL (Docker sets this automatically) |

---

## API Endpoints

All routes are prefixed with `/api`. Full interactive docs at `/api/swagger-ui.html`.

| Area | Method | Route |
|---|---|---|
| **Auth** | POST | `/auth/register/patient` |
| | POST | `/auth/register/doctor` |
| | POST | `/auth/login` |
| **Patient** | GET/PATCH | `/patients/me` |
| | GET | `/patients/me/appointments` |
| | GET | `/patients/me/prescriptions` |
| **Doctor** | GET | `/doctors/search?specialization=X&name=Y` |
| | GET/PATCH | `/doctors/me` |
| | GET | `/doctors/me/appointments` |
| | GET/POST | `/doctors/me/availability` |
| **Appointments** | GET | `/appointments/availability` |
| | POST | `/appointments` |
| | GET | `/appointments/{id}` |
| | POST | `/appointments/{id}/cancel` |
| | PATCH | `/appointments/{id}/status` |
| **Prescriptions** | POST | `/appointments/{id}/prescriptions` |
| **Admin** | GET | `/admin/patients` |
| | GET | `/admin/doctors` |
| | POST | `/admin/doctors/{id}/approve` |
| | GET | `/admin/appointments` |
| | GET | `/admin/statistics` |

All protected routes require: `Authorization: Bearer <token>`  
Tokens expire after **2 hours** by default.

---

## Project Layout

```
artifacts/api-server/
├── .env.example                    ← Copy this to .env and fill in values
├── docker-compose.yml              ← Starts API + PostgreSQL together
├── Dockerfile                      ← Builds the Spring Boot JAR image
├── pom.xml                         ← Maven build config
└── src/main/
    ├── java/com/medicare/
    │   ├── auth/                   # Registration, login, JWT
    │   ├── config/                 # Security, CORS, data source config
    │   ├── doctor/                 # Doctor profile, availability, search
    │   ├── patient/                # Patient profile & prescriptions
    │   ├── appointment/            # Booking, availability windows
    │   ├── admin/                  # Admin dashboard endpoints
    │   └── common/                 # Shared DTOs, exceptions, utilities
    └── resources/
        ├── db/migration/           # Flyway SQL migrations (V1__init.sql, etc.)
        ├── application.yml         # Base config
        └── application-production.yml
```

---

## Troubleshooting

### `permission denied` when running docker
```sh
sudo usermod -aG docker $USER
newgrp docker    # apply without logout
```

### Port 8090 already in use
```sh
# Find what's using it
sudo ss -tlnp | grep 8090
# Kill it
sudo kill -9 <PID>
```

### Backend starts but API returns CORS error
- Check `CORS_ALLOWED_ORIGINS` in your `.env` matches your frontend URL exactly
- Restart `docker compose up` after changing `.env`

### Flyway migration error on startup
```sh
# Wipe the database and start fresh
docker compose down -v
docker compose up --build
```

---

## Security Notes

- Passwords hashed with BCrypt — never stored as plain text
- JWT tokens expire after 2 hours (configurable via `JWT_TTL`)
- CORS restricted to the exact origin in `CORS_ALLOWED_ORIGINS` — never use `*`
- All credentials set via environment variables — nothing hardcoded or committed
- Medical record details are stored separately and never returned by any API response

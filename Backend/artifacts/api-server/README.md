# MediCare Spring Boot API

A Java 21 REST backend for patient and doctor accounts, appointment scheduling,
prescriptions, and administration. The service uses Spring Security, BCrypt,
short-lived signed bearer tokens, Spring Data JPA, Flyway, and PostgreSQL.

## Run locally with Docker

1. Copy `.env.example` to `.env`.
2. Set unique values for `DB_PASSWORD`, `JWT_SECRET`, and the bootstrap admin
   credentials. Keep `.env` private.
3. Set `CORS_ALLOWED_ORIGINS` to the exact origin of your frontend,
   including `https://` and the hostname, for example
   `https://your-frontend-domain.com`.
4. Start the service:

   ```sh
   docker compose up --build
   ```

The API is served under `/api`. Swagger UI is at
`http://localhost:8080/api/swagger-ui.html`, and OpenAPI JSON is at
`http://localhost:8080/api/v3/api-docs`.

On first startup, Flyway creates the tables and adds a small set of common
specializations. Hibernate validates the schema; it does not create or alter
tables. The configured bootstrap administrator is created only if that email
does not already exist. Doctor registrations start unapproved and must be
reviewed by an administrator before they can manage appointments or availability.

## Run tests and package the app

With Java 21 and Maven installed:

```sh
mvn test
mvn package
java -jar target/medicare-api.jar
```

The database URL and credentials are read from `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`. If those are
unset, the app can use the standard `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`,
and `PGPASSWORD` environment variables.

`JWT_SECRET` must contain at least 32 bytes of random material. Set it explicitly
as an environment variable before starting the app. `BOOTSTRAP_ADMIN_EMAIL` and
`BOOTSTRAP_ADMIN_PASSWORD` create the first administrator; no public admin
registration route exists.

## API overview

All routes below are prefixed with `/api`.

| Area | Routes |
| --- | --- |
| Authentication | `POST /auth/register/patient`, `POST /auth/register/doctor`, `POST /auth/login` |
| Patient | `GET/PATCH /patients/me`, `GET /patients/me/appointments`, `GET /patients/me/prescriptions` |
| Doctors | `GET /doctors/search`, `GET /doctors/me`, `GET /doctors/me/appointments`, availability management under `/doctors/me/availability` |
| Scheduling | `GET /appointments/availability`, `POST /appointments`, `GET /appointments/{id}`, `POST /appointments/{id}/cancel`, `PATCH /appointments/{id}/status` |
| Prescriptions | `POST /appointments/{id}/prescriptions` (assigned doctor after a completed visit) |
| Administration | `GET /admin/patients`, `GET /admin/doctors`, `POST /admin/doctors/{id}/approve`, `GET /admin/appointments`, `PATCH /admin/appointments/{id}/status`, `GET /admin/statistics` |

Protected routes use `Authorization: Bearer <accessToken>`. Tokens expire after
two hours by default. Appointment requests must fit inside a published doctor
availability window. The booking transaction locks the doctor row before
checking for overlapping active appointments, preventing two concurrent
requests from booking the same time.

The API returns purpose-built DTOs rather than JPA entities. Password hashes
are never serialized. Patient profile and prescription endpoints are limited to
the authenticated patient; doctors can act only on their own schedules and
appointments. Medical-record contents are stored separately and are not
returned by any endpoint. This is an application-level access boundary, not a
claim of HIPAA compliance; review hosting, access logging, retention, and
regulatory requirements before storing real patient data.

## Configuration

| Variable | Purpose |
| --- | --- |
| `SPRING_DATASOURCE_URL` | JDBC connection string; alternatively use the `PG*` variables |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Database login |
| `JWT_SECRET` | Random token-signing secret, at least 32 bytes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact frontend origins; do not use `*` |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | First admin account |
| `JWT_TTL` | Token duration, ISO-8601 duration; default `PT2H` |
| `PORT` | HTTP port; defaults to `8080` |
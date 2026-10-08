---
name: Production PostgreSQL configuration
description: Database ownership and migration behavior for this Java API.
---

The production database uses PostgreSQL with environment variables (`PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`) for connection.
Development uses Flyway for schema migrations. In production, Flyway is disabled — schema changes are applied manually before each deploy.

**Why:** Running Flyway migrations against an already-provisioned production schema can fail if migration history rows are out of sync with the actual tables.

**How to apply:**
- Development: Flyway is active and runs on startup (`spring.flyway.enabled=true`).
- Production: Set `spring.flyway.enabled=false` via `application-production.yml`. Use the `PG*` environment variables for the database connection. Apply schema changes manually or via a controlled migration script before deploying a new version.
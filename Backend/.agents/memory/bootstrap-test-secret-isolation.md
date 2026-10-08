---
name: Bootstrap test secret isolation
description: Keep Maven and Spring test contexts isolated from shared admin bootstrap Secrets.
---

Shared Replit bootstrap Secrets and the enable flag can be present in the environment used by Maven tests. Regular auth integration-test contexts should explicitly disable bootstrap and blank the effective email/password properties. Bootstrap-specific tests should explicitly set test-only `medicare.admin-bootstrap.*` properties rather than depend on environment-variable placeholders.

**Why:** A live bootstrap configuration can otherwise create an account in an H2 test database or replace the expected test fixture, while test logs only show a generic bootstrap result.

**How to apply:** When adding Spring integration tests, keep bootstrap disabled by default and enable it only in an isolated test context with synthetic credentials. Never log secret values.

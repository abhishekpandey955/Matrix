---
name: Maven artifact development working directory
description: Where managed API artifact development commands run.
---

Managed API development commands run with `artifacts/api-server` as the current working directory. A project-root-relative `-f artifacts/api-server/pom.xml` path is therefore duplicated and fails; use the local pom for `spring-boot:run`.

**Why:** The workflow's initial Maven command failed because Maven resolved the root-relative pom path from inside the API artifact.

**How to apply:** For development workflow commands, invoke Maven from the artifact directory without a root-relative `-f` path. Check the working directory before using `-f` in other build commands.
---
name: PostgreSQL doctor search
description: Null filter and pagination pitfalls in the API's doctor search query.
---

Do not bind `null` text filters into JPQL predicates that call `lower` or `concat`; PostgreSQL may infer a binary type and fail with `lower(bytea)`. Normalize missing filters to empty strings and guard with `param = ''`. Use `EXISTS` subqueries for to-many specialization filters rather than duplicate-producing joins plus `DISTINCT` when paginating and sorting on a joined field.

**Why:** The published doctor search failed with PostgreSQL SQLSTATE 42883. After null handling was corrected, integration testing found the `DISTINCT` query also conflicted with the default joined-name sort. H2 and PostgreSQL exposed different failure modes.

**How to apply:** Keep optional search parameters non-null, use `EXISTS` to retain one row per doctor, and verify both the H2 integration test and a PostgreSQL smoke query.
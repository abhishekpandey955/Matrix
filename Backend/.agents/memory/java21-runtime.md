---
name: Java 21 runtime selection
description: The Java module can expose an older JDK than this backend requires, even when JDK 21 is installed.
---

For this project, `java-graalvm22.3` exposes JDK 19. JDK 21 is installed separately, so Maven commands must explicitly set `JAVA_HOME` from the JDK 21 binary.

**Why:** Maven otherwise selects JDK 19 and cannot compile the Java 21 backend.

**How to apply:** Derive `JAVA_HOME` from `readlink -f "$(command -v java)"` in development and production build commands.
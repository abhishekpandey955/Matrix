# MediCare — Online Healthcare Management System

> **Galgotias University Project** — Built by **TEAM MATRIX**

A full-stack web application for managing healthcare services online. Patients find doctors, book appointments, and view prescriptions. Doctors manage their availability, appointments, and write prescriptions. Administrators approve doctor accounts, manage all appointments, and monitor system-wide statistics.

---

## 📌 Table of Contents

1. [Problem Understanding & Solution Design](#-problem-understanding--solution-design)
2. [Core Java Concepts](#-core-java-concepts)
3. [Database Integration (JDBC)](#-database-integration-jdbc)
4. [Servlets & Web Integration](#-servlets--web-integration)
5. [Tech Stack](#-tech-stack)
6. [Project Structure](#-project-structure)
7. [Running Locally — Step by Step](#-running-locally--step-by-step)
8. [Features](#-features)
9. [API Endpoints](#-api-endpoints)
10. [Security Notes](#-security-notes)
11. [Running Tests](#-running-tests)
12. [Troubleshooting](#-troubleshooting)
13. [Team Members](#-team-members)

---

## 🧠 Problem Understanding & Solution Design

### Problem Statement

The traditional healthcare appointment system suffers from:
- **Manual booking** — patients must call clinics or visit in person to schedule appointments.
- **No real-time availability** — patients cannot see when a doctor is free before visiting.
- **Paper-based prescriptions** — easily lost, hard to track, and not digitally accessible.
- **No centralized management** — administrators have no dashboard to oversee operations.
- **Doctor verification gap** — no approval workflow exists to verify doctor credentials before they start practising on the platform.

### Solution Design

MediCare solves these problems with a **three-role web application** (Patient, Doctor, Admin) built on a clean **layered architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/TS)                     │
│  TanStack Start · Tailwind CSS v4 · shadcn/ui · TanStack   │
│                  Query · File-based routing                 │
└──────────────────────────┬──────────────────────────────────┘
                           │  REST API (JSON over HTTP)
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (Java 21 / Spring Boot 3)          │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ Controllers │→ │  Services  │→ │  JPA Repositories    │  │
│  │ (REST API)  │  │ (Business  │  │  (Database Access)   │  │
│  │             │  │  Logic)    │  │                      │  │
│  └────────────┘  └────────────┘  └──────────┬───────────┘  │
│                                              │              │
│  ┌────────────┐  ┌────────────────────────┐  │              │
│  │  Security   │  │  Domain Entities       │  │              │
│  │  (JWT +     │  │  (JPA @Entity classes) │◄─┘              │
│  │   BCrypt)   │  │                        │                │
│  └────────────┘  └────────────────────────┘                │
└──────────────────────────┬──────────────────────────────────┘
                           │  JDBC (HikariCP Connection Pool)
┌──────────────────────────▼──────────────────────────────────┐
│                PostgreSQL 16 Database                       │
│    Flyway-managed schema migrations (V1__initial_schema.sql)│
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

| Decision | Rationale |
|---|---|
| **Spring Boot 3** over raw Servlets | Production-grade dependency injection, auto-configuration, and embedded Tomcat servlet container |
| **Spring Data JPA** for database access | Type-safe queries via repository interfaces; JPA uses JDBC internally through Hibernate |
| **JWT stateless authentication** | No server-side sessions; horizontally scalable; token expires in 2 hours |
| **BCrypt (cost 12)** for passwords | Industry-standard adaptive hashing; resistant to brute-force attacks |
| **Flyway migrations** | Version-controlled database schema; reproducible across environments |
| **Docker Compose** | One-command setup for both API and PostgreSQL; no manual DB installation |
| **Role-based access (RBAC)** | Fine-grained endpoint protection: `PATIENT`, `DOCTOR`, `ADMIN` |

---

## ☕ Core Java Concepts

This section maps our implementation to the core Java concepts required by the rubric.

### 1. OOP Principles — Inheritance, Polymorphism, Encapsulation

| Concept | Where Used | Source File |
|---|---|---|
| **Inheritance** | `ApiException extends RuntimeException` — custom exception hierarchy | `common/ApiException.java` |
| **Inheritance** | `JwtAuthFilter extends OncePerRequestFilter` — Servlet filter chain inheritance | `security/JwtAuthFilter.java` |
| **Polymorphism** | `GlobalExceptionHandler` uses `@ExceptionHandler` overloads — same method name handles `ApiException`, `MethodArgumentNotValidException`, `ConstraintViolationException`, `DataIntegrityViolationException`, and generic `Exception` | `common/GlobalExceptionHandler.java` |
| **Polymorphism** | `PasswordEncoder` interface — `BCryptPasswordEncoder` injected at runtime via Spring DI | `config/SecurityConfig.java` |
| **Polymorphism** | `JpaRepository<T, ID>` interface — concrete implementations generated at runtime by Spring Data for each entity type | `repository/*.java` |
| **Encapsulation** | All domain entity fields are `private` with controlled getters/setters; `UserAccount.passwordHash` has no setter | `domain/UserAccount.java` |
| **Encapsulation** | Protected no-arg constructors on entities (JPA requirement, hides internal state) | `domain/Doctor.java`, `domain/Patient.java` |

**Code Example — Inheritance & Polymorphism:**

```java
// ApiException.java — Custom exception inheriting from RuntimeException
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    // Factory methods (static polymorphism / method overloading pattern)
    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
    }
    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
    }
    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", message);
    }
}
```

```java
// GlobalExceptionHandler.java — Polymorphic exception handling (5 overloaded handlers)
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)         // Handles our custom exception
    @ExceptionHandler(MethodArgumentNotValidException.class)  // Handles validation errors
    @ExceptionHandler(ConstraintViolationException.class)     // Handles DB constraint violations
    @ExceptionHandler(DataIntegrityViolationException.class)  // Handles data conflicts
    @ExceptionHandler(Exception.class)            // Catch-all fallback
}
```

### 2. Interfaces

| Interface | Implementing Class | Purpose |
|---|---|---|
| `JpaRepository<Doctor, UUID>` | `DoctorRepository` | Database CRUD + custom JPQL queries for doctor search |
| `JpaRepository<Patient, UUID>` | `PatientRepository` | Patient data access |
| `JpaRepository<Appointment, UUID>` | `AppointmentRepository` | Appointment booking & conflict checks |
| `JpaRepository<Prescription, UUID>` | `PrescriptionRepository` | Prescription data access |
| `JpaRepository<UserAccount, UUID>` | `UserAccountRepository` | User authentication & lookup |
| `JpaRepository<DoctorAvailability, UUID>` | `DoctorAvailabilityRepository` | Doctor schedule windows |
| `JpaRepository<Specialization, Long>` | `SpecializationRepository` | Medical specialization lookup |
| `PasswordEncoder` | `BCryptPasswordEncoder` | Password hashing and verification |
| `OncePerRequestFilter` (abstract class) | `JwtAuthFilter` | JWT token extraction and authentication |
| `Filter` (Jakarta Servlet) | `JwtAuthFilter` (via inheritance chain) | Servlet filter contract |

**Code Example — Interface usage:**

```java
// DoctorRepository.java — Interface with custom JPQL query
public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    Optional<Doctor> findByUserAccount_Id(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Doctor d where d.id = :id")
    Optional<Doctor> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
        select d from Doctor d
        join d.userAccount u
        where d.approved = true
          and (:query = '' or lower(u.fullName) like lower(concat('%', :query, '%')))
          and (:specialization = '' or exists (
               select 1 from Doctor sd join sd.specializations s
               where sd = d and lower(s.name) = lower(:specialization)))
        """)
    Page<Doctor> searchApproved(@Param("query") String query,
                                 @Param("specialization") String specialization,
                                 Pageable pageable);
}
```

### 3. Exception Handling

| Exception Type | HTTP Status | When Thrown |
|---|---|---|
| `ApiException.notFound()` | `404` | Doctor/Patient/Appointment not found |
| `ApiException.forbidden()` | `403` | Unapproved doctor tries to act; patient tries admin action |
| `ApiException.conflict()` | `409` | Duplicate email registration; double-booked time slot |
| `ApiException.badRequest()` | `400` | Invalid time range; blank required field |
| `MethodArgumentNotValidException` | `400` | Bean validation failure (`@NotBlank`, `@Email`, `@Future`) |
| `ConstraintViolationException` | `400` | Database-level constraint violation |
| `DataIntegrityViolationException` | `409` | Unique constraint violation at DB level |
| `JwtException` | (caught silently) | Invalid/expired JWT token — clears security context |
| `IllegalStateException` | `500` | Missing `JWT_SECRET` environment variable on startup |

### 4. Enums

| Enum | Values | Used In |
|---|---|---|
| `Role` | `PATIENT`, `DOCTOR`, `ADMIN` | User accounts — drives RBAC security |
| `AppointmentStatus` | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW` | Appointment state machine transitions |

### 5. Java Records (DTOs)

All API request/response objects use **Java Records** (`record` keyword, Java 16+) for immutable, boilerplate-free data transfer:

```java
// ApiDtos.java — 16 record definitions for type-safe API contracts
public record PatientRegistration(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 12) String password,
    @NotBlank String fullName, ...
) {}

public record AuthResponse(String accessToken, String tokenType, Instant expiresAt, String role) {}
public record AppointmentView(UUID id, UUID doctorId, String doctorName, ...) {}
public record ApiError(String code, String message, Instant timestamp, String path) {}
// ... 12 more records
```

### 6. Collections & Generics

| Collection / Generic | Where Used | Purpose |
|---|---|---|
| `Set<Specialization>` | `Doctor.specializations` | Many-to-many relationship; `HashSet` for uniqueness |
| `List<String>` | `DoctorProfile.specializations` | Sorted specialization names in API response |
| `Optional<Doctor>` | `DoctorRepository.findByUserAccount_Id()` | Null-safe entity lookup |
| `Page<Doctor>` | `DoctorRepository.searchApproved()` | Paginated search results with generic type |
| `List<@NotNull Long>` | `DoctorRegistration.specializationIds` | Validated list of specialization IDs |
| `List<SimpleGrantedAuthority>` | `JwtAuthFilter` | Spring Security authorities collection |
| `Stream<T>` + `.map()` + `.toList()` | `CareService` (throughout) | Functional transformation of entity lists to DTO lists |
| `JpaRepository<T, ID>` | All 7 repositories | Generic repository interface parameterized by entity type and ID type |

**Code Example — Generics + Stream API:**

```java
// CareService.java — Generic stream transformations
private List<String> specializationNames(Doctor doctor) {
    return doctor.getSpecializations().stream()    // Stream<Specialization>
        .map(Specialization::getName)              // Stream<String>
        .sorted()                                  // Stream<String> (natural order)
        .toList();                                 // List<String>
}

public Page<PublicDoctorProfile> searchDoctors(String query, String specialization, Pageable pageable) {
    return doctorRepository.searchApproved(safeQuery, safeSpecialization, pageable)
        .map(this::toPublicDoctorProfile);         // Page<Doctor> → Page<PublicDoctorProfile>
}
```

### 7. Switch Expressions (Java 21)

```java
// CareService.java — Pattern matching with switch expression
private void requireAppointmentAccess(AuthenticatedUser user, Appointment appointment) {
    boolean allowed = switch (user.role()) {
        case ADMIN   -> true;
        case PATIENT -> patientFor(user.id()).getId().equals(appointment.getPatient().getId());
        case DOCTOR  -> doctorForUser(user.id()).getId().equals(appointment.getDoctor().getId());
    };
    if (!allowed) throw ApiException.notFound("Appointment not found.");
}
```

---

## 🗄️ Database Integration (JDBC)

### Database Technology

| Component | Technology |
|---|---|
| Database | PostgreSQL 16 |
| Connection Layer | **JDBC** (via HikariCP connection pool + Hibernate JPA provider) |
| ORM | Spring Data JPA (Hibernate 6) — generates SQL that runs over JDBC |
| Connection Pool | HikariCP (production-grade JDBC connection pooling) |
| Schema Management | Flyway (version-controlled SQL migrations) |
| Driver | PostgreSQL JDBC Driver (`org.postgresql:postgresql`) |

### How JDBC Is Used

Spring Data JPA internally uses **JDBC** for all database communication. The connection is configured in `application.yml`:

```yaml
# application.yml — JDBC datasource configuration
spring:
  datasource:
    url: jdbc:postgresql://${PGHOST:localhost}:${PGPORT:5432}/${PGDATABASE:medicare}
    username: ${SPRING_DATASOURCE_USERNAME:${PGUSER:medicare}}
    password: ${SPRING_DATASOURCE_PASSWORD:${PGPASSWORD:}}
  hikari:
    maximum-pool-size: 5    # JDBC connection pool size
    connection-timeout: 30000
    max-lifetime: 1200000
```

For production, a dedicated `ProductionDataSourceConfig.java` configures HikariCP with explicit JDBC URL construction:

```java
// ProductionDataSourceConfig.java — Explicit JDBC DataSource configuration
@Configuration
@Profile("production")
public class ProductionDataSourceConfig {
    @Bean
    public DataSource dataSource(Environment environment) {
        HikariConfig config = new HikariConfig();
        config.setPoolName("MediCareProductionPool");
        config.setJdbcUrl("jdbc:postgresql://"          // ← JDBC URL
                + required(environment, "PGHOST")
                + ":" + environment.getProperty("PGPORT", "5432")
                + "/" + required(environment, "PGDATABASE"));
        config.setUsername(required(environment, "PGUSER"));
        config.setPassword(required(environment, "PGPASSWORD"));
        config.setMaximumPoolSize(10);
        return new HikariDataSource(config);            // ← JDBC DataSource
    }
}
```

### Database Schema (8 Tables)

The entire schema is defined in `V1__initial_schema.sql` and managed by Flyway:

```sql
-- 1. user_accounts — Shared authentication for all roles
CREATE TABLE user_accounts (
    id UUID PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(16) NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    full_name VARCHAR(160) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. patients             -- 3. doctors
-- 4. specializations      -- 5. doctor_specializations (junction)
-- 6. doctor_availability  -- 7. appointments
-- 8. prescriptions        -- 9. medical_records
```

### Entity-Relationship Diagram

```
┌───────────────┐       1:1       ┌──────────┐
│  UserAccount  │────────────────▶│  Patient  │
│  (id, email,  │                 │  (DOB,    │
│   role, ...)  │                 │  address) │
│               │       1:1       ├──────────┐│
│               │────────────────▶│  Doctor   ││
└───────────────┘                 │  (license,││
                                  │  bio, fee)││
                                  └─────┬─────┘│
                                        │      │
                              M:N       │      │
                   ┌────────────────────┘      │
                   ▼                           │
          ┌────────────────┐          1:N      │
          │ Specialization │      ┌────────────┘
          │ (Cardiology,   │      ▼
          │  Neurology...) │  ┌──────────────┐
          └────────────────┘  │ Availability │
                              │ (start, end) │
                              └──────────────┘
     ┌──────────┐      N:1      ┌─────────────┐
     │ Patient  │──────────────▶│ Appointment  │◀──── Doctor
     └──────────┘               │ (start, end, │
                                │  status)     │
                                └──────┬───────┘
                                       │ 1:N
                                       ▼
                                ┌──────────────┐
                                │ Prescription │
                                │ (medication, │
                                │  dosage,     │
                                │  frequency)  │
                                └──────────────┘
```

### Repository Layer (Database Operations Classes)

Each entity has a dedicated repository interface that Spring Data JPA implements at runtime:

| Repository | Entity | Key Operations |
|---|---|---|
| `UserAccountRepository` | `UserAccount` | `findByEmailIgnoreCase()`, `existsByEmailIgnoreCase()`, `countByRole()` |
| `PatientRepository` | `Patient` | `findByUserAccount_Id()` |
| `DoctorRepository` | `Doctor` | `findByUserAccount_Id()`, `findByIdForUpdate()` (pessimistic lock), `searchApproved()` (JPQL) |
| `AppointmentRepository` | `Appointment` | `findByPatient_Id()`, `findByDoctor_Id()`, `hasActiveOverlap()` |
| `DoctorAvailabilityRepository` | `DoctorAvailability` | `findInRange()`, `isWindowAvailable()` |
| `PrescriptionRepository` | `Prescription` | `findByPatient_IdOrderByIssuedAtDesc()` |
| `SpecializationRepository` | `Specialization` | `findByIdIn()` |

### Transaction Management

All service methods are wrapped in `@Transactional` annotations for ACID compliance:

```java
@Transactional                        // Read-write transaction
public AppointmentView bookAppointment(UUID userId, AppointmentCreate request) { ... }

@Transactional(readOnly = true)       // Read-only (optimized, no flush)
public Page<PublicDoctorProfile> searchDoctors(...) { ... }
```

### Pessimistic Locking (Concurrency Control)

To prevent double-booking, the `bookAppointment()` method acquires a **pessimistic write lock** on the doctor row:

```java
// DoctorRepository.java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select d from Doctor d where d.id = :id")
Optional<Doctor> findByIdForUpdate(@Param("id") UUID id);
```

---

## 🌐 Servlets & Web Integration

### Servlet Container

MediCare runs on **Apache Tomcat** (embedded via Spring Boot's `spring-boot-starter-web`). Spring Boot's `DispatcherServlet` acts as the front controller that routes HTTP requests to our `@RestController` classes.

### REST Controllers (6 Controllers)

| Controller | Base Path | Responsibilities |
|---|---|---|
| `AuthController` | `/auth` | Patient registration, doctor registration, login |
| `PatientController` | `/patients` | View/update profile, list appointments & prescriptions |
| `DoctorController` | `/doctors` | Search doctors, manage profile, availability, appointments |
| `AppointmentController` | `/appointments` | Book, cancel, update status, check availability |
| `AdminController` | `/admin` | List patients/doctors, approve doctors, view statistics |
| `HealthController` | `/healthz` | Health check endpoint for Docker/load balancers |

### Servlet Filters

The `JwtAuthFilter` extends `OncePerRequestFilter` (a Spring abstraction over `jakarta.servlet.Filter`):

```java
// JwtAuthFilter.java — Servlet filter for JWT authentication
public class JwtAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            try {
                UUID userId = UUID.fromString(jwtService.parse(token).getSubject());
                UserAccount user = userRepository.findById(userId).orElse(null);
                if (user != null && user.isEnabled()) {
                    var principal = new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole());
                    var authentication = new UsernamePasswordAuthenticationToken(
                        principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

### Security Filter Chain

The `SecurityConfig` class defines the full HTTP security pipeline:

```java
// SecurityConfig.java — Servlet-level security configuration
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter, ...) {
    http
        .csrf(AbstractHttpConfigurer::disable)           // Stateless API — no CSRF needed
        .cors(Customizer.withDefaults())                 // CORS from corsConfigurationSource bean
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/healthz", "/auth/**", "/swagger-ui/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/doctors/search", ...).permitAll()
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .requestMatchers("/patients/**").hasRole("PATIENT")
            .anyRequest().authenticated())
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

### Request / Response Flow

```
HTTP Request
    │
    ▼
┌──────────────────┐
│  Tomcat Servlet   │  (Embedded servlet container)
│  Container        │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  CORS Filter      │  (Validates origin, methods, headers)
└────────┬─────────┘
         ▼
┌──────────────────┐
│  JwtAuthFilter    │  (Extracts Bearer token → sets SecurityContext)
└────────┬─────────┘
         ▼
┌──────────────────┐
│  Security Chain   │  (Role-based authorization: ADMIN, PATIENT, DOCTOR)
└────────┬─────────┘
         ▼
┌──────────────────┐
│  DispatcherServlet│  (Routes to @RestController methods)
└────────┬─────────┘
         ▼
┌──────────────────┐
│  @RestController  │  (e.g., AuthController, DoctorController)
│  → @Service       │  (Business logic in CareService, AuthService)
│  → Repository     │  (JPA → Hibernate → JDBC → PostgreSQL)
└────────┬─────────┘
         ▼
JSON Response (with proper HTTP status code)
```

### API Documentation (Swagger / OpenAPI)

Interactive API docs are auto-generated using **springdoc-openapi** and available at:
- **Swagger UI:** `http://localhost:8090/api/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8090/api/v3/api-docs`

### Bean Validation (Jakarta Validation API)

Request DTOs use Jakarta validation annotations processed by the Servlet layer:

```java
public record PatientRegistration(
    @NotBlank @Email @Size(max = 320) String email,
    @NotBlank @Size(min = 12, max = 128) String password,
    @NotBlank @Size(max = 160) String fullName,
    @NotBlank @Size(max = 32) String phone,
    @NotNull @Past LocalDate dateOfBirth,
    @NotBlank @Size(max = 500) String address
) {}
```

---

## 🛠️ Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.5, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16 with Flyway migrations |
| JDBC Driver | PostgreSQL JDBC Driver (`org.postgresql:postgresql`) |
| Connection Pool | HikariCP |
| Auth | BCrypt password hashing (cost 12) + signed JWT tokens (HMAC-SHA) |
| API Docs | Swagger UI / OpenAPI (springdoc-openapi) |
| Build | Apache Maven |
| Container | Docker + Docker Compose |

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

## 📁 Project Structure

```
Medicare/
├── README.md                         ← This file
├── .gitignore                        ← Root-level ignore rules
├── setup-env.sh                      ← Helper script for env setup
│
├── Backend/
│   ├── BACKEND.md                    ← Detailed backend documentation
│   └── artifacts/api-server/
│       ├── .env.example              ← Sample environment variables
│       ├── docker-compose.yml        ← Starts API + PostgreSQL containers
│       ├── Dockerfile                ← Builds the Spring Boot JAR image
│       ├── pom.xml                   ← Maven build config (all dependencies)
│       └── src/
│           ├── main/java/com/medicare/
│           │   ├── MediCareApplication.java      # Spring Boot entrypoint
│           │   ├── common/
│           │   │   ├── ApiException.java          # Custom exception hierarchy
│           │   │   └── GlobalExceptionHandler.java# Polymorphic exception handlers
│           │   ├── config/
│           │   │   ├── SecurityConfig.java        # Servlet filter chain + CORS + RBAC
│           │   │   ├── OpenApiConfig.java         # Swagger UI configuration
│           │   │   └── ProductionDataSourceConfig.java  # JDBC DataSource (HikariCP)
│           │   ├── controller/
│           │   │   ├── AuthController.java        # /auth — register, login
│           │   │   ├── PatientController.java     # /patients — profile, appointments
│           │   │   ├── DoctorController.java      # /doctors — search, availability
│           │   │   ├── AppointmentController.java # /appointments — book, cancel
│           │   │   ├── AdminController.java       # /admin — approvals, statistics
│           │   │   └── HealthController.java      # /healthz — container health
│           │   ├── domain/
│           │   │   ├── UserAccount.java           # JPA entity — shared user fields
│           │   │   ├── Patient.java               # JPA entity — patient-specific
│           │   │   ├── Doctor.java                # JPA entity — doctor-specific
│           │   │   ├── Appointment.java           # JPA entity — booking records
│           │   │   ├── Prescription.java          # JPA entity — prescribed meds
│           │   │   ├── DoctorAvailability.java    # JPA entity — time windows
│           │   │   ├── MedicalRecord.java         # JPA entity — clinical notes
│           │   │   ├── Specialization.java        # JPA entity — medical specialties
│           │   │   ├── Role.java                  # Enum: PATIENT, DOCTOR, ADMIN
│           │   │   └── AppointmentStatus.java     # Enum: PENDING → COMPLETED
│           │   ├── dto/
│           │   │   └── ApiDtos.java               # 16 Java Records for API contracts
│           │   ├── repository/
│           │   │   ├── UserAccountRepository.java # JPA interface for user_accounts
│           │   │   ├── PatientRepository.java     # JPA interface for patients
│           │   │   ├── DoctorRepository.java      # JPA interface + JPQL search query
│           │   │   ├── AppointmentRepository.java # JPA interface + overlap detection
│           │   │   ├── DoctorAvailabilityRepository.java
│           │   │   ├── PrescriptionRepository.java
│           │   │   ├── SpecializationRepository.java
│           │   │   └── MedicalRecordRepository.java
│           │   ├── security/
│           │   │   ├── JwtService.java            # JWT issue & parse (HMAC-SHA)
│           │   │   ├── JwtAuthFilter.java         # Servlet filter for token auth
│           │   │   └── AuthenticatedUser.java     # Security principal record
│           │   └── service/
│           │       ├── AuthService.java           # Registration & login logic
│           │       ├── CareService.java           # Appointments, prescriptions, profiles
│           │       ├── AdminService.java          # Admin dashboard operations
│           │       └── AdminBootstrap.java        # Creates first admin account on startup
│           ├── main/resources/
│           │   ├── application.yml                # Base JDBC + JPA + security config
│           │   ├── application-production.yml     # Production overrides
│           │   └── db/migration/
│           │       └── V1__initial_schema.sql     # Full database schema (8 tables)
│           └── test/java/com/medicare/
│               ├── AdminBootstrapIntegrationTest.java
│               ├── AuthFlowIntegrationTest.java
│               ├── security/JwtServiceTest.java
│               └── service/AdminBootstrapTest.java
│
└── Frontend/
    ├── .env.example                  ← Frontend env config sample
    ├── package.json                  ← Dependencies and scripts
    ├── vite.config.ts                ← Vite build configuration
    ├── vitest.config.ts              ← Test configuration
    └── src/
        ├── components/               ← Reusable UI components
        ├── hooks/                    ← Custom React hooks
        ├── lib/                      ← API client, auth context, utilities
        ├── routes/                   ← Pages (TanStack file-based routing)
        │   ├── index.tsx             # Landing / Home page
        │   ├── login.tsx             # Login page
        │   ├── register.tsx          # Registration page
        │   ├── doctors.index.tsx     # Doctor search & listing
        │   ├── doctors.$id.tsx       # Individual doctor profile
        │   ├── book.tsx              # Appointment booking
        │   ├── patient.tsx           # Patient dashboard
        │   ├── doctor.tsx            # Doctor dashboard
        │   ├── admin.tsx             # Admin dashboard
        │   ├── appointments.tsx      # Appointment management
        │   ├── prescriptions.tsx     # Prescription history
        │   ├── records.tsx           # Medical records
        │   ├── services.tsx          # Services overview
        │   ├── about.tsx             # About page
        │   └── contact.tsx           # Contact page
        ├── styles.css                ← Global styles & Tailwind theme
        └── test/                     ← Frontend test files
```

---

## 🚀 Running Locally — Step by Step

> You need **two terminals** — one for the Backend, one for the Frontend.

### ✅ Prerequisites — Install These First

#### 🐧 Linux (Ubuntu / Debian)

**1. Install Docker**
```sh
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
sudo usermod -aG docker $USER
newgrp docker
docker --version && docker compose version
```

**2. Install Node.js 22 via nvm**
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22
node --version   # v22.x.x
```

**3. Install Bun**
```sh
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version    # 1.x.x
```

**4. Install Java 21** *(only if running backend without Docker)*
```sh
sudo apt install openjdk-21-jdk -y
java -version
```

#### 🍎 macOS

**1. Install Docker Desktop** — Download from https://www.docker.com/products/docker-desktop/

**2. Install Node.js 22 via nvm**
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install 22 && nvm use 22
```

**3. Install Bun**
```sh
curl -fsSL https://bun.sh/install | bash
source ~/.zshrc
bun --version
```

**4. Install Java 21** *(optional)*
```sh
brew install openjdk@21
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
```

#### 🪟 Windows

**1. Install Docker Desktop** — Download from https://www.docker.com/products/docker-desktop/ (enable WSL 2 backend)

**2. Install Node.js 22** — Download nvm-windows from https://github.com/coreybutler/nvm-windows/releases
```powershell
nvm install 22
nvm use 22
```

**3. Install Bun**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**4. Install Java 21** *(optional)*
```powershell
winget install EclipseAdoptium.Temurin.21.JDK
```

---

### Terminal 1 — Start the Backend

```sh
# 1. Navigate to the backend api-server folder
cd Medicare/Backend/artifacts/api-server

# 2. Create your .env file (only needed once)
cp .env.example .env

# 3. Edit .env with your values
nano .env    # or: code .env
```

Your `.env` should contain:
```env
DB_PASSWORD=choose-any-strong-password
JWT_SECRET=choose-a-random-string-at-least-32-characters-long
BOOTSTRAP_ADMIN_EMAIL=admin@medicare.com
BOOTSTRAP_ADMIN_PASSWORD=Admin@12345
BOOTSTRAP_ADMIN_NAME=System Administrator
CORS_ALLOWED_ORIGINS=http://localhost:8080
```

> **Generate a strong JWT secret:** `openssl rand -base64 48`

```sh
# 4. Start the backend
docker compose up --build
```

Wait for: `Started MedicareApplication in X.XXX seconds`

✅ **Backend:** `http://localhost:8090/api`  
📖 **Swagger UI:** `http://localhost:8090/api/swagger-ui.html`

---

### Terminal 2 — Start the Frontend

```sh
# 1. Navigate to the frontend folder
cd Medicare/Frontend

# 2. Install dependencies (only needed once)
bun install

# 3. Verify .env
cat .env
# Should show: VITE_API_BASE_URL=http://localhost:8090/api

# 4. Start the dev server
bun run dev
```

✅ **Frontend:** `http://localhost:8080`

---

### Verify Everything Works

Open your browser: **http://localhost:8080**

Login with admin credentials from your `.env`:
- **Email:** `admin@medicare.com`
- **Password:** `Admin@12345`

Test the API:
```sh
curl http://localhost:8090/api/doctors/search?size=10
```

---

## 🗺️ Features

| Role | Capabilities |
|---|---|
| **Patient** | Register, search doctors by specialty/name, book appointments, view prescriptions, update profile |
| **Doctor** | Register (pending admin approval), set availability windows, manage appointments, write prescriptions |
| **Admin** | Approve/reject doctors, manage all appointments, view system-wide statistics (patient/doctor/appointment counts) |

---

## 🔌 API Endpoints

All routes prefixed with `/api`. Full interactive docs at `/api/swagger-ui.html`.

| Area | Method | Route | Auth |
|---|---|---|---|
| **Auth** | POST | `/auth/register/patient` | Public |
| | POST | `/auth/register/doctor` | Public |
| | POST | `/auth/login` | Public |
| **Patient** | GET/PATCH | `/patients/me` | PATIENT |
| | GET | `/patients/me/appointments` | PATIENT |
| | GET | `/patients/me/prescriptions` | PATIENT |
| **Doctor** | GET | `/doctors/search` | Public |
| | GET/PATCH | `/doctors/me` | DOCTOR |
| | GET/POST | `/doctors/me/availability` | DOCTOR |
| | DELETE | `/doctors/me/availability/{id}` | DOCTOR |
| | GET | `/doctors/{id}/availability` | Public |
| **Appointments** | GET | `/appointments/availability` | Public |
| | POST | `/appointments` | Authenticated |
| | GET | `/appointments/{id}` | Owner |
| | POST | `/appointments/{id}/cancel` | Owner |
| | PATCH | `/appointments/{id}/status` | DOCTOR |
| **Prescriptions** | POST | `/appointments/{id}/prescriptions` | DOCTOR |
| **Admin** | GET | `/admin/patients` | ADMIN |
| | GET | `/admin/doctors` | ADMIN |
| | POST | `/admin/doctors/{id}/approve` | ADMIN |
| | GET | `/admin/appointments` | ADMIN |
| | GET | `/admin/statistics` | ADMIN |

---

## 🔐 Security Notes

- Passwords hashed with **BCrypt** (cost factor 12) — never stored as plain text
- JWT tokens kept **in memory** on the frontend — never in localStorage
- **CORS** restricted to the exact frontend origin — never uses `*`
- All credentials via **environment variables** — nothing hardcoded or committed
- **Pessimistic write locking** prevents double-booking race conditions
- Medical records stored separately — no API endpoint exposes raw records
- `.env` files excluded via `.gitignore` — secrets never enter version control

---

## 🧪 Running Tests

```sh
# Backend tests (requires Java 21 + Maven)
cd Backend
mvn -f artifacts/api-server/pom.xml test

# Frontend tests
cd Frontend
bun run test
```

Test coverage includes:
- `JwtServiceTest` — JWT token issuance and parsing
- `AdminBootstrapTest` — First admin account creation
- `AdminBootstrapIntegrationTest` — Full integration with H2 in-memory DB
- `AuthFlowIntegrationTest` — Registration and login flow

---

## 🛑 Stopping the Services

```sh
# Stop backend (from Backend/artifacts/api-server)
docker compose down

# Stop and delete the database (fresh start)
docker compose down -v
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `bun: command not found` | Run `source ~/.bashrc` (Linux) or `source ~/.zshrc` (macOS) or restart PowerShell (Windows) |
| `docker compose` not found | Install `docker-compose-plugin` (Linux) or ensure Docker Desktop is running (macOS/Windows) |
| Port 8080 or 8090 in use | Find: `lsof -i :8090` (Linux/Mac) or `netstat -ano \| findstr :8090` (Windows) → Kill the PID |
| CORS error in browser | Ensure `CORS_ALLOWED_ORIGINS=http://localhost:8080` in backend `.env` → restart Docker |
| API calls fail / 404 | Verify backend Docker is running; check `Frontend/.env` has `VITE_API_BASE_URL=http://localhost:8090/api` |
| Flyway migration error | Run `docker compose down -v` then `docker compose up --build` for a fresh database |

---

## 📋 Quick Reference — All Commands

| Task | Command |
|---|---|
| Start backend | `docker compose up --build` |
| Stop backend | `docker compose down` |
| Stop + wipe database | `docker compose down -v` |
| Install frontend deps | `bun install` |
| Start frontend | `bun run dev` |
| Build frontend | `bun run build` |
| Run frontend tests | `bun run test` |
| Run backend tests | `mvn -f artifacts/api-server/pom.xml test` |
| Lint frontend | `bun run lint` |
| Format code | `bun run format` |
| Generate JWT secret | `openssl rand -base64 48` |

---

## 👥 Team Members

> **TEAM MATRIX** — Galgotias University

| Name |
|---|
| SHARWAN |
| ABHISHEK |
| UMMASHANKAR |
| AYSUH |

---

## 📄 License

This project was developed as a university assignment for Galgotias University and is intended for academic purposes.

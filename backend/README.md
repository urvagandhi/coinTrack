# CoinTrack Backend Architecture & Developer Guide

> **Version**: 2.0.0
> **Status**: Production-Ready
> **Tech Stack**: Java 21, Spring Boot 3.2, MongoDB, Spring Security (JWT + TOTP 2FA)
> **Last Updated**: 2025-12-18

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Architectural Principles](#2-key-architectural-principles)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [Module Directory](#4-module-directory)
5. [Folder Structure](#5-folder-structure)
6. [Request Lifecycle](#6-request-lifecycle)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [TOTP 2FA System](#8-totp-2fa-system)
9. [Broker Integration](#9-broker-integration)
10. [Portfolio & Sync Architecture](#10-portfolio--sync-architecture)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Logging Strategy](#12-logging-strategy)
13. [Configuration & Environments](#13-configuration--environments)
14. [Testing Strategy](#14-testing-strategy)
15. [Extension Guide](#15-extension-guide)
16. [Anti-Patterns](#16-anti-patterns)
17. [Deployment & Runtime](#17-deployment--runtime)
18. [Codebase Statistics](#18-codebase-statistics)
19. [Documentation Index](#19-documentation-index)

---

## 1. Project Overview

### What is CoinTrack?
CoinTrack is a **multi-broker portfolio aggregation engine**. It connects to various trading platforms (Zerodha, Angel One, Upstox), fetches user holdings and positions, and consolidates them into a single, unified financial view.

### The Business Problem
Active traders and investors often hold assets across multiple brokerage accounts to diversify risk or leverage specific features. However, this fragmentation makes it impossible to verify their true **Net Worth** or **Day's P&L** in real-time without manually checking multiple apps and spreadsheets.

### Why It's Hard
- **Lack of Standards**: Every broker API has a different schema for "Holdings" and "Positions".
- **Security Risks**: Handling API keys and secrets requires banking-grade encryption and hygiene.
- **Data Freshness**: Synchronizing volatile market data across diverse APIs while respecting rate limits is a distributed systems challenge.

CoinTrack solves this by acting as a **secure, normalizing middleware** between the user and the fragmented broker ecosystem.

### Key Features
| Feature | Description |
|---------|-------------|
| **Multi-Broker Support** | Zerodha, Upstox, AngelOne with unified API |
| **TOTP 2FA** | Mandatory two-factor authentication for all users |
| **Portfolio Aggregation** | Cross-broker holdings with unified P&L |
| **Holdings-Only Summary** | Positions excluded for mathematical consistency |
| **Encrypted Secrets** | AES-256-GCM encryption for all sensitive data |
| **Background Sync** | Scheduled portfolio synchronization |

---

## 2. Key Architectural Principles

We strictly adhere to **Domain-Driven Design (DDD)** and **Separation of Concerns**.

| Principle | Why it matters in CoinTrack |
|-----------|----------------------------|
| **Domain-Driven Design** | Finance is complex. Code structure (`portfolio`, `broker`) must match business language to prevent logic errors. |
| **Separation of Concerns** | `User` module shouldn't know about `Zerodha` APIs. Keeps the codebase modular and testable. |
| **Thin Controllers** | Controllers only handle HTTP translation. All logic resides in Services. Prevents "spaghetti code" in endpoints. |
| **Rich Domain Models** | Entities (`BrokerAccount`) contain business logic validation, not just getters/setters. |
| **Security-First** | "Trust nothing." Tokens are validated on *every* request. Secrets are *never* cleartext. |
| **Provider Pattern** | Adding a new broker (e.g., Groww) should not require changing existing portfolio logic. |
| **Trust the Broker** | Use Zerodha's computed values (P&L, Day Change) rather than recalculating locally. |
| **Raw Pass-Through** | Every DTO includes a `raw` field preserving the complete original API response. |

---

## 3. High-Level System Architecture

CoinTrack follows a **Layered Hexagonal Architecture**.

```
                              ┌─────────────────────────┐
                              │   Frontend / Mobile     │
                              └───────────┬─────────────┘
                                          │ HTTPS/JSON
                                          ▼
                              ┌─────────────────────────┐
                              │     Load Balancer       │
                              └───────────┬─────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  RequestIdFilter│  │    JwtFilter    │  │    CorsConfiguration        │ │
│  │   (MDC Logging) │  │   (JWT Valid.)  │  │     (Cross-Origin)          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND CORE (6 Modules)                           │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │    USER     │ │  SECURITY   │ │   BROKER    │ │     PORTFOLIO       │  │
│  │  (365 lines)│ │  (628 lines)│ │  (500 lines)│ │  (2000+ lines)      │  │
│  │  TOTP 2FA   │ │  JWT Auth   │ │  OAuth Flow │ │  Sync Engine        │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  │          NOTES              │ │            COMMON                    │  │
│  │    (Personal Journal)       │ │  (Infrastructure, Utils, Exceptions)│  │
│  └─────────────────────────────┘ └─────────────────────────────────────┘  │
│                                                                             │
└──────────────────────────────┬──────────────────────────┬───────────────────┘
                               │                          │
                               ▼                          ▼
                    ┌──────────────────┐      ┌──────────────────────────┐
                    │  MongoDB Cluster │      │  External Broker APIs    │
                    │  (7 Collections) │      │  (Zerodha, Upstox, etc.) │
                    └──────────────────┘      └──────────────────────────┘
```

---

## 4. Module Directory

Each module has its own comprehensive README documentation.

| Module | Purpose | Size | README |
|--------|---------|------|--------|
| **broker** | Multi-broker abstraction, OAuth flows | 500+ lines | [broker/README.md](src/main/java/com/urva/myfinance/coinTrack/broker/README.md) |
| **common** | Shared infrastructure, exceptions, utils | 400+ lines | [common/README.md](src/main/java/com/urva/myfinance/coinTrack/common/README.md) |
| **notes** | Personal investment journal | 200+ lines | [notes/README.md](src/main/java/com/urva/myfinance/coinTrack/notes/README.md) |
| **portfolio** | Aggregation, sync engine, P&L calculation | 2000+ lines | [portfolio/README.md](src/main/java/com/urva/myfinance/coinTrack/portfolio/README.md) |
| **security** | JWT auth, TOTP encryption, Spring Security | 628 lines | [security/README.md](src/main/java/com/urva/myfinance/coinTrack/security/README.md) |
| **user** | Registration, profile, TOTP 2FA management | 750+ lines | [user/README.md](src/main/java/com/urva/myfinance/coinTrack/user/README.md) |

**Documentation:**
| Document | Purpose | Location |
|----------|---------|----------|
| Portfolio Summary Architecture | Calculation formulas, precision specs | [docs/Portfolio_Summary_Architecture.md](docs/Portfolio_Summary_Architecture.md) |
| Zerodha Master Integration | Complete Zerodha reference | [docs/zerodha/Zerodha_Master_Integration_Guide.md](docs/zerodha/Zerodha_Master_Integration_Guide.md) |
| API Field Mapping | Zerodha ↔ CoinTrack mapping | [docs/zerodha/Zerodha_CoinTrack_Mapping.md](docs/zerodha/Zerodha_CoinTrack_Mapping.md) |

---

## 5. Folder Structure

The top-level structure is partitioned by **Domain**, not by technical layer.

```
backend/src/main/java/com/urva/myfinance/coinTrack/
│
├── broker/                          # Broker Integration (500+ lines)
│   ├── controller/                  # BrokerController (OAuth endpoints)
│   ├── dto/                         # BrokerCredentials, ConnectionStatus
│   ├── model/                       # BrokerAccount (MongoDB entity)
│   ├── repository/                  # BrokerAccountRepository
│   └── service/                     # BrokerService interface + impls
│       ├── BrokerService.java       # Core abstraction
│       ├── BrokerServiceFactory.java
│       └── impl/
│           └── ZerodhaBrokerService.java
│
├── common/                          # Shared Infrastructure (400+ lines)
│   ├── config/                      # CorsConfig, EncryptionConfig
│   ├── dto/                         # ApiResponse wrapper
│   ├── exception/                   # DomainException hierarchy
│   ├── filter/                      # RequestIdFilter (MDC)
│   └── util/                        # EncryptionUtil, etc.
│
├── notes/                           # Personal Notes (200+ lines)
│   ├── controller/                  # NotesController
│   ├── model/                       # Note entity
│   ├── repository/                  # NotesRepository
│   └── service/                     # NotesService
│
├── portfolio/                       # Core Portfolio (2000+ lines)
│   ├── controller/                  # PortfolioController (12 endpoints)
│   ├── dto/                         # 21 DTOs (Summary, Holdings, Positions)
│   ├── model/                       # 10 models (CachedHolding, CachedPosition, etc.)
│   ├── repository/                  # 6 repositories
│   ├── scheduler/                   # PortfolioSyncScheduler
│   └── service/
│       ├── PortfolioSummaryService.java
│       ├── PortfolioSyncService.java
│       └── impl/
│           ├── PortfolioSummaryServiceImpl.java  # 55KB
│           └── PortfolioSyncServiceImpl.java     # 18KB
│
├── security/                        # Authentication (628 lines)
│   ├── config/                      # SecurityConfig (Spring Security)
│   ├── filter/                      # JwtFilter
│   ├── model/                       # UserPrincipal
│   ├── service/                     # JWTService, CustomerUserDetailService
│   └── util/                        # TotpEncryptionUtil (AES-256-GCM)
│
└── user/                            # User Management (750+ lines)
    ├── controller/
    │   ├── UserController.java      # 11 endpoints, 330 lines
    │   ├── TotpController.java      # 9 TOTP endpoints, 329 lines
    │   └── LoginController.java
    ├── dto/                         # 5 DTOs
    ├── model/
    │   ├── User.java                # 16 fields incl. TOTP
    │   └── BackupCode.java
    ├── repository/
    │   ├── UserRepository.java
    │   └── BackupCodeRepository.java
    └── service/
        ├── TotpService.java         # 361 lines, 14 methods
        ├── UserService.java
        ├── UserAuthenticationService.java
        └── UserProfileService.java
```

> **Rule:** `common` is the only module that should be widely imported. Avoid circular dependencies between domains.

---

## 6. Request Lifecycle

Every HTTP request traverses a strict pipeline.

```
Client          Filters         Dispatcher      Controller       Service         Repo/Broker
  │                │                │               │               │                │
  ├── GET /api ───>│                │               │               │                │
  │                ├── 1. Generate Request ID (MDC) │               │                │
  │                ├── 2. Validate JWT (JwtFilter)  │               │                │
  │                │                │               │               │                │
  │                ├─── Forward ───>│               │               │                │
  │                │                ├─── Invoke ───>│               │                │
  │                │                │               ├── getSummary->│                │
  │                │                │               │               ├── fetchHoldings│
  │                │                │               │               │<-- List<Data> -│
  │                │                │               │<-- Object ----│                │
  │                │                │<-- DTO -------│               │                │
  │                │<-- Response ---│               │               │                │
  │<-- JSON 200 ───│                │               │               │                │
```

---

## 7. Authentication & Authorization

Security is stateless and JWT-based with mandatory TOTP 2FA.

### Components
| Component | File | Purpose |
|-----------|------|---------|
| **JWTService** | `security/service/JWTService.java` | Sign/validate tokens (HMAC-SHA256) |
| **JwtFilter** | `security/filter/JwtFilter.java` | Extract Bearer token, validate |
| **SecurityConfig** | `security/config/SecurityConfig.java` | Define public/protected routes |
| **UserPrincipal** | `security/model/UserPrincipal.java` | Spring Security adapter |

### Critical Rules
- **Manual Parsing Forbidden**: Never manually parse `Authorization` headers. Use `@AuthenticationPrincipal` or `Principal`.
- **Public Routes**: Explicitly whitelisted in `SecurityConfig` (e.g., `/login`, `/register`). All others are deny-by-default.

---

## 8. TOTP 2FA System

CoinTrack enforces **mandatory TOTP 2FA** for all users.

### Components
| Component | Location | Purpose |
|-----------|----------|---------|
| **TotpController** | `user/controller/TotpController.java` | 9 TOTP endpoints |
| **TotpService** | `user/service/TotpService.java` | 361 lines, 14 methods |
| **TotpEncryptionUtil** | `security/util/TotpEncryptionUtil.java` | AES-256-GCM encryption |
| **BackupCode** | `user/model/BackupCode.java` | One-time recovery codes |

### TOTP Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOWS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  REGISTRATION (New Users)                                       │
│  ─────────────────────────                                      │
│  1. POST /api/auth/register → { tempToken }                    │
│  2. POST /api/auth/2fa/register/setup → { qrCode, secret }     │
│  3. User scans QR in authenticator app                         │
│  4. POST /api/auth/2fa/register/verify → { token, backupCodes }│
│  5. User saved to DB, authenticated                            │
│                                                                 │
│  LOGIN (Existing Users)                                         │
│  ──────────────────────                                         │
│  1. POST /api/auth/login → { requiresOtp: true, tempToken }    │
│  2. POST /api/auth/2fa/login → { token, user }                 │
│                                                                 │
│  RECOVERY (Lost Authenticator)                                  │
│  ─────────────────────────────                                  │
│  1. POST /api/auth/login → { requiresOtp: true, tempToken }    │
│  2. POST /api/auth/2fa/recovery → { token, user }              │
│     (uses one-time backup code instead of TOTP)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Security Measures
| Measure | Implementation |
|---------|----------------|
| **Secret Encryption** | AES-256-GCM via `TotpEncryptionUtil` |
| **Backup Codes** | 10 codes, BCrypt hashed, one-time use |
| **Rate Limiting** | 5 failed attempts → 15-minute lockout |
| **Temp Tokens** | 5-minute expiry for TOTP verification |

---

## 9. Broker Integration

The **Broker Module** isolates the system from 3rd-party API chaos.

### BrokerService Abstraction
```java
public interface BrokerService {
    boolean validateConnection(BrokerAccount account);
    List<CachedHolding> fetchHoldings(BrokerAccount account);
    List<CachedPosition> fetchPositions(BrokerAccount account);
}
```

### Factory Pattern
```java
BrokerService service = factory.getService(Broker.ZERODHA);
```

### Supported Brokers
| Broker | Status | OAuth | Holdings | Positions | MF |
|--------|--------|-------|----------|-----------|-----|
| Zerodha | ✅ Complete | ✅ | ✅ | ✅ | ✅ |
| Upstox | 🚧 Pending | ✅ | ✅ | ✅ | ❌ |
| AngelOne | 🚧 Pending | ✅ | ✅ | ✅ | ❌ |

### Token Lifecycle
1. **Connect**: OAuth exchange → tokens encrypted & saved
2. **Expiry**: Most tokens expire daily (~6 AM IST)
3. **Re-Auth**: Backend detects 401/403 → marks `REQUIRES_REAUTH`

---

## 10. Portfolio & Sync Architecture

This is the system's "Heartbeat".

### Core Concepts
| Concept | Description |
|---------|-------------|
| **Holdings** | Long-term delivery assets (Stocks, ETFs) |
| **Positions** | Intraday or F&O contracts |
| **Sync** | Pull data from Broker → Cache in MongoDB |

### Sync Strategy: Cache-First
1. **User Request**: Returns data from MongoDB (fast, ms latency)
2. **Background Sync**: Updates MongoDB from Broker APIs

### Holdings-Only Rule
**Positions are EXCLUDED from portfolio summary totals** to maintain mathematical consistency:
- `Total Day Gain = Total Current Value - Total Previous Value`
- Positions lack stable "Previous Close" concept

### Zerodha Guardrails (CRITICAL)
| Rule | Reason |
|------|--------|
| **No Re-computation** | Never recompute values Zerodha provides (`m2m`, `pnl`) |
| **F&O Safety** | Never use `quantity * price` for derivatives |
| **Current Value** | `Invested + Total P&L` (not `qty × price`) |
| **Day Gain** | Use `m2m` directly from broker |

---

## 11. Error Handling Strategy

Global exception handling via `@RestControllerAdvice`.

### Exception Hierarchy
| Exception | HTTP Status | Use Case |
|-----------|-------------|----------|
| `DomainException` | varies | Base class |
| `AuthenticationException` | 401 | Bad credentials |
| `ExternalServiceException` | 502 | Broker API down |
| `ValidationException` | 400 | Bad input |

### Response Format
```json
{
  "success": false,
  "error": {
    "code": "BROKER_CONNECTION_FAILED",
    "message": "Zerodha API rejected the token."
  },
  "requestId": "a1b2-c3d4"
}
```

> **Rule**: Never expose Java stack traces to the client.

---

## 12. Logging Strategy

SLF4J with **MDC (Mapped Diagnostic Context)**.

### Principles
1. **Correlation**: Every log line includes `[requestId=...]`
2. **Sanitization**: Never log `access_token`, `password`, `api_secret`
3. **Levels**: INFO (business), WARN (recoverable), ERROR (failures)

### Example
```
INFO  [requestId=abc-123] c.u.m.c.u.s.UserAuthenticationService : Login successful for user: urva123
ERROR [requestId=xyz-789] c.u.m.c.b.s.i.ZerodhaBrokerService : Broker sync failed - TokenException
```

---

## 13. Configuration & Environments

### Files
- `application.properties`: Default structure
- `application-dev.properties`: Local DB, debug logging
- `application-prod.properties`: Remote DB, info logging

### Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `JWT_SECRET` | Yes | JWT signing key |
| `ENCRYPTION_KEY` | Yes | AES encryption key |
| `ENCRYPTION_SALT` | Yes | AES salt |
| `MONGODB_URI` | Yes | Database connection |
| `totp.encryption-key` | Yes | TOTP secret encryption |

> **Commit Rule**: Never commit real credentials to Git.

---

## 14. Testing Strategy

### Philosophy
- **Unit Tests**: Test logic in isolation. Mock all dependencies.
- **Integration Tests**: Test Controller → Service → DB flow.

### Mocking
```java
@MockBean
private ZerodhaBrokerService zerodhaService;

when(zerodhaService.fetchHoldings(any())).thenReturn(mockHoldings);
```

---

## 15. Extension Guide

### Adding a New Broker (e.g., Groww)
1. Add `GROWW` to `Broker` Enum
2. Create `GrowwBrokerService` implementing `BrokerService`
3. Implement `fetchHoldings` and `fetchPositions`
4. Register in `BrokerServiceFactory`
5. Add `GrowwCredentialsDTO`

### Adding a New Domain
1. Create folder under `coinTrack/newdomain`
2. Create subfolders: `controller`, `service`, `repository`, `model`
3. Add `README.md` for that domain

---

## 16. Anti-Patterns (STRICTLY FORBIDDEN)

| Anti-Pattern | Why Forbidden |
|--------------|---------------|
| Business Logic in Controllers | Hard to test, duplicates logic |
| Manual JWT Parsing | Vulnerable to spoofing |
| `e.printStackTrace()` | Clutters logs, security risk |
| God Services | Creates tight coupling |
| Hardcoded Secrets | Security vulnerability |
| Frontend Math | Inconsistent calculations |

---

## 17. Deployment & Runtime

### Startup Sequence
1. Spring Context loads
2. DB Connection established
3. `BrokerServiceFactory` initializes broker maps

### Resilience
- **Stateless**: Can scale horizontally behind Load Balancer
- **DB Down**: API returns 500
- **Broker Down**: API returns 502, internal systems stable

---

## 18. Codebase Statistics

| Metric | Value |
|--------|-------|
| **Total Modules** | 6 |
| **Total Source Files** | ~80+ |
| **Total Lines of Code** | ~8,000+ |
| **API Endpoints** | ~40+ |
| **MongoDB Collections** | 7 |
| **DTOs** | 30+ |

### Key Files by Size
| File | Size | Lines |
|------|------|-------|
| PortfolioSummaryServiceImpl.java | 55KB | 1,500+ |
| PortfolioSyncServiceImpl.java | 18KB | 500+ |
| AuthContext.js (Frontend) | 13KB | 365 |
| TotpService.java | 12KB | 361 |
| ZerodhaBrokerService.java | 10KB | 300+ |

---

## 19. Documentation Index

### Module READMEs
| Module | Location | Lines |
|--------|----------|-------|
| Broker | [broker/README.md](src/main/java/com/urva/myfinance/coinTrack/broker/README.md) | 500+ |
| Common | [common/README.md](src/main/java/com/urva/myfinance/coinTrack/common/README.md) | 600+ |
| Notes | [notes/README.md](src/main/java/com/urva/myfinance/coinTrack/notes/README.md) | 220+ |
| Portfolio | [portfolio/README.md](src/main/java/com/urva/myfinance/coinTrack/portfolio/README.md) | 700+ |
| Security | [security/README.md](src/main/java/com/urva/myfinance/coinTrack/security/README.md) | 628 |
| User | [user/README.md](src/main/java/com/urva/myfinance/coinTrack/user/README.md) | 750+ |

### Docs Directory
| Document | Location | Lines |
|----------|----------|-------|
| Docs Index | [docs/README.md](docs/README.md) | 160+ |
| Portfolio Summary | [docs/Portfolio_Summary_Architecture.md](docs/Portfolio_Summary_Architecture.md) | 389 |
| Zerodha Master Guide | [docs/zerodha/Zerodha_Master_Integration_Guide.md](docs/zerodha/Zerodha_Master_Integration_Guide.md) | 671 |

### Related
- [Frontend Documentation](../frontend/docs/README.md)

---

## Final Notes for Maintainers

You are the custodian of a financial system. User trust is our currency.

1. **Review Carefully**: One bad import can break banking-grade architecture
2. **Respect the Layers**: Don't bypass Service layer from Controllers
3. **Security is Everyone's Job**: Fix hardcoded secrets immediately

*Build securely. Code cleanly.*

**CoinTrack Backend Engineering**

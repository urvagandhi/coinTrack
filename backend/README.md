# CoinTrack Backend Architecture & Developer Guide

> **Version**: 1.0.0
> **Status**: Production-Ready
> **Tech Stack**: Java 21, Spring Boot 3.2, MongoDB, Spring Security (JWT)

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

---

## 2. Key Architectural Principles

We strictly adhere to **Domain-Driven Design (DDD)** and **Separation of Concerns**. This is not just valid code; it is *maintainable* code.

| Principle | Why it matters in CoinTrack |
|-----------|-----------------------------|
| **Domain-Driven Design** | Finance is complex. Code structure (`portfolio`, `broker`) must match business language to prevent logic errors. |
| **Separation of Concerns** | `User` module shouldn't know about `Zerodha` APIs. Keeps the codebase modular and testable. |
| **Thin Controllers** | Controllers only handle HTTP translation. All logic resides in Services. Prevents "spaghetti code" in endpoints. |
| **Rich Domain Models** | Entities (`BrokerAccount`) contain business logic validation, not just getters/setters. |
| **Security-First** | "Trust nothing." Tokens are validated on *every* request. Secrets are *never* cleartext. |
| **Provider Pattern** | Adding a new broker (e.g., Groww) should not require changing existing portfolio logic. |

---

## 3. High-Level System Architecture

CoinTrack follows a **Layered Hexagonal Architecture**.

```text
[Frontend / Mobile]
       │
       │ HTTPS/JSON
       ▼
 [Load Balancer]
       │
       ▼
 [Security Layer] (JwtFilter / RequestIdFilter)
       │
       │ Auth Principal
       ▼
┌────────────────────── BACKEND CORE ──────────────────────┐
│                                                          │
│   [Controllers] (Application Layer)                      │
│         │                                                │
│         ▼                                                │
│   [Services] ──────────────────────────┐                 │
│         │                              │                 │
│         ▼                              ▼                 │
│   [Rich Models]                 [Broker Factory]         │
│         │                         (Domain Layer)         │
│         │                              │                 │
│         ▼                              ▼                 │
│   [Repositories]                 [Broker SDKs]           │
│ (Infrastructure)                (Infrastructure)         │
│                                                          │
└─────────┬──────────────────────────────┬─────────────────┘
          │                              │
          ▼                              ▼
  [(MongoDB Cluster)]          [External Broker APIs]
```

---

## 4. Folder Structure

The top-level structure is partitioned by **Domain**, not by technical layer (e.g., we do NOT have a top-level `controllers` folder).

| Module | Description | Dependencies |
|--------|-------------|--------------|
| `common/` | Shared infrastructure (Exceptions, Response wrappers, Utils). | None (Base layer) |
| `security/` | Auth logic, JWT filters, UserPrincipal extraction. | `user`, `common` |
| `user/` | Registration, Profile management, Credentials. | `security`, `common` |
| `broker/` | **Core:** Abstraction over external APIs (Zerodha, etc.). | `common`, `security` |
| `portfolio/` | **Core:** Aggregation logic, Sync engine, P&L calc. | `broker`, `common` |
| `notes/` | User annotations feature. | `security`, `common` |

> **Rule:** `common` is the only module that should be widely imported. Avoid circular dependencies between domains (e.g., `broker` should not depend on `portfolio`).

---

## 5. Request Lifecycle

Every HTTP request traverses a strict pipeline.

```text
Client          Filters         Dispatcher      Controller       Service         Repo/Broker
  │                │                │               │               │                │
  ├── GET /api ───>│                │               │               │                │
  │                ├── 1. Generate Request ID       │               │                │
  │                ├── 2. Validate JWT              │               │                │
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

## 6. Authentication & Authorization Flow

Security is stateless and JWT-based.

### Components
1. **JWT Service**: Signs tokens using `HMAC-SHA256`.
2. **JwtFilter**: Intercepts requests, extracts `Bearer` token, validates signature & expiry actions.
3. **SecurityContext**: Spring's thread-local storage. Populated ONLY if JWT is valid.

### Critical Rules
- **Manual Parsing Forbidden**: Never manually parse `Authorization` headers in controllers. Use `@AuthenticationPrincipal` or `Principal`.
- **Public Routes**: Explicitly whitelisted in `SecurityConfig` (e.g., `/login`, `/register`). All others are deny-by-default.
- **OTP Flow**:
  1. Login → Backend checks credentials.
  2. If 2FA enabled/required → Backend returns `requiresOtp: true`.
  3. Client calls `/verify-otp` -> Backend issues JWT.

---

## 7. Broker Integration Architecture

The **Broker Module** is designed to isolate the system from the chaos of 3rd-party APIs.

### The BrokerService Abstraction
All brokers must implement the `BrokerService` interface:
```java
public interface BrokerService {
    boolean validateConnection(BrokerAccount account);
    List<CachedHolding> fetchHoldings(BrokerAccount account);
    List<CachedPosition> fetchPositions(BrokerAccount account);
}
```

### The Factory Pattern
The `BrokerServiceFactory` resolves the correct implementation at runtime:
```java
BrokerService service = factory.getService(Broker.ZERODHA);
```

### Token Lifecycle
1. **Connect**: OAuth exchange happens; tokens are encrypted & saved to DB.
2. **Expiry**: Most broker tokens expire daily (e.g., 6 AM IST).
3. **Re-Auth**: The backend detects 401/403 from broker → Marks account status as `REQUIRES_REAUTH`.

---

## 8. Portfolio & Sync Architecture

This is the system's "Heartbeat".

### Core Concepts
- **Holdings**: Long-term delivery assets (Stocks, ETFs).
- **Positions**: Intraday or F&O contracts.
- **Sync**: The process of pulling data from Broker -> DB.

### Sync Strategy
We use a **Cached-First** approach.
1. **User Request**: Returns data from MongoDB (fast, ms latency).
2. **Background/Manual Sync**: Updates MongoDB from Broker APIs.

**Why?** Broker APIs are slow and rate-limited. We cannot query them on every page load.

### Safety Mechanisms
- **SyncSafetyService**: Prevents "hammering" broker APIs. Enforces a cooldown (e.g., 1 min) between syncs for the same user.

### Zerodha Guardrails (CRITICAL)
We enforce strict financial correctness rules ("The Zerodha Constitution"):
1. **No Re-computation**: Never recompute values Zerodha provides (e.g., `m2m`, `pnl`).
2. **F&O Safety**:
   - Never use `quantity * price` for derivatives.
   - `Current Value` = `Invested + Total P&L`.
   - `Day Gain` = `m2m` (from Broker).
3. **Flags**: `PortfolioSummaryResponse` includes `containsDerivatives` and `dayGainPercentApplicable` to prevent misleading UI percentages for F&O portfolios.

### Data Normalization Strategy
- **Normalized DTOs**: (e.g., `SummaryHoldingDTO`, `NetPositionDTO`)
    - CamelCase fields (`averageBuyPrice`).
    - Broker-agnostic.
    - USED by Frontend.
- **Raw DTOs**: (e.g., `KitePosition`, `FundsDTO`)
    - Snake_case fields (`average_price`, `m2m`) via `@JsonProperty`.
    - Mirror Broker API exactly.
    - INTERNAL only (mapped to Normalized DTOs before responding).
    - EXCEPTION: Some raw lists (`KiteListResponse`) are passed through if no normalization logic exists yet, but Frontend MUST handle snake_case.

---

## 9. Error Handling Strategy

We use a **Global Exception Handler** (`@RestControllerAdvice`).

### Exception Hierarchy
- `DomainException`: Base class for all handled errors.
- `AuthenticationException` (401): Bad credentials.
- `ExternalServiceException` (502): Broker API down.
- `ValidationException` (400): Bad input.

### Response Format
All errors return a standard JSON structure:
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

## 10. Logging Strategy (AUDIT-LEVEL)

We use **SLF4J** with **MDC (Mapped Diagnostic Context)**.

### Principles
1. **Correlation**: Every log line must have `[requestId=...]`.
2. **Sanitization**: Never log `access_token`, `password`, or `api_secret`. Mask them (`****`).
3. **Levels**:
   - `INFO`: Business events (Login, Sync Start, Order Placed).
   - `WARN`: Recoverable issues (Rate limit hit, Token expired).
   - `ERROR`: System failures (DB down, NPE).

### Example
```text
INFO  [requestId=abc-123] c.u.m.c.u.s.UserAuthenticationService : Login successful for user: urva123
ERROR [requestId=xyz-789] c.u.m.c.b.s.i.ZerodhaBrokerService : Broker sync failed for user: urva123 - KiteException: Token is invalid
```

---

## 11. Configuration & Environments

- **`application.properties`**: Default structure.
- **`application-dev.properties`**: Local DB, debug logging.
- **`application-prod.properties`**: Remote DB, info logging.

### Secrets Management
Secrets are injected via Environment Variables in production:
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `MONGO_URI`

> **Commit Rule**: Never commit real credentials to Git. Use placeholders in properties files.

---

## 12. Testing Strategy

### Philosophy
- **Unit Tests**: Test logic in isolation (e.g., `FnoPositionService`). Mock all dependencies.
- **Integration Tests**: Test Controller -> Service -> DB flow. Use `@SpringBootTest`.

### Mocking
We Mock external Broker APIs. We do *not* hit real Zerodha APIs during CI/CD.

```java
@MockBean
private ZerodhaBrokerService zerodhaService;

when(zerodhaService.fetchHoldings(any())).thenReturn(mockHoldings);
```

---

## 13. Extension Guide

### How to Add a New Broker (e.g., Groww)
1. Add `GROWW` to `Broker` Enum.
2. Create `GrowwBrokerService` implementing `BrokerService`.
3. Implement `fetchHoldings` and `fetchPositions` using Groww SDK/API.
4. Register service in `BrokerServiceFactory`.
5. Add `GrowwCredentialsDTO`.

### How to Add a New Domain
1. Create folder `backend/src/main/java/com/urva/myfinance/coinTrack/newdomain`.
2. Create standard subfolders: `controller`, `service`, `repository`, `model`.
3. Add `README.md` for that domain.

---

## 14. Anti-Patterns (STRICTLY FORBIDDEN)

1. **Business Logic in Controllers**: Triggers code review rejection.
   - *Why*: Hard to test, duplicates logic.
2. **Manual JWT Parsing**: Triggers rejection.
   - *Why*: Vulnerable to spoofing. Use the Security Context.
3. **`e.printStackTrace()`**: Forbidden.
   - *Why*: Clutters logs, creates security risks. Use `logger.error()`.
4. **God Services**: `UserService` must not do Portfolio logic.
   - *Why*: Creates tight coupling.

---

## 15. Deployment & Runtime

- **Startup**:
  1. Spring Context loads.
  2. DB Connection established.
  3. `BrokerServiceFactory` initializes broker maps.
- **Resilience**: The system is stateless. It can be scaled horizontally behind a Load Balancer.
- **Failure Recovery**:
  - DB Down: API returns 500.
  - Broker Down: API returns 502 (Bad Gateway), internal systems remain stable.

---

## 16. Final Notes for Maintainers

You are the custodian of a financial system. User trust is our currency.
1. **Review Carefully**: One bad generic import can break banking-grade architecture.
2. **Respect the Layers**: Don't bypass the Service layer to access Repositories from Controllers.
3. **Security is Everyone's Job**: If you see a hardcoded secret, fix it immediately.

*Build securely. Code cleanly.*

**CoinTrack Backend Engineering**

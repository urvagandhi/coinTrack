# Broker Module – CoinTrack

> **Domain**: External broker integrations (Zerodha, Angel One, Upstox)
> **Responsibility**: Connect, authenticate, and fetch portfolio data with "Raw Fidelity"
> **Version**: 3.0.0 (Hexagonal Architecture)
> **Last Updated**: 2026-08-23
>
> ⚠️ v3.0.0: The legacy `BrokerService` interface + `BrokerServiceFactory` described in earlier
> versions has been REPLACED by the hexagonal `BrokerAdapter` port + `BrokerAdapterRegistry`.
> This README now documents the current architecture, verified against source.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Controllers](#4-controllers)
5. [DTOs (Data Transfer Objects)](#5-dtos-data-transfer-objects)
6. [Models](#6-models)
7. [Services](#7-services)
8. [Repository](#8-repository)
9. [API Endpoints](#9-api-endpoints)
10. [Authentication Flows](#10-authentication-flows)
11. [Security](#11-security)
12. [Extension Guidelines](#12-extension-guidelines)
13. [Common Pitfalls](#13-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Broker module handles all integrations with external trading platforms. It serves as the **Data Transport Layer** that:

- Connects to broker APIs (Zerodha, Angel One, Upstox)
- Handles authentication (OAuth 2.0, TOTP)
- Fetches financial data without altering its truth
- Provides uniform DTO outputs regardless of broker

### 1.2 Core Philosophies

| Principle | Description |
|-----------|-------------|
| **Trust the Broker** | Use official computed values (P&L, Margins, Day Change) from brokers rather than recalculating locally. Brokers handle complex corporate actions and settlements that are hard to replicate. |
| **Raw Pass-Through** | Every DTO includes a `raw` map preserving the **entire** original JSON response. Ensures zero data loss and future-proofs against API changes. |
| **Uniform Interface** | All broker implementations conform to the same `BrokerService` interface, making them interchangeable. |
| **Fail Gracefully** | Connection issues should never crash the system; use cached data when API is unavailable. |

### 1.3 System Position

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           COINTRACK SYSTEM                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐   │
│  │  Frontend   │────▶│  Broker Module   │────▶│  External APIs      │   │
│  │  (Connect)  │     │  (This Module)   │     │  (Kite, Angel, etc) │   │
│  └─────────────┘     └──────────────────┘     └─────────────────────┘   │
│                              │                                           │
│                              │ Normalized DTOs                           │
│                              ▼                                           │
│                       ┌──────────────────┐                               │
│                       │  Portfolio       │                               │
│                       │  Module          │                               │
│                       └──────────────────┘                               │
│                              │                                           │
│                              ▼                                           │
│                       ┌──────────────────┐                               │
│                       │  MongoDB Cache   │                               │
│                       └──────────────────┘                               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Supported Brokers

| Broker | Status | OAuth Type | Implementation |
|--------|--------|------------|----------------|
| **Zerodha Kite** | ✅ Production | OAuth 2.0 (3-legged) | `adapters/zerodha/ZerodhaBrokerAdapter` |
| **Angel One** | ✅ Complete (no MF API) | API key + TOTP (no OAuth redirect) | `adapters/angelone/AngelOneBrokerAdapter` |
| **Upstox** | ✅ Complete (no MF API) | OAuth 2.0 (per-user redirectUri) | `adapters/upstox/UpstoxBrokerAdapter` |

---

## 2. Architecture

### 2.1 Layer Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BROKER MODULE LAYERS                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER                                               │  │
│  │  ├── BrokerConnectController    (/api/brokers — connect flows)  │  │
│  │  ├── BrokerStatusController     (/api/brokers — status)         │  │
│  │  └── ZerodhaBridgeController    (/zerodha/callback — redirect)  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                  │  │
│  │  ├── BrokerConnectService        (OAuth flow orchestration)     │  │
│  │  ├── BrokerStatusService         (Token validity checks)        │  │
│  │  └── ZerodhaLiveDataService      (Live quotes via Kite)         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  PORT & REGISTRY (hexagonal core)                               │  │
│  │  ├── core/port/BrokerAdapter       (THE PORT)                   │  │
│  │  ├── registry/BrokerAdapterRegistry (auto-discovery, O(1))      │  │
│  │  ├── core/capability/BrokerCapability + checker                 │  │
│  │  └── adapters/{zerodha|angelone|upstox}/                        │  │
│  │        ├── *BrokerAdapter.java                                  │  │
│  │        ├── mapper/   (broker → Canonical* mappers)              │  │
│  │        └── raw/      (broker raw API DTOs)                      │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CANONICAL MODELS (core/canonical/)                             │  │
│  │  CanonicalHolding · CanonicalPosition · CanonicalFunds ·        │  │
│  │  CanonicalMfHolding · CanonicalMfOrder (+ DataSource,           │  │
│  │  DataConfidence, Exchange, InstrumentType enums)                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  REPOSITORY / MODEL                                             │  │
│  │  ├── BrokerAccountRepository → broker_accounts                  │  │
│  │  └── normalization/ (Symbol, Exchange, Price, Date normalizers) │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
┌──────────┐  1. API Request    ┌────────────────────┐
│  Client  │───────────────────▶│ BrokerConnect-     │
│          │                    │ Controller         │
└──────────┘                    └────────────────────┘
                                         │
                                         ▼ 2. Validate JWT
                                ┌────────────────────┐
                                │ SecurityContext    │
                                │ (Extract userId)   │
                                └────────────────────┘
                                         │
                                         ▼ 3. Get/Create Account
                                ┌────────────────────┐
                                │ BrokerAccount-     │
                                │ Repository         │
                                └────────────────────┘
                                         │
                                         ▼ 4. Execute Operation
                                ┌────────────────────┐
                                │ BrokerService-     │
                                │ Factory            │
                                └────────────────────┘
                                         │
                                         ▼ 5. Route to Implementation
                                ┌────────────────────┐
                                │ ZerodhaBroker-     │
                                │ Service            │
                                └────────────────────┘
                                         │
                                         ▼ 6. External API Call
                                ┌────────────────────┐
                                │ api.kite.trade     │
                                └────────────────────┘
```

---

## 3. Directory Structure

```
broker/
├── README.md
│
├── adapters/                        # Hexagonal adapter implementations
│   ├── zerodha/
│   │   ├── ZerodhaBrokerAdapter.java
│   │   ├── mapper/                  # Zerodha → Canonical* mappers
│   │   └── raw/                     # Zerodha raw API DTOs (13 files)
│   ├── angelone/
│   │   ├── AngelOneBrokerAdapter.java
│   │   ├── mapper/                  # 3 mappers (Holding, Position, Funds)
│   │   └── raw/                     # 3 raw DTOs
│   └── upstox/
│       ├── UpstoxBrokerAdapter.java
│       ├── mapper/                  # 3 mappers
│       └── raw/                     # 3 raw DTOs
│
├── core/                            # Ports & domain
│   ├── canonical/                   # CanonicalHolding, CanonicalPosition,
│   │                                #   CanonicalFunds, CanonicalMf*,
│   │                                #   DataSource, DataConfidence, Exchange…
│   ├── capability/                  # BrokerCapability enum + checker
│   ├── exception/                   # Broker-specific exceptions
│   ├── port/                        # BrokerAdapter interface (THE PORT)
│   └── session/                     # BrokerSession, per-broker credentials
│
├── controller/
│   ├── BrokerConnectController.java # /api/brokers connect flows
│   ├── BrokerStatusController.java  # /api/brokers status
│   └── ZerodhaBridgeController.java # /zerodha/callback redirect bridge
│
├── dto/                             # BrokerAccountDTO, credential DTOs
├── model/                           # BrokerAccount, Broker enum, ExpiryReason
├── normalization/                   # Symbol, Exchange, Price, Date normalizers
├── registry/                        # BrokerAdapterRegistry (auto-discovery)
├── repository/                      # BrokerAccountRepository
└── service/
    ├── BrokerConnectService.java    # Connection flow interface
    ├── BrokerStatusService.java     # Status check interface
    ├── ZerodhaLiveDataService.java  # Live quotes via Kite WebSocket/API
    ├── exception/                   # BrokerException
    └── impl/
        ├── BrokerConnectServiceImpl.java
        └── BrokerStatusServiceImpl.java
```

---

## 4. Controllers

### 4.1 BrokerConnectController

**Location**: `controller/BrokerConnectController.java`
**Base Path**: `/api/brokers`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{broker}/connect` | GET | Get OAuth login URL (Zerodha; Upstox needs saved credentials) |
| `/zerodha/credentials` | POST | Save Zerodha API key/secret |
| `/upstox/credentials` | POST | Save Upstox apiKey/secret/redirectUri |
| `/angelone/credentials` | POST | Save Angel One credentials |
| `/angelone/connect` | POST | Angel One connect (no OAuth redirect — TOTP-based) |
| `/angelone/disconnect` | POST | Remove Angel One connection |
| `/callback` | POST | Exchange request_token for access_token |
| `/zerodha/callback` | GET | Zerodha callback handler |

### 4.2 BrokerStatusController

**Location**: `controller/BrokerStatusController.java`
**Base Path**: `/api/brokers`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{broker}/status` | GET | Get connection status |

**Key Responsibilities**:
- Return connection status (CONNECTED, DISCONNECTED, TOKEN_EXPIRED)
- Report last sync timestamps
- Check token validity

### 4.3 ZerodhaBridgeController

**Location**: `controller/ZerodhaBridgeController.java`
**Base Path**: `/zerodha/callback` (root-level — no `/api` prefix)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/zerodha/callback` | GET | Redirect OAuth callback to frontend |

**Purpose**: Zerodha redirects here with `request_token`. The controller resolves the
frontend URL from the `frontend.url` property (via `UrlResolverUtil`) and 302-redirects to
`{frontend.url}/brokers/zerodha/callback?request_token=...`, where the frontend then POSTs
`/api/brokers/callback` to exchange the token.

---

## 5. DTOs (Data Transfer Objects)

### 5.1 Credential DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `ZerodhaCredentialsDTO` | `apiKey`, `apiSecret` | Zerodha Kite Connect credentials |
| `AngelOneCredentialsDTO` | `apiKey`, `clientId`, `password`, `totp` | Angel One SmartAPI credentials |
| `UpstoxCredentialsDTO` | `apiKey`, `apiSecret`, `redirectUri`, `authCode` | Upstox credentials |

### 5.2 Response DTOs

| DTO | Fields | Purpose |
|-----|--------|---------|
| `BrokerAccountDTO` | `broker`, `userId`, `status`, `lastSync`, `credentials` | Account overview |
| `BrokerStatusResponse` | `isConnected`, `status`, `message`, `lastSync` | Connection status |

---

## 6. Models

### 6.1 Broker Enum

```java
public enum Broker {
    ZERODHA,
    ANGELONE,
    UPSTOX
}
```

### 6.2 BrokerAccount Entity

**Collection**: `broker_accounts`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | MongoDB ObjectId |
| `userId` | String | CoinTrack internal user ID |
| `brokerUserId` | String | User ID from broker (e.g., Zerodha client ID) |
| `broker` | Broker | Enum: which broker |
| `zerodhaApiKey` | String | Zerodha API key |
| `encryptedZerodhaApiSecret` | String | Encrypted API secret |
| `zerodhaAccessToken` | String | Current session token |
| `zerodhaTokenExpiresAt` | LocalDateTime | Token expiry (typically next 6 AM) |
| `lastSuccessfulSync` | LocalDateTime | Last successful data fetch |
| `lastHoldingsSync` | LocalDateTime | Granular: last holdings sync |
| `lastPositionsSync` | LocalDateTime | Granular: last positions sync |
| `lastMfHoldingsSync` | LocalDateTime | Granular: last MF holdings sync |
| `isActive` | Boolean | Account enabled/disabled |

**Utility Methods**:
- `hasCredentials()` - Check if API credentials are stored
- `hasValidToken()` - Check if access token exists and not expired
- `isTokenExpired()` - Check against expiry timestamp
- `getAccountStatus()` - Return comprehensive status map

### 6.3 ExpiryReason Enum

```java
public enum ExpiryReason {
    NONE,                    // Token is valid
    SESSION_EXPIRED,         // Normal expiry (6 AM cutoff)
    INVALID_TOKEN,           // Token rejected by broker
    USER_LOGOUT,             // User logged out from broker
    PASSWORD_CHANGE,         // Broker password was changed
    FORCED_LOGOUT,           // Broker forced logout (security)
    UNKNOWN                  // Unrecognized expiry reason
}
```

---

## 7. Services

### 7.1 BrokerAdapter Port

**Location**: `core/port/BrokerAdapter.java`

This is the **hexagonal port** that all broker adapters implement. Methods return
`CompletableFuture<Canonical*>`:

```java
public interface BrokerAdapter {
    Broker getBrokerType();
    Set<BrokerCapability> getCapabilities();

    CompletableFuture<List<CanonicalHolding>> fetchHoldings(BrokerSession session);
    CompletableFuture<List<CanonicalPosition>> fetchPositions(BrokerSession session);
    CompletableFuture<CanonicalFunds> fetchFunds(BrokerSession session);

    // MF operations (default: throw UnsupportedBrokerOperationException)
    CompletableFuture<List<CanonicalMfHolding>> fetchMfHoldings(BrokerSession session);
    CompletableFuture<List<CanonicalMfOrder>> fetchMfOrders(BrokerSession session);
}
```

### 7.2 Verified Capability Matrix (from each adapter's `getCapabilities()`)

| Capability | Zerodha | Angel One | Upstox |
|---|---|---|---|
| EQUITY_HOLDINGS | ✅ | ✅ | ✅ |
| INTRADAY / FNO / OVERNIGHT_POSITIONS | ✅ | ✅ | ✅ |
| FUNDS | ✅ | ✅ | ✅ |
| ORDER_HISTORY / TRADE_HISTORY | ✅ | ✅ | ✅ |
| MF_HOLDINGS / MF_ORDERS / MF_SIPS | ✅ | ❌ (no MF API) | ❌ (no MF API) |
| LIVE_QUOTES | ✅ | ❌ | ❌ |

### 7.3 BrokerAdapterRegistry (Auto-Discovery)

Collects all `BrokerAdapter` beans at startup; O(1) lookup by broker type:

```java
BrokerAdapter adapter = registry.getAdapter(Broker.ZERODHA);
```

Before calling any fetch, `BrokerCapabilityChecker` verifies the adapter declares support.

### 7.4 Adapter Implementations

| Adapter | Notes |
|---|---|
| `adapters/zerodha/ZerodhaBrokerAdapter.java` | Full Kite Connect integration via WebClient: holdings, positions (intraday/F&O/overnight), funds, orders/trades, MF holdings/orders/SIPs, live quotes. Token exchange at `/session/token`. |
| `adapters/angelone/AngelOneBrokerAdapter.java` | SmartAPI: holdings, positions, funds, order/trade history. No OAuth redirect — credentials + TOTP based. |
| `adapters/upstox/UpstoxBrokerAdapter.java` | Upstox v2 OAuth with per-user stored `redirectUri`: holdings, positions, funds, order/trade history. |

### 7.5 Connection Services

- `BrokerConnectServiceImpl` — orchestrates connect flows (login URLs, token exchange,
  disconnect). Angel One has no OAuth redirect (clients POST `/api/brokers/angelone/connect`);
  Upstox requires per-user apiKey/secret/redirectUri saved first.
- `BrokerStatusServiceImpl` — token validity checks; Zerodha tokens expire daily ~6 AM IST.
- `ZerodhaLiveDataService` — live market data for Zerodha-connected accounts.

---

## 8. Repository

### BrokerAccountRepository

**Location**: `repository/BrokerAccountRepository.java`
**Extends**: `MongoRepository<BrokerAccount, String>`

| Method | Description |
|--------|-------------|
| `findByUserId(String userId)` | Find all accounts for user |
| `findByUserIdAndBroker(String userId, Broker broker)` | Find specific broker account |
| `findByBrokerAndIsActiveTrue(Broker broker)` | Find all active accounts for broker |

---

## 9. API Endpoints

### 9.1 Connection Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/brokers/{broker}/credentials` | JWT | Save API credentials (per-broker DTOs) |
| GET | `/api/brokers/{broker}/connect` | JWT/public* | Get OAuth login URL |
| POST | `/api/brokers/angelone/connect` | Public (whitelisted) | Angel One connect |
| POST | `/api/brokers/angelone/disconnect` | Public (whitelisted) | Angel One disconnect |
| POST | `/api/brokers/callback` | JWT | Exchange token (body: `{broker, requestToken}`) |
| GET | `/api/brokers/zerodha/callback` | Public (whitelisted) | Zerodha callback handler |

\* Zerodha/AngelOne `connect` and `login-url` routes are explicitly whitelisted in SecurityConfig.

### 9.2 Status

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/brokers/{broker}/status` | JWT | Get connection status |

### 9.3 OAuth Callback Bridge

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/zerodha/callback` | None | Redirect from Zerodha → Frontend (`frontend.url` based) |

---

## 10. Authentication Flows

### 10.1 Zerodha OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ZERODHA OAUTH 2.0 FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STEP 1: User saves credentials                                        │
│  ─────────────────────────────────                                      │
│  POST /api/brokers/zerodha/credentials                                  │
│  Body: { "apiKey": "xxx", "apiSecret": "yyy" }                         │
│  → Encrypted and saved to broker_accounts                               │
│                                                                         │
│  STEP 2: Get login URL                                                  │
│  ─────────────────────                                                  │
│  GET /api/brokers/zerodha/connect                                       │
│  Response: { "loginUrl": "https://kite.zerodha.com/connect/login?..." } │
│                                                                         │
│  STEP 3: User logs in at Zerodha (in browser)                          │
│  ───────────────────────────────────────────                            │
│  User enters credentials + TOTP at Zerodha                              │
│  Zerodha redirects to callback URL with request_token                   │
│                                                                         │
│  STEP 4: Callback redirect                                              │
│  ─────────────────────                                                  │
│  GET /zerodha/callback?request_token=xxx&status=success (backend, root path)             │
│  → ZerodhaBridgeController redirects to:                                │
│    {frontend.url}/brokers/zerodha/callback?request_token=xxx       │
│                                                                         │
│  STEP 5: Frontend exchanges token                                       │
│  ──────────────────────────────                                         │
│  POST /api/brokers/callback                                             │
│  Body: { "broker": "zerodha", "requestToken": "xxx" }                  │
│  → Backend calls Zerodha /session/token                                 │
│  → Receives access_token (valid until next 6 AM)                        │
│  → Saves encrypted to broker_accounts                                   │
│                                                                         │
│  STEP 6: Connection established                                         │
│  ───────────────────────────                                            │
│  Status = CONNECTED                                                     │
│  Can now call /api/portfolio/* endpoints                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Token Lifecycle

| Event | When | Action Required |
|-------|------|-----------------|
| Token Created | After OAuth completion | None |
| Token Valid | Until ~6:00 AM next day | API calls work |
| Token Expired | After 6:00 AM | User must re-login |
| Forced Logout | Broker security event | User must re-login |

---

## 11. Security

### 11.1 Authentication

- All endpoints require valid JWT in `Authorization: Bearer <token>` header
- User ID extracted from SecurityContext
- Cross-user access prevented at repository level

### 11.2 Secrets Management

| Secret | Storage | Encryption |
|--------|---------|------------|
| API Key | Plain text | Not sensitive |
| API Secret | Encrypted | AES via EncryptionUtil |
| Access Token | Encrypted | AES via EncryptionUtil |

**Encryption Flow**:
```java
// Encryption (before save)
String encrypted = encryptionUtil.encrypt(plainApiSecret);
account.setEncryptedZerodhaApiSecret(encrypted);

// Decryption (at API call time only)
String decrypted = encryptionUtil.decrypt(account.getEncryptedZerodhaApiSecret());
```

### 11.3 Logging Policy

| Data | Logged? |
|------|---------|
| API Key | ❌ NEVER |
| API Secret | ❌ NEVER |
| Access Token | ❌ NEVER |
| Request Token | Masked (last 4 chars only) |
| Broker User ID | ✅ Yes (for debugging) |
| Error Messages | ✅ Yes |

---

## 12. Extension Guidelines

### 12.1 Adding a New Broker

1. **Add Enum Value**:
   ```java
   public enum Broker {
       ZERODHA,
       ANGELONE,
       UPSTOX,
       NEW_BROKER  // Add here
   }
   ```

2. **Create Credentials DTO**:
   ```java
   // dto/NewBrokerCredentialsDTO.java
   public class NewBrokerCredentialsDTO {
       private String apiKey;
       private String apiSecret;
       // Broker-specific fields
   }
   ```

3. **Implement BrokerService**:
   ```java
   // service/impl/NewBrokerService.java
   @Service
   public class NewBrokerService implements BrokerService {
       // Implement all 16 methods
   }
   ```

4. **Register in Factory**:
   ```java
   public BrokerService getService(Broker broker) {
       return switch (broker) {
           case ZERODHA -> zerodhaBrokerService;
           case NEW_BROKER -> newBrokerService;  // Add here
           // ...
       };
   }
   ```

5. **Add Controller Endpoints** (if OAuth flow differs)

6. **Write Integration Tests**

### 12.2 Non-Negotiable Rules

| Rule | Rationale |
|------|-----------|
| Always preserve `raw` JSON | Zero data loss, future-proofs API changes |
| Never store secrets in plain text | Security requirement |
| Always check token expiry before API calls | Prevent 401 errors |
| Use BigDecimal for financial values | Precision requirement |
| Log errors, never secrets | Security + debuggability |

---

## 13. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Hardcoding URLs | Environment drift between dev/prod | Use `@Value` / `application.yml` |
| Ignoring Token Expiry | 401 errors, user confusion | Check `isTokenExpired()` before calls |
| Rounding in Service Layer | Data mismatch with broker | Store `BigDecimal` exactly as received |
| Dropping Unknown Fields | Audit gaps, data loss | Always use `Map<String, Object> raw` |
| Logging Secrets | Security breach | Mask sensitive data in logs |
| Assuming Token is Valid | Race conditions | Always validate before use |
| Blocking on API Calls | Thread exhaustion | Use async/timeouts for external calls |

---

## Appendix A: File Size Reference

| File | Size | Lines | Notes |
|------|------|-------|-------|
| ZerodhaBrokerService.java | 40KB | ~1200 | Production implementation |
| BrokerConnectController.java | 11KB | ~300 | Main controller |
| AngelOneBrokerService.java | 6.5KB | ~200 | Partial implementation |
| UpstoxBrokerService.java | 6.5KB | ~200 | Partial implementation |
| BrokerConnectServiceImpl.java | 4.9KB | ~150 | OAuth orchestration |
| BrokerAccount.java | 3.7KB | ~130 | Entity model |

---

## Appendix B: Related Documentation

- ~~Zerodha Master Integration Guide~~ (file no longer exists in the repo)
- ~~Portfolio Summary Architecture~~ (file no longer exists in the repo)
- ~~Zerodha Holdings Architecture~~ (file no longer exists in the repo)
- ~~Zerodha MF Orders Architecture~~ (file no longer exists in the repo)

---

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with accurate structure |
| 1.0.0 | 2025-12-14 | Initial documentation |

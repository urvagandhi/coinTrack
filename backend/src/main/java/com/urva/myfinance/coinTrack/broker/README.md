# Broker Module – CoinTrack

> **Domain**: External broker integrations (Zerodha, Angel One, Upstox)
> **Responsibility**: Connect, authenticate, and fetch portfolio data with "Raw Fidelity"
> **Version**: 2.0.0
> **Last Updated**: 2025-12-17

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
| **Zerodha Kite** | ✅ Production | OAuth 2.0 (3-legged) | `ZerodhaBrokerService` |
| **Angel One** | 🚧 Partial | OAuth + TOTP | `AngelOneBrokerService` |
| **Upstox** | 🚧 Partial | OAuth 2.0 | `UpstoxBrokerService` |

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
│  │  ├── BrokerConnectController    (Credentials, OAuth init)      │  │
│  │  ├── BrokerStatusController     (Connection status)            │  │
│  │  └── ZerodhaBridgeController    (OAuth callback redirect)      │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                  │  │
│  │  ├── BrokerService (Interface)   ◄─── Factory Pattern           │  │
│  │  │   ├── ZerodhaBrokerService    (40KB, full implementation)   │  │
│  │  │   ├── AngelOneBrokerService   (partial)                     │  │
│  │  │   └── UpstoxBrokerService     (partial)                     │  │
│  │  ├── BrokerConnectService        (OAuth flow orchestration)    │  │
│  │  ├── BrokerStatusService         (Token validity checks)       │  │
│  │  └── BrokerServiceFactory        (Service selection)           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  REPOSITORY LAYER                                               │  │
│  │  └── BrokerAccountRepository     (MongoDB CRUD)                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  MODEL LAYER                                                    │  │
│  │  ├── BrokerAccount     (Entity: connection credentials)        │  │
│  │  ├── Broker            (Enum: ZERODHA, ANGELONE, UPSTOX)       │  │
│  │  └── ExpiryReason      (Enum: token expiry reasons)            │  │
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
├── README.md                          # This file
│
├── controller/                        # REST Controllers (3 files)
│   ├── BrokerConnectController.java   # OAuth flows, credential management
│   ├── BrokerStatusController.java    # Connection status endpoints
│   └── ZerodhaBridgeController.java   # Zerodha OAuth callback redirect
│
├── dto/                               # Data Transfer Objects (5 files)
│   ├── BrokerAccountDTO.java          # Account summary response
│   ├── BrokerStatusResponse.java      # Connection status response
│   ├── AngelOneCredentialsDTO.java    # Angel One API credentials
│   ├── UpstoxCredentialsDTO.java      # Upstox API credentials
│   └── ZerodhaCredentialsDTO.java     # Zerodha API key/secret input
│
├── model/                             # Domain Entities (3 files)
│   ├── Broker.java                    # Enum: ZERODHA, ANGELONE, UPSTOX
│   ├── BrokerAccount.java             # Entity: user's broker connection
│   └── ExpiryReason.java              # Enum: token expiry reasons
│
├── repository/                        # Data Access (1 file)
│   └── BrokerAccountRepository.java   # MongoDB repository
│
├── service/                           # Business Logic (5 interfaces + 1 package-info)
│   ├── BrokerService.java             # Core interface (16 methods)
│   ├── BrokerConnectService.java      # Connection flow interface
│   ├── BrokerStatusService.java       # Status check interface
│   ├── BrokerServiceFactory.java      # Factory for broker selection
│   ├── package-info.java              # Package documentation
│   │
│   ├── exception/                     # Custom Exceptions
│   │   └── BrokerException.java       # Broker-specific errors
│   │
│   └── impl/                          # Service Implementations (5 files)
│       ├── ZerodhaBrokerService.java      # Zerodha Kite (40KB, production)
│       ├── AngelOneBrokerService.java     # Angel One (partial)
│       ├── UpstoxBrokerService.java       # Upstox (partial)
│       ├── BrokerConnectServiceImpl.java  # OAuth orchestration
│       └── BrokerStatusServiceImpl.java   # Token validation
│
└── provider/                          # (Reserved for future use)
```

---

## 4. Controllers

### 4.1 BrokerConnectController

**Location**: `controller/BrokerConnectController.java`
**Size**: ~11KB
**Base Path**: `/api/brokers`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{broker}/credentials` | POST | Save API key/secret for broker |
| `/{broker}/credentials` | GET | Get stored credentials (masked) |
| `/{broker}/connect` | GET | Get OAuth login URL |
| `/callback` | POST | Exchange request_token for access_token |
| `/{broker}/disconnect` | DELETE | Remove broker connection |

**Key Responsibilities**:
- Accept and validate credential DTOs
- Initiate OAuth flows
- Handle token exchange callbacks
- Encrypt secrets before storage

### 4.2 BrokerStatusController

**Location**: `controller/BrokerStatusController.java`
**Size**: ~2.6KB
**Base Path**: `/api/brokers`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{broker}/status` | GET | Get connection status |
| `/connected` | GET | List all connected brokers |

**Key Responsibilities**:
- Return connection status (CONNECTED, DISCONNECTED, TOKEN_EXPIRED)
- Report last sync timestamps
- Check token validity

### 4.3 ZerodhaBridgeController

**Location**: `controller/ZerodhaBridgeController.java`
**Size**: ~0.8KB
**Base Path**: `/api/zerodha`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/callback` | GET | Redirect OAuth callback to frontend |

**Purpose**: Zerodha OAuth redirects to this endpoint. It extracts the `request_token` and redirects to the frontend (`http://localhost:3000/broker/callback?...`) with the token, where the frontend can then POST to `/api/brokers/callback`.

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

### 7.1 BrokerService Interface

**Location**: `service/BrokerService.java`
**Size**: ~2KB
**Methods**: 16

This is the **core interface** that all broker implementations must implement.

| Method | Returns | Description |
|--------|---------|-------------|
| `getBrokerName()` | String | Return broker name constant |
| `validateCredentials()` | boolean | Check if credentials are valid |
| `fetchHoldings()` | List\<CachedHolding\> | Fetch equity holdings |
| `fetchPositions()` | List\<CachedPosition\> | Fetch F&O positions |
| `fetchOrders()` | List\<OrderDTO\> | Fetch order history |
| `fetchTrades()` | List\<TradeDTO\> | Fetch trade history |
| `fetchFunds()` | FundsDTO | Fetch margin/funds data |
| `fetchMfHoldings()` | List\<MutualFundDTO\> | Fetch MF holdings |
| `fetchMfOrders()` | List\<MutualFundOrderDTO\> | Fetch MF order history |
| `fetchMfSips()` | List\<MfSipDTO\> | Fetch SIP list |
| `fetchMfInstruments()` | List\<MfInstrumentDTO\> | Fetch MF scheme catalog |
| `fetchProfile()` | UserProfileDTO | Fetch user profile |
| `testConnection()` | boolean | Verify connection works |
| `extractTokenExpiry()` | LocalDateTime | Get token expiry time |
| `getLoginUrl()` | Optional\<String\> | Get OAuth login URL |
| `refreshToken()` | Optional\<String\> | Refresh access token |
| `detectExpiry()` | ExpiryReason | Detect why token expired |

### 7.2 BrokerServiceFactory

**Pattern**: Factory Pattern
**Purpose**: Return correct `BrokerService` implementation based on broker enum.

```java
@Service
public class BrokerServiceFactory {

    public BrokerService getService(Broker broker) {
        return switch (broker) {
            case ZERODHA -> zerodhaBrokerService;
            case ANGELONE -> angelOneBrokerService;
            case UPSTOX -> upstoxBrokerService;
        };
    }
}
```

### 7.3 Implementation: ZerodhaBrokerService

**Location**: `service/impl/ZerodhaBrokerService.java`
**Size**: ~40KB (largest file in module)
**Status**: Production-ready

**Key Features**:
- Full Kite Connect API integration
- Holdings with P&L, Day Change from Zerodha
- Positions with MTM values
- Mutual Fund holdings, orders, SIPs
- MF Instruments CSV parsing
- Funds/Margins with segment breakdown
- Raw JSON preservation in all DTOs

**API Endpoints Used**:
| Purpose | Kite Endpoint |
|---------|---------------|
| Holdings | GET /portfolio/holdings |
| Positions | GET /portfolio/positions |
| Orders | GET /orders |
| Trades | GET /trades |
| Margins | GET /user/margins |
| Profile | GET /user/profile |
| MF Holdings | GET /mf/holdings |
| MF Orders | GET /mf/orders |
| MF SIPs | GET /mf/sips |
| MF Instruments | GET /mf/instruments (CSV) |

### 7.4 Implementation: BrokerConnectServiceImpl

**Purpose**: Orchestrate OAuth connection flows

**Key Methods**:
- `initiateConnection()` - Generate login URL
- `completeConnection()` - Exchange token and save
- `disconnectBroker()` - Remove connection

### 7.5 Implementation: BrokerStatusServiceImpl

**Purpose**: Token validity checks

**Key Logic**:
- Zerodha tokens expire daily at 6:00 AM IST
- Check `zerodhaTokenExpiresAt` field
- Return appropriate status enum

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
| POST | `/api/brokers/zerodha/credentials` | JWT | Save Zerodha API credentials |
| GET | `/api/brokers/zerodha/credentials` | JWT | Get credentials (secret masked) |
| GET | `/api/brokers/zerodha/connect` | JWT | Get Zerodha login URL |
| POST | `/api/brokers/callback` | JWT | Exchange token (body: `{broker, requestToken}`) |
| DELETE | `/api/brokers/zerodha/disconnect` | JWT | Remove Zerodha connection |

### 9.2 Status

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/brokers/zerodha/status` | JWT | Get connection status |
| GET | `/api/brokers/connected` | JWT | List all connected brokers |

### 9.3 OAuth Callback

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/zerodha/callback` | None | Redirect from Zerodha → Frontend |

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
│  GET /api/zerodha/callback?request_token=xxx&status=success             │
│  → ZerodhaBridgeController redirects to:                                │
│    http://localhost:3000/broker/callback?broker=zerodha&token=xxx       │
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

- [Zerodha Master Integration Guide](../../docs/zerodha/Zerodha_Master_Integration_Guide.md)
- [Portfolio Summary Architecture](../../docs/Portfolio_Summary_Architecture.md)
- [Zerodha Holdings Architecture](../../docs/zerodha/Zerodha_Holdings_Architecture.md)
- [Zerodha MF Orders Architecture](../../docs/zerodha/Zerodha_MF_Orders_Architecture.md)

---

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with accurate structure |
| 1.0.0 | 2025-12-14 | Initial documentation |

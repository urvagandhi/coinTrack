# Zerodha Kite Connect Integration - Master Guide

> **Version**: 2.0.0
> **Status**: Production-Ready
> **Last Updated**: 2025-12-17
> **Author**: CoinTrack Backend Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Authentication & Connection](#3-authentication--connection)
4. [Core Integration Components](#4-core-integration-components)
5. [API Endpoints Reference](#5-api-endpoints-reference)
6. [Data Models & DTOs](#6-data-models--dtos)
7. [Error Handling & Recovery](#7-error-handling--recovery)
8. [Rate Limiting & Throttling](#8-rate-limiting--throttling)
9. [Caching Strategy](#9-caching-strategy)
10. [Testing & Debugging](#10-testing--debugging)
11. [Troubleshooting Guide](#11-troubleshooting-guide)
12. [Quick Reference Tables](#12-quick-reference-tables)

---

## 1. Executive Summary

### 1.1 Purpose

CoinTrack integrates with **Zerodha Kite Connect API** to provide users with a unified portfolio view. This integration handles:

- **Equity Holdings** - Long-term delivery investments
- **Positions** - Intraday/F&O trades
- **Orders & Trades** - Execution history
- **Mutual Funds** - Holdings, SIPs, Orders
- **User Profile & Funds** - Account information

### 1.2 Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Trust the Broker** | Use Zerodha's computed values (P&L, Day Change) rather than recalculating locally |
| **Raw Pass-Through** | Every DTO includes a `raw` field preserving the complete original API response |
| **Zero Frontend Math** | Frontend displays values as-is; no financial calculations in the UI |
| **Graceful Degradation** | System continues operating with cached data when API is unavailable |

### 1.3 Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    CoinTrack Backend                            │
├─────────────────────────────────────────────────────────────────┤
│  Framework:      Spring Boot 3.x                                │
│  Database:       MongoDB (cached data persistence)              │
│  HTTP Client:    RestTemplate with retry interceptors           │
│  Auth:           OAuth 2.0 (Kite Connect flow)                  │
│  Scheduling:     Spring @Scheduled for sync jobs                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Overview

### 2.1 System Context Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USER                                        │
│                                │                                         │
│                                ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    COINTRACK FRONTEND                           │    │
│  │    (React/Next.js - Pure display layer, no calculations)       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                │                                         │
│                                ▼ REST API                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    COINTRACK BACKEND                            │    │
│  │  ┌───────────────┐  ┌─────────────────┐  ┌──────────────────┐  │    │
│  │  │ Portfolio     │  │ Broker          │  │ Cache            │  │    │
│  │  │ Controller    │──│ Service         │──│ Repository       │  │    │
│  │  │               │  │ (Zerodha)       │  │                  │  │    │
│  │  └───────────────┘  └─────────────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                │                                         │
│                                ▼ HTTPS                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    ZERODHA KITE CONNECT API                     │    │
│  │                    api.kite.trade                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYERS                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER                                               │  │
│  │  ├── PortfolioController.java     (/api/portfolio/*)           │  │
│  │  ├── BrokerController.java        (/api/brokers/*)             │  │
│  │  └── UserController.java          (/api/users/*)               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER                                                  │  │
│  │  ├── PortfolioSummaryServiceImpl.java  (Aggregation logic)     │  │
│  │  ├── PortfolioSyncServiceImpl.java     (Scheduled sync)        │  │
│  │  ├── ZerodhaBrokerService.java         (API integration)       │  │
│  │  └── BrokerAccountService.java         (Credential management) │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  REPOSITORY LAYER                                               │  │
│  │  ├── BrokerAccountRepository.java                               │  │
│  │  ├── CachedHoldingRepository.java                               │  │
│  │  ├── CachedPositionRepository.java                              │  │
│  │  └── CachedMf*Repository.java                                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│                              ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  PERSISTENCE (MongoDB Collections)                              │  │
│  │  ├── broker_accounts                                            │  │
│  │  ├── cached_holdings                                            │  │
│  │  ├── cached_positions                                           │  │
│  │  ├── cached_mf_holdings                                         │  │
│  │  ├── cached_mf_orders                                           │  │
│  │  └── cached_mf_sips                                             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow Sequence

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────┐
│ Frontend│     │Controller│     │   Service   │     │ MongoDB  │     │ Zerodha │
└────┬────┘     └────┬─────┘     └──────┬──────┘     └────┬─────┘     └────┬────┘
     │               │                  │                 │                │
     │  GET /summary │                  │                 │                │
     │──────────────>│                  │                 │                │
     │               │  getSummary()    │                 │                │
     │               │─────────────────>│                 │                │
     │               │                  │  Check cache    │                │
     │               │                  │────────────────>│                │
     │               │                  │  Cache MISS     │                │
     │               │                  │<────────────────│                │
     │               │                  │                 │  API Call      │
     │               │                  │─────────────────────────────────>│
     │               │                  │                 │  Raw JSON      │
     │               │                  │<─────────────────────────────────│
     │               │                  │  Persist cache  │                │
     │               │                  │────────────────>│                │
     │               │  DTO Response    │                 │                │
     │               │<─────────────────│                 │                │
     │  JSON         │                  │                 │                │
     │<──────────────│                  │                 │                │
     │               │                  │                 │                │
```

---

## 3. Authentication & Connection

### 3.1 OAuth 2.0 Flow

Zerodha uses a **3-legged OAuth 2.0** flow:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ZERODHA OAUTH FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STEP 1: User stores API credentials                                   │
│  ────────────────────────────────────                                   │
│  POST /api/brokers/zerodha/credentials                                  │
│  Body: { apiKey, apiSecret }                                            │
│  Result: Credentials encrypted & stored in broker_accounts              │
│                                                                         │
│  STEP 2: User initiates login                                          │
│  ───────────────────────────────                                        │
│  GET /api/brokers/zerodha/connect                                       │
│  Response: { loginUrl: "https://kite.zerodha.com/connect/login?..." }   │
│  User opens URL in browser → Logs into Zerodha                          │
│                                                                         │
│  STEP 3: Zerodha redirects with request_token                          │
│  ───────────────────────────────────────────                            │
│  Redirect: {callback_url}?request_token=xxx&status=success              │
│                                                                         │
│  STEP 4: Backend exchanges for access_token                            │
│  ─────────────────────────────────────────                              │
│  POST /api/brokers/callback                                             │
│  Body: { broker: "zerodha", requestToken: "xxx" }                       │
│  Backend calls Zerodha /session/token → Gets access_token               │
│  Stores encrypted access_token in broker_accounts                       │
│                                                                         │
│  STEP 5: Connection established                                        │
│  ───────────────────────────                                            │
│  Status = CONNECTED, accessToken valid for 1 trading day                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Token Management

| Token Type | Validity | Storage | Renewal |
|------------|----------|---------|---------|
| **API Key** | Permanent | `broker_accounts.apiKey` (encrypted) | Never expires |
| **API Secret** | Permanent | `broker_accounts.apiSecret` (encrypted) | Never expires |
| **Access Token** | 1 trading day (~6 AM to 3:30 AM next day) | `broker_accounts.accessToken` (encrypted) | User must re-login daily |

### 3.3 Credential Security

```java
// Encryption approach (conceptual)
@Bean
public TextEncryptor textEncryptor() {
    return Encryptors.text(secretKey, salt);
}

// Storage
brokerAccount.setApiSecret(encryptor.encrypt(rawSecret));

// Retrieval
String decrypted = encryptor.decrypt(brokerAccount.getApiSecret());
```

### 3.4 Session States

| State | Description | User Action Required |
|-------|-------------|---------------------|
| `PENDING_CREDENTIALS` | No API key/secret stored | Enter credentials |
| `PENDING_LOGIN` | Credentials stored, no access token | Complete Zerodha login |
| `CONNECTED` | Valid access token | None |
| `TOKEN_EXPIRED` | Access token expired | Re-login to Zerodha |
| `ERROR` | Connection failed | Check credentials/retry |

---

## 4. Core Integration Components

### 4.1 ZerodhaBrokerService

**Location**: `backend/src/main/java/.../service/impl/ZerodhaBrokerService.java`

**Responsibilities**:
- API communication with Kite Connect
- Raw data parsing
- DTO transformation
- Error handling

**Key Methods**:

```java
// Holdings
public List<ZerodhaHoldingRaw> fetchHoldings(BrokerAccount account);

// Positions
public List<ZerodhaPositionRaw> fetchPositions(BrokerAccount account);

// Orders & Trades
public List<Map<String, Object>> fetchOrders(BrokerAccount account);
public List<Map<String, Object>> fetchTrades(BrokerAccount account);

// Mutual Funds
public List<MfHoldingDTO> fetchMfHoldings(BrokerAccount account);
public List<MfSipDTO> fetchMfSips(BrokerAccount account);
public List<MutualFundOrderDTO> fetchMfOrders(BrokerAccount account);
public List<MfInstrumentDTO> fetchMfInstruments();

// Account
public UserProfileDTO fetchProfile(BrokerAccount account);
public FundsDTO fetchFunds(BrokerAccount account);
```

### 4.2 PortfolioSummaryServiceImpl

**Location**: `backend/src/main/java/.../service/impl/PortfolioSummaryServiceImpl.java`

**Responsibilities**:
- Aggregating holdings into portfolio summary
- Computing derived metrics (Day Gain, P&L)
- Converting cached entities to DTOs

**Key Aggregation Logic**:

```java
// Holdings-Only Aggregation (Positions excluded)
BigDecimal totalCurrentValue = holdings.stream()
    .map(h -> h.getQuantity().multiply(h.getCurrentPrice()))
    .reduce(BigDecimal.ZERO, BigDecimal::add);

BigDecimal previousDayValue = holdings.stream()
    .map(h -> h.getQuantity().multiply(h.getPreviousClose()))
    .reduce(BigDecimal.ZERO, BigDecimal::add);

BigDecimal dayGain = totalCurrentValue.subtract(previousDayValue);
```

### 4.3 PortfolioSyncServiceImpl

**Location**: `backend/src/main/java/.../service/impl/PortfolioSyncServiceImpl.java`

**Responsibilities**:
- Scheduled background sync
- Lock management (prevent concurrent syncs)
- Staleness detection

**Sync Schedule**:

```java
@Scheduled(cron = "0 */15 9-16 * * MON-FRI")  // Every 15 mins during market hours
public void marketHoursSync() { ... }

@Scheduled(cron = "0 0 6,20 * * *")  // 6 AM and 8 PM daily
public void offMarketSync() { ... }
```

---

## 5. API Endpoints Reference

### 5.1 Broker Connection Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/brokers/zerodha/credentials` | Store API key/secret | JWT |
| `GET` | `/api/brokers/zerodha/connect` | Get Zerodha login URL | JWT |
| `POST` | `/api/brokers/callback` | Exchange request_token for access_token | JWT |
| `GET` | `/api/brokers/zerodha/status` | Check connection status | JWT |
| `DELETE` | `/api/brokers/zerodha/disconnect` | Remove broker connection | JWT |

### 5.2 Portfolio Endpoints

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| `GET` | `/api/portfolio/summary` | Aggregated portfolio snapshot | `PortfolioSummaryResponse` |
| `GET` | `/api/portfolio/holdings` | Equity holdings list | `KiteListResponse<SummaryHoldingDTO>` |
| `GET` | `/api/portfolio/positions` | Positions list | `KiteListResponse<SummaryPositionDTO>` |
| `GET` | `/api/portfolio/orders` | Order history | `KiteListResponse<Map>` |
| `GET` | `/api/portfolio/trades` | Trade history | `KiteListResponse<Map>` |
| `GET` | `/api/portfolio/funds` | Margin & funds | `FundsDTO` |
| `GET` | `/api/portfolio/profile` | User profile | `UserProfileDTO` |
| `POST` | `/api/portfolio/refresh` | Force manual sync | `SyncStatus` |

### 5.3 Mutual Fund Endpoints

| Method | Endpoint | Description | Response Type |
|--------|----------|-------------|---------------|
| `GET` | `/api/portfolio/mf/holdings` | MF holdings | `KiteListResponse<MfHoldingDTO>` |
| `GET` | `/api/portfolio/mf/orders` | MF order history | `KiteListResponse<MutualFundOrderDTO>` |
| `GET` | `/api/portfolio/mf/sips` | SIP list | `KiteListResponse<MfSipDTO>` |
| `GET` | `/api/portfolio/mf/instruments` | All MF schemes | `KiteListResponse<MfInstrumentDTO>` |

---

## 6. Data Models & DTOs

### 6.1 Holdings Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HOLDINGS DATA TRANSFORMATION                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Zerodha API Response          CachedHolding (DB)      SummaryHoldingDTO│
│  ────────────────────          ──────────────────      ─────────────────│
│                                                                         │
│  { "tradingsymbol": "INFY",    symbol: "INFY"          symbol: "INFY"   │
│    "exchange": "NSE",          exchange: "NSE"         exchange: "NSE"  │
│    "quantity": 10,             quantity: 10            quantity: 10     │
│    "average_price": 1400,      averageBuyPrice: 1400   averageBuyPrice  │
│    "last_price": 1500,         lastPrice: 1500         currentPrice     │
│    "close_price": 1480,        closePrice: 1480        previousClose    │
│    "pnl": 1000,                pnl: 1000               unrealizedPL     │
│    "day_change": 200,          dayChange: 200          dayGain          │
│    "day_change_percentage": .. dayChangePercent: 1.35  dayGainPercent   │
│    ... }                       raw: {...}              raw: {...}       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Field Mapping Tables

#### Holdings

| CoinTrack Field | Zerodha Field | Type | Notes |
|-----------------|---------------|------|-------|
| `symbol` | `tradingsymbol` | String | e.g., "RELIANCE" |
| `exchange` | `exchange` | String | "NSE" or "BSE" |
| `quantity` | `quantity` | Double | Source of truth |
| `averageBuyPrice` | `average_price` | Double | Acquisition cost |
| `currentPrice` | `last_price` | Double | LTP |
| `previousClose` | `close_price` | Double | Yesterday's close |
| `unrealizedPL` | `pnl` | Double | **Official from Zerodha** |
| `dayGain` | `day_change` | Double | **Official from Zerodha** |
| `dayGainPercent` | `day_change_percentage` | Double | **Official from Zerodha** |
| `currentValue` | *computed* | Double | `quantity × currentPrice` |
| `investedValue` | *computed* | Double | `quantity × averageBuyPrice` |

#### Positions

| CoinTrack Field | Zerodha Field | Type | Notes |
|-----------------|---------------|------|-------|
| `symbol` | `tradingsymbol` | String | e.g., "NIFTY23DECFUT" |
| `exchange` | `exchange` | String | "NFO", "BFO", "CDS" |
| `quantity` | `quantity` | Double | Net quantity |
| `averagePrice` | `average_price` | Double | Entry price |
| `currentPrice` | `last_price` | Double | LTP |
| `unrealizedPL` | `pnl` | Double | Position P&L |
| `mtmPL` | `m2m` | Double | Mark-to-Market |
| `instrumentType` | `instrument_type` | String | "FUT", "CE", "PE" |
| `expiryDate` | `expiry` | String | "YYYY-MM-DD" |
| `strikePrice` | `strike` | Double | Option strike |
| `optionType` | `option_type` | String | "CE" or "PE" |

#### Mutual Fund Holdings

| CoinTrack Field | Zerodha Field | Type | Notes |
|-----------------|---------------|------|-------|
| `fund` | `fund` | String | Scheme name |
| `folio` | `folio` | String | Folio number |
| `quantity` | `quantity` | Double | Units held |
| `averagePrice` | `average_price` | Double | Avg NAV |
| `currentPrice` | `last_price` | Double | Current NAV |
| `currentValue` | `current_value` | Double | **Official** |
| `unrealizedPL` | `pnl` | Double | **Official** |

---

## 7. Error Handling & Recovery

### 7.1 Error Categories

| Category | HTTP Status | Kite Error Code | Handling |
|----------|-------------|-----------------|----------|
| **Authentication** | 401, 403 | `TokenException` | Mark session expired, prompt re-login |
| **Rate Limit** | 429 | `RateLimitExceeded` | Exponential backoff + retry |
| **Network** | 5xx, timeout | N/A | Retry with backoff, use cached data |
| **Data** | 4xx | `InputException` | Log error, return partial data |

### 7.2 Retry Strategy

```java
// Retry configuration
@Retryable(
    value = { RestClientException.class },
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2)
)
public <T> T callZerodhaApi(Supplier<T> apiCall) {
    return apiCall.get();
}
```

### 7.3 Fallback Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ERROR RECOVERY FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    Success    ┌─────────────────┐                    │
│  │  API Call    │──────────────>│  Return Fresh   │                    │
│  └──────────────┘               │  Data           │                    │
│         │                       └─────────────────┘                    │
│         │ Failure                                                       │
│         ▼                                                               │
│  ┌──────────────┐    Yes        ┌─────────────────┐                    │
│  │  Cache       │──────────────>│  Return Cached  │                    │
│  │  Available?  │               │  + Stale Flag   │                    │
│  └──────────────┘               └─────────────────┘                    │
│         │ No                                                            │
│         ▼                                                               │
│  ┌──────────────┐                                                       │
│  │  Return      │                                                       │
│  │  Empty + Err │                                                       │
│  └──────────────┘                                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Rate Limiting & Throttling

### 8.1 Zerodha API Limits

| Limit Type | Value | Scope |
|------------|-------|-------|
| **Requests/second** | 3 | Per API key |
| **Requests/minute** | 120 | Per API key |
| **Orders/day** | 3000 | Per user |

### 8.2 CoinTrack Mitigation

1. **Request Coalescing**: Multiple frontend requests for same data are coalesced
2. **Scheduled Sync**: Background sync at defined intervals, not per-request
3. **Cache-First**: API calls only on cache miss or explicit refresh
4. **User Locks**: Only one sync per user at a time

---

## 9. Caching Strategy

### 9.1 Cache Collections

| Collection | TTL | Invalidation |
|------------|-----|--------------|
| `cached_holdings` | 15 min (market hours) | Manual sync, access token refresh |
| `cached_positions` | 5 min | Manual sync |
| `cached_mf_holdings` | 1 hour | Manual sync |
| `cached_mf_orders` | 6 hours | Manual sync |
| `cached_mf_sips` | 1 hour | Manual sync |

### 9.2 Staleness Detection

```java
public boolean isStale(Instant lastSync) {
    Duration age = Duration.between(lastSync, Instant.now());
    if (isMarketHours()) {
        return age.toMinutes() > 15;
    }
    return age.toHours() > 6;
}
```

---

## 10. Testing & Debugging

### 10.1 Postman Collection

**Location**: `/CoinTrack_API_Collection.json`

**TOTP Authentication Flow**:
1. Run `Login` → Get `tempToken`
2. Run `TOTP - Login with TOTP` with code from authenticator
3. Copy `accessToken` to environment

**Zerodha Connection Flow**:
1. Run `Setup Credentials` with API key/secret
2. Run `Get Login Link` → Open URL in browser
3. Login to Zerodha → Copy `request_token` from URL
4. Run `Finalize Connection` with token
5. Run `Verify Status` → Confirm CONNECTED

### 10.2 Debug Logging

Enable detailed logging in `application.yml`:

```yaml
logging:
  level:
    com.urva.myfinance.coinTrack.broker: DEBUG
    com.urva.myfinance.coinTrack.portfolio: DEBUG
```

### 10.3 Common Debug Scenarios

| Scenario | Log Pattern | Resolution |
|----------|-------------|------------|
| Token expired | `TokenException: Invalid access token` | User re-login required |
| Missing holdings | `Holdings count: 0` | Check broker connection status |
| Stale data | `Cache age: XX minutes` | Trigger manual refresh |

---

## 11. Troubleshooting Guide

### 11.1 Connection Issues

**Problem**: "Unable to connect to Zerodha"

**Checklist**:
1. ✅ API Key and Secret are correct
2. ✅ Redirect URI matches Kite app configuration
3. ✅ User completed Zerodha login in browser
4. ✅ Request token was used within 60 seconds

### 11.2 Data Discrepancies

**Problem**: "Portfolio value doesn't match Kite app"

**Causes**:
- **Stale cache**: Trigger manual refresh
- **Market closed**: LTP frozen at previous close
- **Corporate action pending**: Split/bonus not yet reflected

### 11.3 Missing Holdings

**Problem**: "Some stocks not showing"

**Causes**:
- **T+2 settlement**: Recently purchased stocks pending settlement
- **Pledged shares**: May appear in different category
- **Sync failure**: Check logs for API errors

### 11.4 Negative P&L Accuracy

**Problem**: "Day change % seems wrong"

**Explanation**:
CoinTrack uses Zerodha's official `day_change_percentage`. If it seems wrong:
1. Zerodha may have corporate action adjustment
2. Close price may differ from expected (exchange official vs last trade)

---

## 12. Quick Reference Tables

### 12.1 Zerodha API Endpoints Used

| Purpose | Endpoint | Method |
|---------|----------|--------|
| Session Token | `/session/token` | POST |
| Holdings | `/portfolio/holdings` | GET |
| Positions | `/portfolio/positions` | GET |
| Orders | `/orders` | GET |
| Trades | `/trades` | GET |
| User Profile | `/user/profile` | GET |
| Margins | `/user/margins` | GET |
| MF Holdings | `/mf/holdings` | GET |
| MF Orders | `/mf/orders` | GET |
| MF SIPs | `/mf/sips` | GET |
| MF Instruments | `/mf/instruments` | GET (CSV) |

### 12.2 Key Configuration Properties

| Property | Default | Description |
|----------|---------|-------------|
| `zerodha.api.baseUrl` | `https://api.kite.trade` | Kite Connect base URL |
| `zerodha.api.loginUrl` | `https://kite.zerodha.com/connect/login` | OAuth login URL |
| `zerodha.sync.marketHoursCron` | `0 */15 9-16 * * MON-FRI` | Market hours sync schedule |
| `zerodha.sync.offHoursCron` | `0 0 6,20 * * *` | Off-hours sync schedule |

### 12.3 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_SECRET` | Yes | Key for encrypting stored secrets |
| `ENCRYPTION_SALT` | Yes | Salt for encryption |
| `MONGODB_URI` | Yes | MongoDB connection string |

---

## Appendix A: Related Documentation

- [Portfolio Summary Architecture](./Portfolio_Summary_Architecture.md)
- [Zerodha Holdings Architecture](./zerodha/Zerodha_Holdings_Architecture.md)
- [Zerodha MF Orders Architecture](./zerodha/Zerodha_MF_Orders_Architecture.md)
- [Zerodha MF SIPs & Instruments](./zerodha/Zerodha_MF_SIPs_Instruments_Architecture.md)
- [Zerodha CoinTrack Mapping](./zerodha/Zerodha_CoinTrack_Mapping.md)

---

## Appendix B: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Consolidated master guide created |
| 1.0.0 | 2025-12-14 | Initial documentation |

# Portfolio Module – CoinTrack

> **Domain**: Holdings, positions, mutual funds, aggregation, sync, and market data
> **Responsibility**: Consolidate user assets into a unified "Source of Truth" view
> **Version**: 2.0.0
> **Last Updated**: 2025-12-17

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Controllers](#4-controllers)
5. [DTOs](#5-dtos)
6. [Models](#6-models)
7. [Repositories](#7-repositories)
8. [Services](#8-services)
9. [Sync Engine](#9-sync-engine)
10. [Market Data](#10-market-data)
11. [F&O Module](#11-fo-module)
12. [Scheduler](#12-scheduler)
13. [API Reference](#13-api-reference)
14. [Aggregation Logic](#14-aggregation-logic)
15. [Security](#15-security)
16. [Extension Guidelines](#16-extension-guidelines)
17. [Common Pitfalls](#17-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Portfolio module is the **core** of CoinTrack. It aggregates disparate asset classes from multiple brokers into a single, cohesive dashboard providing a complete financial picture.

### 1.2 Business Problems Solved

| Problem | Solution |
|---------|----------|
| "What is my total net worth?" | **Portfolio Summary** with aggregated totals |
| "How much did my portfolio move today?" | **Day Gain** calculation from holdings |
| "Do I have enough margin?" | **Funds/Margins** endpoint |
| "What are my upcoming SIPs?" | **MF SIPs** endpoint with status |
| "Show me my complete trading history" | **Orders & Trades** endpoints |
| "How are my mutual funds performing?" | **MF Holdings, Orders, Timeline** |

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Broker Aggregation** | Combines data from Zerodha, Angel One, Upstox |
| **Holdings Only Summary** | Positions excluded for mathematical consistency |
| **Raw Data Preservation** | Every entity stores original broker JSON |
| **Background Sync** | Scheduled sync during market hours |
| **Rate Limit Protection** | 5-minute cooldown per manual sync |
| **MF Timeline** | Visual history of SIP & order events |

### 1.4 System Position

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           COINTRACK SYSTEM                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                    │
│  │   Frontend      │                                                    │
│  │   Dashboard     │                                                    │
│  └────────┬────────┘                                                    │
│           │ REST API                                                     │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     PORTFOLIO MODULE                            │   │
│  │  ┌───────────────┬───────────────┬───────────────────────────┐ │   │
│  │  │  Controllers  │    Services   │      Sync Engine          │ │   │
│  │  │  (Portfolio,  │  (Summary,    │  (Scheduled, Manual,      │ │   │
│  │  │   Refresh)    │   Positions,  │   Rate Limiting)          │ │   │
│  │  │               │   Market)     │                           │ │   │
│  │  └───────────────┴───────────────┴───────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│           │                     │                     │                 │
│           │                     ▼                     │                 │
│           │            ┌─────────────────┐            │                 │
│           │            │   MongoDB       │            │                 │
│           │            │   (Cached Data) │            │                 │
│           │            └─────────────────┘            │                 │
│           │                                           │                 │
│           ▼                                           ▼                 │
│  ┌─────────────────┐                       ┌─────────────────┐         │
│  │  Broker Module  │                       │  Scheduler      │         │
│  │  (Zerodha API)  │                       │  (Background)   │         │
│  └─────────────────┘                       └─────────────────┘         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Component Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                     PORTFOLIO MODULE LAYERS                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER (2 files)                                     │  │
│  │  ├── PortfolioController.java      (8KB, 12 endpoints)         │  │
│  │  └── ManualRefreshController.java  (2KB, refresh trigger)      │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  DTO LAYER (21 files in 2 subdirectories)                       │  │
│  │  ├── Root DTOs (7): Summary, Holding, Position, FnO, Net       │  │
│  │  └── kite/ (14): Funds, Orders, Trades, MF*, UserProfile       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER (4 interfaces + 4 implementations)               │  │
│  │  ├── PortfolioSummaryService/Impl  (55KB - CORE LOGIC)         │  │
│  │  ├── NetPositionService/Impl       (14KB)                      │  │
│  │  ├── PortfolioSyncService/Impl     (18KB)                      │  │
│  │  └── SyncSafetyService/Impl        (2KB)                       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SPECIALIZED MODULES                                            │  │
│  │  ├── market/  - Market data fetching                           │  │
│  │  ├── fno/     - F&O position consolidation                     │  │
│  │  └── scheduler/ - Background sync jobs                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  REPOSITORY LAYER (6 repositories)                              │  │
│  │  ├── CachedHoldingRepository                                   │  │
│  │  ├── CachedPositionRepository                                  │  │
│  │  ├── CachedFundsRepository                                     │  │
│  │  ├── CachedMfOrderRepository                                   │  │
│  │  ├── MarketPriceRepository                                     │  │
│  │  └── SyncLogRepository                                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  MODEL LAYER (8 entities + 2 enums)                             │  │
│  │  ├── CachedHolding, CachedPosition, CachedFunds, CachedMfOrder │  │
│  │  ├── MarketPrice, SyncLog, SyncStatus, PositionType            │  │
│  │  └── enums/: AssetType, OrderStatus                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 File Statistics

| Component | Files | Total Size | Largest File |
|-----------|-------|------------|--------------|
| **Controllers** | 2 | ~10KB | PortfolioController.java (8KB) |
| **DTOs** | 21 | ~25KB | MutualFundOrderDTO (2.6KB) |
| **Models** | 10 | ~9KB | CachedPosition.java (2.1KB) |
| **Repositories** | 6 | ~4KB | - |
| **Services** | 8 | ~90KB | PortfolioSummaryServiceImpl (55KB) |
| **Sync** | 4 | ~20KB | PortfolioSyncServiceImpl (18KB) |
| **Other** | 5 | ~8KB | PortfolioSyncScheduler (4.8KB) |

---

## 3. Directory Structure

```
portfolio/
├── README.md                              # This file
│
├── controller/                            # REST Controllers (2 files)
│   ├── PortfolioController.java           # 12 endpoints (8KB)
│   └── ManualRefreshController.java       # Sync trigger (2KB)
│
├── dto/                                   # Data Transfer Objects
│   ├── PortfolioSummaryResponse.java      # Aggregate totals
│   ├── SummaryHoldingDTO.java             # Normalized holding
│   ├── SummaryPositionDTO.java            # Normalized position
│   ├── NetPositionDTO.java                # Consolidated positions
│   ├── FnoPositionDTO.java                # F&O position details
│   ├── FnoDetailsDTO.java                 # F&O metadata
│   ├── ManualRefreshResponse.java         # Sync result
│   │
│   ├── broker/                            # Broker-specific DTOs
│   │   └── (reserved for non-kite brokers)
│   │
│   └── kite/                              # Zerodha Kite DTOs (14 files)
│       ├── KiteListResponse.java          # List wrapper with metadata
│       ├── KiteResponseMetadata.java      # Source, timestamp
│       ├── FundsDTO.java                  # Margin data
│       ├── OrderDTO.java                  # Order details
│       ├── TradeDTO.java                  # Trade details
│       ├── MutualFundDTO.java             # MF holdings
│       ├── MutualFundOrderDTO.java        # MF orders
│       ├── MfSipDTO.java                  # SIP details
│       ├── MfInstrumentDTO.java           # MF scheme info
│       ├── MfTimelineEvent.java           # Timeline event
│       ├── MfEventType.java               # Event type enum
│       ├── UserProfileDTO.java            # User profile
│       ├── ZerodhaHoldingRaw.java         # Raw holding wrapper
│       └── ZerodhaPositionRaw.java        # Raw position wrapper
│
├── model/                                 # MongoDB Entities
│   ├── CachedHolding.java                 # Equity holding (1.6KB)
│   ├── CachedPosition.java                # F&O position (2.1KB)
│   ├── CachedFunds.java                   # Margin data (1KB)
│   ├── CachedMfOrder.java                 # MF order (1KB)
│   ├── MarketPrice.java                   # Live price cache
│   ├── SyncLog.java                       # Audit trail
│   ├── SyncStatus.java                    # Enum: sync result
│   ├── PositionType.java                  # Enum: DAY/OVERNIGHT
│   └── enums/                             # Additional enums
│       ├── AssetType.java
│       └── OrderStatus.java
│
├── repository/                            # Spring Data Repositories (6)
│   ├── CachedHoldingRepository.java
│   ├── CachedPositionRepository.java
│   ├── CachedFundsRepository.java
│   ├── CachedMfOrderRepository.java
│   ├── MarketPriceRepository.java
│   └── SyncLogRepository.java
│
├── service/                               # Business Logic
│   ├── PortfolioSummaryService.java       # Interface (11 methods)
│   ├── NetPositionService.java            # Interface
│   └── impl/
│       ├── PortfolioSummaryServiceImpl.java  # 55KB (CORE LOGIC)
│       └── NetPositionServiceImpl.java       # 14KB
│
├── sync/                                  # Sync Engine
│   ├── PortfolioSyncService.java          # Interface
│   ├── SyncSafetyService.java             # Interface
│   └── impl/
│       ├── PortfolioSyncServiceImpl.java  # 18KB (sync orchestration)
│       └── SyncSafetyServiceImpl.java     # Rate limiting
│
├── fno/                                   # F&O Specialization
│   ├── FnoPositionService.java            # Interface
│   └── impl/
│       └── FnoPositionServiceImpl.java
│
├── market/                                # Market Data
│   ├── MarketDataService.java             # Interface
│   ├── exception/
│   │   └── MarketDataException.java
│   └── impl/
│       └── MarketDataServiceImpl.java
│
├── scheduler/                             # Background Jobs
│   └── PortfolioSyncScheduler.java        # Scheduled sync (4.8KB)
│
├── exception/                             # Portfolio-specific exceptions
│   └── (reserved)
│
└── util/                                  # Portfolio utilities
    └── (reserved)
```

---

## 4. Controllers

### 4.1 PortfolioController

**Location**: `controller/PortfolioController.java`
**Size**: 8KB, 181 lines
**Base Path**: `/api/portfolio`

| Endpoint | Method | Description | Response Type |
|----------|--------|-------------|---------------|
| `/summary` | GET | Aggregated portfolio snapshot | `PortfolioSummaryResponse` |
| `/holdings` | GET | Equity holdings list | `List<SummaryHoldingDTO>` |
| `/positions` | GET | F&O positions | `List<NetPositionDTO>` |
| `/orders` | GET | Order history | `KiteListResponse<OrderDTO>` |
| `/trades` | GET | Trade history | `KiteListResponse<TradeDTO>` |
| `/funds` | GET | Margin/funds data | `FundsDTO` |
| `/mf/holdings` | GET | Mutual fund holdings | `KiteListResponse<MutualFundDTO>` |
| `/mf/orders` | GET | MF order history | `KiteListResponse<MutualFundOrderDTO>` |
| `/mf/sips` | GET | SIP list | `KiteListResponse<MfSipDTO>` |
| `/mf/instruments` | GET | MF scheme catalog | `KiteListResponse<MfInstrumentDTO>` |
| `/mf/timeline` | GET | MF event timeline | `KiteListResponse<MfTimelineEvent>` |
| `/profile` | GET | User profile | `UserProfileDTO` |

### 4.2 ManualRefreshController

**Location**: `controller/ManualRefreshController.java`
**Size**: 2KB
**Base Path**: `/api/portfolio`

| Endpoint | Method | Description | Response Type |
|----------|--------|-------------|---------------|
| `/refresh` | POST | Trigger manual sync | `ManualRefreshResponse` |

---

## 5. DTOs

### 5.1 Core DTOs

| DTO | Purpose | Key Fields |
|-----|---------|------------|
| `PortfolioSummaryResponse` | Aggregate totals | `totalCurrentValue`, `totalInvestedValue`, `totalDayGain`, `holdingsList` |
| `SummaryHoldingDTO` | Normalized holding | `symbol`, `quantity`, `avgPrice`, `currentPrice`, `dayGain`, `unrealizedPL` |
| `SummaryPositionDTO` | Normalized position | `symbol`, `quantity`, `avgPrice`, `currentPrice`, `pnl`, `productType` |
| `NetPositionDTO` | Consolidated view | Combined holdings + positions |

### 5.2 Kite DTOs (Zerodha-specific)

| DTO | Purpose | Key Fields |
|-----|---------|------------|
| `KiteListResponse<T>` | List wrapper | `data`, `source`, `lastSyncedAt`, `isStale` |
| `FundsDTO` | Margin data | `equity`, `commodity`, each with `availableMargin`, `utilisedMargin` |
| `OrderDTO` | Order details | `orderId`, `status`, `quantity`, `price`, `tradingSymbol` |
| `TradeDTO` | Trade execution | `tradeId`, `orderId`, `quantity`, `price`, `exchangeTimestamp` |
| `MutualFundDTO` | MF holding | `fund`, `folio`, `quantity`, `navPrice`, `currentValue`, `pnl` |
| `MutualFundOrderDTO` | MF order | `orderId`, `status`, `amount`, `isSip`, `orderSide`, `allotmentDate` |
| `MfSipDTO` | SIP details | `sipId`, `fund`, `amount`, `frequency`, `status`, `nextDeductionDate` |
| `MfInstrumentDTO` | Scheme info | `schemeCode`, `schemeName`, `amc`, `dividendType`, `lastPrice` |
| `UserProfileDTO` | Profile | `userName`, `email`, `exchanges`, `products`, `raw` |

---

## 6. Models

### 6.1 Cached Entities

All cached entities store the **complete original broker response** in a `raw` field.

| Entity | Collection | Key Fields | Purpose |
|--------|------------|------------|---------|
| `CachedHolding` | `cached_holdings` | `userId`, `broker`, `symbol`, `quantity`, `avgPrice`, `pnl`, `raw` | Equity holdings |
| `CachedPosition` | `cached_positions` | `userId`, `broker`, `symbol`, `quantity`, `pnl`, `m2m`, `raw` | F&O positions |
| `CachedFunds` | `cached_funds` | `userId`, `broker`, `equity`, `commodity`, `raw` | Margin data |
| `CachedMfOrder` | `cached_mf_orders` | `userId`, `broker`, `orderId`, `status`, `raw` | MF orders |
| `MarketPrice` | `market_prices` | `symbol`, `ltp`, `updatedAt` | Live price cache |
| `SyncLog` | `sync_logs` | `userId`, `broker`, `status`, `timestamp`, `details` | Audit trail |

### 6.2 Enums

| Enum | Values | Purpose |
|------|--------|---------|
| `SyncStatus` | `SUCCESS`, `FAILED`, `SKIPPED` | Sync result |
| `PositionType` | `DAY`, `OVERNIGHT` | Position holding period |
| `AssetType` | `EQUITY`, `FUTURES`, `OPTIONS`, `MF` | Asset classification |
| `OrderStatus` | `PENDING`, `COMPLETED`, `CANCELLED`, `REJECTED` | Order state |

---

## 7. Repositories

All repositories extend `MongoRepository` with user-scoped queries.

| Repository | Key Methods |
|------------|-------------|
| `CachedHoldingRepository` | `findByUserId()`, `findByUserIdAndBroker()`, `deleteByUserIdAndBroker()` |
| `CachedPositionRepository` | `findByUserId()`, `findByUserIdAndBroker()`, `deleteByUserIdAndBroker()` |
| `CachedFundsRepository` | `findByUserId()`, `findFirstByUserId()` |
| `CachedMfOrderRepository` | `findByUserId()`, `findByUserIdOrderByOrderDateDesc()` |
| `MarketPriceRepository` | `findBySymbol()`, `findBySymbolIn()` |
| `SyncLogRepository` | `findByUserId()`, `findTopByUserIdOrderByTimestampDesc()` |

---

## 8. Services

### 8.1 PortfolioSummaryService

**Interface**: `service/PortfolioSummaryService.java`
**Implementation**: `service/impl/PortfolioSummaryServiceImpl.java` (55KB - largest file)

**Methods**:

| Method | Returns | Description |
|--------|---------|-------------|
| `getPortfolioSummary(userId)` | `PortfolioSummaryResponse` | Aggregate totals |
| `getOrders(userId)` | `KiteListResponse<OrderDTO>` | Order history |
| `getFunds(userId)` | `FundsDTO` | Margin data |
| `getMutualFunds(userId)` | `KiteListResponse<MutualFundDTO>` | MF holdings |
| `getTrades(userId)` | `KiteListResponse<TradeDTO>` | Trade history |
| `getMfOrders(userId)` | `KiteListResponse<MutualFundOrderDTO>` | MF orders |
| `getProfile(userId)` | `UserProfileDTO` | User profile |
| `getMfTimeline(userId)` | `KiteListResponse<MfTimelineEvent>` | Timeline events |
| `getMfSips(userId)` | `KiteListResponse<MfSipDTO>` | SIP list |
| `getMfInstruments(userId)` | `KiteListResponse<MfInstrumentDTO>` | MF schemes |

### 8.2 NetPositionService

**Interface**: `service/NetPositionService.java`
**Implementation**: `service/impl/NetPositionServiceImpl.java` (14KB)

**Purpose**: Consolidate holdings and positions into a unified view.

**Key Method**:
```java
List<NetPositionDTO> mergeHoldingsAndPositions(String userId);
```

---

## 9. Sync Engine

### 9.1 PortfolioSyncService

**Interface**: `sync/PortfolioSyncService.java`
**Implementation**: `sync/impl/PortfolioSyncServiceImpl.java` (18KB)

**Sync Flow**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         SYNC FLOW                                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. Rate Limit Check (SyncSafetyService)                              │
│     └── Last sync > 5 minutes ago? → Continue : Skip                  │
│                                                                        │
│  2. Lock Acquisition                                                   │
│     └── Prevent concurrent syncs for same user/broker                 │
│                                                                        │
│  3. Fetch Fresh Data (BrokerService)                                  │
│     ├── fetchHoldings()                                               │
│     ├── fetchPositions()                                              │
│     ├── fetchFunds()                                                  │
│     ├── fetchMfHoldings()                                             │
│     └── fetchMfOrders()                                               │
│                                                                        │
│  4. Replace Cached Data                                               │
│     ├── DELETE old records for user/broker                            │
│     └── SAVE new records                                              │
│                                                                        │
│  5. Update Timestamps                                                  │
│     └── BrokerAccount.lastSuccessfulSync = now()                      │
│                                                                        │
│  6. Log Result                                                         │
│     └── Create SyncLog entry                                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 9.2 SyncSafetyService

**Interface**: `sync/SyncSafetyService.java`
**Implementation**: `sync/impl/SyncSafetyServiceImpl.java` (2KB)

**Purpose**: Prevent broker API rate limit violations.

**Rules**:
- Minimum 5 minutes between manual syncs per user/broker
- Returns time remaining if sync is blocked

---

## 10. Market Data

### 10.1 MarketDataService

**Location**: `market/MarketDataService.java, impl/MarketDataServiceImpl.java`

**Purpose**: Fetch and cache live market prices.

**Methods**:
```java
Double getLastPrice(String symbol);
Map<String, Double> getLastPrices(List<String> symbols);
```

---

## 11. F&O Module

### 11.1 FnoPositionService

**Location**: `fno/FnoPositionService.java, impl/FnoPositionServiceImpl.java`

**Purpose**: Handle F&O-specific position logic.

**Capabilities**:
- Parse expiry dates from symbols
- Calculate MTM (Mark-to-Market)
- Identify option strike/type

---

## 12. Scheduler

### 12.1 PortfolioSyncScheduler

**Location**: `scheduler/PortfolioSyncScheduler.java` (4.8KB)

**Schedules**:

| Schedule | Cron | Description |
|----------|------|-------------|
| Market Hours | `0 */15 9-16 * * MON-FRI` | Every 15 min, 9 AM - 4 PM, Mon-Fri |
| Off Hours | `0 0 6,20 * * *` | 6 AM and 8 PM daily |

**Logic**:
1. Iterate all active `BrokerAccount` records
2. Check if sync needed (based on staleness)
3. Trigger `PortfolioSyncService` for each

---

## 13. API Reference

### 13.1 Portfolio Endpoints

```http
# Get portfolio summary
GET /api/portfolio/summary
Authorization: Bearer <jwt>

# Get equity holdings
GET /api/portfolio/holdings
Authorization: Bearer <jwt>

# Get F&O positions
GET /api/portfolio/positions
Authorization: Bearer <jwt>

# Get order history
GET /api/portfolio/orders
Authorization: Bearer <jwt>

# Get trade history
GET /api/portfolio/trades
Authorization: Bearer <jwt>

# Get margin/funds
GET /api/portfolio/funds
Authorization: Bearer <jwt>

# Trigger manual sync
POST /api/portfolio/refresh
Authorization: Bearer <jwt>
```

### 13.2 Mutual Fund Endpoints

```http
# Get MF holdings
GET /api/portfolio/mf/holdings
Authorization: Bearer <jwt>

# Get MF orders
GET /api/portfolio/mf/orders
Authorization: Bearer <jwt>

# Get SIPs
GET /api/portfolio/mf/sips
Authorization: Bearer <jwt>

# Get MF instruments (scheme catalog)
GET /api/portfolio/mf/instruments
Authorization: Bearer <jwt>

# Get MF timeline
GET /api/portfolio/mf/timeline
Authorization: Bearer <jwt>

# Get user profile
GET /api/portfolio/profile
Authorization: Bearer <jwt>
```

---

## 14. Aggregation Logic

### 14.1 Holdings-Only Summary Rule

**CRITICAL**: Portfolio summary aggregates **equity holdings only**. Positions (F&O) are **excluded**.

**Rationale**:
- Holdings have stable `previousClose` values
- Positions have complex MTM calculations that don't fit `DayGain = Current - Previous`
- Including positions would create mathematical inconsistencies

### 14.2 Calculation Formulas

```
totalCurrentValue = Σ (holding.quantity × holding.currentPrice)

totalInvestedValue = Σ (holding.quantity × holding.averageBuyPrice)

totalDayGain = Σ (holding.dayChange × holding.quantity)
             = Σ ((holding.currentPrice - holding.previousClose) × holding.quantity)

totalDayGainPercent = (totalDayGain / previousDayValue) × 100
                    where previousDayValue = totalCurrentValue - totalDayGain
```

### 14.3 Trust the Broker Principle

| Field | Source | Fallback |
|-------|--------|----------|
| `pnl` | Broker's `raw.pnl` | `(currentPrice - avgPrice) × quantity` |
| `dayChange` | Broker's `raw.day_change` | `(currentPrice - previousClose) × quantity` |
| `currentValue` | Broker's `raw.current_value` | `quantity × currentPrice` |

---

## 15. Security

### 15.1 User Isolation

Every query is scoped by `userId`:
```java
// All repositories enforce user filtering
cachedHoldingRepository.findByUserId(userId);
cachedPositionRepository.findByUserId(userId);
```

### 15.2 Cross-User Access Prevention

Services always verify the current user owns the requested data:
```java
// Controller extracts userId from JWT
User user = userRepository.findByUsername(principal.getName());

// Service only queries that user's data
portfolioSummaryService.getPortfolioSummary(user.getId());
```

---

## 16. Extension Guidelines

### 16.1 Adding a New Asset Type (e.g., Gold Bonds)

1. **Create Entity**: `CachedGoldBond.java` with `raw` field
2. **Create Repository**: `CachedGoldBondRepository.java`
3. **Update BrokerService**: Add `fetchGoldBonds()` method
4. **Update SyncService**: Fetch and persist during sync
5. **Update SummaryService**: Include in aggregation (if applicable)
6. **Add DTO**: `GoldBondDTO.java`
7. **Add Endpoint**: `/api/portfolio/gold-bonds`

### 16.2 Adding a New Metric

1. Add field to `PortfolioSummaryResponse`
2. Compute in `PortfolioSummaryServiceImpl` using cached data
3. No additional API changes needed

### 16.3 Adding a New Broker

1. Implement `BrokerService` interface
2. Map broker responses to existing DTOs
3. Sync engine works automatically for any `BrokerAccount`

---

## 17. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Including Positions in Summary | Wrong "Total Portfolio" value | Explicitly exclude `CachedPosition` from summary loop |
| Re-calculating Broker P&L | Mismatch with Kite app | Always prefer `raw.pnl` over local math |
| Missing Sync Rate Limit | Broker API Ban (429) | Use `SyncSafetyService` |
| Floating Point Math | Rounding errors | Use `BigDecimal` for everything |
| Missing `userId` filter | Cross-user data leak | Always filter by `userId` in repository queries |
| Concurrent sync race | Data corruption | Use sync locks |
| Stale data display | User confusion | Show `lastSyncedAt` and `isStale` flags |

---

## Appendix A: File Size Reference

| File | Size | Lines | Notes |
|------|------|-------|-------|
| PortfolioSummaryServiceImpl.java | 55KB | ~1600 | Core aggregation logic |
| PortfolioSyncServiceImpl.java | 18KB | ~500 | Sync orchestration |
| NetPositionServiceImpl.java | 14KB | ~400 | Position consolidation |
| PortfolioController.java | 8KB | 181 | 12 endpoints |
| PortfolioSyncScheduler.java | 4.8KB | ~150 | Background jobs |

---

## Appendix B: Related Documentation

- [Portfolio Summary Architecture](../../docs/Portfolio_Summary_Architecture.md)
- [Zerodha Master Integration Guide](../../docs/zerodha/Zerodha_Master_Integration_Guide.md)
- [Broker Module README](../broker/README.md)
- [Zerodha Holdings Architecture](../../docs/zerodha/Zerodha_Holdings_Architecture.md)
- [Zerodha MF Orders Architecture](../../docs/zerodha/Zerodha_MF_Orders_Architecture.md)

---

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with accurate structure |
| 1.0.0 | 2025-12-14 | Initial documentation |

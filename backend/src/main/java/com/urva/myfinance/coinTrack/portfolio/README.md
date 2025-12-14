# Portfolio Module – CoinTrack

> **Domain**: Holdings, positions, portfolio aggregation, and market data
> **Responsibility**: Consolidate, calculate, and present user portfolio across all brokers

---

## 1. Overview

### Purpose
The Portfolio module is the **core value proposition** of CoinTrack. It aggregates holdings and positions from multiple brokers, calculates net positions, and provides real-time portfolio insights.

### Business Problem Solved
Users with multiple broker accounts need:
- Consolidated view of all holdings
- Net position calculation (same stock across brokers)
- Day gain/loss tracking
- F&O position analysis
- Market price integration

### System Position
```text
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Broker    │────>│  Portfolio   │────>│   Frontend      │
│   Module    │     │   Module     │     │   Dashboard     │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │  Market  │ │  Sync    │ │   FnO    │
       │  Data    │ │  Engine  │ │  Service │
       └──────────┘ └──────────┘ └──────────┘
```

---

## 2. Folder Structure

```
portfolio/
├── controller/
│   ├── PortfolioController.java      # Summary, net positions
│   └── ManualRefreshController.java  # Trigger sync
├── dto/
│   ├── PortfolioSummaryResponse.java # Aggregate totals
│   ├── NetPositionDTO.java           # Per-symbol position
│   ├── SummaryHoldingDTO.java        # Individual holding
│   ├── ManualRefreshResponse.java    # Sync result
│   ├── FnoPositionDTO.java           # F&O position
│   └── FnoDetailsDTO.java            # F&O metadata
├── model/
│   ├── CachedHolding.java            # Broker → DB holding
│   ├── CachedPosition.java           # Broker → DB position
│   ├── SyncLog.java                  # Sync audit trail
│   ├── SyncStatus.java               # Enum: SUCCESS, FAILED
│   ├── PositionType.java             # Enum: LONG, SHORT
│   ├── MarketPrice.java              # LTP cache
│   └── enums/
│       ├── FnoInstrumentType.java    # FUTURES, OPTIONS
│       └── OptionType.java           # CE, PE
├── repository/
│   ├── CachedHoldingRepository.java
│   ├── CachedPositionRepository.java
│   ├── SyncLogRepository.java
│   └── MarketPriceRepository.java
├── service/
│   ├── NetPositionService.java       # Interface
│   ├── PortfolioSummaryService.java  # Interface
│   └── impl/
│       ├── NetPositionServiceImpl.java
│       └── PortfolioSummaryServiceImpl.java
├── sync/
│   ├── PortfolioSyncService.java     # Interface
│   ├── SyncSafetyService.java        # Rate limiting
│   └── impl/
│       ├── PortfolioSyncServiceImpl.java
│       └── SyncSafetyServiceImpl.java
├── market/
│   ├── MarketDataService.java        # Interface
│   ├── exception/
│   │   └── MarketDataException.java
│   └── impl/
│       └── MarketDataServiceImpl.java
├── fno/
│   ├── FnoPositionService.java       # Interface
│   └── impl/
│       └── FnoPositionServiceImpl.java
└── scheduler/
    └── PortfolioSyncScheduler.java   # Scheduled sync jobs
```

---

## 3. Component Responsibilities

### Controllers
| Controller | Endpoints | Purpose |
|------------|-----------|---------|
| `PortfolioController` | `GET /summary`, `GET /net-positions` | Return aggregated data |
| `ManualRefreshController` | `POST /refresh` | Trigger portfolio sync |

### Core Services
| Service | Responsibility |
|---------|---------------|
| `NetPositionService` | Merge holdings + positions by symbol |
| `PortfolioSummaryService` | Calculate totals, day gain |
| `PortfolioSyncService` | Fetch from brokers, cache in DB |
| `MarketDataService` | Get current prices |
| `FnoPositionService` | Parse and calculate F&O metrics |

### Sync Engine
```
PortfolioSyncService
├── For each connected broker:
│   ├── Check token validity
│   ├── Fetch holdings via BrokerService
│   ├── Fetch positions via BrokerService
│   ├── Clear old cached data
│   └── Save new data
└── Log sync result in SyncLog
```

### Models
| Model | Purpose |
|-------|---------|
| `CachedHolding` | Holdings from broker (equity) |
| `CachedPosition` | Positions from broker (intraday/F&O) |
| `SyncLog` | Audit: when synced, success/failure |
| `MarketPrice` | LTP cache by symbol |

---

## 4. Execution Flow

### Get Portfolio Summary
```
1. GET /api/portfolio/summary
   └── PortfolioController.getPortfolioSummary(principal)
       └── userRepository.findByUsername(principal.getName())
       └── portfolioSummaryService.getPortfolioSummary(userId)
           └── Fetch CachedHoldings from DB
           └── Fetch current prices from MarketDataService
           └── Calculate:
               - totalCurrentValue
               - totalInvestedValue
               - totalUnrealizedPL
               - totalDayGain
           └── Return PortfolioSummaryResponse
       └── Return ApiResponse.success(response)
```

### Manual Refresh Flow
```
1. POST /api/portfolio/refresh
   └── ManualRefreshController.triggerManualRefresh(principal)
       └── portfolioSyncService.triggerManualRefreshForUser(userId)
           └── For each broker:
               └── syncSafetyService.canSync(userId, broker) // Rate limit
               └── brokerService.fetchHoldings(account)
               └── brokerService.fetchPositions(account)
               └── Clear old CachedHolding for userId+broker
               └── Save new holdings
               └── Log SyncLog
           └── Return ManualRefreshResponse
       └── Return ApiResponse.success(response)
```

---

## 5. Diagrams

### Data Flow Architecture
```text
┌─────────────────────────────────────────────────────────────┐
│                      PORTFOLIO MODULE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Broker    │───>│    Sync     │───>│   Cached    │     │
│  │   Module    │    │   Engine    │    │   Holding   │     │
│  └─────────────┘    └─────────────┘    │   Position  │     │
│                                        └──────┬──────┘     │
│                                               │             │
│                                               ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Market    │───>│     Net     │───>│  Summary    │     │
│  │   Data      │    │   Position  │    │  Response   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Sync Sequence
```text
Controller      SyncService      BrokerService      MongoDB
    │                │                 │               │
    ├── trigger() -->│                 │               │
    │                ├── getBrokerAccounts() --------->│
    │                │                 │               │
    │                ├── [LOOP: For each broker]       │
    │                │                 │               │
    │                ├── fetchHoldings() ─────────────>│
    │                │<------ List<CachedHolding> -----│
    │                │                 │               │
    │                ├── deleteOld() ----------------->│
    │                ├── saveNew() ------------------->│
    │                │                 │               │
    │                ├── save(SyncLog) --------------->│
    │<-- Response ---│                 │               │
```

---

## 6. Logging Strategy

### What IS Logged
| Event | Level | Constant |
|-------|-------|----------|
| Sync started | `INFO` | `SYNC_STARTED` |
| Sync completed | `INFO` | `SYNC_COMPLETED` |
| Sync failed | `ERROR` | `SYNC_FAILED` |
| Rate limit hit | `WARN` | Custom message |
| Market data fetch | `DEBUG` | N/A |

### What is NEVER Logged
- Full holding details
- User financial amounts in production
- Access tokens

---

## 7. Security Considerations

### User Isolation
- All queries filter by `userId`
- Cannot access another user's portfolio
- Principal verified from JWT

### Sync Rate Limiting
```java
// SyncSafetyService
public boolean canSync(String userId, Broker broker) {
    // Max 1 sync per broker per 5 minutes
}
```

---

## 8. Extension Guidelines

### Adding a New Portfolio Metric

1. **Add to DTO**
   ```java
   // PortfolioSummaryResponse.java
   private BigDecimal newMetric;
   ```

2. **Calculate in Service**
   ```java
   // PortfolioSummaryServiceImpl.java
   BigDecimal newMetric = calculateNewMetric(holdings);
   response.setNewMetric(newMetric);
   ```

### Adding a New Asset Type
1. Create new entity in `model/`
2. Create repository
3. Extend `NetPositionService` to include

### Adding a New Data Source
1. Create integration in `market/`
2. Implement `MarketDataService`
3. Register with Spring

---

## 9. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| N+1 queries for prices | Performance kill | Batch price fetch |
| Not clearing old data | Stale duplicates | Delete before insert |
| Sync without rate limit | Broker API ban | Use SyncSafetyService |
| Missing null checks | NPE on new accounts | Handle empty portfolios |
| Not handling F&O separately | Wrong calculations | Use FnoPositionService |

---

## 10. Testing & Verification

### Unit Tests
```java
@Test
void shouldMergeHoldingsAcrossBrokers() {
    // Holdings: RELIANCE 10 @ Zerodha, 5 @ Angel
    // Expect: NetPosition RELIANCE = 15
}

@Test
void shouldCalculateDayGain() {
    // investedValue = 100, currentValue = 110
    // dayGain = 10, dayGainPercent = 10%
}
```

### Integration Tests
```java
@Test
void shouldSyncAndReturnSummary() {
    mockMvc.perform(post("/api/portfolio/refresh")
        .header("Authorization", token))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/portfolio/summary")
        .header("Authorization", token))
        .andExpect(jsonPath("$.data.totalCurrentValue").exists());
}
```

### Manual Verification
- [ ] Sync returns success
- [ ] Summary shows correct totals
- [ ] Net positions merge correctly
- [ ] F&O positions show MTM profit/loss

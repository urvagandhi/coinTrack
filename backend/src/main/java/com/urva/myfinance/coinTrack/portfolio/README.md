# Portfolio Module – CoinTrack

> **Domain**: Holdings, positions, mutual funds, aggregation, and sync
> **Responsibility**: Consolidate user assets into a unified "Source of Truth" view

---

## 1. Overview

### Purpose
The Portfolio module is the **core** of CoinTrack. It aggregates disparate asset classes (Equity, Mutual Funds, Derivatives) from multiple brokers into a single, cohesive dashboard.

### Business Problem Solved
Investors faced fragmented views:
*   "What is my total net worth?"
*   "How much did my portfolio move today?"
*   "Do I have enough margin?"
*   "What are my upcoming SIPs?"

This module solves this by:
1.  **Aggregating**: `Holdings + Positions + Funds + MF`
2.  **Normalizing**: Converting broker-specific formats to CoinTrack DTOs
3.  **Persisting**: Caching data for fast retrieval (avoiding API rate limits)

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
│   ├── PortfolioController.java      # Summary, Holdings, Positions, MFs
│   └── ManualRefreshController.java  # Trigger Sync
├── dto/
│   ├── PortfolioSummaryResponse.java # Aggregate Totals
│   ├── NetPositionDTO.java           # Consolidated Positions
│   ├── SummaryHoldingDTO.java        # Normalized Equity Holding
│   ├── kite/
│   │   ├── FundsDTO.java             # Margins
│   │   ├── MfSipDTO.java             # MF SIPs
│   │   ├── MutualFundDTO.java        # MF Holdings
│   │   └── MutualFundOrderDTO.java   # MF Orders
├── model/
│   ├── CachedHolding.java            # Broker → DB (Equity)
│   ├── CachedPosition.java           # Broker → DB (F&O)
│   ├── CachedMfOrder.java            # Broker → DB (MF Orders)
│   ├── CachedFunds.java              # Broker → DB (Margins)
│   └── SyncLog.java                  # Audit Trail
├── service/
│   ├── PortfolioSummaryService.java  # Aggregation Logic
│   ├── NetPositionService.java       # Position Consolidation
│   └── impl/
│       └── PortfolioSummaryServiceImpl.java (KEY LOGIC HERE)
├── sync/
│   ├── PortfolioSyncService.java     # Sync Orchestration
│   └── SyncSafetyService.java        # Rate Limiting
└── fno/                              # Derivatives Specialization
```

---

## 3. Core Logic & Aggregation Rules

### 3.1 Portfolio Summary (Aggregation)
**Endpoint**: `/api/portfolio/summary`

The Summary is calculated by iterating over **Equity Holdings** only.
*   `totalCurrentValue` = Σ (Holding `currentValue`)
*   `totalInvestedValue` = Σ (Holding `investedValue`)
*   `totalDayGain` = Σ (Holding `dayGain`)

> **CRITICAL RULE**: **Positions (F&O)** are **EXCLUDED** from these totals to maintain mathematical consistency (`DayGain = Current - Previous`). Positions do not have a stable "Previous Close" like holdings do.

### 3.2 Holdings (Equity)
*   **Trust the Broker**: P&L and Day Change are taken directly from the broker response if available. We do not recompute them unless data is missing (Fallback Logic).
*   **Fallback**: If `pnl` is null, we compute `(current - avg) * qty`.

### 3.3 Mutual Funds
*   **Smart DTOs**: The `MutualFundDTO` encapsulates logic to fallback to `qty * NAV` if the broker doesn't provide a ready-made `current_value`.
*   **Orders**: MF Orders are sorted strictly by `executionDate DESC`, then `orderTimestamp DESC`.

---

## 4. Sync Engine

### Purpose
To avoid hitting broker API rate limits and provide instant page loads, we cache data in MongoDB.

### Flows
#### A. Manual Sync (User Triggered)
1.  **Request**: `POST /api/portfolio/refresh`
2.  **Rate Limit Check**: `SyncSafetyService` ensures max 1 sync per 5 mins per broker.
3.  **Fetch & Replace**:
    *   Fetch latest data from Broker Module (`ZerodhaBrokerService`).
    *   **Delete** old records for that user/broker.
    *   **Save** new records (`CachedHolding`, `CachedPosition`, `CachedMfOrder`).
4.  **Audit**: Log result in `SyncLog`.

#### B. Scheduled Sync (Background)
*   Frequency: Every 15 minutes during market hours.
*   Logic: Iterates over all active `BrokerAccount`s and performs the Fetch & Replace flow.

---

## 5. Security & Isolation

### User Isolation
*   Services **MUST** always filter by `userId`.
*   Example: `cachedHoldingRepository.findByUserId(userId)`
*   It is physically impossible for User A to see User B's portfolio via the API.

### Raw Data Preservation
*   Every Entity (`CachedHolding`, `CachedPosition`, etc.) has a `raw` field.
*   This stores the **exact** JSON received from the broker.
*   **Why?** Audit trails, debugging, and future-proofing (e.g., if we need to display a field we didn't initially map).

---

## 6. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Including Positions in Summary | Wrong "Total Portfolio" value | Explicitly exclude `CachedPosition` from summary loop |
| Re-calculating Broker P&L | Mismatch with Kite | Always prefer `raw.pnl` over local math |
| Missing Sync Rate Limit | Broker API Ban (429) | Use `SyncSafetyService` |
| Floating Point Math | Rounding Errors | Use `BigDecimal` for everything |

---

## 7. Extension Guidelines

### Adding a New Asset Type (e.g., Gold Bonds)
1.  Create `CachedGoldBond` entity.
2.  Add fetching logic to `BrokerService`.
3.  Update `PortfolioSyncService` to fetch and save.
4.  Update `PortfolioSummaryService` to include in totals (if applicable).

### Adding a New Metric
1.  Add field to `PortfolioSummaryResponse`.
2.  Compute in `PortfolioSummaryServiceImpl` using existing cached data.

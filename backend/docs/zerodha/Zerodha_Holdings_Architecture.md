# Zerodha Holdings Architecture & Data Flow

## 1. Overview
This document details the end-to-end implementation of the Zerodha Holdings (`/portfolio/holdings`) integration in CoinTrack. The core design philosophy is **"Trust the Broker"**: we prioritize official values provided by Zerodha (P&L, Day Change, Prices) over re-computing them locally, ensuring the user sees exactly what they see on Kite.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture (`ZerodhaBrokerService`)
**Source Endpoint**: `GET https://api.kite.trade/portfolio/holdings`
**Raw Class**: `ZerodhaHoldingRaw`

We use a strict **Raw DTO** to capture the exact JSON response from Zerodha.

| Zerodha JSON Field | Java Type | Description |
| :--- | :--- | :--- |
| `tradingsymbol` | String | Symbol (e.g., "INFY") |
| `exchange` | String | Exchange (NSE/BSE) |
| `quantity` | Double | **Source of Truth** for holdings count |
| `average_price` | Double | Avg. acquisition cost |
| `last_price` | Double | Latest Traded Price (LTP) |
| `close_price` | Double | Previous Day's Close |
| `pnl` | Double | **Official Total P&L** |
| `day_change` | Double | **Official Day Change Amount** |
| `day_change_percentage` | Double | **Official Day Change %** |
| `instrument_token` | Long | Unique ID for live ticks |
| `product` | String | Product type (CNC/MIS) |
| `used_quantity` | Double | Blocked quantity in orders |

### 2.2 Persistence (`CachedHolding`)
Data is stored in MongoDB (`cached_holdings`). We persist **both** the standard fields and the Zerodha-specific "truth" fields.

*   **Standard Fields**: `quantity`, `averageBuyPrice`, `exchange`, `symbol`.
*   **Zerodha Specifics**: `lastPrice`, `closePrice`, `pnl`, `dayChange` (stored to avoid re-fetch/re-calc).
*   **Metadata**: `apiVersion="v3"`, `lastUpdated`.

### 2.3 Normalization & Logic (`PortfolioSummaryServiceImpl`)
When serving the frontend (`/portfolio/summary`), we map `CachedHolding` to `SummaryHoldingDTO`.

#### **Rule 1: "Trust Zerodha P&L"**
We prioritize the official computed values found in `CachedHolding`:
*   `pnl` (Total Unrealized P&L)
*   `dayChange` (Day MTM)
*   `dayChangePercentage`

#### **Rule 2: "Robust Fallback"**
If Zerodha returns `null` for these fields (e.g., new listings, data glitches), the Service layer (`convertHolding`) applies safe fallback logic **before** returning to the frontend.

*   **Last Price Fallback**: If broker `lastPrice` is missing, try `MarketPrice` (if available), else 0.
*   **P&L Fallback**: If broker `pnl` is missing:
    *   `computedUnrealizedPL = (currentPrice - averageBuyPrice) * quantity`
*   **Day Change Fallback**: If broker `dayChange` is missing:
    *   `computedDayChange = (currentPrice - previousClose) * quantity`

> **Note**: These fallback computations are **NOT** persisted to the DB, they are calculated on-the-fly for the API response only.

#### **Rule 3: "Values & Aggregates"**
*   `investedValue` = `quantity * averageBuyPrice`
*   `currentValue` = `quantity * currentPrice`

**Portfolio Wide Aggregation**:
*   `Total Day Gain` = Sum of all Holdings' `dayGain`.
*   `Previous Day Total Value` = Sum of all Holdings' `(quantity * closePrice)`.
*   **Note**: Positions are EXCLUDED from these two aggregates to maintain mathematical consistency.

---

## 3. Frontend Integration

### 3.1 DTO Structure (`SummaryHoldingDTO`)
The frontend receives a normalized JSON object.

```json
{
  "symbol": "INFY",
  "exchange": "NSE",
  "quantity": 10,
  "averageBuyPrice": 1450.00,
  "currentPrice": 1500.00,
  "previousClose": 1480.00,
  "currentValue": 15000.00,
  "investedValue": 14500.00,
  "unrealizedPL": 500.00,       // <-- Pre-filled by Backend (Broker or Fallback)
  "dayGain": 120.50,            // <-- Pre-filled by Backend (Broker or Fallback)
  "dayGainPercent": 0.85,       // <-- Pre-filled by Backend (Broker or Fallback)
  "raw": {
    "instrument_token": 408065,
    "product": "CNC",
    "used_quantity": 0,
    "t1_quantity": 0,
    "close_price": 1480.00
  }
}
```

### 3.2 Display Guidelines
*   **Currency & Precision**: 2 decimal places (e.g., `₹1,250.45`).
*   **Coloring**: Green if `unrealizedPL >= 0`, Red if `< 0`.
*   **Missing Data**: If `currentPrice <= 0` (no market data available), display **"—"**.

---

## 4. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Compute P&L, Day Change | **Source of Truth** |
| **Backend Service** | Persist Truth, Compute Fallbacks | **Normalization** |
| **Frontend** | Display & Formatting | **Presentation** |

---

## 5. Risk & Edge Case Handling

### 5.1 Zero Prices
If `last_price` is 0:
*   `currentValue` = 0
*   `dayGain` might be computed against `previousClose` (if valid), else 0.
*   Frontend displays "—".

### 5.2 Negative Quantities
*   Treated as corrupted data in `fetchHoldings` and skipped/logged, unless specific logic for short holdings is enabled (currently not for equity holdings).

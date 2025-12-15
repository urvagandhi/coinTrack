# Zerodha Holdings Architecture & Data Flow

## 1. Overview
This document details the end-to-end implementation of the Zerodha Holdings integration in CoinTrack. The core design philosophy is **"Trust the Broker"**: we prioritize official values provided by Zerodha (P&L, Day Change, Prices) over re-computing them locally, ensuring the user sees exactly what they see on Kite.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Mapping (`ZerodhaBrokerService`)
**Source Endpoint**: `GET https://api.kite.trade/portfolio/holdings`

We use a strict **Raw DTO** to capture the exact JSON response from Zerodha without modification.

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
| `instrument_token` | Long | Unique ID for live ticks (prices/websocket) |
| `product` | String | Product type (CNC/MIS) |
| `used_quantity` | Double | Blocked quantity in orders |
| `t1_quantity` | Double | Quantity still in settlement (T1) |
| `realised_quantity` | Double | Quantity sold/delivered historically |
| `price` | Double | (Optional) Backup for last_price |
| `authorised_quantity` | Double | Authorized lots/qty |
| `authorised_date` | String | Date of authorization |
| `authorisation` | Object | Additional auth metadata |

### 2.2 Persistence (`CachedHolding`)
Data is stored in MongoDB (`cached_holdings`). We persist **both** the standard fields and the Zerodha-specific "truth" fields.

*   **Standard Fields**: `quantity`, `averageBuyPrice` (used for basic reporting)
*   **Zerodha Specifics**: `lastPrice`, `closePrice`, `pnl`, `dayChange` (stored to avoid re-fetch/re-calc)
*   **Metadata**:
    *   `apiVersion`: "v3" (Tracks Zerodha API version used for this snapshot)
    *   `lastUpdated`: Timestamp of sync (Acts as `syncedAt`)

### 2.3 Normalization & Logic (`PortfolioSummaryServiceImpl`)
When serving the frontend (`/portfolio/summary`), we map `CachedHolding` to `SummaryHoldingDTO`.

**Important**: Zerodha returns these computed values (`pnl`, `day_change`, etc.) as part of the `/portfolio/holdings` response — the backend should use them directly without recomputing.

#### **Rule 1: "Trust Zerodha P&L"**
We prioritize the official computed values:
*   `raw.pnl` (Total Unrealized P&L)
*   `raw.day_change` (Day MTM)
*   `raw.day_change_percentage`
These handle corporate actions and official settlement prices correctly.

#### **Rule 2: "Safe Computation Only"**
We only compute mathematical definitions for safe fields:

| Frontend Field | Logic / Source | Why? |
| :--- | :--- | :--- |
| **quantity** | `raw.quantity` | Direct |
| **averageBuyPrice** | `raw.average_price` | Direct |
| **currentPrice** | `raw.last_price` (or `raw.price`) | Direct (LTP Snapshot) |
| **unrealizedPL** | **`raw.pnl`** | **Critical**: Trust Zerodha. |
| **dayGain** | **`raw.day_change`** | **Critical**: Trust Zerodha. |
| **investedValue** | `quantity * averageBuyPrice` | **Computed**: Safe. |
| **currentValue** | `quantity * currentPrice` | **Computed**: Safe. |

#### **Rule 3: Robust Fallback & Validation**
If Zerodha returns `null` (rare), we calculate a safe estimate **only for the response** (never saved to DB).

```java
if (raw.pnl == null) {
    if (raw.last_price <= 0) {
        // Validation: New listing/No data -> Treat as "no market data yet"
        computedUnrealizedPL = 0;
    } else {
        // Fallback: (last_price - average_price) * quantity
        computedUnrealizedPL = (raw.last_price - raw.average_price) * raw.quantity;
    }
}
```

---

## 3. Frontend Integration

### 3.1 DTO Structure (`SummaryHoldingDTO`)
The frontend receives a normalized JSON object. It doesn't need to know it came from Zerodha specifically.

```json
{
  "symbol": "INFY",
  "quantity": 10,
  "averageBuyPrice": 1450.00,
  "currentPrice": 1500.00,
  "currentValue": 15000.00,
  "investedValue": 14500.00,
  "unrealizedPL": 500.00,       // <-- Pre-filled by Backend
  "dayGain": 120.50,            // <-- Pre-filled by Backend
  "dayGainPercent": 0.85        // <-- Pre-filled by Backend
}
```

### 3.2 Display Logic (`PortfolioPage.jsx` & `HoldingsTable.jsx`)
The frontend is "dumb" (pure display).
1.  **Holdings Table**:
    *   **P&L Column**: Displays `unrealizedPL` directly.
    *   **Day Change Column**: Displays `dayGain` and `dayGainPercent` directly.
    *   Color coding (Green/Red) is based on these pre-calculated values `>= 0`.

2.  **Positions Tab (Derivatives)**:
    *   Uses `dayGain` to represent **Day MTM** for F&O positions.
    *   Uses `unrealizedPL` for Net P&L.

### 3.3 Display Guidelines
To remove ambiguity, the following rendering rules are enforced:

*   **Currency & Precision**:
    *   Prices & Values: 2 decimal places (e.g., `₹1,250.45`).
    *   Percentages: 2 decimal places (e.g., `+1.20%`).
    *   Locale: Standard Indian `en-IN` formatting.

*   **UI Indication Rules**:
    *   **Color**: Green if `>= 0`, Red if `< 0`.
    *   **Missing Data**: If `currentPrice <= 0` (no market data available), display **"—"** instead of `₹0.00`.

---

## 4. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Compute P&L & dayChange | **Source of Truth** |
| **Backend** | Safe fields & normalization | Shape & Persistence |
| **Frontend** | Display & formatting | Presentation Logic |

## 5. Risk & Edge Case Handling

### 5.1 Zero or Missing Prices
If `last_price` (or optional `price`) is 0 (e.g., illiquid or new listing):
*   `currentValue` = 0
*   `dayGainPercent` = 0
*   **Action**: Flag as "price not available" (Frontend displays "—").

### 5.2 Incorrect or Corrupted Data
We validate raw data before processing:
*   If `raw.quantity < 0`: Treat as error (unless valid short position logic is added later).
*   If `raw.average_price < 0`: Treat as error.

### 5.3 Reconciliation Job
A periodic background job is required to:
*   **Re-sync**: Fetch holdings daily to stay in sync with Zerodha.
*   **Cleanup**: Remove stale data (holdings sold on Kite but still in DB).
*   **Schema Check**: Detect if Zerodha adds/changes fields (via `apiVersion` check).

### 5.4 Other Known Cases
*   **Fractional Quantities**: `quantity` is `BigDecimal` to support Mutual Funds.
*   **Missing P&L**: Graceful fallback to `(Last - Avg) * Qty` if official P&L is null.

## 6. Key Terms & Concepts

### 6.1 Snapshot vs Live
Data stored in `CachedHolding` is a **snapshot** from the moment of the last sync. It is **not** a real-time live feed.
*   **Last Price Logic**: We prioritize `last_price`. If missing, we fallback to `price`. Both represent the effective LTP at the moment of sync.

### 6.2 Zero Holdings
API Response Logic:
*   If a user has **no holdings**, return an **empty array `[]`**.
*   Do **NOT** return `null` or error. This ensures the Frontend table simply shows "No holdings found" state.

## 7. Schema Example (Complete)

Below is the complete JSON response structure for a normalized holding, including the "raw" metadata from Zerodha.

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
  "unrealizedPL": 500.00,
  "dayGain": 120.50,
  "dayGainPercent": 0.85,
  "raw": {
    "instrument_token": 408065,
    "product": "CNC",
    "used_quantity": 0,
    "t1_quantity": 0,
    "close_price": 1480.00
  }
}
```

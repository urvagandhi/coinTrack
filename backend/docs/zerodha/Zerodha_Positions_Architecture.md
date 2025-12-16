# Zerodha Positions Architecture & Data Flow

## 1. Overview
This document details the end-to-end implementation of the Zerodha Positions integration in CoinTrack.

**Core Philosophies:**
1.  **"Trust the Broker"**: We prioritize official computed values (`pnl`, `m2m`, `value`) provided by Zerodha over local re-computation.
2.  **"Raw Pass-Through"**: We rigorously preserve **ALL** fields returned by Zerodha (including optional fields like `buy_quantity`, `sell_price`, etc.) in a dedicated `raw` object.
3.  **"Portfolio Exclusion"**: Positions are **excluded** from the main "Portfolio Summary" aggregates (Total Gain, Previous Day) to preserve mathematical consistency (`DayGain = Current - Previous`).

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture (`ZerodhaBrokerService`)
**Source Endpoint**: `GET https://api.kite.trade/portfolio/positions`

We extract the **Net Segment** (`data.net`) which represents actual open positions.
We capture data in two layers:
1.  **Typed Fields**: Mapped to `ZerodhaPositionRaw.java` for business logic (e.g., `quantity`, `pnl`).
2.  **Raw Map**: The entire JSON object for each position is captured as `Map<String, Object>` to ensure no data loss.

| Zerodha Field | Type | Description |
| :--- | :--- | :--- |
| `tradingsymbol` | String | Symbol (e.g., "NIFTY23JULFUT") |
| `quantity` | BigDecimal | **Net Quantity** (Source of Truth) |
| `pnl` | BigDecimal | **Total Unrealized P&L** (Official) |
| `m2m` | BigDecimal | **Day MTM** (Official Day Change) |
| `value` | BigDecimal | Current Value (Broker Computed) |
| `average_price` | BigDecimal | Net Average Price |
| `last_price` | BigDecimal | LTP |
| `instrument_type` | String | F&O Type (FUT/CE/PE). **Key for detection.** |
| `day_buy_quantity` | BigDecimal | (Optional) Intraday Metadata |

### 2.2 Persistence (`CachedPosition`)
Data is stored in MongoDB (`cached_positions`).
*   **Typed Fields**: `quantity`, `pnl`, `mtm`, `averageBuyPrice`, `lastPrice`.
*   **Raw Payload**: `rawData` (Map) stores the full broker JSON.
*   **Metadata**: `apiVersion="v3"`, `lastUpdated`.

### 2.3 Normalization & Logic (`PortfolioSummaryServiceImpl`)

#### **Core Rules:**

**Rule 1: "Portfolio Aggregate Exclusion"**
*   Positions are **NOT** added to `totalDayGain`, `previousDayTotalValue`, or `totalCurrentValue` in the `PortfolioSummaryResponseDTO`.
*   **Reason**: Positions lack a stable "Previous Close" concept identical to Holdings. Including them would break the equation: `Total Day Gain = Total Current Value - Total Previous Value`.

**Rule 2: "Trust Zerodha P&L"**
*   `unrealizedPl` (note casing) = `raw.pnl` (Direct).
*   `dayGain` = `raw.m2m` (Direct).

**Rule 3: "Computed Fallback"**
*   If `raw.pnl` is missing (e.g., specific instrument types), we compute:
    *   `unrealizedPl = (currentPrice - averageBuyPrice) * quantity`
*   If `raw.value` is missing:
    *   `currentValue = quantity * last_price`

**Rule 4: "Derivative Detection"**
*   `derivative` = `true` if `raw.instrument_type` is not null.

---

## 3. API Response Structure (Schema)

The `/portfolio/summary` endpoint returns a list of positions matching this schema:

```json
{
  "symbol": "NIFTY23JUL19500CE",
  "totalQuantity": 50,
  "averageBuyPrice": 120.50,
  "currentPrice": 145.00,
  "investedValue": 6025.00,
  "currentValue": 7250.00,
  "unrealizedPl": 1225.00,      // <-- Matches Java DTO field
  "dayGain": 450.00,            // <-- Derived from raw.m2m
  "dayGainPercent": 7.47,       // <-- Computed: (450 / 6025) * 100
  "derivative": true,
  "instrumentType": "CE",
  "expiryDate": "2023-07-27",
  "strikePrice": 19500.00,
  "raw": {
     "tradingsymbol": "NIFTY23JUL19500CE",
     "instrument_token": 1234567,
     "product": "NRML",
     "quantity": 50,
     "pnl": 1225.00,
     "m2m": 450.00,
     "value": 7250.00
  }
}
```

---

## 4. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Compute P&L, MTM, Value | **Source of Truth** |
| **Backend** | Persist, Exclude from Aggregates, Normalize | Shape & Logic |
| **Frontend** | Display, Color Coding (Green/Red) | Presentation Logic |

---

## 5. Risk & Edge Case Handling

### 5.1 Missing Raw Data
*   Services verify `rawData`. If null (legacy data), a valid `raw` map is reconstructed from stored typed fields to ensure the frontend never receives null.

### 5.2 Zero Price / Illiquidity
*   If `last_price` is 0 and `raw.value` is 0, `currentValue` is 0.
*   Frontend handles this gracefully (e.g., displaying "—").

### 5.3 F&O Expiry
*   Expired positions vanish from Zerodha's API. The `PortfolioSyncService` detects missing items and updates the local DB to remove them or set quantity to 0.

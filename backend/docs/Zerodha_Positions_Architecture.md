# Zerodha Positions Architecture & Data Flow

## 1. Overview
This document details the end-to-end implementation of the Zerodha Positions integration in CoinTrack.

**Core Philosophies:**
1.  **"Trust the Broker"**: We prioritize official computed values (`pnl`, `m2m`, `value`) provided by Zerodha over local re-computation.
2.  **"Raw Pass-Through"**: We rigourously preserve **ALL** fields returned by Zerodha (including optional fields like `buy_quantity`, `sell_price`, etc.) in a dedicated `raw` object, ensuring complete fidelity to the source of truth and enabling future-proof auditing.

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
| *...others* | Varies | All preserved in `raw` map. |

### 2.2 Persistence (`CachedPosition`)
Data is stored in MongoDB (`cached_positions`).
*   **Typed Fields**: `quantity`, `pnl`, `mtm`, `averageBuyPrice`, `lastPrice`.
*   **Raw Payload**: `rawData` (Map) stores the full broker JSON.
*   **Metadata**: `apiVersion="v3"`, `lastUpdated`.

### 2.3 Normalization & Logic
We serve positions via two primary services/endpoints, both adhering to the **Same Truth**.

#### **A. Portfolio Summary (`PortfolioSummaryServiceImpl` -> `/portfolio/summary`)**
Maps `CachedPosition` to `SummaryPositionDTO`.
*   Used for the "Positions" tab in the Portfolio Dashboard (Aggregated view).

#### **B. Net Positions (`NetPositionServiceImpl` -> `/portfolio/positions`)**
Maps `CachedPosition` to `NetPositionDTO`.
*   Used for the dedicated Positions page (Detailed view).

#### **Core Rules (Applied to Both):**

**Rule 1: "Trust Zerodha P&L"**
*   `unrealizedPL` = `raw.pnl` (Direct)
*   `dayGain` = `raw.m2m` (Direct)

**Rule 2: "Safe Day Gain %"**
*   Since Zerodha doesn't provide Day Gain % for positions, we compute it safely.
*   **Formula**: `(m2m / investedValue) * 100`
*   **Guardrail**: Only compute if `investedValue > 0`. Default to `0` otherwise.

**Rule 3: "Derivative Detection"**
*   `isDerivative` = `raw.instrument_type != null`.
*   We rely on explicit metadata, not heuristics.

**Rule 4: "Robust Raw Fallback"**
*   If `cachedPosition.rawData` is null (legacy data), the service **reconstructs** a valid `raw` map from stored typed fields (`pnl`, `mtm`, `value`, etc.) before returning.
*   This guarantees `raw` is **NEVER** null in the API response.

---

## 3. API Response Structure (Schema)

Both `/portfolio/summary` and `/portfolio/positions` return a structure compliant with this schema.

```json
{
  "symbol": "NIFTY23JUL19500CE",
  "totalQuantity": 50,
  "averageBuyPrice": 120.50,
  "currentPrice": 145.00,
  "investedValue": 6025.00,
  "currentValue": 7250.00,
  "unrealizedPL": 1225.00,      // <-- Derived from raw.pnl
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
     "value": 7250.00,
     "buy_quantity": 50,
     "sell_quantity": 0,
     "day_buy_quantity": 0,
     "day_sell_quantity": 0
     // ... ALL other broker fields forwarded verbatim
  }
}
```

---

## 4. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Compute P&L, MTM, Value | **Source of Truth** |
| **Backend** | Persist, Normalize identifiers, Pass-through Raw | Shape & Persistence |
| **Frontend** | Display, Color Coding (Green/Red) | Presentation Logic |

---

## 5. Risk & Edge Case Handling

### 5.1 Missing Raw Data (Legacy Sync)
*   **Scenario**: Database contains positions fetched before the "Raw Pass-Through" update.
*   **Handling**: Services (`PortfolioSummary` & `NetPosition`) verify `rawData` existence. If null, they reconstruct a high-fidelity map from individual stored columns.

### 5.2 Zero Price / Illiquidity
*   **Scenario**: `last_price` is 0.
*   **Handling**: `currentValue` respects `raw.value` if provided. If both `raw.value` and `last_price` are 0, value is 0. Frontend shows "—".

### 5.3 F&O Expiry
*   **Scenario**: Position expires or is closed.
*   **Handling**: If `quantity` becomes 0, Zerodha usually removes it from `net` positions. It disappears from the API. The `PortfolioSyncService` updates the local DB to remove/mark it zero quantity strictly based on the fresh API list.

## 6. Verification Steps

1.  **API Check**: Call `/portfolio/summary` or `/portfolio/positions`.
2.  **Raw Field Check**: Verify the `raw` object is present and contains fields like `instrument_token` or `product`.
3.  **P&L Audit**: Compare `unrealizedPL` in the response with `raw.pnl`. They must match.
4.  **Fallback Test**: Manually set `rawData` to null in MongoDB for a test document and verify the API still returns a populated `raw` object (triggering fallback logic).

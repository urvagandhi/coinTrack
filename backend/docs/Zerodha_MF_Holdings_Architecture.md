# Zerodha Mutual Funds Holdings Architecture & Data Flow

## 1. Overview
This document details the end-to-end implementation of the Zerodha Mutual Funds (`/mf/holdings`) integration in CoinTrack.

**Core Philosophies:**
1.  **"Trust the Broker"**: We strictly prioritize official values provided by Zerodha (P&L, NAV, Quantity) because Mutual Funds have complex settlement logic (T+1, exit loads, stamp duty) that cannot be accurately replicated locally.
2.  **"Raw Pass-Through"**: We rigourously preserve **ALL** fields returned by Zerodha in a dedicated `raw` object. This ensures that if Zerodha adds metadata (e.g., `dividend_type`, `lockin_period`) in the future, it is immediately available without backend code changes.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture (`ZerodhaBrokerService`)
**Source Endpoint**: `GET https://api.kite.trade/mf/holdings`

We use a dynamic extraction strategy to ensure zero data loss:
1.  **Fetch**: The service fetches the response explicitly as `List<Map<String, Object>>`. This bypasses strict POJO mapping at the fetch layer.
2.  **DTO Mapping**: We use Jackson's `convertValue` to map known standard fields (like `fund`, `quantity`) to our Java DTO.
3.  **Raw Injection**: The **entire original Map** is injected into the DTO's `raw` field.

| Zerodha Field | Java Type | Description |
| :--- | :--- | :--- |
| `tradingsymbol` | String | Unique fund identifier/code returned by Zerodha (`INF...`), used for NAV/pricing lookups |
| `fund` | String | Scheme Name (e.g., "HDFC Top 100") |
| `folio` | String | Folio Number |
| `quantity` | BigDecimal | **Source of Truth** for units held. |
| `average_price` | BigDecimal | Average NAV (Acquisition Cost). |
| `last_price` | BigDecimal | Latest NAV (Current Price). |
| `current_value` | BigDecimal | **Official Market Value**. |
| `pnl` | BigDecimal | **Official Unrealized P&L**. |
| `amc` | String | AMC Name (e.g., "HDFC Mutual Fund"). |
| `isin` | String | Unique Identifier. |
| *...others* | Varies | Preserved in `raw`. |

> **Full Raw Capture Policy:** All fields returned by the `/mf/holdings` API — including undocumented or auxiliary ones (e.g., `xirr`, `discrepancy`, `pledged_quantity`, `las_quantity`) — MUST be preserved in `raw`. The backend should never filter or mutate unknown fields.

### 2.2 Logic & Normalization (`PortfolioSummaryServiceImpl`)

When serving the frontend (`/portfolio/mutual-funds`), we strictly adhere to the **"No Re-computation"** rule.

#### **Rule 1: Trust Official P&L**
*   **Logic**: `dto.unrealizedPL` = `raw.pnl`.
*   **Why**: Local calculation `(currentValue - investedValue)` often mismatches due to rounding or hidden charges. We trust the broker's ledger.
*   **Fallback**: If `pnl` is null (rare, e.g., fresh allotment), we pass `null` or `0` to the frontend. We do **not** attempt to estimate it.

#### **Rule 2: Trust Official Current Value**
*   **Logic**: `dto.currentValue` = `raw.current_value`.
*   **Why**: Ensures alignment with the Kite dashboard.

---

## 3. Frontend Integration (`MutualFundDTO`)

The API returns a normalized contract that is friendly to the Javascript frontend (camelCase) while carrying the raw payload.

### 3.1 Response Structure (Schema)

```json
{
  "fund": "HDFC SMALL CAP FUND - DIRECT GROWTH",
  "tradingsymbol": "INF179KC1AW7",
  "folio": "12345678/45",
  "amc": "HDFC Mutual Fund",
  "isin": "INF179KC1AW7",
  "quantity": 560.45,
  "averagePrice": 78.90,     // Mapped from raw.average_price
  "currentPrice": 92.45,     // Mapped from raw.last_price
  "currentValue": 51813.60,  // Mapped from raw.current_value OR Computed Fallback
  "investedValue": 44219.50, // Computed: quantity * averagePrice
  "unrealizedPL": 7594.15,   // Mapped from raw.pnl OR Computed Fallback
  "raw": {
    "fund": "HDFC SMALL CAP FUND - DIRECT GROWTH",
    "folio": "12345678/45",
    "quantity": 560.45,
    "average_price": 78.9023,
    "last_price": 92.4500,
    "pnl": 7594.154,
    "current_value": 51813.6025,
    "last_price_date": "2023-10-27",
    "pledged_quantity": 0
    // ... Any other extra fields from Zerodha
  }
}
```

### 3.2 Display Guidelines
*   **Quantity**: Display with up to 3 decimal places (MF units can be fractional).
*   **P&L Coloring**: Green if `unrealizedPL >= 0`, Red if `< 0`.
*   **Missing Data**: If `currentPrice` is missing, display "—" (Market data unavailable).

---

## 4. Risks & Edge Case Handling

### 4.1 Zero Quantity (Redemption)
*   **Scenario**: User redeemed full units, but Zerodha might still return the holding with `quantity: 0` for T+1 settlement days.
*   **Handling**: Passed through as `quantity: 0`. The frontend should decide whether to hide it or show it as "Redeemed".

### 4.2 Null P&L (New Allotment)
*   **Scenario**: User bought funds today; NAV is not yet updated for the day.
*   **Handling**: `unrealizedPL` might be null. Frontend handles this gracefully (shows "0" or "—").

### 4.3 Schema Changes
*   **Scenario**: Zerodha renames `last_price` to `nav` in v4 API.
*   **Handling**: The `raw` map will immediately capture `nav`. The typed field `currentPrice` might be null until we update the `@JsonAlias`. However, audit data remains intact in `raw`.

### 4.5 Fallback Computation for Mutual Funds

**When to compute:**
If Zerodha returns `null` or `0` for `current_value` and/or `pnl`.
*Only compute as a fallback, not as a replacement for broker-provided values.*

**Safe Computation Logic:**
*   `investedValue` = `quantity` × `averagePrice`
*   `currentValue` = `quantity` × `currentPrice`
*   `unrealizedPL` = `currentValue` − `investedValue`

**Backend Implementation:**
*   Compute fallback values only on the **API layer** before sending to frontend.
*   Do **not** persist fallback values in the database as primary values — persist only Zerodha raw fields.

**Frontend Display:**
*   Display computed fallback values only when official `raw.current_value` or `raw.pnl` are missing or invalid.
*   If both official and computed values are present, prefer official values.

## 5. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Compute NAV, Units, P&L | **Source of Truth** |
| **Backend** | Fetch, Normalize Keys, Pass Raw | **Transport Layer** |
| **Frontend** | Format & Display | **Presentation** |


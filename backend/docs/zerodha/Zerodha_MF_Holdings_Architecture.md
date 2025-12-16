# Zerodha Mutual Funds Holdings Architecture & Data Flow

## 1. Overview
This document details the end-to-end implementation of the Zerodha Mutual Funds (`/mf/holdings`) integration in CoinTrack.

**Core Philosophies:**
1.  **"Trust the Broker"**: We strictly prioritize official values provided by Zerodha (P&L, NAV, Quantity).
2.  **"Smart Fallback"**: The Backend DTO automatically computes fallback values (`Quantity * NAV`) if trusted broker values are missing, guaranteeing valid non-null financial data for the frontend.
3.  **"Raw Pass-Through"**: We rigourously preserve **ALL** fields returned by Zerodha in a dedicated `raw` object.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture (`ZerodhaBrokerService`)
**Source Endpoint**: `GET https://api.kite.trade/mf/holdings`

We use a dynamic extraction strategy to ensure zero data loss:
1.  **Fetch**: Explicitly as `List<Map<String, Object>>`.
2.  **DTO Mapping**: Maps known standard fields (like `fund`, `quantity`) to `MutualFundDTO`.
3.  **Raw Injection**: The **entire original Map** is injected into the DTO's `raw` field.

| Zerodha Field | Java Type | Description |
| :--- | :--- | :--- |
| `tradingsymbol` | String | Unique fund identifier/code. |
| `fund` | String | Scheme Name. |
| `folio` | String | Folio Number. |
| `quantity` | BigDecimal | **Source of Truth** for units held. |
| `average_price` | BigDecimal | Average NAV (Acquisition Cost). |
| `last_price` | BigDecimal | Latest NAV (Current Price). |
| `current_value` | BigDecimal | **Official Market Value**. |
| `pnl` | BigDecimal | **Official Unrealized P&L**. |
| `amc` | String | AMC Name. |

### 2.2 Logic & Normalization (`MutualFundDTO`)

The **DTO itself** encapsulates the "Trust but Verify" logic. The Service layer (`PortfolioSummaryServiceImpl`) simply converts lists; the DTO getters enforce the rules.

#### **Rule 1: Trust Official P&L with Fallback**
*   **Getter Logic (`getUnrealizedPL`)**:
    1.  Check `this.unrealizedPL` (Mapped from `raw.pnl`).
    2.  P&L exists and != 0? **Return it.**
    3.  **Fallback**: Compute `getCurrentValue() - getInvestedValue()`.

#### **Rule 2: Trust Official Current Value with Fallback**
*   **Getter Logic (`getCurrentValue`)**:
    1.  Check `this.currentValue` (Mapped from `raw.current_value`).
    2.  Value exists and != 0? **Return it.**
    3.  **Fallback**: Compute `quantity * currentPrice`.

> **Impact**: The Frontend (Consumer) **never** receives null/zero unless the underlying quantity/price are also missing. It effectively "hides" data gaps from Zerodha.

---

## 3. Frontend Integration (`MutualFundDTO`)

The API returns a normalized contract that is populated either by direct broker data or safe backend computation.

### 3.1 Response Structure (Schema)

```json
{
  "fund": "HDFC SMALL CAP FUND - DIRECT GROWTH",
  "tradingSymbol": "INF179KC1AW7",
  "folio": "12345678/45",
  "amc": "HDFC Mutual Fund",
  "isin": "INF179KC1AW7",
  "quantity": 560.45,
  "averagePrice": 78.90,
  "currentPrice": 92.45,
  "currentValue": 51813.60,  // <-- Populated by raw.current_value OR Fallback
  "investedValue": 44219.50, // <-- Computed: quantity * averagePrice
  "unrealizedPL": 7594.15,   // <-- Populated by raw.pnl OR Fallback
  "lastPriceDate": "2023-10-27",
  "raw": {
    "fund": "HDFC SMALL CAP FUND - DIRECT GROWTH",
    "quantity": 560.45,
    "average_price": 78.9023,
    "last_price": 92.4500,
    "pnl": 7594.154,
    "current_value": 51813.6025,
    "last_price_date": "2023-10-27"
    // ... Any other extra fields from Zerodha
  }
}
```

### 3.2 Display Guidelines
*   **P&L Coloring**: Green if `unrealizedPL >= 0`, Red if `< 0`.
*   **Simplicity**: Frontend does **not** need to perform fallback math. Trust the values in `unrealizedPL` and `currentValue`.

---

## 4. Risks & Edge Case Handling

### 4.1 Zero Quantity (Redemption)
*   **Scenario**: User redeemed full units; Zerodha creates a T+1 record with `quantity: 0`.
*   **Result**: Backend returns `quantity: 0`, `currentValue: 0`, `unrealizedPL: 0`.

### 4.2 Missing NAV (New Listing)
*   **Scenario**: `last_price` is null/zero.
*   **Result**: `currentValue` becomes 0 (even in fallback). `unrealizedPL` becomes negative of invested value (worst case) or zero depending on `pnl` presence.
*   **Guidance**: If `currentPrice` is zero, frontend should consider showing "—" instead of financial values.

---

## 5. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Compute NAV, Units, P&L | **Source of Truth** |
| **Backend DTO** | Map Raw, **Compute Fallback if Missing**, Inject Raw | **Normalization & Safety** |
| **Frontend** | Format & Display | **Presentation** |

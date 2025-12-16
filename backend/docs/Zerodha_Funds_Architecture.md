# Zerodha Funds & Margins Architecture

## 1. Overview
This document details the implementation of the Zerodha Funds and Margins integration in CoinTrack.

**Core Philosophies:**
1.  **"Trust the Broker"**: We display exactly what Zerodha reports for Net, Available, and Utilised margins.
2.  **"Raw Pass-Through"**: We rigorously preserve **ALL** fields returned by Zerodha (including optional ones like `adhoc_margin`) in a dedicated `raw` object, ensuring complete fidelity to the source of truth and enabling future-proof auditing.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture (`ZerodhaBrokerService`)
**Source Endpoint**: `GET https://api.kite.trade/user/margins`

We do **not** simply deserialize into a fixed schema. Instead, we:
1.  Fetch the response as a generic `Map<String, Object>`.
2.  Desrialize the standard fields into our typed `FundsDTO` for business logic.
3.  **Crucially**, we extract the **entire** `equity` and `commodity` JSON nodes and inject them into `FundsDTO.equity.raw` and `FundsDTO.commodity.raw`.

This guarantees that if Zerodha adds a new field (e.g., `special_margin_benefit`) tomorrow, it is automatically captured and passed through without code changes.

### 2.2 Persistence (`CachedFunds`)
To allow for auditing and historical analysis, we persist the latest fetched margin state.

*   **Entity**: `CachedFunds` (MongoDB `cached_funds`)
*   **Key Fields**:
    *   `userId` & `broker`: Compound Index.
    *   `equityRaw`: The full JSON map for the equity segment.
    *   `commodityRaw`: The full JSON map for the commodity segment.
    *   `lastUpdated`: Timestamp of the fetch.

### 2.3 Service Layer (`PortfolioSummaryServiceImpl`)
When `getFunds()` is called:
1.  It calls `ZerodhaBrokerService.fetchFunds()`.
2.  It **intercepts** the result to save the raw data into `CachedFundsRepository`.
3.  It returns the DTO (containing both normalized and raw data) to the frontend.

---

## 3. Data Structure & Schema

### 3.1 Normalized Fields (For UI)
These are strongly typed fields used for standard UI display (e.g., "Available Cash").

| Field | Type | Description |
| :--- | :--- | :--- |
| `enabled` | boolean | Is this segment active? |
| `net` | BigDecimal | Net Cash Balance |
| `available.cash` | BigDecimal | Free cash balance |
| `available.collateral` | BigDecimal | Margin from pledged holdings |
| `utilised.debits` | BigDecimal | Total amount used/blocked |
| `utilised.exposure` | BigDecimal | Margin blocked for exposure |
| `utilised.m2m_realised` | BigDecimal | Realized MTM for the day |

### 3.2 Raw Pass-Through (For Audit/Debug)
The `raw` object contains the **superset** of all fields.

> **Policy**: The backend must forward **all fields** returned by the API. Do not drop `adhoc_margin`, `payout`, etc.

**Example Raw JSON Content (stored in `raw`):**
```json
{
  "enabled": true,
  "net": 12345.65,
  "available": {
    "adhoc_margin": 0,
    "cash": 12345.65,
    "opening_balance": 12345.65,
    "live_balance": 12345.65,
    "collateral": 0,
    "intraday_payin": 0
  },
  "utilised": {
    "debits": 0,
    "exposure": 0,
    "m2m_realised": 0,
    "m2m_unrealised": 0,
    "option_premium": 0,
    "payout": 0,
    "span": 0,
    "holding_sales": 0,
    "turnover": 0,
    "liquid_collateral": 0,
    "stock_collateral": 0,
    "delivery": 0
  }
}
```

> **Note on Nesting**: The backend explicitly preserves the hierarchical structure (e.g., `available.intraday_payin`) within the `raw` map. No flattening occurs.

---

## 4. API Response Structure

The frontend receives a structure strictly partitioned by segment (`equity`, `commodity`), each containing specific `raw` metadata.

```json
{
  "success": true,
  "data": {
    "equity": {
      "enabled": true,
      "net": 245431.60,
      "available": {
        "cash": 245431.60,
        "collateral": 0.00,
        "live_balance": 99725.05
      },
      "utilised": {
        "debits": 145706.55,
        "span": 101989.00,
        "exposure": 38981.25
      },
      "raw": {
        // ... ENTIRE Zerodha "equity" object ...
        "available": {
             "adhoc_margin": 0,  // <--- Preserved!
             "cash": 245431.60
        }
      }
    },
    "commodity": {
      "enabled": false,
      "net": 0.00,
      "available": { ... },
      "utilised": { ... },
      "raw": { ... }
    }
  }
}
```

---

## 5. Summary of Responsibilities

| Component | Responsibility |
| :--- | :--- |
| **Zerodha API** | **Source of Truth**. Provides margins, calc, and balances. |
| **Backend** | **Transport & Audit**. Fetches verbatim, extracts normalized fields for convenience, but persists and forwards everything in `raw`. |
| **Frontend** | **Display**. Uses normalized fields for the main card, but can use `raw` for detailed "Balance Sheet" views or debugging. |

## 6. Verification Steps

To verify the integration is working as designed:
1.  **Call API**: Hit `/api/portfolio/funds`.
2.  **Inspect Response**: Check for the presence of the `raw` object inside `equity`.
3.  **Verify Content**: Ensure `raw` contains fields like `adhoc_margin` or `opening_balance` even if they aren't in the main `available` block.
4.  **Check Database**: Query `db.cached_funds.find()` and verify the `equityRaw` map is populated with the full JSON.

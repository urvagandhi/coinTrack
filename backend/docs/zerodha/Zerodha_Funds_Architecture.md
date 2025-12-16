# Zerodha Funds & Margins Architecture

## 1. Overview
This document details the implementation of the Zerodha Funds and Margins integration in CoinTrack.

**Core Philosophies:**
1.  **"Trust the Broker"**: We display exactly what Zerodha reports for Net, Available, and Utilised margins.
2.  **"Raw Pass-Through"**: We rigorously preserve **ALL** fields returned by Zerodha (including optional ones like `adhoc_margin`) in a dedicated `raw` object.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture (`ZerodhaBrokerService`)
**Source Endpoint**: `GET https://api.kite.trade/user/margins`

We do **not** simply deserialize into a fixed schema. Instead, we:
1.  Fetch the response as a strongly typed `FundsDTO`.
2.  **Crucially**, the service layer manually extracts the **entire** `equity` and `commodity` JSON nodes and injects them explicitly into `FundsDTO.equity.raw` and `FundsDTO.commodity.raw`.

This guarantees that if Zerodha adds a new field (e.g., `special_margin_benefit`), it is automatically captured in the `raw` map and passed through.

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

### 3.1 Nested Structure (`FundsDTO`)
The DTO mirrors the Zerodha/Kite structure, partitioned by segment.

`FundsDTO`
  ├── `equity` (`SegmentFundsDTO`)
  └── `commodity` (`SegmentFundsDTO`)

### 3.2 Normalized Fields (For UI)
These are strongly typed fields in `SegmentFundsDTO` used for standard UI display:

| Field | Type | Description |
| :--- | :--- | :--- |
| `enabled` | boolean | Is this segment active? |
| `net` | BigDecimal | Net Cash Balance |
| `available.cash` | BigDecimal | Free cash balance |
| `available.collateral` | BigDecimal | Margin from pledged holdings |
| `available.live_balance`| BigDecimal | Effective available balance |
| `utilised.debits` | BigDecimal | Total amount used/blocked |
| `utilised.exposure` | BigDecimal | Margin blocked for exposure |
| `utilised.span` | BigDecimal | SPAN margin blocked |

### 3.3 Raw Pass-Through (For Audit/Debug)
The `raw` object contains the **superset** of all fields for that segment.

> **Policy**: The backend must forward **all fields** returned by the API.

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
        "live_balance": 99725.05,
        "opening_balance": 245431.60
      },
      "utilised": {
        "debits": 145706.55,
        "span": 101989.00,
        "exposure": 38981.25,
        "option_premium": 0.00
      },
      "raw": {
        // ... ENTIRE Zerodha "equity" object ...
        "net": 245431.60,
        "available": {
             "adhoc_margin": 0,
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
| **Backend** | **Transport & Audit**. Fetches typed objects, but injects original JSON into `raw`. |
| **Frontend** | **Display**. Uses normalized fields for the main card, `raw` for detailed views. |

## 6. Verification Steps

To verify the integration is working as designed:
1.  **Call API**: Hit `/api/portfolio/funds`.
2.  **Inspect Response**: Check for the presence of the `raw` object inside `equity`.
3.  **Verify Content**: Ensure `raw` contains fields like `adhoc_margin` (if present in broker response) or duplicate values of `net`, confirming full capture.

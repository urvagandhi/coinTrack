# Zerodha Mutual Funds Orders Architecture & Data Flow

## 1. Overview
This document details the implementation of the **Zerodha Mutual Funds Orders (`/mf/orders`)** integration in CoinTrack.

**Core Philosophies:**
1.  **Trust the Broker**: Official Zerodha values are the source of truth.
2.  **Raw Pass-Through**: All fields (documented or not) are preserved in the `raw` map.
3.  **Semantic Enrichment**: We derive useful frontend flags (`isSip`, `orderSide`) but never alter financial values.
4.  **Audit Persistence**: Full fidelity storage in `cached_mf_orders`.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture
**Endpoint**: `GET https://api.kite.trade/mf/orders`
**Method**: `ZerodhaBrokerService.fetchMfOrders`

1.  **Fetch**: Retries list of raw maps `List<Map<String, Object>>` to capture full fidelity.
2.  **DTO Mapping**: Maps known fields to `MutualFundOrderDTO` properties.
3.  **Raw Injection**: The complete original JSON object is injected into the `raw` field.

### 2.2 Persistence
**Collection**: `cached_mf_orders`
**Entity**: `CachedMfOrder`
**Key Strategy**: `userId` + `orderId` + `broker`.
**Logic**: Idempotent upsert. If an order ID exists, it is updated; otherwise, inserted.

---

## 3. Normalization Logic (`PortfolioSummaryServiceImpl`)

### 3.1 Normalized Fields Table

| DTO Field | Zerodha Source | Description & Logic |
| :--- | :--- | :--- |
| `orderId` | `order_id` | Unique Order Identifier. |
| `fund` | `fund` | Scheme Name. |
| `tradingSymbol` | `tradingsymbol` | Unique Scheme Code. |
| `transactionType` | `transaction_type` | `BUY`, `SELL`, `PURCHASE`, `REDEEM`. |
| `amount` | `amount` | Order Value (₹). |
| `executedQuantity` | `quantity` | Units Allotted/Redeemed. Null for OPEN orders. |
| `executedNav` | `average_price` | Execution Price. Null for OPEN orders. |
| `status` | `status` | `COMPLETE`, `REJECTED`, `OPEN`, `CANCELLED`. |
| **`executionDate`** | **`exchange_timestamp`** | **Primary**: Date of trade execution. <br> **Fallback**: If null, uses `order_date`. |
| `orderTimestamp` | `order_timestamp` | Date/Time of order placement. |
| `folio` | `folio` | Folio Number. |
| `variety` | `variety` | `sip`, `amc_sip`, `regular`, `redemption`. |
| `purchaseType` | `purchase_type` | `fresh`, `additional`, `lump_sum`. |
| `settlementId` | `settlement_id` | Settlement Reference from exchange. |
| **`orderSide`** | **Derived** | `INFLOW` if BUY/PURCHASE, `OUTFLOW` if SELL/REDEEM. |
| **`isSip`** | **Derived** | `true` if `variety` contains "sip", else `false`. |

### 3.2 Meta Date Extraction
Zerodha places some critical dates inside a nested `meta` object.
*   **`expectedNavDate`**: `raw.meta.expected_nav_date` (Date NAV is applicable).
*   **`allotmentDate`**: `raw.meta.allotment_date` (Date units are credited).
*   **`redemptionDate`**: `raw.meta.redemption_date` OR `raw.meta.expected_redeem_date`.

### 3.3 Sorting Rule (Strict)
The backend enforces a strict sorting order before returning the list:
1.  **Primary**: `executionDate` **DESCENDING** (Newest trades first).
2.  **Secondary**: `orderTimestamp` **DESCENDING** (Tie-breaker for same-day/same-time trades).

---

## 4. JSON Representation (Example)

```json
{
  "orderId": "1000000001",
  "fund": "Nippon India Small Cap Fund - Direct Growth Plan",
  "tradingSymbol": "INF123456789",
  "transactionType": "BUY",
  "status": "COMPLETE",
  "amount": 5000.00,
  "executedQuantity": 25.432,
  "executedNav": 196.50,
  "executionDate": "2023-10-25 14:30:00",
  "orderTimestamp": "2023-10-25 09:15:00",
  "variety": "sip",
  "purchaseType": "fresh",
  "folio": "12345678/90",
  "settlementId": "1234567",
  "isSip": true,
  "orderSide": "INFLOW",
  "expectedNavDate": "2023-10-25",
  "allotmentDate": "2023-10-26",
  "raw": {
    "order_id": "1000000001",
    "status": "COMPLETE",
    "meta": {
      "expected_nav_date": "2023-10-25",
      "allotment_date": "2023-10-26"
    }
  }
}
```

---

## 5. Risk & Null Policy

| Field | Nullability | Handling |
| :--- | :--- | :--- |
| `executedQuantity` | **Nullable** | Null until status is `COMPLETE`. |
| `executedNav` | **Nullable** | Null until status is `COMPLETE`. |
| `folio` | **Nullable** | Null for first-time orders until allotment. |
| `executionDate` | **Non-Null** | Guaranteed via fallback to `order_date` if `exchange_timestamp` is missing. |

**Frontend Requirement**:
*   Always check `status` before displaying Quantity/NAV.
*   Handle `folio` as optional text (e.g., "Pending...").

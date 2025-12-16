# Zerodha MF SIPs, Instruments & Orders Architecture

## 1. Overview
This document details the architecture and data flow for the Mutual Fund SIPs, Instruments, and Orders integration in CoinTrack. Similar to our Holdings architecture, we follow the **"Trust the Broker"** philosophy, relying on Zerodha's official data for status, amounts, and dates.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Mapping (`ZerodhaBrokerService`)
We utilize three primary endpoints from the Kite Connect API:
1.  **SIPs**: `GET https://api.kite.trade/mf/sips`
2.  **Instruments**: `GET https://api.kite.trade/mf/instruments` (returns CSV)
3.  **Orders**: `GET https://api.kite.trade/mf/orders`

We use **Raw DTOs** effectively to capture the exact JSON/CSV response.

#### 2.1.1 SIPs Mapping (`MfSipDTO`)
| Zerodha Field | Java Type | Description |
| :--- | :--- | :--- |
| `sip_id` | String | Unique SIP Identifier |
| `fund` | String | Name of the Mutual Fund Scheme |
| `tradingsymbol` | String | Unique Trading Symbol (e.g., "INFYDirect") |
| `status` | String | **Source of Truth** (ACTIVE, PAUSED, CANCELLED) |
| `instalment_amount` | Double | Fixed amount per instalment |
| `frequency` | String | Schedule (monthly, weekly) |
| `created` | String | Start Date of the SIP |
| `last_instalment` | String | Timestamp of last successful instalment |
| `next_instalment` | String | **Critical**: Date of next deduction |
| `folio_id` | String | Folio Number |
| `completed_instalments`| Integer | Count of paid instalments |
| `transaction_type` | String | BUY/SELL (usually BUY for SIPs) |
| `dividend_type` | String | payout / reinvest / growth |
| `fund_source` | String | Source of funds |
| `mandate_type` | String | e.g., "emandate" |
| `mandate_id` | String | Linked mandate identifier |

#### 2.1.2 Instruments Mapping (`MfInstrumentDTO`)
*Note: The instruments API returns a CSV file. We parse headers dynamically but map specific columns.*

| Zerodha CSV Column | Java Type | Description |
| :--- | :--- | :--- |
| `tradingsymbol` | String | Unique Trading Symbol |
| `name` | String | Full Scheme Name |
| `amc` | String | Asset Management Company |
| `isin` | String | ISIN Code |
| `scheme_type` | String | Equity, Debt, Hybrid, etc. |
| `plan` | String | Direct / Regular |
| `last_price` | BigDecimal | Latest NAV |
| `last_price_date` | String | Date of `last_price` |
| `minimum_purchase_amount` | BigDecimal | Min. initial investment |
| `minimum_additional_purchase_amount` | BigDecimal | Min. subsequent investment |
| `purchase_amount_multiplier` | BigDecimal | Step amount for purchase |
| `purchase_allowed` | Boolean | "1" -> true |
| `redemption_allowed` | Boolean | "1" -> true |
| `minimum_redemption_quantity` | BigDecimal | Min units to redeem |
| `settlement_type` | String | e.g., "T3", "T1" |
| `dividend_type` | String | growth / payout |

#### 2.1.3 Orders Mapping (`MutualFundOrderDTO`)
| Zerodha Field | Java Type | Description |
| :--- | :--- | :--- |
| `order_id` | String | Unique Order ID |
| `fund` | String | Scheme Name |
| `tradingsymbol` | String | Trading Symbol |
| `transaction_type` | String | BUY / SELL |
| `amount` | BigDecimal | Order Amount (for purchase) |
| `quantity` | BigDecimal | Executed Units (or Sell Qty) |
| `status` | String | COMPLETE, REJECTED, OPEN |
| `order_timestamp` | String | Time of placement |
| `exchange_timestamp` | String | **Time of execution** |
| `average_price` | BigDecimal | Execution NAV |
| `variety` | String | regular, sip, amc_sip, redemption |
| `purchase_type` | String | lump_sum, sip |
| `settlement_id` | String | Settlement Reference |

### 2.2 Logic & Transformation (`PortfolioSummaryServiceImpl` / `ZerodhaBrokerService`)
Unlike Holdings, these entities are largely "pass-through".

#### **Rule 1: Wrapper Response**
All list responses are wrapped in `KiteListResponse<T>` to include:
*   `data`: The list of DTOs.
*   `lastSyncedAt`: Timestamp of the fetch.
*   `source`: "LIVE".

#### **Rule 2: Raw Preservation**
We inject the complete original JSON object into a `raw` field.
*   **SIPs/Orders**: `raw` map from JSON.
*   **Instruments**: `raw` map constructed from CSV columns.

#### **Rule 3: Order Dates**
*   **Execution Date**: We prioritize `exchange_timestamp` (actual trade time) over `order_timestamp` (placement time).
*   **Meta Dates**: We extract `expected_nav_date`, `allotment_date`, and `redemption_date` from the nested `meta` object in the raw response.

#### **Rule 4: Derived Fields (Orders)**
*   `isSip`: True if variety is "sip" or "amc_sip".
*   `orderSide`: "INFLOW" if BUY, "OUTFLOW" if SELL.

---

## 3. Frontend Integration

### 3.1 DTO Structure

#### **SIP DTO (`MfSipDTO`)**
```json
{
  "sipId": "123456",
  "fund": "HDFC Top 100 Fund - Direct Plan - Growth",
  "status": "ACTIVE",
  "instalmentAmount": 5000.00,
  "nextInstalmentDate": "2023-12-15",
  "sipType": "sip",
  "dividendType": "growth",
  "raw": { ... }
}
```

#### **Instrument DTO (`MfInstrumentDTO`)**
```json
{
  "tradingsymbol": "INFYDirect",
  "name": "HDFC Top 100 Fund",
  "amc": "HDFC Mutual Fund",
  "lastPrice": 145.20,
  "minimumPurchaseAmount": 500.00,
  "purchaseAllowed": true,
  "raw": { ... }
}
```

#### **Order DTO (`MutualFundOrderDTO`)**
```json
{
  "orderId": "111222",
  "fund": "Axis Bluechip Fund",
  "transactionType": "BUY",
  "amount": 10000.00,
  "executedQuantity": 50.5,
  "executedNav": 198.02,
  "status": "COMPLETE",
  "executionDate": "2023-10-01 14:00:00",
  "variety": "sip",
  "isSip": true,
  "orderSide": "INFLOW",
  "expectedNavDate": "2023-10-02",
  "raw": { "meta": { "expected_nav_date": "..." } }
}
```

### 3.2 Display Logic
1.  **SIP List**:
    *   Status Badges (ACTIVE=Green, PAUSED=Yellow).
    *   Dates formatted to local string.

2.  **Instrument List**:
    *   Client-side filtering (Name/AMC).
    *   Display `minimumPurchaseAmount` and `purchaseAllowed` status.
    *   Show `lastPrice` (NAV) and its date.

3.  **Order List**:
    *   Unified list of MF orders, sorted by `executionDate` desc (or `orderDate` if execution missing).
    *   Distinguish SIP orders via `isSip` flag.

---

## 4. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Maintain SIPs, Instruments, Order history | **Source of Truth** |
| **Backend** | Fetch, Parse CSV (Instruments), Map JSON, Inject `raw` | Transport Layer |
| **Frontend** | Display status, Filter instruments, Render Order History | Presentation Logic |

## 5. Risk & Edge Case Handling

### 5.1 CSV Parsing (Instruments)
*   **Resilience**: The CSV parser dynamically maps headers, so column reordering by Zerodha won't break it as long as header names remain consistent.
*   **Quotes**: Handles quoted CSV values (e.g., "Fund Name, Growth").

### 5.2 Meta Dates (Orders)
*   Fields like `expected_nav_date` are nested in a `meta` JSON object. If missing (early processing stage), getters return `null`. Frontend must handle graceful fallbacks (e.g., "TBD").

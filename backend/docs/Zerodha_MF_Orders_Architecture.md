# Zerodha Mutual Funds Orders Architecture & Data Flow *(Finalized)*

## 1. Overview
This document details the implementation of the **Zerodha Mutual Funds Orders (`/mf/orders`)** integration in CoinTrack.

**Core Philosophies:**
1.  **Trust the Broker**: Official Zerodha values are the source of truth.
2.  **Raw Pass-Through**: All fields (documented or not) are preserved in `raw`.
3.  **Semantic Enrichment**: We derive useful frontend flags (`isSip`, `orderSide`) but never alter financial values.
4.  **Audit Persistence**: Full fidelity storage in `cached_mf_orders`.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Capture
**Endpoint**: `GET https://api.kite.trade/mf/orders`
**Method**: `ZerodhaBrokerService.fetchMfOrders`

1.  **Fetch**: As `List<Map<String, Object>>` to capture everything.
2.  **Inject**: `raw` map injected into DTO.

### 2.2 Persistence
**Collection**: `cached_mf_orders`
**Entity**: `CachedMfOrder`
**Logic**: Idempotent upsert based on `order_id`.

---

## 3. Normalization Logic (`PortfolioSummaryServiceImpl`)

### 3.1 Normalized Fields Table

| Normalized Field | Source / Logic | Description |
| :--- | :--- | :--- |
| `orderId` | `raw.order_id` | Unique ID. |
| `fund` | `raw.fund` | Scheme Name. |
| `tradingsymbol` | `raw.tradingsymbol` | Scheme Code. |
| `transactionType` | `raw.transaction_type` | `BUY`, `SELL`. |
| `amount` | `raw.amount` | Order Value (₹). |
| `executedQuantity` | `raw.quantity` | Units (Allotted/Redeemed). |
| `executedNav` | `raw.average_price` | Execution Price. |
| `status` | `raw.status` | `COMPLETE`, `OPEN`, etc. |
| `executionDate` | `raw.exchange_timestamp` | **Canonical Date** (Settlement). |
| `orderTimestamp` | `raw.order_timestamp` | Placement Time. |
| `folio` | `raw.folio` | Folio Number. |
| `variety` | `raw.variety` | e.g., `sip`, `regular`. |
| `purchaseType` | `raw.purchase_type` | `FRESH`, `ADDITIONAL`. |
| `settlementId` | `raw.settlement_id` | Settlement Identifier. |
| **`orderSide`** | Derived (`BUY`->`INFLOW`) | Semantic direction. |
| **`isSip`** | Derived (`variety` has "sip") | Boolean flag. |
| **`expectedNavDate`** | `raw.meta.expected_nav_date` | Date of NAV applicability. |
| **`allotmentDate`** | `raw.meta.allotment_date` | Date of unit credit. |
| **`redemptionDate`** | `raw.meta.redemption_date` (or expected) | Date of payout. |
| `raw` | Full Map | **Source of Truth**. |

### 3.2 Sorting Rule (Backend Responsibility)
*   **Primary Sort**: `executionDate` (mapped from `exchange_timestamp`) **DESCENDING**.
*   **Secondary Sort**: `orderTimestamp` **DESCENDING** (Avoids flicker on same-day orders).
*   **Guarantee**: Backend implementation strictly enforces this multi-level sort.

---

## 4. Risks & Edge Case Handling ('Explicit Null Policy')

Frontend consumers MUST handle nulls gracefully.

| Field | Nullability | Rule / Reason |
| :--- | :--- | :--- |
| `folio` | **Nullable** | Null for new buy orders before allotment. |
| `executedQuantity` | **Nullable** | Null for `OPEN` orders. |
| `executedNav` | **Nullable** | Null for `OPEN` orders. |
| `expectedNavDate` | **Nullable** | May not be provided by exchange. |
| `allotmentDate` | **Nullable** | Null until allotment happens. |
| `redemptionDate` | **Nullable** | Null for BUY orders. |

**Important**: Never assume a field exists. Always check or use safe accessors.

---

## 5. Summary of Responsibilities

| Component | Responsibility |
| :--- | :--- |
| **Zerodha API** | Source of Truth for Status, Dates, Amounts. |
| **Backend** | Fetch, Persist, Normalize Semantics, **Sort**. |
| **Frontend** | Display, Format Dates, Handle Nulls. |

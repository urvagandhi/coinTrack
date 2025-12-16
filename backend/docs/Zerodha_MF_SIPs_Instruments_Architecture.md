# Zerodha MF SIPs & Instruments Architecture

## 1. Overview
This document details the architecture and data flow for the Mutual Fund SIPs and Instruments integration in CoinTrack. Similar to our Holdings architecture, we follow the **"Trust the Broker"** philosophy, relying on Zerodha's official data for status, amounts, and dates.

---

## 2. Backend Data Flow

### 2.1 Fetching & Raw Mapping (`ZerodhaBrokerService`)
We utilize two primary endpoints from the Kite Connect API:
1.  **SIPs**: `GET https://api.kite.trade/mf/sips`
2.  **Instruments**: `GET https://api.kite.trade/mf/instruments`

We use **Raw DTOs** effectively to capture the exact JSON response.

#### 2.1.1 SIPs Mapping (`MfSipDTO`)
| Zerodha JSON Field | Java Type | Description |
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

#### 2.1.2 Instruments Mapping (`MfInstrumentDTO`)
| Zerodha JSON Field | Java Type | Description |
| :--- | :--- | :--- |
| `tradingsymbol` | String | Unique Trading Symbol |
| `name` | String | Full Scheme Name |
| `amc` | String | Asset Management Company |
| `isin` | String | ISIN Code |
| `scheme_type` | String | Equity, Debt, Hybrid, etc. |
| `plan` | String | Direct / Regular |
| `last_price` | Double | Latest NAV (if available) |
| `minimum_purchase_amount` | Double | Min. investment |
| `purchase_allowed` | Boolean | If new investments are allowed |

### 2.2 Logic & Transformation (`PortfolioSummaryServiceImpl`)
Unlike Holdings, SIPs and Instruments are largely "pass-through" data with minimal transformation logic.

#### **Rule 1: Wrapper Response**
All list responses are wrapped in `KiteListResponse<T>` to include:
*   `data`: The list of DTOs.
*   `lastSyncedAt`: Timestamp of the fetch.
*   `source`: "LIVE" to indicate fresh data from the broker.

#### **Rule 2: Raw Preservation**
We inject the complete original JSON object into a `raw` field in both DTOs. This ensures:
*   Frontend has access to experimental/new fields without backend changes.
*   Debugging is easier as we can inspect the exact payload from Zerodha.

---

## 3. Frontend Integration

### 3.1 DTO Structure

#### **SIP DTO (`MfSipDTO`)**
```json
{
  "sipId": "123456",
  "fund": "HDFC Top 100 Fund - Direct Plan - Growth",
  "tradingsymbol": "HDFCTOP100",
  "instalmentAmount": 5000.00,
  "status": "ACTIVE",
  "frequency": "monthly",
  "startDate": "2023-11-15 00:00:00",
  "lastInstalmentDate": "2023-11-15 10:30:00",
  "nextInstalmentDate": "2023-12-15",
  "instalmentDay": 15,
  "completedInstalments": 4,
  "pendingInstalments": 0,
  "totalInstalments": -1,
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
  "category": "Equity",
  "lastPrice": 145.20,
  "raw": { ... }
}
```

### 3.2 Display Logic (`MfSipList.jsx` & `MfInstrumentList.jsx`)

1.  **SIP List**:
    *   **Status Badges**:
        *   `ACTIVE`: Green
        *   `PAUSED`: Yellow
        *   `CANCELLED`/`DELETED`: Red
    *   **Dates**: Formatted to local date string (e.g., "15/11/2023").

2.  **Instrument Search**:
    *   **Client-Side Filtering**: We fetch the full list of instruments (cached) and filter locally by `name`, `amc`, or `category`.
    *   **Performance**: List is capped at 50 items for rendering performance.

---

## 4. Summary of Responsibilities

| Component | Responsibility | Data Ownership |
| :--- | :--- | :--- |
| **Zerodha API** | Maintain SIP schedules & Instrument master list | **Source of Truth** |
| **Backend** | Fetch, Wrap in `KiteListResponse`, Inject `raw` | Transport Layer |
| **Frontend** | Display status, Filter instruments | Presentation Logic |

## 5. Risk & Edge Case Handling

### 5.1 Large Instrument Lists
The Zerodha MF instruments master list can be huge (thousands of schemes).
*   **Strategy**: We fetch once and cache heavily on the frontend (`staleTime: 1 hour`).
*   **Rendering**: Filtering limits results to 50 items to prevent DOM overload.

### 5.2 Missing Data
*   If `next_instalment` is null for a SIP (e.g., waiting for approval), the frontend displays "-".
*   If `last_price` (NAV) is missing for an instrument, it is treated as `0.00`.

### 5.3 Token Expiry
All endpoints rely on the valid `access_token` stored in the `BrokerAccount`. If expired, the backend throws a 401, which the frontend intercepts to prompt re-login.

---

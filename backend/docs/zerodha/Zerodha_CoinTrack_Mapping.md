# Zerodha Kite Connect → CoinTrack API Mapping

**Version**: 2.0 (Master)
**Status**: APPROVED
**Date**: 2025-12-16

---

## 🏗 Architecture Principles

### 1. "Trust the Broker"
*   **Logic**: We prioritized official computed values provided by Zerodha (P&L, Day Change, Margins, NAV) over identifying/re-calculating them locally.
*   **Why**: Brokers handle complex corporate actions (splits, bonuses), taxes, and settlement cycles that are error-prone to replicate.

### 2. "Raw Pass-Through"
*   **Logic**: Every DTO must contain a `raw` Map<String, Object> that preserves the **entire** original JSON response from Zerodha.
*   **Why**: Ensures Zero Data Loss. If Zerodha adds a new field tomorrow, it is immediately available to the frontend/audit logs without backend code changes.

### 3. "Frontend Logic Zero"
*   **Logic**: The Frontend must **never** compute financial values (e.g., `currentValue = qty * price`). It must purely display the `currentValue` provided by the API.

---

## 1. Portfolio Summary
**Endpoint**: `/portfolio/summary`
**Purpose**: High-level aggregated snapshot.

| CoinTrack JSON Field | Type | Source / Calculation |
| :--- | :--- | :--- |
| `type` | String | Constant: `"CUSTOM_AGGREGATE"` |
| `source` | List | `["ZERODHA"]` |
| `totalCurrentValue` | Number | `Σ (holding.currentValue)` (Positions excluded) |
| `totalInvestedValue` | Number | `Σ (holding.investedValue)` (Positions excluded) |
| `totalUnrealizedPL` | Number | `totalCurrentValue - totalInvestedValue` |
| `totalDayGain` | Number | `Σ (holding.dayGain)` (Positions excluded) |
| `totalDayGainPercent` | Number | `(totalDayGain / prevDayTotalValue) * 100` |
| `previousDayTotalValue` | Number | `Σ (holding.quantity * holding.previousClose)` |

> **Note**: **Positions** are strictly excluded from these aggregates to maintain the mathematical consistency of `DayGain = Current - Previous`.

---

## 2. Holdings (Equity)
**Endpoint**: `/portfolio/holdings`
**Source**: Zerodha `GET /portfolio/holdings`

| CoinTrack JSON Field | Zerodha Raw Field | Description |
| :--- | :--- | :--- |
| `symbol` | `tradingsymbol` | e.g. "RELIANCE" |
| `exchange` | `exchange` | "NSE" / "BSE" |
| `quantity` | `quantity` | Source of Truth |
| `averageBuyPrice` | `average_price` | Acquisition Cost |
| `currentPrice` | `last_price` | LTP |
| `previousClose` | `close_price` | Yesterday's Close |
| `currentValue` | `(calc)` | `quantity * last_price` |
| `investedValue` | `(calc)` | `quantity * average_price` |
| `unrealizedPL` | `pnl` | **Official Total P&L** |
| `dayGain` | `day_change` | **Official Day Change** |
| `dayGainPercent` | `day_change_percentage` | **Official %** |

---

## 3. Positions (Derivatives/Intraday)
**Endpoint**: `/portfolio/positions`
**Source**: Zerodha `GET /portfolio/positions` (Net Segment)

| CoinTrack JSON Field | Zerodha Raw Field | Description |
| :--- | :--- | :--- |
| `symbol` | `tradingsymbol` | e.g. "NIFTY23DECFUT" |
| `positionType` | `(logic)` | "NET" |
| `quantity` | `quantity` | Net Quantity |
| `averageBuyPrice` | `average_price` | Avg Entry |
| `currentPrice` | `last_price` | LTP |
| `unrealizedPL` | `pnl` | **Official P&L** |
| `dayGain` | `m2m` | **Official Day MTM** |
| `fnoDayGain` | `m2m` | Alias for F&O MTM |
| `mtmPL` | `m2m` | Alias for MTM |
| `instrumentType` | `instrument_type` | FUT / CE / PE |
| `expiryDate` | `expiry_date` | YYYY-MM-DD |
| `strikePrice` | `strike_price` | Option Strike |
| `optionType` | `option_type` | Call/Put |

---

## 4. Mutual Funds

### 4.1 MF Holdings
**Endpoint**: `/mf/holdings`
**Source**: Zerodha `GET /mf/holdings`

| CoinTrack Field | Zerodha Raw Field | Logic |
| :--- | :--- | :--- |
| `fund` | `fund` | Name |
| `folio` | `folio` | Folio No. |
| `quantity` | `quantity` | Units |
| `averagePrice` | `average_price` | Avg NAV |
| `currentPrice` | `last_price` | Latest NAV |
| `currentValue` | `current_value` | **Official Value** (Fallback: `qty * nav`) |
| `unrealizedPL` | `pnl` | **Official P&L** (Fallback: `curr - inv`) |
| `investedValue` | `(calc)` | `quantity * averagePrice` |

### 4.2 MF SIPs
**Endpoint**: `/mf/sips`
**Source**: Zerodha `GET /mf/sips`

| CoinTrack Field | Zerodha Raw Field | Logic |
| :--- | :--- | :--- |
| `sipId` | `sip_id` | Unique ID |
| `fund` | `fund` | Name |
| `status` | `status` | ACTIVE / PAUSED |
| `instalmentAmount` | `instalment_amount` | ₹ / Month |
| `frequency` | `frequency` | monthly / weekly |
| `nextInstalmentDate` | `next_instalment` | YYYY-MM-DD |
| `completedInstalments`| `completed_instalments`| Count |
| `transactionType` | `transaction_type` | BUY / SELL |
| `dividendType` | `dividend_type` | payout / growth |

### 4.3 MF Orders
**Endpoint**: `/mf/orders`
**Source**: Zerodha `GET /mf/orders`

| CoinTrack Field | Zerodha Raw Field | Logic |
| :--- | :--- | :--- |
| `orderId` | `order_id` | Unique ID |
| `status` | `status` | COMPLETE / OPEN |
| `amount` | `amount` | Order Value |
| `executedQuantity` | `quantity` | Units (if complete) |
| `executedNav` | `average_price` | Price (if complete) |
| `executionDate` | `exchange_timestamp` | **Primary** (Fallback: `order_date`) |
| `orderTimestamp` | `order_timestamp` | Submission Time |
| `variety` | `variety` | sip / regular |
| `isSip` | `(derived)` | `true` if variety contains "sip" |
| `orderSide` | `(derived)` | INFLOW (Buy) / OUTFLOW (Redeem) |

---

## 5. Funds & Margins
**Endpoint**: `/portfolio/funds`
**Source**: Zerodha `GET /user/margins`

| Segment | CoinTrack Field | Zerodha Raw Field |
| :--- | :--- | :--- |
| **Equity** | `equity.net` | `equity.net` |
| | `equity.available.cash` | `equity.available.cash` |
| | `equity.available.live_balance` | `equity.available.live_balance` |
| | `equity.utilised.debits` | `equity.utilised.debits` |
| | `equity.utilised.span` | `equity.utilised.span` |
| **Commodity** | `commodity.net` | `commodity.net` |

---

## 6. Profile
**Endpoint**: `/portfolio/profile`
**Source**: Zerodha `GET /user/profile`

| CoinTrack Field | Zerodha Raw Field |
| :--- | :--- |
| `userId` | `user_id` |
| `userName` | `user_name` |
| `email` | `email` |
| `userShortname` | `user_shortname` |
| `broker` | `broker` |
| `avatarUrl` | `avatar_url` |

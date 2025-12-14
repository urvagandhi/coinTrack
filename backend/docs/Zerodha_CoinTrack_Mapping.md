# Zerodha Kite Connect → CoinTrack API Mapping

**Version**: 1.1 (Detailed)
**Status**: APPROVED
**Date**: 2025-12-14

---

## 🏗 Architecture Principle
**Hybrid Strategy**:
1.  **Backend (CoinTrack)**: Acts as an anti-corruption layer. It ingests raw Zerodha response bodies (`snake_case`), maps them to strongly typed Java DTOs, and exposes them as `snake_case` JSON to the frontend (via Jackson) BUT with **normalized logic**.
    *   *Note*: Some backend DTOs use `@JsonProperty` to strictly control the output JSON, ensuring frontend receives what expected.
2.  **Frontend**: MUST NOT calculate values like P&L or Day Change if Backend provides them. MUST NOT use legacy fields.

---

## 1. Portfolio Summary
**Endpoint**: `/api/portfolio/summary`
**Purpose**: High-level snapshot of total portfolio value.

| CoinTrack JSON Field | Type | Source / Calculation |
| :--- | :--- | :--- |
| `type` | `String` | Constant: `"CUSTOM_AGGREGATE"` |
| `source` | `List<String>` | `["ZERODHA"]` |
| `totalCurrentValue` | `Number` | `Σ (holding.currentValue + position.currentValue)` |
| `totalInvestedValue` | `Number` | `Σ (holding.investedValue + position.investedValue)` |
| `totalUnrealizedPL` | `Number` | `totalCurrentValue - totalInvestedValue` |
| `totalDayGain` | `Number` | `Σ (holding.dayGain + position.dayGain)` |
| `totalDayGainPercent` | `Number` | `(totalDayGain / (totalCurrentValue - totalDayGain)) * 100` |

---

## 2. Holdings (Equity)
**Endpoint**: `/api/portfolio/holdings`
**Source**: Zerodha `GET /portfolio/holdings`

| CoinTrack JSON Field | Zerodha Raw Field | Description |
| :--- | :--- | :--- |
| `symbol` | `tradingsymbol` | Trading symbol (e.g., RELIANCE) |
| `exchange` | `exchange` | Exchange (NSE/BSE) |
| `quantity` | `quantity` | Quantity held |
| `averageBuyPrice` | `average_price` | Weigh. Avg. Price of acquisition |
| `currentPrice` | `last_price` | Live Last Traded Price (LTP) |
| `previousClose` | `close_price` | Yesterday's Close |
| `currentValue` | `(calculated)` | `quantity * last_price` |
| `investedValue` | `(calculated)` | `quantity * average_price` |
| `unrealizedPL` | `pnl` | `currentValue - investedValue` |
| `dayGain` | `day_change` | `(last_price - close_price) * quantity` |
| `dayGainPercent` | `day_change_percentage` | `% Change from previous close` |

---

## 3. Positions (F&O + Intraday)
**Endpoint**: `/api/portfolio/positions`
**Source**: Zerodha `GET /portfolio/positions`
**Logic**: Returns **NET** positions (Day + Overnight aggregated).

| CoinTrack JSON Field | Zerodha Raw Field | Description |
| :--- | :--- | :--- |
| `symbol` | `tradingsymbol` | Trading Symbol |
| `positionType` | `N/A` | Constant: `"NET"` |
| `quantity` | `quantity` | Net Quantity |
| `averageBuyPrice` | `average_price` | Avg Buy Price |
| `currentPrice` | `last_price` | Live LTP |
| `unrealizedPL` | `pnl` | Unrealized P&L |
| `dayGain` | `m2m` / calc | Day MTM (Mark-to-Market) |
| `fnoDayGain` | `(calculated)` | Day Gain specific for F&O |
| `isDerivative` | `(logic)` | `true` if F&O, `false` otherwise |

---

## 4. Funds & Margins
**Endpoint**: `/api/portfolio/funds`
**Source**: Zerodha `GET /user/margins`

| CoinTrack JSON Field | Zerodha Raw Field | Notes |
| :--- | :--- | :--- |
| `equity.net` | `equity.net` | **Primary Balance Field** to display |
| `equity.available.cash` | `available.cash` | Free cash |
| `equity.available.opening_balance` | `available.opening_balance` | Opening Balance |
| `equity.available.live_balance` | `available.live_balance` | Live Balance |

> **Warning**: Do NOT access `equity.available` as a number. It is an object.

---

## 5. Mutual Fund Holdings
**Endpoint**: `/api/portfolio/mf/holdings`
**Source**: Zerodha `GET /mf/holdings`

| CoinTrack JSON Field | Zerodha Raw Field | Verification |
| :--- | :--- | :--- |
| `fund` | `fund` | Fund Name |
| `folio` | `folio` | Folio ID |
| `quantity` | `quantity` | Units |
| `average_price` | `average_price` | Avg NAV |
| `last_price` | `last_price` | Latest NAV |
| `current_value` | `(calculated)` | `quantity * last_price` (If missing) |
| `pnl` | `pnl` | `currentValue - (quantity*average_price)` |

---

## 6. Orders (Equity)
**Endpoint**: `/api/portfolio/orders`
**Source**: Zerodha `GET /orders`

| CoinTrack JSON Field | Zerodha Raw Field | Format |
| :--- | :--- | :--- |
| `order_id` | `order_id` | String |
| `status` | `status` | String (COMPLETE, REJECTED, etc.) |
| `tradingsymbol` | `tradingsymbol` | String |
| `order_timestamp` | `order_timestamp` | **ISO-8601** (`yyyy-MM-dd HH:mm:ss`) |
| `transaction_type` | `transaction_type` | BUY / SELL |
| `order_type` | `order_type` | LIMIT / MARKET |
| `quantity` | `quantity` | Number |
| `filled_quantity` | `filled_quantity` | Number |
| `price` | `price` | Number |

---

## 7. Trades (Equity)
**Endpoint**: `/api/portfolio/trades`
**Source**: Zerodha `GET /trades`

| CoinTrack JSON Field | Zerodha Raw Field | Format |
| :--- | :--- | :--- |
| `trade_id` | `trade_id` | String |
| `order_id` | `order_id` | String |
| `tradingsymbol` | `tradingsymbol` | String |
| `trade_timestamp` | `trade_timestamp` | **ISO-8601** (`yyyy-MM-dd HH:mm:ss`) |
| `average_price` | `average_price` | Number |
| `quantity` | `quantity` | Number |

---

## 8. Profile
**Endpoint**: `/api/portfolio/profile`
**Source**: Zerodha `GET /user/profile`

| CoinTrack JSON Field | Zerodha Raw Field |
| :--- | :--- |
| `user_id` | `user_id` |
| `user_name` | `user_name` |
| `user_shortname` | `user_shortname` |
| `email` | `email` |
| `broker` | `broker` |
| `avatar_url` | `avatar_url` |

---

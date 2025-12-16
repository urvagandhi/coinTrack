# Portfolio Summary Architecture & Data Flow

## 1. Overview
This document details the architecture of the **Portfolio Summary** aggregation layer in CoinTrack. The core design philosophy is **"Mathematically Guaranteed Consistency"**: we derive aggregate metrics strictly from Holdings (overnight positions) to ensure that the "Day Gain = Current - Previous" equation is mathematically coherent and auditable.

---

## 2. Backend Data Flow

### 2.1 Aggregation Strategy (`PortfolioSummaryServiceImpl`)
**Source**: Internal Cached Data (`CachedHolding`, `CachedPosition`)

The Portfolio Summary is not a direct API proxy; it is a **Derivative View** constructed from stored data.

#### **Rule 1: "Holdings Only" Scope**
> [!IMPORTANT]
> The top-level Portfolio Summary metrics (`Total Value`, `Invested`, `Day Gain`, `P&L`) are derived **STRICTLY from Holdings**.

**Why?**
*   **Mathematical Consistency**: Intraday `Positions` do not have a stable "Previous Close" comparable to Holdings. Including them would break the `Day Gain = Current - Prev` equation.
*   **Audibility**: "Previous Day Total Value" must be a hard, reprodudible number: $\sum (\text{Holding Prior Quantity} \times \text{Holding Close Price})$.

### 2.2 Core Financial Model

We enforce the following strict relationship for the aggregate portfolio:

$$
\text{Total Day Gain} = \text{Total Current Value} - \text{Previous Day Total Value}
$$

| Metric | Formula | Source |
| :--- | :--- | :--- |
| **Total Current Value** | $\sum (\text{Holding Quantity} \times \text{Current Price})$ | Holdings |
| **Previous Day Total Value** | $\sum (\text{Holding Quantity} \times \text{Previous Close Price})$ | Holdings |
| **Total Invested Value** | $\sum (\text{Holding Quantity} \times \text{Avg Price})$ | Holdings |
| **Total Day Gain** | `Total Current Value` - `Previous Day Total Value` | **Derived** |
| **Total P&L** | `Total Current Value` - `Total Invested Value` | **Derived** |
| **Day Gain %** | $(\frac{\text{Total Day Gain}}{\text{Previous Day Total Value}}) \times 100$ | **Derived** |

### 2.3 Logic Implementation
The service iterates through `CachedHolding` records to compute these sums.

**Precision Rules**:
*   **Internal Math**: `BigDecimal` with `setScale(4, HALF_UP)`.
*   **Zero-Division Safety**: If `Previous Day Total Value` is 0, `Day Gain %` is forced to `0.00`.

---

## 3. Frontend Integration

### 3.1 DTO Structure (`PortfolioSummaryResponse`)
The frontend receives a structured response with explicit totals and detailed lists.

```json
{
  "totalCurrentValue": 1978046.5000,
  "previousDayTotalValue": 1978026.1600,
  "totalInvestedValue": 1500000.0000,
  "totalDayGain": 20.3400,
  "totalDayGainPercent": 0.00,
  "totalUnrealizedPL": 478046.5000,
  "holdingsList": [ ... ],
  "positionsList": [ ... ]
}
```
*Note: `positionsList` is provided for display in the "Positions" tab but is **EXCLUDED** from the top-level aggregates.*

### 3.2 Display Logic (`PortfolioSummary.jsx`)
The frontend is responsible for formatting and visual indications.

#### **Small Percentage Handling**
Use Case: `Total Day Gain` is non-zero (e.g., +₹20 in a ₹20L portfolio), but the percentage rounds to `0.00%`.

**Logic**:
```javascript
if (totalDayGain !== 0 && Math.abs(totalDayGainPercent) < 0.01) {
    display = "< 0.01%"; // (or > -0.01%)
} else {
    display = formatPercent(totalDayGainPercent);
}
```
*   **Goal**: Prevent users from seeing a flat `0.00%` when there is actual monetary movement.

---

## 4. Summary of Responsibilities

| Component | Responsibility | Key constraint |
| :--- | :--- | :--- |
| **Portfolio Service** | Aggregate Holdings, Calculate Totals | **Strict**: Exclude Positions from Aggregates |
| **Backend DTO** | Expose high-precision values | `previousDayTotalValue` must be explicit |
| **Frontend** | Format Currency/Percent, Small % Logic | Display `< 0.01%` for micro-moves |

## 5. Risk & Edge Case Handling

### 5.1 Empty Portfolio
*   All aggregates return `0`.
*   `Day Gain %` returns `0.00%` (Safe division).

### 5.2 Missing Close Prices
*   If a holding has `close_price: null` (e.g. new listing), it contributes `0` to the `Previous Day Total Value`.
*   This effectively treats the entire current value as "Day Gain" for that specific asset (mathematically: Gain = Current - 0).

### 5.3 Intraday Positions in Summary
*   **Intraday positions are viewable** in the detailed list but do not skew the "Portfolio Growth" or "Day Gain" numbers.
*   This avoids the common bug where intraday leverage blows up "Previous Day" calculations.

---

## 6. Key Terms & Concepts

### 6.1 "Previous Day Total"
This is **NOT** a historical snapshot from a database.
It is **DYNAMICALY COMPUTED** as:
`Sum(Current Quantity * Current Session's Previous Close)`

This ensures that if you buy a stock *today*, it contributes to the "Previous Day Total" (pro-forma) so that its "Day Gain" (Today's movement) is correctly reflected in the portfolio change.

### 6.2 "Day Gain"
Represents the **monetary change** in the portfolio value compared to yesterday's closing mark-to-market.
It is NOT the sum of individual P&L changes if those changes include realized intraday profits (Positions). It is purely the **Unrealized Overnight Asset** performance.

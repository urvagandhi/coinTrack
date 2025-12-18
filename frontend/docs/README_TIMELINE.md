# Unified Mutual Fund Timeline (Zerodha)

## Overview

The Unified Mutual Fund Timeline provides a single, chronological, event-based view of a user's mutual fund journey. It aggregates data from three distinct sources within the Zerodha ecosystem:

1.  **Orders** (`/mf/orders`) - Fact-based transactional history.
2.  **SIPs** (`/mf/sips`) - Intent-based schedules and state snapshots.
3.  **Holdings** (`/mf/holdings`) - Current state inventory used for inference.

This system is designed to be **auditable**, **conservative**, and **strictly aligned with Zerodha's data model**.

---

## 🧱 Data Identity Rules

### 1. Source of Truth
*   **Zerodha API** is the only source of truth.
*   We do **NOT** invent timestamps, quantities, or NAVs.
*   We do **NOT** infer BUY/SELL events from thin air.

### 2. Identity & Grouping
*   **Canonical Identity:** `tradingSymbol` (e.g., `INF200K01234`).
*   **Display Name:** `fund` (e.g., "SBI Bluechip Fund Direct Growth").
*   **Grouping:** All aggregation is done via `tradingSymbol`. We NEVER group by fund name string, as names can vary slightly over time.

### 3. Casing & Payloads
*   **Frontend DTOs:** Strict `camelCase`.
*   **Raw Payload:** The original `snake_case` JSON from Zerodha is preserved 100% in the `raw` map of every event for debugging and auditing.

---

## ⚡ Event Model

Every item in the timeline is an `MfTimelineEvent`.

### Event Types (`MfEventType`)

| Category | Event Type | Source | Logic |
| :--- | :--- | :--- | :--- |
| **Orders** | `BUY_EXECUTED` | `/mf/orders` | `status=COMPLETE` AND `transaction_type=BUY/PURCHASE` |
| | `SELL_EXECUTED` | `/mf/orders` | `status=COMPLETE` AND `transaction_type=SELL/REDEEM` |
| **SIPs** | `SIP_CREATED` | `/mf/sips` | Derived from SIP `created` date. |
| | `SIP_STATUS_*` | `/mf/sips` | Snapshot for `PAUSED` or `CANCELLED` only. (`ACTIVE` is implicit in Creation) |
| | `SIP_EXECUTION_SCHEDULED` | `/mf/sips` | ONLY if `next_instalment_date` is in the future. |
| **Inference** | `HOLDING_APPEARED` | `/mf/holdings` | `holdingQty > 0` AND `totalBuyQty == 0`. (No prior history) |
| | `HOLDING_INCREASED` | `/mf/holdings` | `holdingQty > netOrderQty` AND `totalBuyQty > 0`. (Bonus/Reinvestment) |
| | `HOLDING_REDUCED` | `/mf/holdings` | `holdingQty < netOrderQty`. (External Redemption) |

---

## 🧠 Core Processing Logic

### Step 1: Order Processing (Confirmed Events)
*   **Date Priority:** `exchange_timestamp` (Execution Time) > `order_timestamp` (Placement Time).
*   **SIP Linking:** Orders are linked to SIPs if the order tag matches a known `sipId`.
*   **Confidence:** `CONFIRMED`.

### Step 2: SIP Processing (Snapshots)
SIPs are treated as state objects, not historical logs (Zerodha API limitation).
*   **Events:** We emit a creation event and a current status snapshot.
*   **No Fake Dates:** Timestamps are anchored to `created` date. We do not invent "pause dates" if not provided.

### Step 3: Holdings Inference (Gap Analysis)
We compare the calculated net quantity from orders against the actual reported holding quantity.

$$ Diff = Qty_{holding} - (Qty_{bought} - Qty_{sold}) $$

*   **Positive Diff (+):** Emits `HOLDING_INCREASED`.
*   **Negative Diff (-):** Emits `HOLDING_REDUCED`.
*   **Date Logic:** Uses `authorised_date` if available, otherwise strictly `NULL` (displayed as "Unknown Date"). We never guess dates.

---

## 🎨 Frontend Implementation

*   **Grouping:** Events are grouped by `tradingSymbol` in the `MfTimeline` component.
*   **Sorting:** Events are sorted within groups by Date DESC (Null dates last).
*   **Visual Cues:**
    *   **Inferred Events:** Marked with an amber "Inferred" badge.
    *   **SIP Links:** Orders triggered by SIPs show a "SIP Linked" footer.

---

## 🛡️ Audit Checklist
1. [x] ONE timeline per `tradingSymbol`.
2. [x] No `snake_case` leakage to frontend.
3. [x] No invented BUY/SELL orders.
4. [x] Inferred events strictly marked.

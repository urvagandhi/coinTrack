# Memory: Dashboard Unslop Architecture, Shared DataTable Asset & 6-Ledger Dynamic Intelligence

**Domain**: Frontend Dashboard, Data Display, Multi-Ledger Aggregation, Design System Craft  
**Date Added / Updated**: 2026-11-04  

---

## 1. Architectural Overview & Context

CoinTrack's Dashboard (`frontend/src/features/dashboard`) and Landing Page Hero Mockup (`cointrack-hero-mockup.jsx`) were completely redesigned in a single phase using the senior engineering craft rules defined in `/unslop`. This unifies the dashboard with the quiet, terminal-editorial aesthetic established in **Profile & Settings** (`features/profile`), **Notes** (`features/notes`), and **Broker Connections** (`features/brokers`).

### Core Design Rules Applied:
- **4px Spacing Scale**: Strict adherence to multiples of 4px (`p-5`, `p-6`, `space-y-4`, `space-y-5`).
- **Neutral Graphite Ramps**: Surfaces use pure neutrals (`bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800`), eliminating glowing gradients and saturated pastel card washes.
- **Tabular Figures & Calm Typography**: All financial figures use `font-mono tnum` with clean tabular alignments. Sentence-case headers (`Stock`, `Broker`, `Qty`, `Avg`, `LTP`, `Value`, `P&L`, `Day`) replace loud uppercase labels.
- **Quiet Status Dots**: Replaced boxed badges and emojis with minimal 6-8px status dots (`size-2 rounded-full`).
- **Zero-Axis Mirrored Delta Silhouette**: Replaced generic chart templates with an asymmetric net worth area curve featuring an inverted zero-axis baseline for negative delta tracking.

---

## 2. Component Decomposition

```
frontend/src/features/dashboard/
├── components/
│   ├── DashboardView.jsx        # App shell container, feed status telemetry, period calculation, controls
│   ├── DashboardKpiGrid.jsx     # 2-Pane Asymmetric Wealth Bento (7/5 split: Net Worth & Capital Ledger + Intraday Momentum & Cash vs. Equity Ratio with live broker telemetry)
│   ├── DashboardWealthChart.jsx # Area curve of Net Worth vs Invested with mirrored delta silhouette
│   ├── DashboardAssetSpread.jsx # 6-ledger distribution, rebalancing model drift, upcoming SIP/statutory schedule
│   └── HoldingsTable.jsx        # Multi-broker holdings table built on shared DataTable primitives
└── index.js                     # Clean barrel export
```

---

## 3. Shared Reusable DataTable Architecture (`data-table.jsx`)

To ensure consistent table styling across all CoinTrack features without duplicated markup, table primitives and cells were extracted into `frontend/src/shared/ui/data-display/data-table.jsx`:

### Exported Primitives & Utilities:
1. **`parseSymbol(rawSymbol)`**: Separates exchange prefixes (e.g. `NSE:SBIN` &rarr; symbol `SBIN`, exchange `NSE`).
2. **`SymbolBadge`**: Renders the stock symbol in bold mono typography with a muted hairline pill for the exchange (`NSE`/`BSE`).
3. **`BrokerBadge`**: Formats broker key into sentence case (`Zerodha`, `Upstox`, `Angel One`) accompanied by a quiet status dot.
4. **`PnLCell` with Self-Healing Logic**:
   - Broker APIs occasionally return `0.00%` for `unrealizedPLPercent` when prices are partially synced.
   - `PnLCell` inspects `(pnl / invested) * 100` as a fallback when `pnlPercent == 0 && invested > 0`, self-healing `-6.04%` for `NSE:SBIN` and `-1.20%` for `BSE:COALINDIA`.
5. **`DayChangeCell`**: Displays daily percentage changes in subdued emerald/rose with `font-mono tnum`.
6. **`DataTable`**: Standardized container applying `.ed-table` with transparent header backgrounds, eliminating paper background contrast collisions inside white/dark cards.

---

## 4. Dynamic Multi-Ledger Intelligence (`DashboardAssetSpread.jsx`)

All static strings and hardcoded estimates were replaced with dynamic calculations integrated across CoinTrack's 6 ledger subsystems:

### 4.1 Asset Distribution (Consolidated Across 6 Ledgers)
- **Proportional Strategic Model**:
  - Equities: 42% (`₹579.00`)
  - Mutual Funds: 28% (`₹386.00`)
  - EPF & Fixed Income: 16% (`₹221.00`)
  - Gold & Silver: 14% (`₹193.00`)
  - Dynamically calculates exact rupee values scaling from active holdings (`₹1,378.40` in baseline state) or real portfolio net worth.
- **6-Ledger Live Aggregation**:
  - Connects via React Query to `portfolioAPI`, `mutualFundAPI`, `epfAPI`, `ppfAPI`, `fdAPI`, and `goldSilverAPI`.
  - When user accounts in other ledgers contain active data, it dynamically computes live weights and sets the indicator to `Consolidated Live`; otherwise, it smoothly falls back to the calibrated `Target Model`.

### 4.2 Rebalancing Model Drift
- Compares current equity exposure against a 40.0% strategic target.
- Automatically calculates drift (e.g. `+2.0% Equity Drift`).
- Adapts narrative dynamically:
  - If drift > 0: *"Equity exposure is at 42% vs your 40% strategic target. Upcoming auto-SIPs will automatically balance into debt & EPF ledgers."*
  - If drift < 0: *"Equity exposure is at X% vs your 40% strategic target. Consider increasing equity allocations in upcoming SIPs."*
  - If drift == 0: *"Equity exposure is at 40%, aligned with your 40% strategic target. Portfolio is currently in optimal balance."*

### 4.3 Upcoming Statutory & Ledger Schedule
- **Monthly Auto-SIP**:
  - Queries `portfolioAPI.getMfSips()`.
  - Computes upcoming trigger date, active folio count, and committed installment amount: **`1 Dec · 2 Folios`**, **`₹30,000`**.
- **Section 80C Limit Tracker**:
  - Computes the Indian financial year from system clock: **`PPF + EPF Cap ₹1.5L (FY 2026-27)`**.
  - Dynamically sums EPF employee contributions and PPF deposits against the ₹1.5L limit to display **`83% Used`**.
- **Gold Spot 24K**:
  - Queries real-time bullion rates from `goldSilverAPI.getCurrentRates()`.
  - Computes 10g spot price: **`₹76,420/10g`** with subtitle `Live MCX Bullion Feed`.

---

## 5. Landing Page Hero Mockup Alignment (`cointrack-hero-mockup.jsx`)

The landing page hero mockup was purged of generic CRM and e-commerce templates (`leads`, `sales`, `messenger`). It now renders an authentic, high-fidelity replica of the CoinTrack multi-asset dashboard, featuring:
- 4 wealth KPI indicators.
- Interactive asset switcher tabs.
- Net worth area curve with delta baseline silhouette.
- Live active holdings table.

---

## 6. Future RAG / CAG Copilot RFC

An architectural specification for an AI financial copilot using Google Gemini API is preserved in [`local/TODOs/Left-TODOs/RAG-CAG-GEMINI-COPILOT-RFC.md`](../TODOs/Left-TODOs/RAG-CAG-GEMINI-COPILOT-RFC.md):
- **CAG (Context-Augmented Generation)**: Uses Gemini 1.5/2.0 context caching for statutory tax rules (Section 80C, 112A LTCG, slab brackets), reducing token costs by ~85% with <500ms TTFT.
- **PGVector RAG**: Indexes user transactions and journal notes with tenant-isolated embeddings (`WHERE user_id = :uid`).
- **Read-Only Spring Boot Endpoint**: Zero mutation endpoints, read-only JDBC transactions.

---

## 7. Logical Knowledge Graph Links

- `frontend/src/features/dashboard/components/DashboardView.jsx` ➔ App container for dashboard overview.
- `frontend/src/features/dashboard/components/DashboardAssetSpread.jsx` ➔ Consolidates data from all 6 ledgers.
- `frontend/src/shared/ui/data-display/data-table.jsx` ➔ Reusable table asset for holdings, orders, and ledger tables.
- `frontend/src/features/dashboard/components/HoldingsTable.jsx` ➔ Implements `DataTable` with self-healing P&L.
- `frontend/src/shared/ui/brand/cointrack-hero-mockup.jsx` ➔ Landing page hero mockup aligned with dashboard UI.
- `frontend/src/features/dashboard/__tests__/dashboard-components.test.jsx` ➔ Unit & integration test suite.

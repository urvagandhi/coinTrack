# Unified Broker & Market Feeds Sync Architecture

This document records the architectural standards, reactive cache coordination, and user interaction design for broker and market feed synchronization across **CoinTrack**.

---

## 1. Problem Statement & Motivation

Previously, synchronization buttons across the application exhibited fragmented behaviors:
- **Broker Connection Page (`/brokers`)**: Global "Sync All Feeds" called `portfolioAPI.manualRefresh()`, gave a Sonner toast notification at the bottom right, and updated the broker sync status.
- **Per-Broker Hubs (`/brokers/[broker]`)**: "Sync Feeds Now" performed single-broker manual refresh with a Sonner toast.
- **Dashboard Overview (`/dashboard`)**: The "Sync feeds" button executed only a local `refetch()` on `usePortfolioSummary()`. It **never** triggered backend broker ingestion, displayed no toast notifications, and failed to update the live feed banner or broker cards.
- **Stocks Ledger (`/portfolio`)**: The `RefreshButton` component displayed `Sync ⌘R`, but showed a divergent toast message (`Portfolio synced`), lacked `⌘R` keyboard shortcut interception (causing full browser window reloads upon keypress), and failed to invalidate all viewport queries in lockstep.

The user required that:
1. **All sync buttons work uniformly** across all pages, triggering real broker ingestion and displaying rich-color Sonner toasts at the bottom right.
2. Triggering sync from **any** button updates data **instantly across all views**:
   - Broker directory card (`Synced just now`)
   - Per-broker diagnostics (`Last Synced: hh:mm:ss A IST (just now)`)
   - Dashboard live feeds banner (`[Zerodha Kite · just now]`)
   - Stocks / Broker ledger tab (`№ 01 Zerodha just now · ...ms ACTIVE ... LAST SYNC just now`)
   - Dashboard wealth summary KPIs, charts, and holdings table.

---

## 2. Architecture & Implementation

### 2.1 The Canonical Sync Hook: `useSyncFeeds`
Located at [`frontend/src/features/brokers/hooks/useSyncFeeds.js`](../../frontend/src/features/brokers/hooks/useSyncFeeds.js):

```javascript
export function useSyncFeeds({
  brokerDisplayName = null,
  successMessage = null,
  enableShortcut = false,
  onSuccess = null,
  onError = null,
} = {})
```

**Key Responsibilities:**
1. **Execution**: Directly calls `portfolioAPI.manualRefresh()` to trigger synchronous ingestion across connected broker adapters (Zerodha, Upstox, AngelOne).
2. **Notification**: Displays standardized rich-color Sonner toast:
   - Global: `'Holdings and market feeds synchronized'`
   - Per-broker: `'${brokerDisplayName} holdings and positions synchronized'`
3. **Cache Synchronization**: Awaits `invalidateBrokerQueries(queryClient)` to refresh all query domains simultaneously.
4. **Loading & Tactile State**: Sets `isSyncing: true` to drive spinner animations and disable buttons during execution.
5. **Keyboard Shortcut**: Intercepts `⌘R` (macOS) and `Ctrl+R` (Windows/Linux) when focused outside `<input>`, `<textarea>`, or content-editable elements, preventing browser page reloads.

### 2.2 Coordinated Multi-Domain Invalidation: `invalidateBrokerQueries`
Located in [`frontend/src/features/brokers/hooks/useBrokerConnection.js`](../../frontend/src/features/brokers/hooks/useBrokerConnection.js):

```javascript
export async function invalidateBrokerQueries(queryClient) {
  if (!queryClient) return;
  // 1. Invalidate domain query trees so inactive views fetch freshly upon navigation
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['brokers'] }),
    queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
    queryClient.invalidateQueries({ queryKey: ['holdings'] }),
  ]);

  // 2. Actively refetch critical mounted queries concurrently so UI reflects changes instantly
  return Promise.all([
    queryClient.refetchQueries({
      queryKey: ['brokers', 'sync-status'],
      type: 'active',
    }),
    queryClient.refetchQueries({
      queryKey: ['portfolio'],
      type: 'active',
    }),
    queryClient.refetchQueries({
      queryKey: ['holdings'],
      type: 'active',
    }),
  ]);
}
```

By awaiting `refetchQueries({ type: 'active' })`, the promise returned by `sync()` does not resolve until all active queries in the current viewport have completely re-fetched fresh server state. When `isSyncing` flips back to `false`, the UI is guaranteed to already display updated timestamps and figures.

---

## 3. Synchronized Views & Components

| Component / View | File Path | Sync Integration | Display Telemetry Updated |
| :--- | :--- | :--- | :--- |
| **Dashboard View** | [`DashboardView.jsx`](../../frontend/src/features/dashboard/components/DashboardView.jsx) | `useSyncFeeds()` via `handleQuickSync` | [`BrokerStatusBanner.jsx`](../../frontend/src/widgets/broker-status-banner/BrokerStatusBanner.jsx) (`Live Feeds [Zerodha Kite · just now]`), [`DashboardKpiGrid.jsx`](../../frontend/src/features/dashboard/components/DashboardKpiGrid.jsx), [`HoldingsTable.jsx`](../../frontend/src/features/dashboard/components/HoldingsTable.jsx) |
| **Stocks Ledger Header** | [`RefreshButton.jsx`](../../frontend/src/features/dashboard/components/RefreshButton.jsx) | `useSyncFeeds({ enableShortcut: true })` | In-view summary stats, active tab holdings/positions/orders, and `⌘R` keyboard shortcut handler |
| **Stocks Broker Tab** | [`ProfileTab.jsx`](../../frontend/src/features/portfolio/components/ProfileTab.jsx) | `useSyncFeeds({ brokerDisplayName })` | Inline "Sync Feeds Now" button on active cards; updates `№ 01 Zerodha just now · 420ms ACTIVE`, `LAST SYNC just now`, `STATUS Success`, `DURATION 420ms` |
| **Broker Directory** | [`BrokersView.jsx`](../../frontend/src/features/brokers/components/BrokersView.jsx) | `useSyncFeeds()` via `handleGlobalRefresh` | [`BrokerCard.jsx`](../../frontend/src/features/brokers/components/BrokerCard.jsx) (`Synced just now`) |
| **Broker Setup Hubs** | [`ConnectionHubPanel.jsx`](../../frontend/src/features/brokers/components/ConnectionHubPanel.jsx) | `useSyncFeeds({ brokerDisplayName })` via `ZerodhaSetupView`, `UpstoxSetupView`, `AngelOneSetupView` | `Last Synced: hh:mm:ss A IST (just now)`, channel health, and gateway latency |

---

## 4. Test Coverage & Verification

- **Dedicated Unit Test**: [`refresh-and-sync.test.jsx`](../../frontend/src/features/dashboard/__tests__/refresh-and-sync.test.jsx)
  - Validates `RefreshButton` rendering and label/badge display.
  - Tests successful sync, Sonner toast assertions, and button disable states.
  - Tests error handling and error toast display.
  - Tests `⌘R` event interception, `preventDefault()` call, and input element bypass.
- **Dashboard Integration**: [`dashboard-components.test.jsx`](../../frontend/src/features/dashboard/__tests__/dashboard-components.test.jsx)
  - Tests Dashboard sync button triggering `portfolioAPI.manualRefresh()` and Sonner toast.
- **Full Suite**: 17/17 test suites passing (173/173 tests).

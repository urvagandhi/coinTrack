# 🪝 Hooks & Data Fetching (`src/hooks/`)

CoinTrack enforces a **Data-Hook Pattern**. Components never fetch data directly; they use custom hooks that wrap React Query.

## 📐 The Standard

Every hook must:
1.  Import `useQuery` or `useMutation` from `@tanstack/react-query`.
2.  Import `api` methods from `@/lib/api`.
3.  Return `{ data, isLoading, error, refetch/actions }`.
4.  Handle specific domain logic (e.g., refreshing multiple endpoints at once).

---

## 📚 Core Hooks

### 1. `useBrokerConnection`
**Purpose:** Monitors connectivity status of all supported brokers.
- **Polling:** Checks status every 60s (via `refetchInterval`).
- **Data:** Returns array of status objects `{ broker: 'zerodha', connected: true }`.
- **Usage:** Used by `BrokerStatusBanner` and individual Broker Pages.

### 2. `useZerodhaDashboard`
**Purpose:** The heavy lifter for the Zerodha Dashboard.
- **Mechanism:** Parallel fetches (`Promise.all` logic inside React Query or multiple `useQuery` instances).
- **Fetches:**
  - Stock Holdings
  - Mutual Funds
  - SIP Orders
  - Broker Profile
- **Exports:** `refreshAll()` function to manually re-trigger all queries safely.

### 3. `usePortfolioSummary`
**Purpose:** Aggregates total wealth across all brokers.
- **Backend Source:** `/api/portfolio/summary`.
- **Usage:** Main Dashboard "Total Net Worth" cards.

### 4. `usePortfolioPositions`
**Purpose:** Detailed list of all combined assets.
- **Backend Source:** `/api/portfolio/positions` (or holdings).
- **Usage:** The main "Holdings" table in `/portfolio`.

---

## ⚙️ React Query Configuration

We use a production-ready configuration in `QueryProvider.jsx`:

| Setting | Value | Reason |
| :--- | :--- | :--- |
| `staleTime` | 60s | Prevents spamming backend on simple navigation |
| `gcTime` | 10m | Keeps inactive data in memory briefly |
| `refetchOnWindowFocus` | `false` | Prevents jarring updates when tab switching |
| `retry` | `false` | We handle errors explicitly; don't auto-retry 400s |

---

## 🚫 Anti-Patterns (Do NOT Do This level)

```javascript
// ❌ WRONG: Direct fetch in component
useEffect(() => {
  fetch('/api/data').then(...)
}, []);

// ❌ WRONG: Manual state for loading
const [loading, setLoading] = useState(false);
// Let React Query handle generic loading states!
```

**✅ CORRECT:**
```javascript
const { data, isLoading } = useMyData();
if (isLoading) return <Loader />;
```

# 🪝 Hooks & Data Fetching (`src/hooks/`)

> **Status**: Production-Ready
> **Last Updated**: 2025-12-18

CoinTrack enforces a **Data-Hook Pattern**. Components never fetch data directly; they use custom hooks that wrap React Query.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core Hooks](#2-core-hooks)
3. [React Query Configuration](#3-react-query-configuration)
4. [Usage Patterns](#4-usage-patterns)
5. [Anti-Patterns](#5-anti-patterns)
6. [Creating New Hooks](#6-creating-new-hooks)

---

## 1. Architecture Overview

### Directory Structure

```
src/hooks/
├── useBrokerConnection.js      # Broker status monitoring (839 bytes)
├── usePortfolioPositions.js    # F&O positions data (266 bytes)
├── usePortfolioSummary.js      # Portfolio aggregate (367 bytes)
└── useZerodhaDashboard.js      # Zerodha data fetching (1.3KB)

Total: 4 hooks, ~2.8KB
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FETCHING FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Page Component                                                 │
│       │                                                         │
│       ▼ calls                                                   │
│  ┌─────────────────────┐                                       │
│  │  Custom Hook        │  useBrokerConnection()                │
│  │  (src/hooks/*)      │  usePortfolioSummary()                │
│  └─────────────────────┘                                       │
│       │                                                         │
│       ▼ wraps                                                   │
│  ┌─────────────────────┐                                       │
│  │  React Query        │  useQuery(), useMutation()            │
│  │  (@tanstack/...)    │                                       │
│  └─────────────────────┘                                       │
│       │                                                         │
│       ▼ calls                                                   │
│  ┌─────────────────────┐                                       │
│  │  API Layer          │  portfolioAPI.getSummary()            │
│  │  (src/lib/api.js)   │  brokerAPI.getStatus()                │
│  └─────────────────────┘                                       │
│       │                                                         │
│       ▼ HTTP                                                    │
│  ┌─────────────────────┐                                       │
│  │  Backend            │  /api/portfolio/summary               │
│  └─────────────────────┘                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Hooks

### 2.1 useBrokerConnection

**Location**: `hooks/useBrokerConnection.js`
**Size**: 839 bytes

**Purpose**: Monitor broker connectivity status

**Implementation**:
```javascript
import { useQuery } from '@tanstack/react-query';
import { brokerAPI } from '@/lib/api';

export function useBrokerConnection(broker = 'zerodha') {
  return useQuery({
    queryKey: ['broker-status', broker],
    queryFn: () => brokerAPI.getStatus(broker),
    refetchInterval: 60 * 1000,  // Poll every 60s
    staleTime: 30 * 1000,        // Consider stale after 30s
  });
}
```

**Returns**:
| Field | Type | Description |
|-------|------|-------------|
| `data` | Object | `{ connected, status, lastSync }` |
| `isLoading` | Boolean | Initial load state |
| `isError` | Boolean | Error state |
| `refetch` | Function | Manual refresh |

**Usage**:
```javascript
const { data, isLoading } = useBrokerConnection('zerodha');

if (isLoading) return <Spinner />;
if (!data?.connected) return <ConnectButton />;
return <Dashboard />;
```

### 2.2 useZerodhaDashboard

**Location**: `hooks/useZerodhaDashboard.js`
**Size**: 1.3KB

**Purpose**: Fetch all Zerodha data for dashboard

**Features**:
- Parallel data fetching
- Combined refresh function
- Error aggregation

**Implementation**:
```javascript
export function useZerodhaDashboard() {
  const holdings = useQuery({
    queryKey: ['zerodha-holdings'],
    queryFn: () => portfolioAPI.getHoldings(),
  });

  const funds = useQuery({
    queryKey: ['zerodha-funds'],
    queryFn: () => portfolioAPI.getFunds(),
  });

  const profile = useQuery({
    queryKey: ['zerodha-profile'],
    queryFn: () => portfolioAPI.getProfile(),
  });

  const refreshAll = useCallback(() => {
    holdings.refetch();
    funds.refetch();
    profile.refetch();
  }, [holdings, funds, profile]);

  return {
    holdings: holdings.data,
    funds: funds.data,
    profile: profile.data,
    isLoading: holdings.isLoading || funds.isLoading,
    refreshAll,
  };
}
```

### 2.3 usePortfolioSummary

**Location**: `hooks/usePortfolioSummary.js`
**Size**: 367 bytes

**Purpose**: Aggregate portfolio value across all brokers

**Backend Source**: `/api/portfolio/summary`

**Returns**:
```javascript
{
  data: {
    totalCurrentValue: 1234567.89,
    totalInvestedValue: 1000000.00,
    totalUnrealizedPL: 234567.89,
    totalDayGain: 5678.90,
    totalDayGainPercent: 0.46,
  },
  isLoading,
  error,
  refetch
}
```

### 2.4 usePortfolioPositions

**Location**: `hooks/usePortfolioPositions.js`
**Size**: 266 bytes

**Purpose**: Fetch F&O positions

**Backend Source**: `/api/portfolio/positions`

---

## 3. React Query Configuration

### 3.1 Default Options

```javascript
// In QueryProvider.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,           // 60 seconds
      gcTime: 10 * 60 * 1000,         // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,    // No jarring updates
      retry: false,                   // Handle errors explicitly
    },
  },
});
```

### 3.2 Configuration Explained

| Setting | Value | Reason |
|---------|-------|--------|
| `staleTime` | 60s | Prevents API spam on navigation |
| `gcTime` | 10m | Keeps data in memory for back navigation |
| `refetchOnWindowFocus` | false | Prevents surprise UI changes |
| `retry` | false | Let hooks handle 4xx errors explicitly |

### 3.3 Query Keys

| Hook | Query Key | Description |
|------|-----------|-------------|
| `useBrokerConnection` | `['broker-status', broker]` | Per-broker status |
| `useZerodhaDashboard` | `['zerodha-holdings']` | Zerodha holdings |
| `usePortfolioSummary` | `['portfolio-summary']` | Aggregated summary |
| `usePortfolioPositions` | `['portfolio-positions']` | F&O positions |

---

## 4. Usage Patterns

### 4.1 In Page Components

```javascript
// ✅ CORRECT - Page fetches, component displays
export default function DashboardPage() {
  const { data, isLoading, error } = usePortfolioSummary();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorAlert message={error.message} />;

  return <DashboardContent data={data} />;
}
```

### 4.2 Loading States

```javascript
// ✅ CORRECT - Handle all states
const { data, isLoading, isError, error } = usePortfolioSummary();

if (isLoading) return <Spinner />;
if (isError) return <Alert variant="destructive">{error.message}</Alert>;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

### 4.3 Manual Refresh

```javascript
// ✅ CORRECT - Expose refetch
const { data, refetch, isFetching } = useZerodhaDashboard();

return (
  <Button onClick={refetch} disabled={isFetching}>
    {isFetching ? 'Refreshing...' : 'Refresh'}
  </Button>
);
```

---

## 5. Anti-Patterns

### 5.1 Direct Fetch in Component

```javascript
// ❌ WRONG - Direct fetch in useEffect
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// ✅ CORRECT - Use hook
const { data } = useMyData();
```

### 5.2 Manual Loading State

```javascript
// ❌ WRONG - Manual loading state
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);

useEffect(() => {
  setLoading(true);
  api.getData().then(setData).finally(() => setLoading(false));
}, []);

// ✅ CORRECT - React Query handles this
const { data, isLoading } = useQuery({
  queryKey: ['my-data'],
  queryFn: api.getData,
});
```

### 5.3 Fetching in Components

```javascript
// ❌ WRONG - Child component fetches
function HoldingsTable() {
  const { data } = useHoldings(); // NO!
  return <Table data={data} />;
}

// ✅ CORRECT - Parent passes data
function HoldingsTable({ data }) {
  return <Table data={data} />;
}
```

---

## 6. Creating New Hooks

### 6.1 Template

```javascript
import { useQuery } from '@tanstack/react-query';
import { myAPI } from '@/lib/api';

/**
 * @description Fetches my data
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useMyData(params) {
  return useQuery({
    queryKey: ['my-data', params],
    queryFn: () => myAPI.getData(params),
    staleTime: 60 * 1000,
    enabled: Boolean(params), // Conditional fetching
  });
}
```

### 6.2 Checklist

- [ ] Import from `@tanstack/react-query`
- [ ] Import API method from `@/lib/api`
- [ ] Define unique `queryKey`
- [ ] Return destructured query result
- [ ] Add JSDoc comments
- [ ] Handle loading/error in consuming component

---

## Appendix: Hook File Sizes

| Hook | Size | Lines |
|------|------|-------|
| useZerodhaDashboard.js | 1.3KB | ~45 |
| useBrokerConnection.js | 839B | ~25 |
| usePortfolioSummary.js | 367B | ~15 |
| usePortfolioPositions.js | 266B | ~10 |

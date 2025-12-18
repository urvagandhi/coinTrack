# 🧩 Component Library (`src/components/`)

> **Status**: Production-Ready
> **Last Updated**: 2025-12-18

Components in CoinTrack are **Presentational**. They focus on UI rendering and interaction, delegating data fetching to parent pages or hooks.

---

## Table of Contents

1. [Directory Structure](#1-directory-structure)
2. [Component Categories](#2-component-categories)
3. [UI Components](#3-ui-components)
4. [Dashboard Components](#4-dashboard-components)
5. [Layout Components](#5-layout-components)
6. [Auth Components](#6-auth-components)
7. [Styling Guidelines](#7-styling-guidelines)
8. [Common Pitfalls](#8-common-pitfalls)

---

## 1. Directory Structure

```
src/components/
├── TotpSetup.jsx                     # TOTP 2FA setup component (11KB)
│
├── auth/                             # Authentication components
│   └── AuthGuard.jsx                 # Protected route wrapper
│
├── brokers/                          # Broker-specific components
│   └── BrokerStatusCard.jsx          # Connection status display
│
├── calculators/                      # Calculator widgets
│   └── InvestmentCalculator.jsx      # SIP/Lumpsum calculator
│
├── dashboard/                        # Dashboard widgets (5 files)
│   ├── BrokerStatusBanner.jsx        # Multi-broker health indicator
│   ├── HoldingsTable.jsx             # Asset data grid
│   ├── MfTimeline.jsx                # MF timeline events
│   ├── StatsCard.jsx                 # Metric display cards
│   └── PortfolioChart.jsx            # Chart components
│
├── layout/                           # App scaffolding (3 files)
│   ├── MainLayout.jsx                # App shell
│   ├── Sidebar.jsx                   # Navigation menu
│   └── Header.jsx                    # Top bar
│
├── notes/                            # Notes feature (1 file)
│   └── NoteDialog.jsx                # Create/Edit note modal
│
├── portfolio/                        # Portfolio display (3 files)
│   ├── PositionsTable.jsx            # F&O positions grid
│   ├── MfHoldingsTable.jsx           # Mutual fund holdings
│   └── TimelineEvent.jsx             # Portfolio event display
│
└── ui/                               # Atomic UI elements (10 files)
    ├── PageTransition.jsx            # Route animations
    ├── alert.jsx                     # Alert component
    ├── badge.jsx                     # Status badges
    ├── button.jsx                    # Button variants
    ├── card.jsx                      # Card container
    ├── input.jsx                     # Form input
    ├── label.jsx                     # Form label
    ├── toast.jsx                     # Toast notification
    ├── toaster.jsx                   # Toast container
    └── use-toast.js                  # Toast hook

Total: 26 files
```

---

## 2. Component Categories

| Category | Purpose | Data Source |
|----------|---------|-------------|
| **UI** | Atomic, reusable elements | Props only |
| **Dashboard** | Data display widgets | Props from pages |
| **Layout** | App scaffolding | Context providers |
| **Auth** | Security guards | AuthContext |
| **Feature** | Domain-specific UX | Props + hooks |

---

## 3. UI Components

### 3.1 Button (`ui/button.jsx`)

**Size**: 2.4KB

**Variants**:
```jsx
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link Style</Button>
```

**Sizes**: `default`, `sm`, `lg`, `icon`

### 3.2 Card (`ui/card.jsx`)

**Size**: 1.9KB

**Structure**:
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```

### 3.3 Toast System (`ui/toast.jsx`, `ui/toaster.jsx`, `ui/use-toast.js`)

**Combined Size**: 9.3KB

**Usage**:
```jsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

// Success
toast({ title: "Success", description: "Data saved" });

// Error
toast({ title: "Error", description: "Failed", variant: "destructive" });
```

**Features**:
- Auto-dismiss (5 seconds)
- Multiple toast stacking
- Dismiss button
- Dark mode support

### 3.4 Alert (`ui/alert.jsx`)

**Size**: 1.5KB

**Variants**:
```jsx
<Alert variant="default">Info alert</Alert>
<Alert variant="destructive">Error alert</Alert>
```

### 3.5 Badge (`ui/badge.jsx`)

**Size**: 1.2KB

**Variants**: `default`, `secondary`, `destructive`, `outline`

---

## 4. Dashboard Components

### 4.1 HoldingsTable (`dashboard/HoldingsTable.jsx`)

**Role**: Primary data grid for equity holdings

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `data` | Array | Holdings from API |
| `loading` | Boolean | Loading state |
| `onRefresh` | Function | Manual refresh callback |

**Features**:
- Currency formatting (₹)
- P&L color-coding (Green/Red)
- Responsive columns
- Sortable headers
- Symbol-to-name mapping

**Implementation**:
```jsx
// From page
<HoldingsTable
  data={holdings.data || []}
  loading={isLoading}
  onRefresh={refetch}
/>
```

### 4.2 BrokerStatusBanner (`dashboard/BrokerStatusBanner.jsx`)

**Role**: Multi-broker health indicator

**Logic**:
1. Consumes `useBrokerConnection` hook
2. Displays status dots (🟢 Connected / 🔴 Disconnected)
3. Self-contained - fetches its own data

### 4.3 StatsCard (`dashboard/StatsCard.jsx`)

**Role**: Key metric display

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `title` | String | Metric name |
| `value` | String/Number | Metric value |
| `change` | Number | Change percentage |
| `icon` | Component | Optional icon |

---

## 5. Layout Components

### 5.1 MainLayout (`layout/MainLayout.jsx`)

**Role**: Application shell

**Structure**:
```jsx
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex-1">
    <Header />
    <main>
      <PageTransition>
        {children}
      </PageTransition>
    </main>
  </div>
</div>
```

### 5.2 Sidebar (`layout/Sidebar.jsx`)

**Features**:
- Navigation links
- Active route highlighting
- Collapsible on mobile
- User avatar
- Logout button

**Routes**:
| Icon | Label | Path |
|------|-------|------|
| 🏠 | Dashboard | `/dashboard` |
| 📈 | Portfolio | `/portfolio` |
| 🔗 | Brokers | `/brokers` |
| 📝 | Notes | `/notes` |
| 👤 | Profile | `/profile` |

### 5.3 Header (`layout/Header.jsx`)

**Features**:
- Breadcrumb navigation
- Theme toggle (Dark/Light)
- User dropdown menu
- Mobile menu button

---

## 6. Auth Components

### 6.1 AuthGuard (`auth/AuthGuard.jsx`)

**Role**: Security gatekeeper for protected routes

**Logic**:
```javascript
function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return children;
}
```

### 6.2 TotpSetup (`TotpSetup.jsx`)

**Size**: 11KB
**Role**: TOTP 2FA setup wizard

**Features**:
- QR code display
- Manual secret entry
- 6-digit code verification
- Backup codes display
- Copy-to-clipboard

---

## 7. Styling Guidelines

### 7.1 Tailwind CSS

**Rule**: Strict Tailwind usage. No custom CSS unless necessary.

```jsx
// ✅ CORRECT
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

// ❌ WRONG - Custom CSS
<div style={{ backgroundColor: 'white', padding: '16px' }}>
```

### 7.2 Dark Mode

**Rule**: ALL components MUST support `dark:` variants.

```jsx
// ✅ CORRECT
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"

// ❌ WRONG - Missing dark mode
className="bg-white text-gray-900"
```

### 7.3 Responsiveness

**Rule**: Mobile-first approach.

```jsx
// ✅ CORRECT - Stack on mobile, row on desktop
className="flex flex-col md:flex-row"

// ❌ WRONG - Desktop-first
className="flex flex-row md:flex-col"
```

---

## 8. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Fetching in components | Race conditions | Pass data as props |
| Complex useState | Maintenance hell | Keep components reactive |
| Missing dark mode | Poor UX | Always add `dark:` |
| Hardcoded colors | Inconsistent UI | Use Tailwind palette |
| Direct API calls | Bypassess caching | Use hooks from pages |
| Missing loading states | Poor UX | Check `isLoading` |

---

## Appendix: File Sizes

| Component | Size | Category |
|-----------|------|----------|
| TotpSetup.jsx | 11KB | Auth |
| toast.jsx | 4.7KB | UI |
| use-toast.js | 3.6KB | UI |
| button.jsx | 2.4KB | UI |
| card.jsx | 1.9KB | UI |
| alert.jsx | 1.5KB | UI |
| badge.jsx | 1.2KB | UI |
| input.jsx | 1KB | UI |
| toaster.jsx | 1KB | UI |

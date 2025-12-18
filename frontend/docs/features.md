# 🚀 Feature Implementation Details

> **Status**: Production-Ready
> **Last Updated**: 2025-12-18

This document outlines the end-to-end flow of complex features in CoinTrack.

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [TOTP 2FA System](#2-totp-2fa-system)
3. [Broker Integration](#3-broker-integration)
4. [Portfolio Analytics](#4-portfolio-analytics)
5. [Notes Feature](#5-notes-feature)
6. [Dark Mode](#6-dark-mode)

---

## 1. Authentication Flow

### 1.1 Files Involved

| File | Role |
|------|------|
| `contexts/AuthContext.js` | State management, API calls |
| `lib/api.js` | Token management, HTTP client |
| `(access)/login/page.jsx` | Login form UI |
| `(access)/register/page.jsx` | Registration form |
| `(access)/setup-2fa/page.jsx` | Mandatory TOTP setup |
| `components/auth/AuthGuard.jsx` | Route protection |

### 1.2 Login Flow (Without TOTP)

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW (NO TOTP)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User submits form                                           │
│     └── login({ identifier, password })                         │
│                                                                 │
│  2. AuthContext calls API                                       │
│     └── authAPI.login(credentials)                              │
│         └── POST /api/auth/login                                │
│                                                                 │
│  3. Backend validates                                           │
│     └── Returns { token, user }                                 │
│                                                                 │
│  4. Token stored                                                │
│     └── tokenManager.setToken(token, remember)                  │
│         ├── remember=true → localStorage                        │
│         └── remember=false → sessionStorage                     │
│                                                                 │
│  5. User state updated                                          │
│     └── dispatch({ type: SET_USER, payload: user })             │
│                                                                 │
│  6. Redirect                                                    │
│     └── router.push('/dashboard')                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Login Flow (With TOTP)

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW (WITH TOTP)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User submits form                                           │
│     └── login({ identifier, password })                         │
│                                                                 │
│  2. Backend returns TOTP requirement                            │
│     └── { requiresOtp: true, tempToken: "eyJ..." }              │
│                                                                 │
│  3. UI shows TOTP input                                         │
│     └── User enters 6-digit code                                │
│                                                                 │
│  4. Verify TOTP                                                 │
│     └── verifyTotpLogin(tempToken, code)                        │
│         └── POST /api/auth/2fa/login                            │
│                                                                 │
│  5. Success: Token returned                                     │
│     └── handleTotpLoginSuccess(token, user)                     │
│                                                                 │
│  6. Store token & redirect                                      │
│     └── router.push('/dashboard')                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Token Expiry Handling

```javascript
// In api.js response interceptor
if (error.response?.status === 401) {
  tokenManager.removeToken();
  // AuthGuard will detect no token and redirect to /login
}
```

---

## 2. TOTP 2FA System

### 2.1 Files Involved

| File | Role |
|------|------|
| `contexts/AuthContext.js` | TOTP method implementations |
| `lib/api.js` | totpAPI methods |
| `components/TotpSetup.jsx` | QR code display, verification UI |
| `(access)/setup-2fa/page.jsx` | Mandatory setup page |

### 2.2 Mandatory TOTP Setup (Registration)

```
┌─────────────────────────────────────────────────────────────────┐
│                   REGISTRATION + TOTP FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User completes registration form                            │
│     └── POST /api/auth/register                                 │
│                                                                 │
│  2. Backend returns temp token                                  │
│     └── { tempToken, message: "TOTP setup required" }           │
│                                                                 │
│  3. Redirect to /setup-2fa                                      │
│     └── Page passes tempToken in state                          │
│                                                                 │
│  4. Fetch TOTP setup                                            │
│     └── POST /api/auth/2fa/register/setup                       │
│     └── Returns { qrCode, secret }                              │
│                                                                 │
│  5. User scans QR code in authenticator app                     │
│                                                                 │
│  6. User enters 6-digit code                                    │
│     └── POST /api/auth/2fa/register/verify                      │
│                                                                 │
│  7. Success: User saved to DB                                   │
│     └── Returns { token, backupCodes }                          │
│                                                                 │
│  8. Display backup codes                                        │
│     └── User must save these (one-time display)                 │
│                                                                 │
│  9. Redirect to /dashboard                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 TOTP Methods in AuthContext

```javascript
// Get QR code for setup
const { qrCode, secret } = await setupTotp();

// Verify initial setup
const { backupCodes } = await verifyTotpSetup(code);

// Login with TOTP
const { token, user } = await verifyTotpLogin(tempToken, code);

// Login with backup code
const { token, user } = await verifyRecoveryLogin(tempToken, backupCode);

// Reset TOTP (rotate secret)
const { qrCode, secret } = await resetTotp(currentCode);

// Verify reset
const { backupCodes } = await verifyResetTotp(newCode);
```

### 2.4 TotpSetup Component

**Size**: 11KB
**Features**:
- QR code display (base64 PNG)
- Manual secret entry option
- 6-digit code input
- Backup codes display with copy button
- Step-by-step wizard UI

---

## 3. Broker Integration

### 3.1 Files Involved

| File | Role |
|------|------|
| `(main)/brokers/page.jsx` | Broker hub |
| `(main)/brokers/zerodha/page.jsx` | Zerodha status |
| `(main)/brokers/zerodha/callback/page.jsx` | OAuth handler |
| `(main)/brokers/zerodha/dashboard/page.jsx` | Data display |
| `hooks/useBrokerConnection.js` | Status polling |
| `hooks/useZerodhaDashboard.js` | Data fetching |
| `lib/api.js` | brokerAPI methods |

### 3.2 Zerodha Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZERODHA INTEGRATION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: CREDENTIALS                                           │
│  ─────────────────────                                          │
│  1. User visits /brokers/zerodha                                │
│  2. Enters API Key + API Secret                                 │
│  3. Clicks "Save Credentials"                                   │
│     └── POST /api/brokers/zerodha/credentials                   │
│  4. Credentials encrypted & stored in MongoDB                   │
│                                                                 │
│  PHASE 2: OAUTH HANDSHAKE                                       │
│  ────────────────────────                                       │
│  5. User clicks "Connect to Zerodha"                            │
│     └── GET /api/brokers/zerodha/connect                        │
│     └── Returns { loginUrl: "https://kite.zerodha.com/..." }    │
│  6. User redirected to Zerodha login page                       │
│  7. User logs into Zerodha account                              │
│  8. Zerodha redirects to /brokers/zerodha/callback              │
│     └── URL params: ?request_token=xxx&status=success           │
│                                                                 │
│  PHASE 3: TOKEN EXCHANGE                                        │
│  ────────────────────────                                       │
│  9. Callback page extracts request_token                        │
│  10. Calls backend to exchange token                            │
│      └── POST /api/brokers/callback                             │
│      └── Body: { broker: "zerodha", requestToken: "xxx" }       │
│  11. Backend calls Zerodha /session/token                       │
│  12. Access token stored (encrypted)                            │
│  13. Redirect to /brokers/zerodha/dashboard                     │
│                                                                 │
│  PHASE 4: DATA CONSUMPTION                                      │
│  ──────────────────────────                                     │
│  14. Dashboard page loads                                       │
│  15. useZerodhaDashboard hook fires                             │
│  16. Parallel fetches: holdings, funds, profile                 │
│  17. Data displayed in HoldingsTable + StatsCards               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Multiple Broker Support

CoinTrack supports multiple brokers with identical structures:

| Broker | Status Page | Callback | Dashboard |
|--------|-------------|----------|-----------|
| Zerodha | `/brokers/zerodha` | `/brokers/zerodha/callback` | `/brokers/zerodha/dashboard` |
| Upstox | `/brokers/upstox` | `/brokers/upstox/callback` | `/brokers/upstox/dashboard` |
| AngelOne | `/brokers/angelone` | `/brokers/angelone/callback` | `/brokers/angelone/dashboard` |

---

## 4. Portfolio Analytics

### 4.1 Files Involved

| File | Role |
|------|------|
| `(main)/portfolio/page.jsx` | Main portfolio view |
| `hooks/usePortfolioSummary.js` | Aggregate data |
| `components/dashboard/HoldingsTable.jsx` | Holdings grid |
| `components/portfolio/PositionsTable.jsx` | Positions grid |

### 4.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PORTFOLIO DATA FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend                       Backend                         │
│  ────────                       ───────                         │
│                                                                 │
│  usePortfolioSummary()          /api/portfolio/summary          │
│       │                               │                         │
│       │                               ▼                         │
│       │                    ┌─────────────────────────┐          │
│       │                    │ PortfolioSummaryService │          │
│       │                    │  ├── Fetch all brokers  │          │
│       │                    │  ├── Aggregate holdings │          │
│       │                    │  └── Compute totals     │          │
│       │                    └─────────────────────────┘          │
│       │                               │                         │
│       └───────────────────────────────┘                         │
│                                                                 │
│  Data received:                                                 │
│  {                                                              │
│    totalCurrentValue: 1234567.89,                               │
│    totalInvestedValue: 1000000.00,                              │
│    totalUnrealizedPL: 234567.89,                                │
│    totalDayGain: 5678.90,                                       │
│    totalDayGainPercent: 0.46,                                   │
│    holdingsList: [...],                                         │
│    positionsList: [...]                                         │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Key Principle: Zero Frontend Math

All financial calculations are done on the backend:
- Total portfolio value
- Day gain/loss
- Unrealized P&L
- Percentages

Frontend only displays the pre-computed values.

---

## 5. Notes Feature

### 5.1 Files Involved

| File | Role |
|------|------|
| `(main)/notes/page.jsx` | Notes list page |
| `components/notes/NoteDialog.jsx` | Create/Edit modal |
| `lib/api.js` | notesAPI methods |

### 5.2 CRUD Operations

```javascript
// List notes
const { data: notes } = useQuery({
  queryKey: ['notes'],
  queryFn: () => notesAPI.list(),
});

// Create note
const createMutation = useMutation({
  mutationFn: notesAPI.create,
  onSuccess: () => queryClient.invalidateQueries(['notes']),
});

// Update note
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => notesAPI.update(id, data),
  onSuccess: () => queryClient.invalidateQueries(['notes']),
});

// Delete note
const deleteMutation = useMutation({
  mutationFn: notesAPI.delete,
  onSuccess: () => queryClient.invalidateQueries(['notes']),
});
```

### 5.3 Note Structure

```javascript
{
  id: "note_123",
  title: "Investment Thesis",
  content: "Markdown content here...",
  pinned: true,
  createdAt: "2025-12-18T10:00:00Z",
  updatedAt: "2025-12-18T10:30:00Z"
}
```

---

## 6. Dark Mode

### 6.1 Implementation

```javascript
// ThemeContext.js
const { theme, toggleTheme } = useTheme();

// Toggle adds/removes 'dark' class on <html>
document.documentElement.classList.toggle('dark');
```

### 6.2 Component Usage

```jsx
// All components must support dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  {/* Content */}
</div>
```

### 6.3 Persistence

Theme preference saved in `localStorage`:
```javascript
localStorage.setItem('theme', 'dark');
```

---

## Appendix: Feature Checklist

| Feature | Status | Files |
|---------|--------|-------|
| Login | ✅ Complete | AuthContext, login/page |
| Register | ✅ Complete | AuthContext, register/page |
| TOTP 2FA | ✅ Complete | TotpSetup, setup-2fa/page |
| Backup Codes | ✅ Complete | TotpSetup |
| Zerodha Integration | ✅ Complete | brokers/zerodha/* |
| Portfolio Summary | ✅ Complete | portfolio/page |
| Holdings View | ✅ Complete | HoldingsTable |
| Positions View | ✅ Complete | PositionsTable |
| Notes CRUD | ✅ Complete | notes/page |
| Dark Mode | ✅ Complete | ThemeContext |
| Profile Update | ✅ Complete | profile/page |
| Password Change | ✅ Complete | profile/page |

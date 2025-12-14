# 🚀 Feature Implementation Details

This document outlines the end-to-end flow of complex features in CoinTrack.

## 🔐 1. Authentication Flow

**Files:** `AuthContext.js`, `api.js`, `(access)/login/page.jsx`

1.  **Login**: User submits form -> `authAPI.login()` -> Backend.
2.  **Token**: Backend returns JWT.
3.  **Storage**: `AuthContext` calls `tokenManager.setToken()`.
    - Stored in `localStorage` (if "Remember Me") or `sessionStorage`.
4.  **State**: `user` state updates -> `AuthGuard` allows entry to `(main)`.
5.  **Expiry**: `api.js` intercepts 401 response -> calls `tokenManager.removeToken()` -> `AuthGuard` redirects to Login.

---

## 📈 2. Broker Integration (Zerodha)

**Files:** `(main)/brokers/zerodha/*`, `useZerodhaDashboard`, `brokerAPI`

### Phase A: Linking
1.  User visits `/brokers/zerodha`.
2.  Enters API Key/Secret -> `brokerAPI.saveZerodhaCredentials()`.
3.  Clicks "Connect" -> `brokerAPI.getConnectUrl()` -> Redirects to Zerodha.

### Phase B: Callback
1.  Zerodha redirects back to `/brokers/zerodha/callback?request_token=xyz`.
2.  Page parses `request_token`.
3.  Calls `brokerAPI.handleCallback('zerodha', token)`.
4.  Backend exchanges token, saves access token securely.
5.  Frontend redirects to `/brokers` on success.

### Phase C: Data Consumption
1.  User views `/brokers/zerodha/dashboard`.
2.  `useZerodhaDashboard` hook fires.
3.  Fetches `holdings`, `funds`, `profile` in parallel.
4.  Renders `HoldingsTable` and `StatsCard`.

---

## 📝 3. Notes Feature

**Files:** `src/app/(main)/notes/`, `src/components/notes/NoteDialog.jsx`

- **List**: `api.get('/api/notes')`.
- **Create/Edit**: Uses a shared `NoteDialog` component.
- **Optimism**: Currently relies on `refetch()` after mutation (simple consistency).

---

## 📊 4. Portfolio Analytics

**Files:** `(main)/portfolio`, `usePortfolioSummary`

- **Consolidated View**: Fetches summary from **all** connected brokers via single backend aggregator endpoint (`/api/portfolio/summary`).
- **Performance**: High-level metrics are computed on the Backend to reduce frontend processing load.

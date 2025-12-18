# 🧠 Contexts & Providers

> **Status**: Production-Ready
> **Last Updated**: 2025-12-18

CoinTrack uses **React Context** for global application state (auth, theme) and **React Query** for server state (API data).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [AuthContext](#2-authcontext)
3. [ThemeContext](#3-themecontext)
4. [QueryProvider](#4-queryprovider)
5. [Usage Guidelines](#5-usage-guidelines)
6. [Common Pitfalls](#6-common-pitfalls)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PROVIDER HIERARCHY                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  <QueryProvider>                    React Query             │
│    <ThemeProvider>                  Dark/Light mode         │
│      <AuthProvider>                 Authentication          │
│        {children}                   App content             │
│        <Toaster />                  Toast notifications     │
│      </AuthProvider>                                        │
│    </ThemeProvider>                                         │
│  </QueryProvider>                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Directory Structure**:
```
src/
├── contexts/
│   ├── AuthContext.js           # Authentication (365 lines, 13KB)
│   └── ThemeContext.js          # Theme toggle (1.5KB)
│
└── providers/
    └── QueryProvider.jsx        # React Query setup
```

---

## 2. AuthContext

### 2.1 Overview

**Location**: `src/contexts/AuthContext.js`
**Size**: 365 lines, 13KB
**Purpose**: Complete authentication management including TOTP 2FA

### 2.2 State Shape

```javascript
const initialState = {
  user: null,           // User profile object (id, username, email, etc.)
  isAuthenticated: false,
  isLoading: true,      // Initially true to check token
  error: null
};
```

### 2.3 Actions

| Action Type | Description |
|-------------|-------------|
| `SET_LOADING` | Toggle loading state |
| `SET_USER` | Set authenticated user |
| `SET_ERROR` | Set error message |
| `LOGOUT` | Clear user and token |
| `CLEAR_ERROR` | Clear error state |

### 2.4 Exported Methods

**Authentication**:
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `login(credentials)` | `{ identifier, password }` | `{ success, requiresTotp?, tempToken? }` | Initial login |
| `logout()` | - | - | Clear session |
| `fetchUserProfile()` | - | `User` | Refresh user data |

**TOTP 2FA**:
| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setupTotp()` | - | `{ qrCode, secret }` | Get TOTP setup |
| `verifyTotpSetup(code)` | 6-digit code | `{ backupCodes }` | Verify initial setup |
| `verifyTotpLogin(tempToken, code)` | Token + code | `{ token, user }` | Complete TOTP login |
| `verifyRecoveryLogin(tempToken, code)` | Token + backup code | `{ token, user }` | Recovery login |
| `resetTotp(currentCode)` | Current code | `{ qrCode, secret }` | Initiate reset |
| `verifyResetTotp(code)` | New code | `{ backupCodes }` | Complete reset |
| `handleTotpLoginSuccess(token, userData)` | JWT + user | - | Post-TOTP handler |

### 2.5 Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTH CONTEXT LIFECYCLE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. MOUNT                                                       │
│     └── initializeAuth()                                       │
│         ├── Check localStorage for token                       │
│         ├── If token exists:                                   │
│         │   ├── tokenManager.isTokenExpired(token)?            │
│         │   │   ├── Yes → removeToken(), set isLoading=false   │
│         │   │   └── No → call /api/users/me                    │
│         │   └── If API success → SET_USER                      │
│         └── If no token → set isLoading=false                  │
│                                                                 │
│  2. LOGIN FLOW                                                  │
│     login({ identifier, password })                            │
│         ├── Call /api/auth/login                               │
│         ├── If response.requiresOtp:                           │
│         │   └── Return { requiresTotp: true, tempToken }       │
│         └── Else:                                              │
│             ├── tokenManager.setToken(token)                   │
│             ├── fetchUserProfile()                             │
│             └── SET_USER                                       │
│                                                                 │
│  3. LOGOUT                                                      │
│     logout()                                                   │
│         ├── authAPI.logout()                                   │
│         ├── tokenManager.removeToken()                         │
│         └── LOGOUT → router.push('/login')                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 Usage

```javascript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    verifyTotpLogin
  } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <LoginPrompt />;

  return <Dashboard user={user} />;
}
```

---

## 3. ThemeContext

### 3.1 Overview

**Location**: `src/contexts/ThemeContext.js`
**Size**: 1.5KB
**Purpose**: Dark/Light mode toggle

### 3.2 State

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | System pref | Current theme |

### 3.3 Methods

| Method | Description |
|--------|-------------|
| `toggleTheme()` | Switch between light/dark |
| `setTheme(theme)` | Set specific theme |

### 3.4 Implementation

```javascript
// Adds/removes 'dark' class on <html>
useEffect(() => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}, [theme]);
```

### 3.5 Usage

```javascript
import { useTheme } from '@/contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}
```

---

## 4. QueryProvider

### 4.1 Overview

**Location**: `src/providers/QueryProvider.jsx`
**Purpose**: React Query configuration

### 4.2 Configuration

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,         // 60 seconds
      gcTime: 10 * 60 * 1000,       // 10 minutes
      refetchOnWindowFocus: false,  // Disable jarring updates
      retry: false,                 // Handle errors explicitly
    },
  },
});
```

### 4.3 Settings Explained

| Setting | Value | Reason |
|---------|-------|--------|
| `staleTime` | 60s | Prevent spam on navigation |
| `gcTime` | 10m | Keep data in memory briefly |
| `refetchOnWindowFocus` | false | No surprise updates |
| `retry` | false | Let hooks handle errors |

---

## 5. Usage Guidelines

### 5.1 Context vs React Query

| Data Type | Use Context | Use React Query |
|-----------|-------------|-----------------|
| User session | ✅ | ❌ |
| Theme preference | ✅ | ❌ |
| Portfolio data | ❌ | ✅ |
| Holdings list | ❌ | ✅ |
| API data | ❌ | ✅ |

### 5.2 Safe Hook Export

Always export a custom hook, never the raw context:

```javascript
// ✅ CORRECT
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ❌ WRONG - Exposes raw context
export { AuthContext };
```

### 5.3 Provider Hierarchy

```javascript
// ✅ CORRECT - Query > Theme > Auth
<QueryProvider>
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
</QueryProvider>

// ❌ WRONG - Auth before Theme causes issues
<AuthProvider>
  <ThemeProvider>...</ThemeProvider>
</AuthProvider>
```

---

## 6. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Using Context for API data | Stale data, no caching | Use React Query |
| Exposing raw Context | Missing provider errors | Export custom hook |
| Wrong provider order | Hydration mismatches | Follow hierarchy |
| Not handling loading | Flash of wrong content | Check `isLoading` |
| Overusing Context | Performance issues | Keep minimal data |
| Forgetting `'use client'` | Server component error | Add to context files |

---

## Appendix: Context File Sizes

| File | Size | Lines |
|------|------|-------|
| AuthContext.js | 13KB | 365 |
| ThemeContext.js | 1.5KB | ~50 |
| QueryProvider.jsx | ~1KB | ~30 |

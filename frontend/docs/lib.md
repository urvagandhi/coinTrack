# 📚 Lib & API Utilities (`src/lib/`)

> **Status**: Production-Ready
> **Last Updated**: 2025-12-18

This directory contains the core infrastructure code: API client, logging, formatters, and utilities.

---

## Table of Contents

1. [Directory Structure](#1-directory-structure)
2. [API Client (api.js)](#2-api-client-apijs)
3. [Logger (logger.js)](#3-logger-loggerjs)
4. [Format Utilities (format.js)](#4-format-utilities-formatjs)
5. [Stock Name Mapping](#5-stock-name-mapping)
6. [Error Handling Strategy](#6-error-handling-strategy)

---

## 1. Directory Structure

```
src/lib/
├── api.js                  # Axios instance, API methods (443 lines, 15.5KB)
├── logger.js               # Centralized logging (130 lines, 4KB)
├── format.js               # Currency/date formatters (874 bytes)
├── stockNameMapping.js     # Symbol to name (3.3KB)
└── utils.js                # Misc utilities (143 bytes)

Total: 5 files, ~23KB
```

---

## 2. API Client (api.js)

### 2.1 Overview

**Size**: 443 lines, 15.5KB
**Purpose**: Centralized HTTP client with auth, error handling, and API method exports

### 2.2 Axios Instance

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,              // 30 second timeout
  headers: { 'Content-Type': 'application/json' },
  retry: false,
  transitional: { silentJSONParsing: true }
});
```

### 2.3 Token Manager

**Purpose**: JWT storage and validation

```javascript
export const tokenManager = {
  getToken(),                    // Get from storage
  setToken(token, remember),     // Save to localStorage/sessionStorage
  removeToken(),                 // Clear from both storages
  isTokenExpired(token)          // Check JWT expiry claim
};
```

**Storage Logic**:
| Remember Me | Storage | Persistence |
|-------------|---------|-------------|
| `true` | `localStorage` | Survives browser close |
| `false` | `sessionStorage` | Cleared on tab close |

### 2.4 Request Interceptor

```javascript
api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token && !tokenManager.isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.metadata = { startTime: new Date() };
  return config;
});
```

**Features**:
- Auto-inject Bearer token
- Skip if token expired
- Track request start time

### 2.5 Response Interceptor

```javascript
api.interceptors.response.use(
  (response) => {
    // Log slow requests (> 2 seconds)
    const duration = new Date() - response.config.metadata.startTime;
    if (duration > 2000) {
      logger.warn('[API] Slow Request', { url, duration });
    }
    return response;
  },
  (error) => {
    // Normalize error for UI consumption
    const normalizedError = {
      message: error.response?.data?.message || 'An unexpected error occurred',
      status: error.response?.status,
      original: error
    };

    // Auto-logout on 401
    if (error.response?.status === 401) {
      tokenManager.removeToken();
    }

    return Promise.reject(normalizedError);
  }
);
```

### 2.6 API Endpoints Registry

```javascript
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    totp: {
      setup: '/api/auth/2fa/setup',
      verify: '/api/auth/2fa/verify',
      login: '/api/auth/2fa/login',
      recovery: '/api/auth/2fa/recovery',
      reset: '/api/auth/2fa/reset',
      verifyReset: '/api/auth/2fa/verify-reset',
      status: '/api/auth/2fa/status',
      registerSetup: '/api/auth/2fa/register/setup',
      registerVerify: '/api/auth/2fa/register/verify',
    }
  },
  users: {
    me: '/api/users/me',
    update: (id) => `/api/users/${id}`,
  },
  portfolio: {
    summary: '/api/portfolio/summary',
    holdings: '/api/portfolio/holdings',
    positions: '/api/portfolio/positions',
    orders: '/api/portfolio/orders',
    funds: '/api/portfolio/funds',
    mfHoldings: '/api/portfolio/mf/holdings',
    mfOrders: '/api/portfolio/mf/orders',
    mfSips: '/api/portfolio/mf/sips',
    mfInstruments: '/api/portfolio/mf/instruments',
    mfTimeline: '/api/portfolio/mf/timeline',
    trades: '/api/portfolio/trades',
    profile: '/api/portfolio/profile',
  },
  brokers: {
    connect: (broker) => `/api/brokers/${broker}/connect`,
    status: (broker) => `/api/brokers/${broker}/status`,
    zerodha: {
      saveCredentials: '/api/brokers/zerodha/credentials',
    },
    callback: '/api/brokers/callback',
  },
  notes: {
    list: '/api/notes',
    create: '/api/notes',
    update: (id) => `/api/notes/${id}`,
    delete: (id) => `/api/notes/${id}`,
  }
};
```

### 2.7 Exported API Objects

**authAPI**:
| Method | Parameters | Endpoint |
|--------|------------|----------|
| `login(credentials)` | `{ identifier, password }` | POST `/api/auth/login` |
| `register(userData)` | User data | POST `/api/auth/register` |
| `logout()` | - | POST `/api/auth/logout` |

**totpAPI**:
| Method | Parameters | Endpoint |
|--------|------------|----------|
| `setup()` | - | GET `/api/auth/2fa/setup` |
| `verify(code)` | 6-digit code | POST `/api/auth/2fa/verify` |
| `verifyLogin(tempToken, code)` | Token + code | POST `/api/auth/2fa/login` |
| `verifyRecovery(tempToken, code)` | Token + backup code | POST `/api/auth/2fa/recovery` |
| `reset(code)` | Current TOTP code | POST `/api/auth/2fa/reset` |
| `verifyReset(code)` | New code | POST `/api/auth/2fa/verify-reset` |
| `status()` | - | GET `/api/auth/2fa/status` |

**portfolioAPI**:
| Method | Endpoint |
|--------|----------|
| `getSummary()` | GET `/api/portfolio/summary` |
| `getHoldings()` | GET `/api/portfolio/holdings` |
| `getPositions()` | GET `/api/portfolio/positions` |
| `getOrders()` | GET `/api/portfolio/orders` |
| `getFunds()` | GET `/api/portfolio/funds` |
| `getMfHoldings()` | GET `/api/portfolio/mf/holdings` |
| `getMfOrders()` | GET `/api/portfolio/mf/orders` |
| `getMfSips()` | GET `/api/portfolio/mf/sips` |
| `getMfInstruments()` | GET `/api/portfolio/mf/instruments` |
| `getTrades()` | GET `/api/portfolio/trades` |
| `getProfile()` | GET `/api/portfolio/profile` |

**brokerAPI**:
| Method | Parameters | Endpoint |
|--------|------------|----------|
| `getConnectUrl(broker)` | Broker name | GET `/api/brokers/{broker}/connect` |
| `getStatus(broker)` | Broker name | GET `/api/brokers/{broker}/status` |
| `handleCallback(broker, token)` | Broker + request_token | POST `/api/brokers/callback` |
| `saveZerodhaCredentials(data)` | API key/secret | POST `/api/brokers/zerodha/credentials` |

**notesAPI**:
| Method | Parameters | Endpoint |
|--------|------------|----------|
| `list()` | - | GET `/api/notes` |
| `create(note)` | Note data | POST `/api/notes` |
| `update(id, data)` | ID + data | PUT `/api/notes/{id}` |
| `delete(id)` | Note ID | DELETE `/api/notes/{id}` |

---

## 3. Logger (logger.js)

### 3.1 Overview

**Size**: 130 lines, 4KB
**Purpose**: Production-safe logging wrapper

### 3.2 Log Levels

| Level | Value | Production | Development |
|-------|-------|------------|-------------|
| DEBUG | 0 | ❌ Hidden | ✅ Shown |
| INFO | 1 | ❌ Hidden | ✅ Shown |
| WARN | 2 | ✅ Shown | ✅ Shown |
| ERROR | 3 | ✅ Shown | ✅ Shown |

### 3.3 API

```javascript
import { logger } from '@/lib/logger';

logger.debug('Debug message', { optional: 'context' });
logger.info('Info message', { userId: '123' });
logger.warn('Warning message', { reason: 'something' });
logger.error('Error message', { error: err.message });

// Special API tracing
logger.api('GET', '/api/portfolio', 200, 150);
// Output: ✅ API GET /api/portfolio (200) - 150ms
```

### 3.4 Features

**Format**:
```
[CoinTrack] [LEVEL] 2025-12-18T10:30:00.000Z - Message
{"context": "data"}
```

**Security**:
- In dev: Warns if context contains "token", "password", "secret"
- Circular reference handling
- Safe serialization

### 3.5 Usage Rules

```javascript
// ✅ CORRECT - Use logger
logger.info('User logged in', { userId: user.id });

// ❌ WRONG - Direct console
console.log('User logged in');
```

---

## 4. Format Utilities (format.js)

### 4.1 Overview

**Size**: 874 bytes
**Purpose**: Currency and date formatting

### 4.2 Functions

```javascript
// Format currency in INR
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
// Output: ₹1,23,456.78

// Format percentage
export function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
// Output: +12.34% or -5.67%

// Format date
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
// Output: 18 Dec 2025
```

---

## 5. Stock Name Mapping

### 5.1 Overview

**Location**: `stockNameMapping.js`
**Size**: 3.3KB
**Purpose**: Convert trading symbols to human-readable names

### 5.2 Usage

```javascript
import { getStockName } from '@/lib/stockNameMapping';

getStockName('RELIANCE');  // "Reliance Industries Ltd."
getStockName('TCS');       // "Tata Consultancy Services Ltd."
getStockName('UNKNOWN');   // "UNKNOWN" (fallback to symbol)
```

---

## 6. Error Handling Strategy

### 6.1 Error Normalization

All API errors are normalized before reaching components:

```javascript
// Raw Axios Error → Normalized Error
{
  message: "User friendly message",   // From response.data.message
  status: 400,                        // HTTP status
  original: AxiosError                // For debugging in dev
}
```

### 6.2 Usage in Components

```javascript
// ✅ Safe to render error.message
const { error } = usePortfolioSummary();

if (error) {
  return <Alert variant="destructive">{error.message}</Alert>;
}
```

### 6.3 HTTP Status Handling

| Status | Behavior |
|--------|----------|
| 401 | Auto-logout via interceptor |
| 403 | Error passed to component |
| 404 | Error passed to component |
| 5xx | Generic "Server error" message |

---

## Appendix: File Statistics

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| api.js | 15.5KB | 443 | HTTP client + all API methods |
| logger.js | 4KB | 130 | Centralized logging |
| stockNameMapping.js | 3.3KB | ~100 | Symbol to name map |
| format.js | 874B | ~30 | Formatters |
| utils.js | 143B | ~5 | Misc utilities |

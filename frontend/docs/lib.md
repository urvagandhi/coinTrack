# 📚 Lib & API Utilities (`src/lib/`)

This directory contains the core infrastructure code, singleton instances, and static constants.

## 🛠️ Core Modules

### 1. `api.js` (The Backbone)
See [Backend Integration](../README.md#frontend--backend-integration) for high-level concepts.

- **`api` instance**: An Axios instance with global configuration.
- **Interceptors**:
  - **Request**: Injects `Authorization: Bearer <token>`.
  - **Response**: Normalizes errors, logs slow requests.
- **Endpoints**: A static registry (`endpoints` object) mapping every backend route.
- **Exports**: `authAPI`, `brokerAPI`, `portfolioAPI`.

### 2. `logger.js` (The Eyes)
A production-safe logging wrapper.
- **Methods**: `logger.info`, `logger.warn`, `logger.error`, `logger.debug`.
- **Production**: Automatically silences `debug` and `info` logs to keep console clean.
- **Safety**: Includes rudimentary checks (in dev) to warn if you accidentally log an object containing "password" or "token".

### 3. `stockNameMapping.js`
A utility to map raw trading symbols (e.g., `RELIANCE.NSE`) to human-readable names.
- Used extensively in Dashboards and Holdings Tables.

---

## 🛡️ Error Handling Strategy

**In `api.js`:**
We enforce a strict error contract. The UI never sees a raw Axios error object.

```javascript
// Raw Axios Error -> Normalized
{
  message: "User friendly message",
  status: 400,
  original: ... // (Dev only)
}
```

**In Components:**
```javascript
if (error) {
  return <Alert>{error.message}</Alert>; // Safe to render
}
```

---

## 🕵️‍♂️ Observability

**Logger Rules:**
1.  Imports: `import { logger } from '@/lib/logger'`
2.  Usage: `logger.error('Login Failed', { reason: err.message })`
3.  **NEVER**: `console.log()`

This ensures that if we later add a remote logging service (like Sentry or Datadog), we only check one file (`logger.js`).

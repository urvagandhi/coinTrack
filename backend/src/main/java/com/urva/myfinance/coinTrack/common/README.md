# Common Module – CoinTrack

> **Domain**: Cross-cutting infrastructure and shared utilities
> **Responsibility**: Configuration, exception handling, logging, and reusable components

---

## 1. Overview

### Purpose
The Common module provides foundational infrastructure shared across all domain modules. It contains no business logic—only cross-cutting concerns that every other module depends on.

### System Position
```
┌─────────────────────────────────────────────────────────┐
│                     All Domain Modules                  │
│   (user, broker, portfolio, notes, security)            │
└─────────────────────────┬───────────────────────────────┘
                          │ depends on
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     COMMON MODULE                       │
│  ┌──────────┐ ┌───────────┐ ┌──────┐ ┌────────────┐     │
│  │ Exception│ │  Response │ │Config│ │   Util     │     │
│  └──────────┘ └───────────┘ └──────┘ └────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
common/
├── config/
│   ├── CorsConfig.java           # CORS policy for frontend
│   ├── EncryptionConfig.java     # AES encryption beans
│   └── RestTemplateConfig.java   # HTTP client configuration
├── exception/
│   ├── DomainException.java      # Base exception class
│   ├── AuthenticationException.java
│   ├── AuthorizationException.java
│   ├── ExternalServiceException.java
│   └── GlobalExceptionHandler.java  # @RestControllerAdvice
├── filter/
│   └── RequestIdFilter.java      # MDC correlation ID (Traceability)
├── health/
│   └── HealthController.java     # /health endpoint
├── response/
│   ├── ApiResponse.java          # Standard success wrapper
│   ├── ApiErrorResponse.java     # Standard error wrapper
│   └── user/                     # Shared User DTOs
└── util/
    ├── LoggingConstants.java     # Centralized log messages
    ├── EncryptionUtil.java       # AES encrypt/decrypt (Secrets)
    ├── HashUtil.java             # SHA-256 checksums (Integrity)
    └── FnoUtils.java             # F&O parsing utilities
```

---

## 3. Component Responsibilities

### Exception Hierarchy
All application errors extend `DomainException`.
```
RuntimeException
    └── DomainException (base)
            ├── AuthenticationException  → 401 Unauthorized
            ├── AuthorizationException   → 403 Forbidden
            ├── ExternalServiceException → 502 Bad Gateway
            └── ValidationException      → 400 Bad Request
```

### GlobalExceptionHandler
Converts exceptions into a standard JSON error response:
```json
{
  "success": false,
  "code": "AUTH_FAILED",
  "message": "Invalid credentials",
  "requestId": "550e8400-e29b..."
}
```

### RequestIdFilter (`MDC`)
*   **Purpose**: Log Correlation
*   **Mechanism**: Generates a UUID for every incoming request and stores it in the MDC (Mapped Diagnostic Context) as `requestId`.
*   **Log Format**: `[requestId=...] Message`

---

## 4. Security Utilities

### Encryption (`EncryptionUtil`)
Used for storing sensitive API secrets (Broker keys) in the database.
*   **Algorithm**: AES-256
*   **Key Source**: Environment variable `${ENCRYPTION_KEY}`
*   **Usage**:
    ```java
    String encrypted = encryptionUtil.encrypt(apiKey);
    String original = encryptionUtil.decrypt(encrypted);
    ```

### Hashing (`HashUtil`)
Used for generating checksums (e.g., Zerodha login flow).
*   **Algorithm**: SHA-256
*   **Usage**: `HashUtil.sha256(inputString)`

---

## 5. Execution Flow

### Request Processing
```
Incoming Request
    │
    ▼
RequestIdFilter (Generates UUID → MDC)
    │
    ▼
JwtFilter (Security Module - Auth Check)
    │
    ▼
Controller → Service → Repository
    │
    ▼
GlobalExceptionHandler (catches errors) OR ApiResponse (wraps success)
```

---

## 6. Common Pitfalls
| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Throwing `RuntimeException` | Bypasses standard error codes | Always throw `DomainException` subclasses |
| Logging Secrets | Security risk | Never log raw secrets; use `EncryptionUtil` for storage |
| Logic in Common | Circular dependencies | Keep `common` stateless and logic-free |
| Hardcoding Configurations | Environment drift | Use `@Value` or `AppConfig` beans |

---

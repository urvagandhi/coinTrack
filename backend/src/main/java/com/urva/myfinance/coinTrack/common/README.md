# Common Module – CoinTrack

> **Domain**: Cross-cutting infrastructure and shared utilities
> **Responsibility**: Configuration, exception handling, logging, and reusable components

---

## 1. Overview

### Purpose
The Common module provides foundational infrastructure shared across all domain modules. It contains no business logic—only cross-cutting concerns that every other module depends on.

### Business Problem Solved
Without centralized infrastructure:
- Each module would define its own error responses
- Logging would be inconsistent
- Configuration would be scattered
- Exception handling would vary between controllers

This module enforces consistency and reduces duplication.

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
│  ┌──────────┐ ┌───────────┐ ┌──────┐ ┌────────────┐    │
│  │ Exception│ │  Response │ │Config│ │   Util     │    │
│  └──────────┘ └───────────┘ └──────┘ └────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
common/
├── config/
│   ├── CorsConfig.java           # CORS policy for frontend
│   ├── EncryptionConfig.java     # AES encryption beans
│   ├── RestTemplateConfig.java   # HTTP client configuration
│   └── package-info.java         # Architecture documentation
├── exception/
│   ├── DomainException.java      # Base exception class
│   ├── AuthenticationException.java
│   ├── AuthorizationException.java
│   ├── ExternalServiceException.java
│   ├── ValidationException.java
│   └── GlobalExceptionHandler.java  # @RestControllerAdvice
├── filter/
│   └── RequestIdFilter.java      # MDC correlation ID
├── health/
│   ├── HealthController.java     # /health endpoint
│   └── HomeController.java       # Root redirect
├── response/
│   ├── ApiResponse.java          # Standard success wrapper
│   ├── ApiErrorResponse.java     # Standard error wrapper
│   └── user/                     # User-specific DTOs
│       ├── RegisterUserDTO.java
│       ├── UpdateUserDTO.java
│       ├── UserDTO.java
│       └── PasswordChangeDTO.java
└── util/
    ├── LoggingConstants.java     # Centralized log messages
    ├── EncryptionUtil.java       # AES encrypt/decrypt
    ├── HashUtil.java             # SHA-256 checksums
    ├── FnoUtils.java             # F&O parsing utilities
    ├── NotificationService.java  # Email/SMS abstraction
    ├── SequenceGeneratorService.java  # Auto-increment IDs
    └── DatabaseSequence.java     # MongoDB sequence model
```

### Why This Structure?
| Folder | Purpose | Rationale |
|--------|---------|-----------|
| `config/` | Spring configuration beans | Centralized settings |
| `exception/` | Exception hierarchy + handler | Consistent error handling |
| `filter/` | Servlet filters | Request-level concerns |
| `health/` | Health and home endpoints | Operational monitoring |
| `response/` | API response wrappers | Contract consistency |
| `util/` | Stateless utilities | Reusable helper functions |

---

## 3. Component Responsibilities

### Exception Hierarchy
```
RuntimeException
    └── DomainException (base)
            ├── AuthenticationException  → 401 Unauthorized
            ├── AuthorizationException   → 403 Forbidden
            ├── ExternalServiceException → 502 Bad Gateway
            └── ValidationException      → 400 Bad Request
```

### GlobalExceptionHandler
| Exception Type | HTTP Status | Response |
|---------------|-------------|----------|
| `DomainException` | From exception | `ApiErrorResponse` |
| `AuthenticationException` | 401 | `AUTH_FAILED` |
| `AuthorizationException` | 403 | `ACCESS_DENIED` |
| `ExternalServiceException` | 502 | `EXTERNAL_SERVICE_FAILED` |
| `MethodArgumentNotValidException` | 400 | Field validation errors |
| `RuntimeException` | 500 | Generic error (logged fully) |

### ApiResponse Wrapper
```java
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private Instant timestamp;
    private String requestId;  // From MDC
}
```

Usage:
```java
return ResponseEntity.ok(ApiResponse.success(user));
return ResponseEntity.status(401).body(ApiResponse.error("Invalid token"));
```

### RequestIdFilter
- Generates UUID for every request
- Stores in MDC: `MDC.put("requestId", uuid)`
- Available in all logs: `[requestId=abc-123]`
- Clears after request completes

### LoggingConstants
Centralized log message templates:
```java
public static final String USER_LOGIN_STARTED = "Login started for user: {}";
public static final String BROKER_CONNECT_FAILED = "Broker {} connection failed for user {}: {}";
```

---

## 4. Execution Flow

### Request Processing with RequestIdFilter
```
┌─────────────────┐
│ Incoming Request│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ RequestIdFilter                 │
│ 1. Generate UUID                │
│ 2. MDC.put("requestId", uuid)   │
│ 3. log "Request started"        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│ JwtFilter       │ (security module)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Controller      │
│ → Service       │
│ → Repository    │
└────────┬────────┘
         │ Exception thrown?
         │
    ┌────┴────┐
    │ Yes     │ No
    ▼         ▼
┌─────────────────────┐  ┌─────────────────┐
│GlobalExceptionHandler│  │ ApiResponse.    │
│ → ApiErrorResponse  │  │ success(data)   │
└─────────────────────┘  └─────────────────┘
```

### Exception Handling Flow
```
1. Service throws AuthenticationException("Invalid password")
2. GlobalExceptionHandler catches it
3. Logs: logger.warn("Authentication failed: {}", ex.getMessage())
4. Returns: 401 + ApiErrorResponse{code: "AUTH_FAILED", message: "..."}
```

---

## 5. Diagrams

### Exception Hierarchy
```text
┌─────────────────────────────────────────────────────────┐
│                    DomainException                      │
│  - httpStatus: int                                      │
│  - errorCode: String                                    │
│  - message: String                                      │
└─────────────────────────┬───────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌──────────────┐  ┌───────────────┐  ┌───────────────────┐
│Authentication│  │Authorization  │  │ExternalService    │
│Exception     │  │Exception      │  │Exception          │
│ 401          │  │ 403           │  │ 502               │
└──────────────┘  └───────────────┘  └───────────────────┘
```

### Request ID Flow (Sequence)
```text
Client       RequestIdFilter      MDC       Controller
  │                 │              │            │
  ├── HTTP Request >│              │            │
  │                 ├── put("reqId")>           │
  │                 │              │            │
  │                 ├─── doFilter() ───────────>│
  │                 │              │            ├── get("reqId")
  │                 │              │<-- uuid ---│
  │                 │              │            │
  │                 │              │            ├── log(msg)
  │<-- Response ────│              │            │
  │                 ├── remove("reqId")>        │
```

---

## 6. Logging Strategy

### What IS Logged
| Event | Level | Component |
|-------|-------|-----------|
| Request start | `DEBUG` | RequestIdFilter |
| Request complete | `DEBUG` | RequestIdFilter |
| Validation failed | `WARN` | GlobalExceptionHandler |
| Auth failure | `WARN` | GlobalExceptionHandler |
| External service error | `ERROR` | GlobalExceptionHandler |
| Unhandled exception | `ERROR` | GlobalExceptionHandler (with stack trace) |

### What is NEVER Logged
- Passwords (never, anywhere)
- JWT tokens
- API secrets
- Full stack traces to client (only to server logs)

### MDC Context
Every log line includes:
```
[requestId=550e8400-e29b-41d4-a716-446655440000] Login started for user: john
```

---

## 7. Security Considerations

### Encryption
```java
// EncryptionUtil uses AES-256
String encrypted = encryptionUtil.encrypt(secretValue);
String decrypted = encryptionUtil.decrypt(encrypted);
```

- Encryption key from environment: `${ENCRYPTION_KEY}`
- Never log encrypted values
- Used for: API secrets, sensitive tokens

### Exception Messages
- Internal exceptions: Full message logged
- Client responses: Sanitized message (no stack traces, no internal paths)

### CORS Configuration
```java
// CorsConfig.java
.allowedOrigins("http://localhost:3000", "${FRONTEND_URL}")
.allowedMethods("GET", "POST", "PUT", "DELETE")
.allowCredentials(true)
```

---

## 8. Extension Guidelines

### Adding a New Exception Type

1. **Extend DomainException**
   ```java
   public class RateLimitException extends DomainException {
       public RateLimitException(String message) {
           super(429, "RATE_LIMIT_EXCEEDED", message, HttpStatus.TOO_MANY_REQUESTS);
       }
   }
   ```

2. **Add handler (optional, falls back to DomainException handler)**
   ```java
   @ExceptionHandler(RateLimitException.class)
   public ResponseEntity<ApiErrorResponse> handleRateLimit(RateLimitException ex) {
       // Custom handling if needed
   }
   ```

### Adding a New Utility
1. Create in `util/` folder
2. Make methods `static` if stateless
3. Use `@Component` if needs Spring beans
4. Document public methods with Javadoc

### Adding a New Configuration
1. Create in `config/` folder
2. Use `@Configuration` annotation
3. Use `@Value` for externalized properties
4. Document in `package-info.java`

---

## 9. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Throwing `RuntimeException` directly | Bypasses exception hierarchy | Extend `DomainException` |
| Logging passwords | Security breach | Use LoggingConstants patterns |
| Hardcoding encryption keys | Key exposure in source | Use `${ENCRYPTION_KEY}` |
| Returning stack traces to client | Information disclosure | GlobalExceptionHandler sanitizes |
| Not clearing MDC | Memory leak, wrong requestId | `finally { MDC.clear() }` |
| Business logic in common | Violates architecture | Common = infrastructure only |

---

## 10. Testing & Verification

### Unit Tests
```java
@Test
void shouldGenerateUniqueRequestIds() {
    RequestIdFilter filter = new RequestIdFilter();
    // Mock filter chain, verify MDC is set
}

@Test
void shouldEncryptAndDecrypt() {
    String original = "secret";
    String encrypted = encryptionUtil.encrypt(original);
    assertThat(encryptionUtil.decrypt(encrypted)).isEqualTo(original);
}
```

### Integration Tests
```java
@Test
void globalExceptionHandlerReturnsCorrectStatus() {
    // Trigger AuthenticationException
    mockMvc.perform(get("/protected"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTH_FAILED"));
}
```

### Manual Verification
- [ ] `/health` returns 200 with system info
- [ ] All error responses have `requestId`
- [ ] Logs contain correlation IDs
- [ ] Encrypted values are not reversible without key

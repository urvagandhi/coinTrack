# Common Module – CoinTrack

> **Domain**: Cross-cutting infrastructure and shared utilities
> **Responsibility**: Configuration, exception handling, logging, response wrappers, security utilities
> **Version**: 2.0.0
> **Last Updated**: 2025-12-17

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Configuration](#4-configuration)
5. [Exception Handling](#5-exception-handling)
6. [Request Filtering](#6-request-filtering)
7. [Health Checks](#7-health-checks)
8. [Response Wrappers](#8-response-wrappers)
9. [Utility Classes](#9-utility-classes)
10. [Logging Standards](#10-logging-standards)
11. [Security Utilities](#11-security-utilities)
12. [Usage Guidelines](#12-usage-guidelines)
13. [Common Pitfalls](#13-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Common module provides foundational infrastructure shared across **all domain modules**. It contains **no business logic**—only cross-cutting concerns that every other module depends on.

### 1.2 Core Responsibilities

| Area | Components | Purpose |
|------|------------|---------|
| **Configuration** | CORS, Encryption, RestTemplate | Application-wide settings |
| **Exception Handling** | GlobalExceptionHandler, DomainException hierarchy | Consistent error responses |
| **Filtering** | RequestIdFilter | Request tracing via MDC |
| **Health Monitoring** | HealthController, HomeController | System status endpoints |
| **Response Wrappers** | ApiResponse, ApiErrorResponse | Standardized API responses |
| **Utilities** | Encryption, Hashing, Logging, Sequences | Reusable helper functions |

### 1.3 System Position

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ALL DOMAIN MODULES                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│   │   User   │ │  Broker  │ │Portfolio │ │  Notes   │ │ Security │    │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│        │            │            │            │            │           │
│        └────────────┴────────────┴────────────┴────────────┘           │
│                                  │                                      │
│                           depends on                                    │
│                                  ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       COMMON MODULE                             │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────┐ ┌────────────────┐   │   │
│  │  │ Exception  │ │  Response  │ │ Config │ │     Util       │   │   │
│  │  │ Handling   │ │  Wrappers  │ │        │ │ (Encrypt/Hash) │   │   │
│  │  └────────────┘ └────────────┘ └────────┘ └────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Request Processing Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      REQUEST PROCESSING PIPELINE                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Incoming HTTP Request                                                   │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────────┐                                                 │
│  │  RequestIdFilter   │  Generate UUID → Store in MDC                   │
│  │  (Correlation ID)  │  [requestId=550e8400-e29b-...]                  │
│  └────────────────────┘                                                 │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────────┐                                                 │
│  │    JwtFilter       │  Validate Bearer token                          │
│  │  (Security Module) │  Extract userId → Store in MDC                  │
│  └────────────────────┘                                                 │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────────┐                                                 │
│  │    Controller      │  Handle business request                        │
│  │    → Service       │                                                  │
│  │    → Repository    │                                                  │
│  └────────────────────┘                                                 │
│           │                                                              │
│    ┌──────┴──────┐                                                      │
│    │             │                                                       │
│    ▼             ▼                                                       │
│ SUCCESS       EXCEPTION                                                  │
│    │             │                                                       │
│    ▼             ▼                                                       │
│ ┌────────┐  ┌────────────────────┐                                      │
│ │ApiResp │  │GlobalException-    │                                      │
│ │  onse  │  │Handler             │                                      │
│ └────────┘  └────────────────────┘                                      │
│    │             │                                                       │
│    └──────┬──────┘                                                      │
│           ▼                                                              │
│  ┌────────────────────┐                                                 │
│  │    JSON Response   │  Includes requestId from MDC                    │
│  └────────────────────┘                                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
common/
├── README.md                              # This file
│
├── config/                                # Application Configuration (4 files)
│   ├── CorsConfig.java                    # CORS policy for frontend origins
│   ├── EncryptionConfig.java              # AES encryption beans
│   ├── RestTemplateConfig.java            # HTTP client with timeouts
│   └── package-info.java                  # Package documentation
│
├── exception/                             # Exception Handling (6 files)
│   ├── DomainException.java               # Base exception class
│   ├── AuthenticationException.java       # 401 Unauthorized
│   ├── AuthorizationException.java        # 403 Forbidden
│   ├── ValidationException.java           # 400 Bad Request
│   ├── ExternalServiceException.java      # 502 Bad Gateway
│   └── GlobalExceptionHandler.java        # @RestControllerAdvice (5.5KB)
│
├── filter/                                # Request Filters (1 file)
│   └── RequestIdFilter.java               # MDC correlation ID generation
│
├── health/                                # Health Monitoring (2 files)
│   ├── HealthController.java              # /api/health endpoint (7.4KB)
│   └── HomeController.java                # Root redirect
│
├── response/                              # Response DTOs (2 files + subdirs)
│   ├── ApiResponse.java                   # Standard success wrapper
│   ├── ApiErrorResponse.java              # Standard error wrapper
│   │
│   ├── user/                              # Shared User DTOs (4 files)
│   │   ├── UserDTO.java                   # User response DTO
│   │   ├── RegisterUserDTO.java           # Registration request
│   │   ├── UpdateUserDTO.java             # Update request
│   │   └── PasswordChangeDTO.java         # Password change request
│   │
│   ├── zerodha/                           # Zerodha-specific DTOs
│   ├── angelone/                          # Angel One-specific DTOs
│   └── upstox/                            # Upstox-specific DTOs
│
└── util/                                  # Utility Classes (7 files)
    ├── LoggingConstants.java              # Centralized log message patterns
    ├── EncryptionUtil.java                # AES-256 encryption (5.9KB)
    ├── HashUtil.java                      # SHA-256 hashing
    ├── FnoUtils.java                      # F&O symbol parsing (4.7KB)
    ├── DatabaseSequence.java              # MongoDB sequence entity
    ├── SequenceGeneratorService.java      # Auto-increment ID generator
    └── NotificationService.java           # Notification interface
```

---

## 4. Configuration

### 4.1 CorsConfig

**Location**: `config/CorsConfig.java`
**Size**: ~3.2KB

Configures Cross-Origin Resource Sharing for frontend integration.

**Allowed Origins**:
- `http://localhost:3000` (Development)
- `https://cointrack.app` (Production)

**Configuration**:
```java
@Bean
public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:3000"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    // ...
}
```

### 4.2 EncryptionConfig

**Location**: `config/EncryptionConfig.java`
**Size**: ~1.3KB

Provides beans for AES encryption.

**Environment Variables**:
| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | 32-char AES-256 key |
| `ENCRYPTION_SALT` | Yes | Salt for key derivation |

### 4.3 RestTemplateConfig

**Location**: `config/RestTemplateConfig.java`
**Size**: ~0.9KB

Configures HTTP client for external API calls.

**Timeouts**:
- Connection timeout: 5 seconds
- Read timeout: 30 seconds

---

## 5. Exception Handling

### 5.1 Exception Hierarchy

```
java.lang.RuntimeException
    └── DomainException (base)
            │
            ├── AuthenticationException  → HTTP 401 Unauthorized
            │       └── Error Code: AUTH_FAILED
            │
            ├── AuthorizationException   → HTTP 403 Forbidden
            │       └── Error Code: ACCESS_DENIED
            │
            ├── ValidationException      → HTTP 400 Bad Request
            │       └── Error Code: VALIDATION_FAILED
            │
            └── ExternalServiceException → HTTP 502 Bad Gateway
                    └── Error Code: EXTERNAL_SERVICE_FAILED
```

### 5.2 DomainException (Base Class)

**Location**: `exception/DomainException.java`
**Size**: ~1.2KB

```java
public class DomainException extends RuntimeException {
    private final int httpStatus;
    private final String errorCode;

    public DomainException(String message, int httpStatus, String errorCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.errorCode = errorCode;
    }
}
```

### 5.3 GlobalExceptionHandler

**Location**: `exception/GlobalExceptionHandler.java`
**Size**: ~5.5KB
**Annotation**: `@RestControllerAdvice`

Converts exceptions into standardized JSON error responses.

**Handler Methods**:

| Exception Type | HTTP Status | Error Code | Handler Method |
|----------------|-------------|------------|----------------|
| `DomainException` | From exception | From exception | `handleDomainException` |
| `AuthenticationException` | 401 | `AUTH_FAILED` | `handleAuthenticationException` |
| `AuthorizationException` | 403 | `ACCESS_DENIED` | `handleAuthorizationException` |
| `ExternalServiceException` | 502 | `EXTERNAL_SERVICE_FAILED` | `handleExternalServiceException` |
| `BrokerException` | 503 | `BROKER_ERROR` | `handleBrokerException` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_FAILED` | `handleValidationExceptions` |
| `RuntimeException` (catch-all) | 500 | N/A | `handleRuntimeException` |

**Example Error Response**:
```json
{
  "success": false,
  "status": 401,
  "code": "AUTH_FAILED",
  "message": "Invalid credentials",
  "timestamp": "2025-12-17T10:30:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 6. Request Filtering

### 6.1 RequestIdFilter

**Location**: `filter/RequestIdFilter.java`
**Size**: ~2.6KB
**Order**: `Ordered.HIGHEST_PRECEDENCE` (executes first)

**Purpose**: Generate unique correlation ID for every request for log tracing.

**Mechanism**:
1. Generate UUID for incoming request
2. Store in MDC (Mapped Diagnostic Context) as `requestId`
3. Include in all log messages automatically
4. Return to client in response headers

**MDC Keys Set**:
| Key | Value | Purpose |
|-----|-------|---------|
| `requestId` | UUID | Trace requests across logs |
| `userId` | From JWT | Identify user in logs |

**Log Output Example**:
```
2025-12-17 10:30:00 [requestId=550e8400-e29b-41d4-a716-446655440000] INFO  c.u.m.c.user.service.UserService - [User] Login successful for user: john
```

---

## 7. Health Checks

### 7.1 HealthController

**Location**: `health/HealthController.java`
**Size**: ~7.4KB
**Base Path**: `/api`

Provides comprehensive health monitoring for deployment platforms (Render, AWS, etc.).

**Endpoints**:

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/api/health` | GET | Full health check | Detailed status with DB, JVM, uptime |
| `/api/health/ping` | GET | Simple ping | Minimal "UP" response |

**Full Health Response Example**:
```json
{
  "service": "coinTrack",
  "version": "1.0.0",
  "status": "UP",
  "timestamp": "2025-12-17T10:30:00Z",
  "uptime": 86400000,
  "checks": {
    "database": {
      "status": "UP",
      "database": "cointrack",
      "responseTime": "5ms",
      "collections": "accessible"
    },
    "system": {
      "jvm": {
        "version": "17.0.1",
        "vendor": "Eclipse Adoptium"
      },
      "memory": {
        "total": "512 MB",
        "used": "256 MB",
        "free": "256 MB",
        "usage": "50%"
      },
      "processors": 4
    },
    "application": {
      "startTime": "2025-12-16T10:30:00",
      "uptime": "1d 00h 00m",
      "environment": "production"
    }
  }
}
```

**Status Codes**:
- `200 OK` - All systems healthy
- `503 Service Unavailable` - Critical component down (e.g., database)

### 7.2 HomeController

**Location**: `health/HomeController.java`
**Size**: ~0.3KB

Simple redirect from root `/` to health endpoint.

---

## 8. Response Wrappers

### 8.1 ApiResponse

**Location**: `response/ApiResponse.java`
**Size**: ~2.5KB

Standard wrapper for successful API responses.

```java
public class ApiResponse<T> {
    private boolean success = true;
    private int status;
    private String message;
    private T data;
    private String timestamp;
    private String requestId;  // From MDC
}
```

**Usage**:
```java
return ResponseEntity.ok(
    ApiResponse.success(userDTO, "User created successfully")
);
```

**JSON Output**:
```json
{
  "success": true,
  "status": 200,
  "message": "User created successfully",
  "data": { ... },
  "timestamp": "2025-12-17T10:30:00Z",
  "requestId": "550e8400-e29b-..."
}
```

### 8.2 ApiErrorResponse

**Location**: `response/ApiErrorResponse.java`
**Size**: ~2KB

Standard wrapper for error responses.

```java
public class ApiErrorResponse {
    private boolean success = false;
    private int status;
    private String code;      // Error code like "AUTH_FAILED"
    private String message;
    private String timestamp;
    private String requestId;
}
```

### 8.3 User DTOs

**Location**: `response/user/`

| DTO | Size | Purpose |
|-----|------|---------|
| `UserDTO.java` | 4.8KB | User response (no password) |
| `RegisterUserDTO.java` | 4.2KB | Registration request with validation |
| `UpdateUserDTO.java` | 3KB | Profile update request |
| `PasswordChangeDTO.java` | 2.5KB | Password change request |

---

## 9. Utility Classes

### 9.1 LoggingConstants

**Location**: `util/LoggingConstants.java`
**Size**: ~4.5KB

Centralized log message patterns for consistency.

**Categories**:

| Category | Example Constant | Pattern |
|----------|------------------|---------|
| **Authentication** | `AUTH_LOGIN_SUCCESS` | `[Auth] Login successful for user: {}` |
| **User Operations** | `USER_CREATED` | `[User] Created user: {}` |
| **Broker Operations** | `BROKER_CONNECT_SUCCESS` | `[Broker] Connected successfully to {} - user: {}` |
| **Portfolio Sync** | `SYNC_COMPLETED` | `[Sync] Portfolio sync completed - holdings: {}, positions: {}` |
| **Request Lifecycle** | `REQUEST_COMPLETED` | `[Request] {} {} completed in {}ms` |

**MDC Keys**:
```java
public static final String MDC_REQUEST_ID = "requestId";
public static final String MDC_USER_ID = "userId";
public static final String MDC_BROKER = "broker";
```

**Usage**:
```java
import static com.urva.myfinance.coinTrack.common.util.LoggingConstants.*;

logger.info(AUTH_LOGIN_SUCCESS, username);
logger.info(SYNC_COMPLETED, userId, holdingsCount, positionsCount);
```

### 9.2 EncryptionUtil

**Location**: `util/EncryptionUtil.java`
**Size**: ~5.9KB

AES-256 encryption for sensitive data (API secrets).

**Methods**:
```java
// Encrypt plaintext
String encrypted = encryptionUtil.encrypt("my-api-secret");

// Decrypt ciphertext
String decrypted = encryptionUtil.decrypt(encrypted);
```

**Configuration**:
- Algorithm: AES-256-CBC
- Key derivation: PBKDF2WithHmacSHA256
- IV: Random per encryption

### 9.3 HashUtil

**Location**: `util/HashUtil.java`
**Size**: ~1.2KB

SHA-256 hashing for checksums (e.g., Zerodha login flow).

**Methods**:
```java
// Generate SHA-256 hash
String checksum = HashUtil.sha256(apiKey + requestToken + apiSecret);
```

### 9.4 FnoUtils

**Location**: `util/FnoUtils.java`
**Size**: ~4.7KB

Utilities for parsing F&O (Futures & Options) trading symbols.

**Capabilities**:
- Parse expiry date from symbol
- Extract strike price
- Identify option type (CE/PE)
- Determine if symbol is futures or options

**Example**:
```java
FnoUtils.getExpiryDate("NIFTY23DEC21500CE");  // 2023-12-21
FnoUtils.getStrikePrice("NIFTY23DEC21500CE"); // 21500
FnoUtils.getOptionType("NIFTY23DEC21500CE");  // "CE"
FnoUtils.isFutures("NIFTY23DECFUT");          // true
```

### 9.5 SequenceGeneratorService

**Location**: `util/SequenceGeneratorService.java`
**Size**: ~1.3KB

MongoDB auto-increment ID generator.

**Usage**:
```java
long nextId = sequenceGenerator.generateSequence("notes_sequence");
```

### 9.6 DatabaseSequence

**Location**: `util/DatabaseSequence.java`
**Size**: ~0.6KB

MongoDB entity for storing sequence counters.

### 9.7 NotificationService

**Location**: `util/NotificationService.java`
**Size**: ~0.3KB

Interface for notification sending (email, SMS - placeholder).

---

## 10. Logging Standards

### 10.1 Log Format

All logs automatically include MDC context:
```
TIMESTAMP [requestId=UUID] LEVEL LOGGER - [Context] Message
```

**Example**:
```
2025-12-17 10:30:00 [requestId=550e8400-e29b-41d4] INFO  c.u.m.c.broker.service.ZerodhaBrokerService - [Broker] Connected successfully to ZERODHA - user: user123
```

### 10.2 Log Levels

| Level | When to Use |
|-------|-------------|
| `ERROR` | Unrecoverable errors, exceptions |
| `WARN` | Recoverable issues, deprecations |
| `INFO` | Key business events (login, sync, etc.) |
| `DEBUG` | Detailed flow for troubleshooting |
| `TRACE` | Very detailed (raw API responses) |

### 10.3 What NOT to Log

| Never Log | Why |
|-----------|-----|
| Passwords | Security |
| API Secrets | Security |
| Access Tokens | Security |
| Full Credit Card Numbers | PCI Compliance |
| Raw Request/Response Bodies (production) | Performance + Security |

---

## 11. Security Utilities

### 11.1 Encryption Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     SECRET ENCRYPTION FLOW                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Input                                                              │
│  (API Secret)                                                            │
│       │                                                                  │
│       ▼                                                                  │
│  ┌────────────────┐                                                     │
│  │ EncryptionUtil │  AES-256 + Random IV                                │
│  │   .encrypt()   │                                                      │
│  └────────────────┘                                                     │
│       │                                                                  │
│       ▼                                                                  │
│  Encrypted String                                                        │
│  (Base64 encoded)                                                        │
│       │                                                                  │
│       ▼                                                                  │
│  ┌────────────────┐                                                     │
│  │   MongoDB      │  Stored in broker_accounts collection               │
│  └────────────────┘                                                     │
│       │                                                                  │
│       ▼ (At API call time)                                               │
│  ┌────────────────┐                                                     │
│  │ EncryptionUtil │  Decrypt just-in-time                               │
│  │   .decrypt()   │                                                      │
│  └────────────────┘                                                     │
│       │                                                                  │
│       ▼                                                                  │
│  Plaintext Secret                                                        │
│  (Used in Zerodha API call)                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Checksum Calculation

Used for Zerodha token exchange:
```java
String checksum = HashUtil.sha256(apiKey + requestToken + apiSecret);
```

---

## 12. Usage Guidelines

### 12.1 Throwing Exceptions

**Always** throw domain exceptions, never raw `RuntimeException`:

```java
// ❌ BAD
throw new RuntimeException("User not found");

// ✅ GOOD
throw new AuthenticationException("User not found");

// ✅ GOOD (with custom HTTP status)
throw new DomainException("Invalid data", HttpStatus.BAD_REQUEST.value(), "INVALID_DATA");
```

### 12.2 Using Log Constants

```java
import static com.urva.myfinance.coinTrack.common.util.LoggingConstants.*;

// ❌ BAD - Inconsistent format
logger.info("User logged in: " + username);

// ✅ GOOD - Consistent, structured
logger.info(AUTH_LOGIN_SUCCESS, username);
```

### 12.3 Wrapping Responses

```java
// Success response
return ResponseEntity.ok(
    ApiResponse.success(data, "Operation successful")
);

// The GlobalExceptionHandler handles errors automatically
```

---

## 13. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Throwing `RuntimeException` | Bypasses standard error codes | Always throw `DomainException` subclasses |
| Logging Secrets | Security breach | Never log raw API keys/secrets |
| Business Logic in Common | Circular dependencies | Keep `common` stateless and logic-free |
| Hardcoding Configurations | Environment drift | Use `@Value` or `AppConfig` beans |
| Ignoring RequestId | Hard to trace issues | Always include `requestId` in responses |
| Inconsistent Log Format | Hard to parse logs | Use `LoggingConstants` patterns |
| Skipping Encryption | Security violation | Always use `EncryptionUtil` for secrets |

---

## Appendix A: File Size Reference

| File | Size | Lines | Notes |
|------|------|-------|-------|
| HealthController.java | 7.4KB | 206 | Full system health monitoring |
| EncryptionUtil.java | 5.9KB | ~180 | AES-256 implementation |
| GlobalExceptionHandler.java | 5.5KB | 134 | All exception handling |
| UserDTO.java | 4.8KB | ~120 | User response DTO |
| FnoUtils.java | 4.7KB | ~140 | F&O symbol parsing |
| LoggingConstants.java | 4.5KB | 70 | All log message patterns |

---

## Appendix B: Related Documentation

- [Zerodha Master Integration Guide](../../docs/zerodha/Zerodha_Master_Integration_Guide.md)
- [Broker Module README](../broker/README.md)
- [Security Module README](../security/README.md)

---

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with accurate structure |
| 1.0.0 | 2025-12-14 | Initial documentation |

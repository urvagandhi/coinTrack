# Security Module – CoinTrack

> **Domain**: Authentication, authorization, and access control
> **Responsibility**: Gatekeeper ensuring identity verification (JWT) and protecting resources
> **Version**: 2.0.0
> **Last Updated**: 2025-12-17

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Configuration](#4-configuration)
5. [JWT Service](#5-jwt-service)
6. [JWT Filter](#6-jwt-filter)
7. [User Details Service](#7-user-details-service)
8. [User Principal Model](#8-user-principal-model)
9. [TOTP Encryption](#9-totp-encryption)
10. [Authentication Flow](#10-authentication-flow)
11. [Authorization Flow](#11-authorization-flow)
12. [Temporary Tokens](#12-temporary-tokens)
13. [Security Checklist](#13-security-checklist)
14. [Environment Variables](#14-environment-variables)
15. [Common Pitfalls](#15-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The Security module guards every API endpoint in CoinTrack. It employs a **stateless JWT architecture** to validate incoming requests, ensuring only authenticated users can access their financial data.

### 1.2 Core Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **JwtFilter** | Intercepts requests, extracts Bearer token |
| **JWTService** | Token generation, validation, claim extraction |
| **SecurityConfig** | Spring Security filter chain, endpoint permissions |
| **CustomerUserDetailService** | Load user from database |
| **UserPrincipal** | Adapter between User entity and Spring Security |
| **TotpEncryptionUtil** | AES-256-GCM encryption for TOTP secrets |

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| **Stateless Auth** | No server-side sessions required |
| **HMAC-SHA256** | Industry-standard JWT signing |
| **TOTP Support** | Time-based One-Time Password for 2FA |
| **Temp Tokens** | Special tokens for TOTP setup/verification |
| **AES-GCM Encryption** | TOTP secrets encrypted at rest |
| **MDC Integration** | User ID added to logging context |

### 1.4 System Position

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        INCOMING HTTP REQUEST                             │
│                    Authorization: Bearer eyJ...                          │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SECURITY MODULE                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  JwtFilter (OncePerRequestFilter)                               │   │
│  │  └── Extract token from "Authorization: Bearer <token>"        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  JWTService                                                     │   │
│  │  ├── extractUsername(token)                                    │   │
│  │  ├── validateToken(token, userDetails)                         │   │
│  │  └── isTokenExpired(token)                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  CustomerUserDetailService                                      │   │
│  │  └── loadUserByUsername() → UserPrincipal                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  SecurityContextHolder                                          │   │
│  │  └── Set authenticated principal                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Authenticated (Principal)
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN CONTROLLERS                                │
│              (user, broker, portfolio, notes)                            │
│              principal.getName() → "john"                                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Spring Security Filter Chain

```
┌────────────────────────────────────────────────────────────────────────┐
│                    REQUEST PROCESSING ORDER                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. CORS Filter (handled by Spring)                                   │
│           │                                                            │
│           ▼                                                            │
│  2. JwtFilter (our custom filter)                                     │
│     ├── If token present: Validate & set SecurityContext             │
│     └── If no token: Continue (let SecurityConfig decide)            │
│           │                                                            │
│           ▼                                                            │
│  3. UsernamePasswordAuthenticationFilter (Spring's)                   │
│           │                                                            │
│           ▼                                                            │
│  4. AuthorizationFilter (Spring's)                                    │
│     └── SecurityConfig.authorizeHttpRequests() rules                  │
│           │                                                            │
│           ▼                                                            │
│  5. Controller                                                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
security/
├── README.md                              # This file
│
├── config/                                # Spring Security Configuration (1 file)
│   └── SecurityConfig.java               # Filter chain, endpoint permissions
│       └── 137 lines, 9KB
│
├── filter/                                # Request Filters (1 file)
│   └── JwtFilter.java                     # JWT token extraction & validation
│       └── 128 lines, 5.8KB
│
├── model/                                 # Security Models (1 file)
│   └── UserPrincipal.java                 # UserDetails adapter
│       └── 54 lines, 1.2KB
│
├── service/                               # Security Services (2 files)
│   ├── JWTService.java                    # Token generation & validation
│   │   └── 185 lines, 6.8KB
│   └── CustomerUserDetailService.java    # User lookup for Spring Security
│       └── 36 lines, 1.4KB
│
└── util/                                  # Security Utilities (1 file)
    └── TotpEncryptionUtil.java           # AES-256-GCM for TOTP secrets
        └── 88 lines, 3.3KB

Total: 6 files, ~628 lines, ~27.5KB
```

---

## 4. Configuration

### 4.1 SecurityConfig

**Location**: `config/SecurityConfig.java`
**Size**: 137 lines, 9KB

**Beans Provided**:

| Bean | Purpose |
|------|---------|
| `SecurityFilterChain` | Defines endpoint permissions & filter order |
| `AuthenticationManager` | Manages authentication process |
| `AuthenticationProvider` | DaoAuthenticationProvider with BCrypt |
| `PasswordEncoder` | BCryptPasswordEncoder for passwords |

**Endpoint Permissions**:

```java
http.authorizeHttpRequests(auth -> auth
    // Public endpoints (no auth required)
    .requestMatchers("/", "/api/health/**").permitAll()
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/broker/*/callback").permitAll()
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

    // Protected endpoints (JWT required)
    .requestMatchers("/api/**").authenticated()

    // Deny all others
    .anyRequest().denyAll()
);
```

**Security Features**:

| Feature | Setting | Reason |
|---------|---------|--------|
| CSRF | Disabled | Stateless API |
| Sessions | Stateless | JWT-based auth |
| CORS | Configured | Frontend access |
| Entry Point | 401 Unauthorized | Access violations |

### 4.2 Public vs Protected Endpoints

**Public (No Authentication)**:
| Pattern | Description |
|---------|-------------|
| `/` | Root redirect |
| `/api/health/**` | Health checks |
| `/api/auth/**` | Login, register, TOTP verify |
| `/api/broker/*/callback` | OAuth callbacks |
| `OPTIONS /**` | CORS preflight |

**Protected (JWT Required)**:
| Pattern | Description |
|---------|-------------|
| `/api/portfolio/**` | Portfolio data |
| `/api/broker/**` (non-callback) | Broker management |
| `/api/notes/**` | User notes |
| `/api/user/**` | User profile |

---

## 5. JWT Service

### 5.1 JWTService

**Location**: `service/JWTService.java`
**Size**: 185 lines, 6.8KB

**Token Configuration**:

| Setting | Value | Notes |
|---------|-------|-------|
| Algorithm | HMAC-SHA256 | Via jjwt library |
| Expiry | 30 minutes | Standard token |
| Temp Expiry | 15 minutes | Registration tokens |
| Secret | From `${jwt.secret}` | Base64 encoded |

**Methods**:

| Method | Purpose | Returns |
|--------|---------|---------|
| `generateToken(Authentication)` | Create JWT for authenticated user | JWT string |
| `extractUsername(token)` | Get subject claim | Username string |
| `validateToken(token, userDetails)` | Verify token for user | boolean |
| `isTokenExpired(token)` | Check expiration | boolean |
| `generateTempToken(user, purpose, mins)` | Create purpose-specific temp token | JWT string |
| `generateTempToken(username, purpose)` | Create temp token (no user) | JWT string |
| `extractPurpose(token)` | Get custom "purpose" claim | String |
| `isValidTempToken(token, purpose)` | Validate temp token | boolean |

### 5.2 Token Structure

**Standard JWT**:
```json
{
  "sub": "john_doe",           // Username
  "iat": 1702800000,           // Issued at (epoch)
  "exp": 1702801800            // Expiry (30 min later)
}
```

**Temporary Token** (for TOTP):
```json
{
  "sub": "john_doe",
  "purpose": "TOTP_SETUP",     // TOTP_LOGIN, TOTP_SETUP, TOTP_RESET
  "userId": "user_12345",
  "iat": 1702800000,
  "exp": 1702800900             // 15 min expiry
}
```

---

## 6. JWT Filter

### 6.1 JwtFilter

**Location**: `filter/JwtFilter.java`
**Size**: 128 lines, 5.8KB
**Extends**: `OncePerRequestFilter`

**Design Decisions**:
- Does NOT skip any paths (SecurityConfig handles permitAll)
- Gracefully handles missing tokens (just doesn't set auth context)
- Adds `userId` to MDC for request-scoped logging

**Filter Logic**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                       JWT FILTER FLOW                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. Extract "Authorization" header                                    │
│     └── No header? → Continue chain (SecurityConfig decides)         │
│                                                                        │
│  2. Does header start with "Bearer "?                                 │
│     └── No? → Continue chain                                          │
│                                                                        │
│  3. Extract token (substring after "Bearer ")                         │
│                                                                        │
│  4. Extract username from token                                       │
│     └── Failed? → Log warning, continue chain                         │
│                                                                        │
│  5. Is SecurityContext empty? (not already authenticated)            │
│     └── No? → Skip (already authenticated)                            │
│                                                                        │
│  6. Load UserDetails from database                                    │
│     └── Not found? → Log warning, clear context                       │
│                                                                        │
│  7. Validate token against UserDetails                                │
│     ├── Valid → Set SecurityContext with authentication              │
│     └── Invalid → Log warning, clear context                          │
│                                                                        │
│  8. Add userId to MDC for logging                                     │
│                                                                        │
│  9. Continue filter chain                                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Code Snippet**:
```java
if (authHeader != null && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
    username = jwtService.extractUsername(token);
    MDC.put(LoggingConstants.MDC_USER_ID, username);

    if (jwtService.validateToken(token, userDetails)) {
        UsernamePasswordAuthenticationToken authToken =
            new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
}
```

---

## 7. User Details Service

### 7.1 CustomerUserDetailService

**Location**: `service/CustomerUserDetailService.java`
**Size**: 36 lines, 1.4KB
**Implements**: `UserDetailsService`

**Purpose**: Bridge between Spring Security and our User entity.

**Flow**:
```
Spring Security
      │
      ▼ loadUserByUsername("john")
┌─────────────────────────────────────┐
│  CustomerUserDetailService          │
│  └── userRepository.findByUsername()│
└─────────────────────────────────────┘
      │
      ▼ User entity
┌─────────────────────────────────────┐
│  new UserPrincipal(user)            │
└─────────────────────────────────────┘
      │
      ▼ UserDetails (for Spring Security)
```

---

## 8. User Principal Model

### 8.1 UserPrincipal

**Location**: `model/UserPrincipal.java`
**Size**: 54 lines, 1.2KB
**Implements**: `UserDetails`

**Purpose**: Adapter that wraps our `User` entity to implement Spring Security's `UserDetails` interface.

**Implemented Methods**:

| Method | Returns | Notes |
|--------|---------|-------|
| `getUsername()` | `user.getUsername()` | From User entity |
| `getPassword()` | `user.getPassword()` | Hashed password |
| `getAuthorities()` | `[ROLE_USER]` | Single role |
| `isAccountNonExpired()` | `true` | Always enabled |
| `isAccountNonLocked()` | `true` | Always enabled |
| `isCredentialsNonExpired()` | `true` | Always enabled |
| `isEnabled()` | `true` | Always enabled |

---

## 9. TOTP Encryption

### 9.1 TotpEncryptionUtil

**Location**: `util/TotpEncryptionUtil.java`
**Size**: 88 lines, 3.3KB

**Purpose**: Encrypt TOTP secrets before storing in database.

**Algorithm Details**:

| Setting | Value |
|---------|-------|
| Algorithm | AES-256-GCM |
| Tag Length | 128 bits |
| IV Length | 12 bytes |
| Key Source | `${totp.encryption-key}` (64 hex chars = 32 bytes) |

**Storage Format**:
```
Base64( IV [12 bytes] + Ciphertext + AuthTag )
```

**Methods**:

| Method | Input | Output |
|--------|-------|--------|
| `encrypt(plaintext)` | Raw TOTP secret | Base64(IV + Ciphertext) |
| `decrypt(encrypted)` | Base64 string | Original TOTP secret |

**Usage**:
```java
// Encrypt before storing
String encrypted = totpEncryptionUtil.encrypt(totpSecret);
user.setTotpSecret(encrypted);

// Decrypt when validating
String secret = totpEncryptionUtil.decrypt(user.getTotpSecret());
boolean valid = totpVerify(secret, userInputCode);
```

---

## 10. Authentication Flow

### 10.1 Login Flow (with TOTP)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. POST /api/auth/login                                               │
│     Body: { username, password }                                       │
│           │                                                             │
│           ▼                                                             │
│     ┌─────────────────────────────────┐                                │
│     │ Verify password (BCrypt)        │                                │
│     │ Check TOTP enabled              │                                │
│     └─────────────────────────────────┘                                │
│           │                                                             │
│     ┌─────┴─────┐                                                      │
│     │           │                                                       │
│     ▼           ▼                                                       │
│  TOTP OFF    TOTP ON                                                   │
│     │           │                                                       │
│     ▼           ▼                                                       │
│  Return     Return tempToken                                           │
│  JWT        { requiresTotp: true,                                      │
│              tempToken: "eyJ..." }                                     │
│                 │                                                       │
│                 ▼                                                       │
│  2. POST /api/auth/verify-totp                                         │
│     Body: { tempToken, totpCode }                                      │
│           │                                                             │
│           ▼                                                             │
│     ┌─────────────────────────────────┐                                │
│     │ Validate tempToken purpose      │                                │
│     │ Verify TOTP code                │                                │
│     └─────────────────────────────────┘                                │
│           │                                                             │
│           ▼                                                             │
│     Return JWT (full access)                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Authorization Flow

### 11.1 Accessing Protected Resources

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AUTHORIZATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. GET /api/portfolio/summary                                         │
│     Header: Authorization: Bearer eyJhbGc...                           │
│           │                                                             │
│           ▼                                                             │
│     ┌─────────────────────────────────────────────────────────────┐   │
│     │ JwtFilter                                                   │   │
│     │ ├── Extract token from header                               │   │
│     │ ├── jwtService.extractUsername("eyJ...") → "john"           │   │
│     │ ├── customerUserDetailService.loadUser("john")              │   │
│     │ ├── jwtService.validateToken() → true                       │   │
│     │ └── SecurityContext.setAuthentication(john)                 │   │
│     └─────────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│     ┌─────────────────────────────────────────────────────────────┐   │
│     │ PortfolioController                                         │   │
│     │ └── principal.getName() → "john"                            │   │
│     │     portfolioService.getSummary(userId) → data for john     │   │
│     └─────────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│     Return portfolio data (only john's data)                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Temporary Tokens

### 12.1 Purpose-Specific Tokens

Temporary tokens are used for multi-step authentication flows.

**Token Purposes**:

| Purpose | Use Case | Expiry |
|---------|----------|--------|
| `TOTP_LOGIN` | Verify TOTP during login | 5 min |
| `TOTP_SETUP` | Initial TOTP configuration | 15 min |
| `TOTP_RESET` | TOTP secret reset | 15 min |

**Token Claims**:
```json
{
  "sub": "username",
  "purpose": "TOTP_LOGIN",
  "userId": "user_12345",
  "iat": 1702800000,
  "exp": 1702800300
}
```

**Validation**:
```java
// Check purpose matches expected
boolean isValid = jwtService.isValidTempToken(token, "TOTP_LOGIN");
```

---

## 13. Security Checklist

### 13.1 Authentication Security

| Requirement | Implementation |
|-------------|----------------|
| Password Hashing | BCrypt via Spring Security |
| Session Management | Stateless (JWT) |
| Token Signing | HMAC-SHA256 |
| Token Expiry | 30 minutes |
| 2FA Support | TOTP with encrypted secrets |

### 13.2 Authorization Security

| Requirement | Implementation |
|-------------|----------------|
| Endpoint Protection | SecurityConfig permits/denies |
| User Isolation | userId from JWT, never from request |
| Role-Based Access | `ROLE_USER` via `UserPrincipal` |

### 13.3 Data Protection

| Requirement | Implementation |
|-------------|----------------|
| TOTP Secrets | AES-256-GCM encrypted |
| API Secrets | Separate EncryptionUtil |
| Log Safety | Never log tokens |

---

## 14. Environment Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `jwt.secret` | String | JWT signing key (min 32 chars) | `my-super-secret-jwt-key-32chars` |
| `totp.encryption-key` | Hex | 32-byte AES key (64 hex chars) | `0123456789abcdef...` |

**Generating Secure Values**:

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate TOTP encryption key (64 hex characters)
openssl rand -hex 32
```

---

## 15. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Hardcoding secrets | Total compromise | Use `@Value("${...}")` |
| Logging tokens | Credential leak | Never log Authorization header |
| Weak JWT secret | Brute-force attacks | Min 32 bytes, use SecureRandom |
| Long token expiry | Stolen token risk | Keep expiry ≤ 30 min |
| Missing path in permitAll | Auth bypass | Review SecurityConfig |
| Duplicate path logic | Maintenance issues | Only define in SecurityConfig |
| Not clearing SecurityContext | Auth pollution | Clear on validation failure |
| Storing plain TOTP secrets | Secret exposure | Use TotpEncryptionUtil |

---

## Appendix A: File Size Reference

| File | Size | Lines | Notes |
|------|------|-------|-------|
| SecurityConfig.java | 9KB | 137 | Filter chain, 4 beans |
| JWTService.java | 6.8KB | 185 | Token operations |
| JwtFilter.java | 5.8KB | 128 | Request filter |
| TotpEncryptionUtil.java | 3.3KB | 88 | AES-GCM encryption |
| CustomerUserDetailService.java | 1.4KB | 36 | User lookup |
| UserPrincipal.java | 1.2KB | 54 | UserDetails adapter |

---

## Appendix B: Related Documentation

- [Common Module README](../common/README.md) - EncryptionUtil, logging
- [User Module README](../user/README.md) - User entity, authentication endpoints
- [Broker Module README](../broker/README.md) - OAuth callbacks

---

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with accurate code analysis |
| 1.0.0 | 2025-12-14 | Initial documentation |

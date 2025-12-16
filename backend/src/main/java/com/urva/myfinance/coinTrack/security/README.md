# Security Module – CoinTrack

> **Domain**: Authentication, authorization, and access control
> **Responsibility**: Gatekeeper ensuring verifying identity (JWT) and protecting resources

---

## 1. Overview

### Purpose
The Security module guards the application API. It employs a stateless JWT architecture to validate every incoming request, ensuring only authenticated users can access their financial data.

### System Position
```text
┌─────────────────────────────────────────────────────────────┐
│                     INCOMING REQUEST                        │
26: └─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY MODULE                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │ JwtFilter   │───>│ JWTService  │───>│ SecurityContext │  │
│  └─────────────┘    └─────────────┘    └─────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ Authenticated (Principal)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN CONTROLLERS                       │
│           (user, broker, portfolio, notes)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
security/
├── config/
│   └── SecurityConfig.java           # Spring Security Filter Chain
├── filter/
│   └── JwtFilter.java                # The Guard: Intercepts HTTP requests
├── model/
│   └── UserPrincipal.java            # Maps App User to Spring Security User
└── service/
    ├── JWTService.java               # Token Crypto (HMAC-SHA256)
    ├── CustomerUserDetailService.java # DB Lookup
    └── TotpService.java              # 2FA Utilities
```

---

## 3. Component Responsibilities

### SecurityConfig
**Role**: The Rulebook
*   **Permissions**: Defines which endpoints are public (`/login`, `/register`) vs private.
*   **CORS**: Configures allowed origins (Frontend URL).
*   **CSRF**: Disabled (Stateless API).
*   **Exception Handling**: Returns `401 Unauthorized` for access violations.

### JwtFilter
**Role**: The Bouncer
1.  Intercepts every request.
2.  Checks for `Authorization: Bearer <token>` header.
3.  Validates token signature & expiry via `JWTService`.
4.  If valid, populates the `SecurityContext` with the user's identity.

### JWTService
**Role**: The Key Maker
*   `generateToken(username)`: creating signed tokens upon login.
*   `extractUsername(token)`: reading who is asking.
*   `isTokenValid(token)`: checking signature and ensuring `exp > now`.

---

## 4. Execution Flow

### Authentication (Login)
```
1. POST /login {username, password}
2. UserService verifies password (BCrypt)
3. JWTService.generateToken("username") → "eyJ..."
4. Returns token to client
```

### Authorization (Accessing Resource)
```
1. GET /api/portfolio/summary
   Header: Authorization: Bearer eyJ...

2. JwtFilter intercepts
   -> JWTService.extractUsername() -> "john"
   -> CustomerUserDetailService.loadUser("john")
   -> JWTService.isValid() -> true

3. SecurityContext set to "john"

4. PortfolioController executes
   -> principal.getName() returns "john"
   -> Fetches data ONLY for "john"
```

---

## 5. Security Checklist

### 1. Statelessness
*   We use **No Sessions**. Every request must carry credentials.
*   Benefit: Horizontal scaling (Server A and Server B don't need to sync sessions).

### 2. Secret Management
*   `JWT_SECRET` must be a strong, random 256-bit string.
*   It is injected via environment variables. **Never committed to Git.**

### 3. Public vs Private
*   **Public**: `/register`, `/login`, `/auth/verify-otp`, `/health`
*   **Private**: Everything else (`/api/**`)

---

## 6. Common Pitfalls
| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Hardcoding Secret | Total security compromise | Use `@Value("${JWT_SECRET}")` |
| Logging Tokens | Leakage in logs | Never log the Authorization header |
| Weak Secrets | Brute-force attacks | Use `SecureRandom` to generate keys |
| Long Expiry | Stolen token risk | Keep expiry short (e.g., 24h) |

---

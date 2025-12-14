# Security Module – CoinTrack

> **Domain**: Authentication, authorization, and access control
> **Responsibility**: JWT validation, Spring Security configuration, and user identity management

---

## 1. Overview

### Purpose
The Security module is the **gatekeeper** of CoinTrack. It handles:
- JWT token generation and validation
- Spring Security filter chain configuration
- User principal mapping from JWT to Spring Security context

### Business Problem Solved
A fintech application must:
- Protect all API endpoints from unauthorized access
- Validate user identity on every request
- Provide secure session management without server-side state

### System Position
```text
┌─────────────────────────────────────────────────────────────┐
│                     INCOMING REQUEST                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY MODULE                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ JwtFilter   │───>│ JWTService  │───>│ SecurityContext │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ Authenticated
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
│   └── SecurityConfig.java           # Spring Security configuration
├── filter/
│   └── JwtFilter.java                # JWT authentication filter
├── model/
│   └── UserPrincipal.java            # UserDetails implementation
└── service/
    ├── JWTService.java               # Token generation/validation
    ├── CustomerUserDetailService.java # Load user by username
    └── TotpService.java              # Time-based OTP generation
```

### Why This Structure?
| Folder | Purpose | Spring Security Role |
|--------|---------|---------------------|
| `config/` | Security filter chain | Configuration |
| `filter/` | Request filters | Authentication |
| `model/` | Security principals | Identity |
| `service/` | Token and user services | Business logic |

---

## 3. Component Responsibilities

### SecurityConfig
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // Defines:
    // - Which endpoints are public (login, register, health)
    // - Which require authentication
    // - Filter chain order
    // - CORS and CSRF settings
}
```

**Public Endpoints**:
- `/login`, `/register`, `/verify-otp`
- `/health`, `/api/zerodha/callback`
- Swagger routes (dev only)

### JwtFilter
```java
@Component
public class JwtFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(request, response, chain) {
        1. Extract token from Authorization header
        2. Validate token via JWTService
        3. Load UserDetails via CustomerUserDetailService
        4. Set SecurityContextHolder.getContext().setAuthentication()
        5. Continue filter chain
    }
}
```

### JWTService
| Method | Purpose |
|--------|---------|
| `generateToken(username)` | Create JWT with claims |
| `extractUsername(token)` | Parse username from JWT |
| `isTokenValid(token, userDetails)` | Validate signature and expiry |

### UserPrincipal
Implements `UserDetails`:
```java
public class UserPrincipal implements UserDetails {
    private final User user;

    @Override
    public String getUsername() { return user.getUsername(); }
    @Override
    public Collection<GrantedAuthority> getAuthorities() {
        return Collections.singleton(() -> "ROLE_USER");
    }
}
```

---

## 4. Execution Flow

### Authentication Flow
```
1. Request: POST /api/portfolio/summary
   Header: Authorization: Bearer eyJhbGc...

2. JwtFilter.doFilterInternal()
   └── Extract token from header
   └── jwtService.extractUsername(token) → "john"
   └── customerUserDetailService.loadUserByUsername("john")
   └── jwtService.isTokenValid(token, userDetails) → true
   └── Create UsernamePasswordAuthenticationToken
   └── SecurityContextHolder.getContext().setAuthentication(auth)

3. Controller receives request with authenticated Principal
   └── principal.getName() → "john"
```

### Token Generation Flow (in User Module)
```
1. Login successful
2. JWTService.generateToken(username)
   └── Create claims (sub, exp, iat)
   └── Sign with secret key
   └── Return token string
3. Return token in LoginResponse
```

---

## 5. Diagrams

### Security Filter Chain
```text
┌─────────────────────────────────────────────────────────────┐
│                    Spring Security                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Request ──> CorsFilter ──> RequestIdFilter ──> JwtFilter  │
│                                                    │        │
│                                           ┌────────┴───────┐│
│                                           │ Valid Token?   ││
│                                           └────────┬───────┘│
│                                      ┌─────────────┴───────┐│
│                                      │ Yes            No   ││
│                                      ▼             ▼       ││
│                               ┌──────────┐   ┌──────────┐  ││
│                               │ Set Auth │   │   401    │  ││
│                               │ Context  │   │ Response │  ││
│                               └────┬─────┘   └──────────┘  ││
│                                    ▼                       ││
│                               Controller                    ││
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### JWT Structure
```text
┌───────────────────────────────────────────────────────────┐
│                         JWT                               │
├─────────────────┬─────────────────┬───────────────────────┤
│     Header      │     Payload     │      Signature        │
│  {"alg":"HS256"}│  {"sub":"john", │  HMAC(header.payload, │
│                 │   "exp":...}    │       secret)         │
└─────────────────┴─────────────────┴───────────────────────┘
```

---

## 6. Logging Strategy

### What IS Logged
| Event | Level | Example |
|-------|-------|---------|
| Auth success | `DEBUG` | `User john authenticated successfully` |
| Token expired | `WARN` | `Token expired for request to /api/portfolio` |
| Invalid token | `WARN` | `Invalid JWT signature` |
| Missing token | `DEBUG` | `No token provided for /api/notes` |

### What is NEVER Logged
- JWT token contents
- JWT secret key
- Passwords
- User credentials

---

## 7. Security Considerations

### JWT Secret Management
```java
@Value("${JWT_SECRET}")
private String jwtSecret;
```
- Never hardcode secret
- Minimum 256-bit key
- Rotate periodically

### Token Expiry
- Default: 24 hours
- Consider: Refresh token pattern for production

### CSRF Protection
- Disabled for stateless JWT API
- CORS configured for frontend origin

### Common Mistakes to Avoid
| ❌ Don't | ✅ Do |
|---------|-------|
| Trust token without validation | Always call `isTokenValid()` |
| Store tokens in localStorage | Use httpOnly cookies (frontend) |
| Log JWT tokens | Log only usernames |
| Skip expiry check | Validate `exp` claim |
| Use weak secret | Use 256-bit+ secret |

---

## 8. Extension Guidelines

### Adding Role-Based Access

1. **Add roles to User model**
   ```java
   private List<String> roles; // ["ROLE_USER", "ROLE_ADMIN"]
   ```

2. **Update UserPrincipal**
   ```java
   @Override
   public Collection<GrantedAuthority> getAuthorities() {
       return user.getRoles().stream()
           .map(SimpleGrantedAuthority::new)
           .collect(Collectors.toList());
   }
   ```

3. **Add to SecurityConfig**
   ```java
   .requestMatchers("/admin/**").hasRole("ADMIN")
   ```

### Adding OAuth2 Provider
1. Add Spring Security OAuth2 dependency
2. Configure in SecurityConfig
3. Create OAuth2 success handler

---

## 9. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Not validating token on all requests | Security bypass | JwtFilter on all non-public routes |
| Exposing JWT details in errors | Token theft | Generic error messages |
| Weak secret key | Token forgery | Use `SecureRandom` generated key |
| Missing token expiry | Indefinite access | Always set `exp` claim |
| Bypassing SecurityContext | Inconsistent auth | Always use `Principal` |

---

## 10. Testing & Verification

### Unit Tests
```java
@Test
void shouldGenerateValidToken() {
    String token = jwtService.generateToken("testuser");
    assertThat(jwtService.extractUsername(token)).isEqualTo("testuser");
    assertThat(jwtService.isTokenExpired(token)).isFalse();
}

@Test
void shouldRejectExpiredToken() {
    // Create token with negative expiry
    assertThat(jwtService.isTokenExpired(expiredToken)).isTrue();
}
```

### Integration Tests
```java
@Test
void shouldReturn401WithoutToken() {
    mockMvc.perform(get("/api/portfolio/summary"))
        .andExpect(status().isUnauthorized());
}

@Test
void shouldAllowAccessWithValidToken() {
    mockMvc.perform(get("/api/portfolio/summary")
        .header("Authorization", "Bearer " + validToken))
        .andExpect(status().isOk());
}
```

### Manual Verification
- [ ] Login returns valid JWT
- [ ] Requests without token → 401
- [ ] Requests with expired token → 401
- [ ] Requests with valid token → 200
- [ ] /health accessible without auth

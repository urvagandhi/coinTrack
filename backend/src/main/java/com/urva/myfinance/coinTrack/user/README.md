# User Module – CoinTrack

> **Domain**: User management, authentication, and profile operations
> **Responsibility**: Registration, login, OTP verification, and profile CRUD

---

## 1. Overview

### Purpose
The User module handles all user lifecycle operations. It was refactored from a 618-line monolith (`UserService`) into three focused services following single-responsibility principle.

### Business Problem Solved
Users need to:
- Register with OTP verification
- Login with multiple identifiers (username/email/mobile)
- Manage their profile information
- Change passwords securely

### System Position
```text
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────>│    User      │────>│   Security      │
│  (Auth UI)  │     │   Module     │     │   Module        │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    └──────────────┘
```

---

## 2. Folder Structure

```
user/
├── controller/
│   ├── LoginController.java         # Login, OTP verification
│   └── UserController.java          # Registration, profile CRUD
├── dto/
│   ├── LoginRequest.java            # Login credentials
│   ├── LoginResponse.java           # Token + user info
│   └── VerifyOtpRequest.java        # OTP verification
├── model/
│   └── User.java                    # User entity
├── repository/
│   └── UserRepository.java          # MongoDB access
└── service/
    ├── UserService.java             # Legacy facade (kept for compatibility)
    ├── UserAuthenticationService.java  # Login, OTP handling
    ├── UserRegistrationService.java    # Registration flow
    └── UserProfileService.java         # Profile CRUD
```

### Why This Structure?
| Folder | Purpose | DDD Alignment |
|--------|---------|---------------|
| `controller/` | HTTP endpoints | Application layer |
| `service/` | Business logic (split) | Domain layer |
| `dto/` | Request/response contracts | Application layer |
| `model/` | User entity | Domain model |
| `repository/` | Data access | Infrastructure layer |

---

## 3. Component Responsibilities

### Controllers
| Controller | Endpoints | Purpose |
|------------|-----------|---------|
| `LoginController` | `POST /login`, `POST /verify-otp` | Authentication |
| `UserController` | Registration, profile CRUD | User management |

### Split Services
| Service | Responsibility |
|---------|---------------|
| `UserAuthenticationService` | Login validation, OTP generation/verification, rate limiting |
| `UserRegistrationService` | User creation, pending registration, OTP for new users |
| `UserProfileService` | Get/update/delete user, password changes |
| `UserService` | Legacy facade delegating to new services |

### User Model
```java
@Document(collection = "users")
public class User {
    @Id private String id;
    @Indexed(unique = true) private String username;
    private String name;
    private LocalDate dateOfBirth;
    private String email;
    private String phoneNumber;
    private String password;  // BCrypt hashed
    private LocalDate createdAt;
    private LocalDate updatedAt;
}
```

---

## 4. Execution Flow

### Registration Flow
```
1. POST /register with user data
   └── UserController.registerUser(RegisterUserDTO)
       └── userRegistrationService.initiateRegistration(dto)
           └── Validate unique email/username/phone
           └── Hash password with BCrypt
           └── Store in pendingRegistrations map
           └── Generate OTP
           └── Send OTP via NotificationService
           └── Return "OTP sent" response

2. POST /verify-registration-otp
   └── userRegistrationService.verifyRegistrationOtp(username, otp)
       └── Check pendingRegistrations
       └── Validate OTP
       └── Save user to database
       └── Create default notes
       └── Generate JWT
       └── Return LoginResponse with token
```

### Login Flow
```
1. POST /login with credentials
   └── LoginController.login(LoginRequest)
       └── userAuthenticationService.authenticate(usernameOrEmail, password)
           └── Find user by username/email/phone
           └── Verify BCrypt password
           └── Check if OTP required
           └── If OTP mode: generate and send OTP
           └── Else: generate JWT
           └── Return LoginResponse

2. POST /verify-otp (if OTP mode)
   └── userAuthenticationService.verifyLoginOtp(username, otp)
       └── Validate OTP from in-memory store
       └── Generate JWT
       └── Return LoginResponse with token
```

---

## 5. Diagrams

### Service Split Architecture
```text
┌─────────────────────────────────────────────────────────────┐
│                    USER MODULE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  UserService                        │   │
│  │                (Legacy Facade)                      │   │
│  └───────────┬────────────┬────────────┬───────────────┘   │
│              │            │            │                    │
│              ▼            ▼            ▼                    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │ Authentication│ │ Registration  │ │   Profile     │     │
│  │    Service    │ │   Service     │ │   Service     │     │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤     │
│  │ - Login       │ │ - Register    │ │ - Get user    │     │
│  │ - OTP verify  │ │ - Verify OTP  │ │ - Update user │     │
│  │ - Rate limit  │ │ - Store user  │ │ - Delete user │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### OTP Verification Sequence
```text
Client        Controller        AuthService        Database
   │               │                 │                 |
   ├── login() ───>│                 │                 |
   │               ├── authenticate()│                 |
   │               │                 ├── findUser() -->|
   │               │                 │<---- User ------|
   │               │                 │                 |
   │               │                 ├── verifyPass()  |
   │               │                 ├── sendOTP()     |
   │<-- "OTP Sent"-│                 │                 |
   │               │                 │                 |
   ├── verify() ──>│                 │                 |
   │               ├── verifyOtp() ->│                 |
   │               │                 ├── checkMap()    |
   │               │                 ├── generateJWT() |
   │<-- {token} ---│                 │                 |
```

---

## 6. Logging Strategy

### What IS Logged
| Event | Level | Constant |
|-------|-------|----------|
| Login started | `INFO` | `USER_LOGIN_STARTED` |
| Login successful | `INFO` | `USER_LOGIN_SUCCESSFUL` |
| Login failed | `WARN` | `USER_LOGIN_FAILED` |
| Registration started | `INFO` | `USER_REGISTRATION_STARTED` |
| Registration completed | `INFO` | `USER_REGISTRATION_COMPLETED` |
| Profile updated | `INFO` | `USER_PROFILE_UPDATED` |
| User not found | `WARN` | `USER_NOT_FOUND` |

### What is NEVER Logged
- Passwords (raw or hashed)
- OTP values
- JWT tokens
- Full user objects

---

## 7. Security Considerations

### Password Storage
```java
// BCrypt hashing
String hashed = passwordEncoder.encode(rawPassword);

// Verification
boolean valid = passwordEncoder.matches(rawPassword, storedHash);
```

### OTP Security
- 6-digit numeric codes
- 5-minute expiry
- Rate limiting: max 3 resends per 15 minutes
- Stored in-memory (not persistent)

### Rate Limiting
```java
// In UserAuthenticationService
private final Map<String, Integer> otpResendCounts = new ConcurrentHashMap<>();

public void checkRateLimit(String username) {
    int count = otpResendCounts.getOrDefault(username, 0);
    if (count >= MAX_OTP_RESENDS) {
        throw new AuthenticationException("Rate limit exceeded");
    }
}
```

---

## 8. Extension Guidelines

### Adding a New User Field

1. **Add to User model**
   ```java
   private String newField;
   ```

2. **Add to DTOs**
   ```java
   // RegisterUserDTO, UpdateUserDTO
   private String newField;
   ```

3. **Update services**
   - Registration: Copy field from DTO
   - Profile: Handle in update method

### Adding Social Login

1. **Create SocialLoginService**
2. **Add OAuth2 flow in security module**
3. **Create or link user in UserService**

### Adding Email Verification

1. **Add `emailVerified` field to User**
2. **Create verification token storage**
3. **Add verification endpoint**

---

## 9. Common Pitfalls

| Pitfall | Why It's Bad | Prevention |
|---------|--------------|------------|
| Storing plain passwords | Security breach | Always use BCrypt |
| Logging passwords | Credential exposure | Use LoggingConstants |
| OTP without expiry | Indefinite access | 5-minute TTL |
| No rate limiting | Brute force attacks | Max resend counts |
| Skipping unique checks | Duplicate accounts | Check before save |
| Returning full User object | Data exposure | Return safe DTO only |

---

## 10. Testing & Verification

### Unit Tests
```java
@Test
void shouldHashPasswordOnRegistration() {
    // Register user with plain password
    // Assert stored password is BCrypt hash
}

@Test
void shouldRejectInvalidOtp() {
    // Initiate login
    // Verify with wrong OTP
    // Assert AuthenticationException
}

@Test
void shouldRateLimitOtpResend() {
    // Resend OTP 3 times
    // Fourth request should throw
}
```

### Integration Tests
```java
@Test
void fullRegistrationFlow() {
    // POST /register → 200
    // POST /verify-registration-otp → 200 with token
    // Use token to access protected resource → 200
}

@Test
void loginWithOtpFlow() {
    // POST /login → requiresOtp: true
    // POST /verify-otp → token
}
```

### Manual Verification
- [ ] Register → OTP email received
- [ ] Verify OTP → Login successful
- [ ] Login → JWT returned
- [ ] Update profile → Changes persisted
- [ ] Password change → Old password rejected

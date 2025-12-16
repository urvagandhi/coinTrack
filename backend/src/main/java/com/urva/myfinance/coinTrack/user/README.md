# User Module – CoinTrack

> **Domain**: User management, authentication, and profile operations
> **Responsibility**: Registration, login, OTP verification, and profile CRUD

---

## 1. Overview

### Purpose
The User module handles all user lifecycle operations. It follows the **Single Responsibility Principle**, splitting complex logic into focused services for Authentication, Registration, and Profile management.

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
│   ├── LoginController.java            # Login, OTP verification
│   └── UserController.java             # Registration, Profile CRUD
├── dto/
│   ├── LoginRequest.java               # Login Credentials
│   ├── LoginResponse.java              # Token + User Info
│   └── VerifyOtpRequest.java           # OTP Payload
├── model/
│   └── User.java                       # MongoDB Entity
├── repository/
│   └── UserRepository.java             # Data Access
└── service/
    ├── UserService.java                # Legacy Facade (Deprecated/Compatibility)
    ├── UserAuthenticationService.java  # Login Logic, Rate Limiting
    ├── UserRegistrationService.java    # Registration Flow, Pending Users
    └── UserProfileService.java         # Profile Update, Password Change
```

---

## 3. Component Responsibilities

### Controllers
**`LoginController`**
*   `POST /login`: Initiates login (returns Token or OTP requirement).
*   `POST /verify-otp`: Verifies OTP and issues Token.

**`UserController`**
*   `POST /register`: Starts registration (Sends OTP).
*   `POST /verify-registration-otp`: Completes registration.
*   `GET /me`: Fetches current user profile.
*   `PUT /me`: Updates profile details.

### Services
**`UserAuthenticationService`**
*   Handles Login logic.
*   Manages OTP generation & verification for logins.
*   Enforces Rate Limits on OTP resends.

**`UserRegistrationService`**
*   Handles new user creation.
*   Stores temporary "Pending User" state during OTP check.
*   Ensures unique username/email/phone.

**`UserProfileService`**
*   Orchestrates Profile updates.
*   Handles Password changes (verifying old password first).

---

## 4. Execution Flows

### Registration Flow
```
1. POST /register (User details)
   -> UserRegistrationService.initiateRegistration()
   -> Validates uniqueness
   -> Hashes password (BCrypt)
   -> Generates & Sends OTP
   -> Stores in `pendingRegistrations` Map

2. POST /verify-registration-otp (username, otp)
   -> UserRegistrationService.verifyRegistrationOtp()
   -> Checks Map for pending user
   -> Validates OTP
   -> Saves to MongoDB (`userRepository.save`)
   -> Generates JWT
   -> Returns Success + Token
```

### Login Flow
```
1. POST /login (username, password)
   -> UserAuthenticationService.authenticate()
   -> Finds User
   -> Verifies Password (BCrypt)
   -> [Conditional] If 2FA enabled:
        -> Generate & Send OTP
        -> Return { requiresOtp: true }
   -> [Else]:
        -> Generate JWT
        -> Return { token: "..." }

2. POST /verify-otp (username, otp)
   -> UserAuthenticationService.verifyLoginOtp()
   -> Validates OTP
   -> Generates JWT
   -> Returns { token: "..." }
```

---

## 5. Security Checklist

### 1. Password Storage
*   **Algorithm**: BCrypt
*   **Policy**: Never store plain text. Always hash before saving.

### 2. OTP Security
*   **Expiry**: 5 Minutes.
*   **Storage**: In-Memory (Cleared after verification or expiry).
*   **Rate Limit**: Max 3 resends per 15 minutes to prevent SMS flooding.

### 3. Data Privacy
*   **PII**: Email and Phone are stored.
*   **Exposure**: `UserDTO` excludes sensitive fields (password, internal flags) before creating API responses.

---

## 6. Common Pitfalls
| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Returning Entity directly | Exposes Password Hash | Always map `User` -> `UserDTO` |
| Case Sensitivity | Duplicate Users (John vs john) | Normalize to lowercase before check |
| Infinite OTP Resend | SMS Cost / Spam | STRICT Rate Limiting in Service |

---

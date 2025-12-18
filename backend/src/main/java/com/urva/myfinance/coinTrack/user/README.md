# User Module – CoinTrack

> **Domain**: User management, authentication, TOTP 2FA, and profile operations
> **Responsibility**: Registration, login, TOTP verification, backup codes, and profile CRUD
> **Version**: 2.0.0
> **Last Updated**: 2025-12-17

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Controllers](#4-controllers)
5. [DTOs](#5-dtos)
6. [Models](#6-models)
7. [Repositories](#7-repositories)
8. [Services](#8-services)
9. [Authentication Flows](#9-authentication-flows)
10. [TOTP 2FA System](#10-totp-2fa-system)
11. [Backup Codes](#11-backup-codes)
12. [API Reference](#12-api-reference)
13. [Security](#13-security)
14. [Common Pitfalls](#14-common-pitfalls)

---

## 1. Overview

### 1.1 Purpose

The User module handles all user lifecycle operations including registration, login with TOTP 2FA, profile management, and password changes. It follows the **Single Responsibility Principle**, splitting logic into focused services.

### 1.2 Core Features

| Feature | Description |
|---------|-------------|
| **Registration** | Username/email/phone validation, mandatory TOTP setup |
| **Login** | Password + optional TOTP verification |
| **TOTP 2FA** | Time-based One-Time Password with encrypted secrets |
| **Backup Codes** | 10 recovery codes per user per TOTP version |
| **Profile Management** | Update name, bio, contact details |
| **Password Change** | Verify old password before update |

### 1.3 System Position

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           COINTRACK SYSTEM                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐                                                    │
│  │  Frontend       │                                                    │
│  │  (Auth UI)      │                                                    │
│  └────────┬────────┘                                                    │
│           │ REST API                                                     │
│           ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      USER MODULE                                │   │
│  │  ┌───────────────┬───────────────┬───────────────────────────┐ │   │
│  │  │  Controllers  │   Services    │      TOTP System          │ │   │
│  │  │  (User,       │  (Auth,       │  (Secrets, Codes,         │ │   │
│  │  │   Login,      │   Profile,    │   Backup Codes)           │ │   │
│  │  │   TOTP)       │   TOTP)       │                           │ │   │
│  │  └───────────────┴───────────────┴───────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│           │                     │                                       │
│           ▼                     ▼                                       │
│  ┌─────────────────┐   ┌─────────────────┐                             │
│  │  Security       │   │   MongoDB       │                             │
│  │  Module         │   │   (users,       │                             │
│  │  (JWT, Encrypt) │   │   backup_codes) │                             │
│  └─────────────────┘   └─────────────────┘                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture

### 2.1 Component Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                      USER MODULE LAYERS                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  CONTROLLER LAYER (3 files)                                     │  │
│  │  ├── UserController.java          (14KB, 330 lines, 11 endpoints)│  │
│  │  ├── TotpController.java          (14.8KB, 329 lines, 9 endpoints)│  │
│  │  └── LoginController.java         (2.6KB, 65 lines)             │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  DTO LAYER (5 files)                                            │  │
│  │  ├── LoginRequest.java            (3KB, credentials)            │  │
│  │  ├── LoginResponse.java           (5.9KB, token + user)         │  │
│  │  ├── TotpSetupResponse.java       (QR code + secret)            │  │
│  │  ├── TotpVerifyRequest.java       (TOTP code input)             │  │
│  │  └── VerifyOtpRequest.java        (legacy OTP input)            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  SERVICE LAYER (4 files)                                        │  │
│  │  ├── TotpService.java             (14KB, 361 lines, TOTP logic) │  │
│  │  ├── UserService.java             (15.4KB, main facade)         │  │
│  │  ├── UserAuthenticationService.java (12KB, login logic)         │  │
│  │  └── UserProfileService.java      (4.8KB, profile CRUD)         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  MODEL LAYER (2 files)                                          │  │
│  │  ├── User.java                    (1.6KB, 63 lines)             │  │
│  │  └── BackupCode.java              (1KB, recovery codes)         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                              │                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  REPOSITORY LAYER (2 files)                                     │  │
│  │  ├── UserRepository.java          (user queries)                │  │
│  │  └── BackupCodeRepository.java    (backup code queries)         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
user/
├── README.md                              # This file
│
├── controller/                            # REST Controllers (3 files)
│   ├── UserController.java                # User CRUD, login, registration
│   │   └── 330 lines, 14KB, 11 endpoints
│   ├── TotpController.java                # TOTP setup, verify, reset
│   │   └── 329 lines, 14.8KB, 9 endpoints
│   └── LoginController.java               # Simple login endpoint
│       └── 65 lines, 2.6KB
│
├── dto/                                   # Data Transfer Objects (5 files)
│   ├── LoginRequest.java                  # Login credentials
│   │   └── 3KB, with validation annotations
│   ├── LoginResponse.java                 # Token, user info, TOTP flags
│   │   └── 5.9KB
│   ├── TotpSetupResponse.java             # QR code, secret for setup
│   │   └── 0.4KB
│   ├── TotpVerifyRequest.java             # TOTP code submission
│   │   └── 0.4KB
│   └── VerifyOtpRequest.java              # Legacy OTP verification
│       └── 0.3KB
│
├── model/                                 # MongoDB Entities (2 files)
│   ├── User.java                          # User entity with TOTP fields
│   │   └── 63 lines, 1.6KB, 16 fields
│   └── BackupCode.java                    # Recovery code entity
│       └── 1KB
│
├── repository/                            # Data Access (2 files)
│   ├── UserRepository.java                # User queries
│   │   └── 0.5KB
│   └── BackupCodeRepository.java          # Backup code queries
│       └── 1KB
│
└── service/                               # Business Logic (4 files)
    ├── TotpService.java                   # TOTP setup, verify, reset
    │   └── 361 lines, 14KB, 14 methods
    ├── UserService.java                   # Main user operations facade
    │   └── 15.4KB
    ├── UserAuthenticationService.java    # Login logic
    │   └── 12KB
    └── UserProfileService.java           # Profile updates
        └── 4.8KB

Total: 16 files
```

---

## 4. Controllers

### 4.1 UserController

**Location**: `controller/UserController.java`
**Size**: 14KB, 330 lines
**Base Path**: `/api/users` and `/api/auth`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/auth/login` | POST | Login with username/password |
| `POST /api/auth/register` | POST | Register new user |
| `POST /api/auth/verify-token` | POST | Validate JWT token |
| `GET /api/users/check/{username}` | GET | Check username availability |
| `GET /api/users` | GET | List all users (admin) |
| `GET /api/users/{id}` | GET | Get user by ID |
| `GET /api/users/me` | GET | Get current user profile |
| `PUT /api/users/{id}` | PUT | Update user |
| `PUT /api/users/{id}/password` | PUT | Change password |
| `DELETE /api/users/{id}` | DELETE | Delete user |

### 4.2 TotpController

**Location**: `controller/TotpController.java`
**Size**: 14.8KB, 329 lines
**Base Path**: `/api/auth/totp`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/auth/totp/setup` | GET | Get QR code for TOTP setup |
| `POST /api/auth/totp/verify-setup` | POST | Verify initial TOTP setup |
| `POST /api/auth/totp/verify` | POST | Complete login with TOTP |
| `POST /api/auth/totp/verify-recovery` | POST | Login with backup code |
| `POST /api/auth/totp/reset` | POST | Initiate TOTP reset |
| `POST /api/auth/totp/verify-reset` | POST | Complete TOTP reset |
| `GET /api/auth/totp/status` | GET | Get 2FA status |
| `POST /api/auth/totp/setup-registration` | POST | Setup TOTP during registration |
| `POST /api/auth/totp/verify-registration` | POST | Verify TOTP & complete registration |

### 4.3 LoginController

**Location**: `controller/LoginController.java`
**Size**: 2.6KB
**Base Path**: `/api/auth`

Simple controller for basic login operations.

---

## 5. DTOs

### 5.1 LoginRequest

**Location**: `dto/LoginRequest.java`
**Size**: 3KB

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `identifier` | String | `@NotBlank` | Username, email, or phone |
| `password` | String | `@NotBlank` | User password |

### 5.2 LoginResponse

**Location**: `dto/LoginResponse.java`
**Size**: 5.9KB

| Field | Type | Description |
|-------|------|-------------|
| `token` | String | JWT access token (null if TOTP required) |
| `tempToken` | String | Temporary token for TOTP verification |
| `user` | UserDTO | User information |
| `requiresOtp` | boolean | True if TOTP verification needed |
| `message` | String | Status message |
| `backupCodes` | List\<String\> | Recovery codes (on setup only) |

### 5.3 TotpSetupResponse

**Location**: `dto/TotpSetupResponse.java`

| Field | Type | Description |
|-------|------|-------------|
| `qrCode` | String | Base64 PNG QR code |
| `secret` | String | TOTP secret for manual entry |

### 5.4 TotpVerifyRequest

**Location**: `dto/TotpVerifyRequest.java`

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `code` | String | `@NotBlank` | 6-digit TOTP code |

---

## 6. Models

### 6.1 User Entity

**Location**: `model/User.java`
**Size**: 63 lines, 1.6KB
**Collection**: `users`

**Standard Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | `@Id` | MongoDB ObjectId |
| `username` | String | `@Indexed(unique=true)` | Login identifier |
| `name` | String | - | Display name |
| `email` | String | - | Email address |
| `phoneNumber` | String | - | Phone number |
| `password` | String | - | BCrypt hashed |
| `bio` | String | - | User bio |
| `location` | String | - | User location |
| `dateOfBirth` | LocalDate | - | Birth date |
| `createdAt` | LocalDate | `@CreatedDate` | Registration date |
| `updatedAt` | LocalDate | `@LastModifiedDate` | Last update |

**TOTP 2FA Fields**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `totpEnabled` | boolean | `false` | Is 2FA active? |
| `totpVerified` | boolean | `false` | Has user completed setup? |
| `totpSecretEncrypted` | String | - | AES-GCM encrypted TOTP secret |
| `totpSecretPending` | String | - | Staged secret awaiting verification |
| `totpSecretVersion` | int | `1` | Version for backup codes |
| `totpSetupAt` | LocalDateTime | - | When 2FA was enabled |
| `totpLastUsedAt` | LocalDateTime | - | Last TOTP verification |
| `totpFailedAttempts` | int | `0` | Failed verification count |
| `totpLockedUntil` | LocalDateTime | - | Lockout expiry (if locked) |

### 6.2 BackupCode Entity

**Location**: `model/BackupCode.java`
**Size**: 1KB
**Collection**: `backup_codes`

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | MongoDB ObjectId |
| `userId` | String | Owner user ID |
| `codeHash` | String | BCrypt hashed code |
| `version` | int | TOTP secret version |
| `usedAt` | LocalDateTime | When code was used (null = unused) |
| `createdAt` | LocalDateTime | Creation timestamp |

---

## 7. Repositories

### 7.1 UserRepository

**Location**: `repository/UserRepository.java`

| Method | Description |
|--------|-------------|
| `findByUsername(String username)` | Find user by username |
| `findByEmail(String email)` | Find user by email |
| `existsByUsername(String username)` | Check username exists |

### 7.2 BackupCodeRepository

**Location**: `repository/BackupCodeRepository.java`

| Method | Description |
|--------|-------------|
| `findByUserIdAndVersion(String userId, int version)` | Get user's backup codes |
| `findByUserIdAndVersionAndUsedAtIsNull(...)` | Get unused codes |
| `deleteByUserIdAndVersion(String userId, int version)` | Delete old codes on rotation |

---

## 8. Services

### 8.1 TotpService

**Location**: `service/TotpService.java`
**Size**: 14KB, 361 lines

**Core Methods**:

| Method | Purpose |
|--------|---------|
| `generateSetup(User)` | Generate QR code + secret for existing user |
| `verifySetup(User, code)` | Verify initial setup & enable 2FA |
| `verifyLogin(User, code)` | Verify TOTP during login |
| `verifyBackupCode(User, code)` | Verify backup code for recovery |
| `generateSetupForPendingUser(User)` | Setup during registration |
| `verifySetupForPendingUser(User, code)` | Verify during registration |
| `generateBackupCodesForPendingUser(User, version)` | Create backup codes |
| `initiateReset(User)` | Start TOTP rotation |
| `generateBackupCodes(User, version)` | Generate 10 recovery codes |
| `handleFailedAttempt(User)` | Track & enforce lockout |
| `isLocked(User)` | Check if user is locked out |

### 8.2 UserService

**Location**: `service/UserService.java`
**Size**: 15.4KB

Main facade for user operations, coordinating other services.

### 8.3 UserAuthenticationService

**Location**: `service/UserAuthenticationService.java`
**Size**: 12KB

| Method | Purpose |
|--------|---------|
| `authenticate(identifier, password)` | Verify credentials, return token or TOTP required |
| `verifyLoginTotp(tempToken, code)` | Complete TOTP login |
| `verifyBackupCode(tempToken, code)` | Recovery login |

### 8.4 UserProfileService

**Location**: `service/UserProfileService.java`
**Size**: 4.8KB

| Method | Purpose |
|--------|---------|
| `updateProfile(userId, updateDto)` | Update user profile fields |
| `changePassword(userId, oldPwd, newPwd)` | Verify old pwd, update |

---

## 9. Authentication Flows

### 9.1 Registration Flow (with Mandatory TOTP)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      REGISTRATION FLOW                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. POST /api/auth/register                                           │
│     Body: { username, email, password, name, ... }                    │
│           │                                                            │
│           ▼                                                            │
│     ┌─────────────────────────────────────────────────────────────┐   │
│     │ UserService.initiateRegistration()                          │   │
│     │ ├── Validate unique username/email                          │   │
│     │ ├── Hash password (BCrypt)                                  │   │
│     │ ├── Store in pendingRegistrations Map                       │   │
│     │ └── Return TOTP_REGISTRATION temp token                     │   │
│     └─────────────────────────────────────────────────────────────┘   │
│           │                                                            │
│           ▼                                                            │
│  Response: { tempToken: "eyJ...", message: "TOTP setup required" }    │
│                                                                        │
│  2. POST /api/auth/totp/setup-registration                            │
│     Body: { tempToken }                                               │
│           │                                                            │
│           ▼                                                            │
│     ┌─────────────────────────────────────────────────────────────┐   │
│     │ TotpService.generateSetupForPendingUser()                   │   │
│     │ ├── Generate TOTP secret                                    │   │
│     │ ├── Store in pending user object                            │   │
│     │ └── Generate QR code                                        │   │
│     └─────────────────────────────────────────────────────────────┘   │
│           │                                                            │
│           ▼                                                            │
│  Response: { qrCode: "data:image/png;base64,...", secret: "ABC..." }  │
│                                                                        │
│  3. POST /api/auth/totp/verify-registration                           │
│     Body: { tempToken, code: "123456" }                               │
│           │                                                            │
│           ▼                                                            │
│     ┌─────────────────────────────────────────────────────────────┐   │
│     │ TotpService.verifySetupForPendingUser()                     │   │
│     │ ├── Verify TOTP code                                        │   │
│     │ ├── Encrypt & save secret                                   │   │
│     │ ├── Generate backup codes                                   │   │
│     │ ├── Save user to MongoDB                                    │   │
│     │ ├── Save backup codes to MongoDB                            │   │
│     │ └── Generate JWT token                                      │   │
│     └─────────────────────────────────────────────────────────────┘   │
│           │                                                            │
│           ▼                                                            │
│  Response: { token: "eyJ...", backupCodes: ["xxxx-xxxx", ...] }       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Login Flow (with TOTP)

```
┌────────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. POST /api/auth/login                                              │
│     Body: { identifier: "john", password: "secret" }                  │
│           │                                                            │
│           ▼                                                            │
│     ┌─────────────────────────────────────────────────────────────┐   │
│     │ UserAuthenticationService.authenticate()                    │   │
│     │ ├── Find user by username/email/phone                       │   │
│     │ ├── Verify password (BCrypt)                                │   │
│     │ └── Check totpEnabled flag                                  │   │
│     └─────────────────────────────────────────────────────────────┘   │
│           │                                                            │
│     ┌─────┴─────┐                                                     │
│     │           │                                                      │
│     ▼           ▼                                                      │
│  TOTP OFF    TOTP ON                                                  │
│     │           │                                                      │
│     ▼           ▼                                                      │
│  Return      Return tempToken                                         │
│  JWT Token   { requiresOtp: true, tempToken: "eyJ..." }              │
│                 │                                                      │
│                 ▼                                                      │
│  2. POST /api/auth/totp/verify                                        │
│     Body: { tempToken, code: "123456" }                               │
│           │                                                            │
│           ▼                                                            │
│     ┌─────────────────────────────────────────────────────────────┐   │
│     │ TotpService.verifyLogin()                                   │   │
│     │ ├── Validate temp token purpose = TOTP_LOGIN                │   │
│     │ ├── Decrypt TOTP secret                                     │   │
│     │ ├── Verify 6-digit code                                     │   │
│     │ ├── Reset failed attempts on success                        │   │
│     │ └── Generate JWT token                                      │   │
│     └─────────────────────────────────────────────────────────────┘   │
│           │                                                            │
│           ▼                                                            │
│  Response: { token: "eyJ...", user: {...} }                           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 10. TOTP 2FA System

### 10.1 TOTP Configuration

| Setting | Value |
|---------|-------|
| Algorithm | SHA1 |
| Digits | 6 |
| Period | 30 seconds |
| Secrets | Encrypted with AES-256-GCM |
| Library | `dev.samstevens.totp` |

### 10.2 Secret Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│                    TOTP SECRET LIFECYCLE                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Stage 1: PENDING                                                     │
│  ├── Generated during setup                                           │
│  ├── Stored in totpSecretPending (encrypted)                         │
│  └── Not yet active                                                   │
│           │                                                            │
│           │ User scans QR and enters code                             │
│           ▼                                                            │
│  Stage 2: ACTIVE                                                      │
│  ├── Moved to totpSecretEncrypted                                    │
│  ├── totpEnabled = true                                              │
│  ├── totpVerified = true                                             │
│  ├── totpSecretPending = null                                        │
│  └── Backup codes generated                                          │
│           │                                                            │
│           │ User requests reset                                        │
│           ▼                                                            │
│  Stage 3: ROTATION                                                    │
│  ├── New secret in totpSecretPending                                 │
│  ├── Old secret still active                                          │
│  └── totpSecretVersion incremented                                   │
│           │                                                            │
│           │ User verifies new code                                     │
│           ▼                                                            │
│  Stage 4: ROTATED                                                     │
│  ├── New secret moved to totpSecretEncrypted                         │
│  ├── Old backup codes deleted                                        │
│  └── New backup codes generated                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Lockout Protection

| Setting | Value |
|---------|-------|
| Max Failed Attempts | 5 |
| Lockout Duration | 15 minutes |
| Reset on Success | Yes |

---

## 11. Backup Codes

### 11.1 Configuration

| Setting | Value |
|---------|-------|
| Count | 10 codes per user |
| Format | `XXXX-XXXX` (8 alphanumeric chars) |
| Storage | BCrypt hashed |
| Usage | One-time only |
| Version | Tied to TOTP secret version |

### 11.2 Recovery Flow

```
POST /api/auth/totp/verify-recovery
Body: { tempToken, code: "ABCD-1234" }

1. Validate temp token purpose = TOTP_LOGIN
2. Find unused backup codes for user's current version
3. Compare input against hashed codes (BCrypt)
4. Mark matching code as used (set usedAt)
5. Generate JWT token
```

---

## 12. API Reference

### 12.1 Authentication Endpoints

```http
# Login
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "john_doe",
  "password": "secret123"
}

# Response (TOTP enabled)
{
  "requiresOtp": true,
  "tempToken": "eyJhbGciOiJIUzI1NiIs...",
  "message": "TOTP verification required"
}

# Response (TOTP disabled)
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "username": "john_doe", ... }
}
```

### 12.2 TOTP Endpoints

```http
# Setup TOTP
GET /api/auth/totp/setup
Authorization: Bearer <token>

# Response
{
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "secret": "JBSWY3DPEHPK3PXP"
}

# Verify TOTP Setup
POST /api/auth/totp/verify-setup
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}

# Response
{
  "success": true,
  "backupCodes": ["ABCD-1234", "EFGH-5678", ...]
}
```

### 12.3 Profile Endpoints

```http
# Get current user
GET /api/users/me
Authorization: Bearer <token>

# Update profile
PUT /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Investor",
  "location": "Mumbai"
}

# Change password
PUT /api/users/{id}/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "current123",
  "newPassword": "newSecret456"
}
```

---

## 13. Security

### 13.1 Password Security

| Aspect | Implementation |
|--------|----------------|
| Algorithm | BCrypt |
| Storage | Never plaintext |
| Transmission | HTTPS only |
| Validation | Verify old password before change |

### 13.2 TOTP Secret Security

| Aspect | Implementation |
|--------|----------------|
| Encryption | AES-256-GCM |
| Key Source | Environment variable |
| Storage | Encrypted at rest |
| Transmission | Never sent after setup |

### 13.3 Token Security

| Token Type | Expiry | Purpose |
|------------|--------|---------|
| JWT Access | 30 min | Full API access |
| TOTP_LOGIN | 5 min | Complete TOTP login |
| TOTP_SETUP | 15 min | Initial 2FA setup |
| TOTP_REGISTRATION | 15 min | Registration completion |

---

## 14. Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Returning User entity | Exposes password hash | Always map to UserDTO |
| Case sensitivity | Duplicate users (John vs john) | Normalize to lowercase |
| Logging passwords | Security breach | Never log credentials |
| Long-lived temp tokens | Token hijacking | 5-15 min expiry |
| Missing lockout | Brute force attacks | 5 attempts → 15 min lockout |
| Plain backup codes | Database leak exposure | BCrypt hash all codes |
| Skipping old password check | Unauthorized password change | Always verify old password |
| Not clearing pending secrets | Stale setup data | Clear on failure/timeout |

---

## Appendix A: File Size Reference

| File | Size | Lines | Notes |
|------|------|-------|-------|
| UserService.java | 15.4KB | ~450 | Main user operations |
| TotpController.java | 14.8KB | 329 | 9 TOTP endpoints |
| TotpService.java | 14KB | 361 | TOTP logic |
| UserController.java | 14KB | 330 | 11 user endpoints |
| UserAuthenticationService.java | 12KB | ~350 | Login logic |
| LoginResponse.java | 5.9KB | ~150 | Response DTO |
| UserProfileService.java | 4.8KB | ~140 | Profile CRUD |

---

## Appendix B: Related Documentation

- [Security Module README](../security/README.md) - JWT, TotpEncryptionUtil
- [Common Module README](../common/README.md) - ApiResponse, exceptions
- [Notes Module README](../notes/README.md) - Default notes seeding

---

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-17 | Comprehensive rewrite with TOTP 2FA documentation |
| 1.0.0 | 2025-12-14 | Initial documentation |

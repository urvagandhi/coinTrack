# Input & Output Normalization - Industry Standards Compliance

> **Status:** TODO  
> **Priority:** HIGH  
> **Created:** 2026-08-25  
> **Estimated Effort:** Large (touches every layer of the application)

---

## 1. Why Normalize?

Currently, CoinTrack accepts raw user input across ~200+ input fields with inconsistent validation. This creates:

- **Security risks** (OWASP A03 - Injection, CWE-602 - Client-Side Enforcement)
- **Data inconsistency** (same phone number stored as `9876543210`, `+919876543210`, `09876543210`)
- **Broken integrations** (date comparisons fail when formats differ)
- **Compliance gaps** (RBI/SEBI/KYC mandates standardized identity formats)

---

## 2. Industry Standards Reference

| Standard | What It Covers | Relevance |
|----------|---------------|-----------|
| **ISO 8601** | Date/time format (`YYYY-MM-DD`) | All date inputs, transaction dates, DOB, maturity dates |
| **E.164** | International phone number format (`+91XXXXXXXXXX`) | Phone number inputs |
| **RFC 5321** | Email address format | Email normalization |
| **OWASP ASVS v4.0** | Input validation & sanitization | All user inputs |
| **RBI KYC Norms** | PAN, Aadhaar, DOB verification | Identity fields |
| **ISO 20022** | Structured financial data (addresses, amounts) | Financial transactions |
| **PCI DSS Req-6.2.4** | Payment data validation | Amount/currency fields |
| **WCAG 2.2** | Input purpose, error identification | Accessibility |
| **PMLA 2002** | Anti-money laundering data requirements | Transaction data |

---

## 3. Normalization Categories

### 3.1 Identity & Authentication
- Full Name (trim, title case, Unicode normalization)
- Username (lowercase, alphanumeric + underscore only)
- Email (lowercase, trim, RFC 5321 compliance)
- Phone Number (E.164 format, Indian mobile validation)
- Date of Birth (ISO 8601: `YYYY-MM-DD`)
- Password (bcrypt/argon2 hash, never stored plaintext)

### 3.2 Financial Identifiers
- PAN Card (`^[A-Z]{5}[0-9]{4}[A-Z]$`, 10 chars, uppercase)
- Aadhaar Number (`^[0-9]{12}$`, 12 digits, no spaces)
- IFSC Code (`^[A-Z]{4}0[A-Z0-9]{6}$`, 11 chars, uppercase)
- Account Number (trim, no spaces, no special chars except hyphens)
- UPI ID (lowercase, `username@bank` format)

### 3.3 Monetary Values
- Amounts (stored as integers in paise/cents, never floats)
- Currency (ISO 4217: `INR`, `USD`, etc.)
- Percentage rates (stored as decimals: 12% → `0.12`)
- Weight (grams, stored as decimal with fixed precision)

### 3.4 Dates & Times
- All dates stored as ISO 8601 (`YYYY-MM-DD`)
- All timestamps stored as UTC (`YYYY-MM-DDTHH:MM:SSZ`)
- Display format: `DD/MM/YYYY` (Indian convention) or `MM/DD/YYYY` (US)
- Never store timezone-naive dates for financial transactions

### 3.5 Free Text
- Names: trim, normalize Unicode (NFKC), title case
- Remarks/Notes: trim, max length enforcement, sanitize XSS
- Location/Address: trim, capitalize first letter of each word

### 3.6 Numeric Inputs
- Use `type="number"` with `inputmode="decimal"` or `inputmode="numeric"`
- Always validate min/max on server side (client-side is UX only)
- Reject negative values for currency unless explicitly allowed
- Use `step="0.01"` for currency, `step="0.001"` for weights

---

## 4. Implementation Layers

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: Frontend (Client-Side Validation)     │
│  - HTML5 input types & attributes               │
│  - JavaScript pre-validation (UX feedback)      │
│  - Input masks & formatting helpers             │
│  - Real-time validation on blur/change          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  LAYER 2: API Gateway / Middleware               │
│  - Request schema validation (Zod/Joi)          │
│  - Type coercion & sanitization                 │
│  - Rate limiting & abuse prevention             │
│  - Input length limits                          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  LAYER 3: Backend Controller / Service           │
│  - Business logic validation                    │
│  - Normalization functions (phone, email, etc.) │
│  - Duplicate detection                          │
│  - Audit logging                                │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│  LAYER 4: Database (Storage)                     │
│  - CHECK constraints                            │
│  - UNIQUE constraints                           │
│  - Proper column types (DATE, DECIMAL, etc.)    │
│  - Indexes for normalized lookups               │
└─────────────────────────────────────────────────┘
```

---

## 5. File Index

| File | Covers |
|------|--------|
| `01_AUTHENTICATION_NORMALIZATION.md` | Registration, Login, Forgot/Reset Password, OTP, 2FA |
| `02_PROFILE_NORMALIZATION.md` | Profile edit, Change Password, Notifications, Account Deletion |
| `03_FINANCIAL_NORMALIZATION.md` | EPF, PPF, FD, Gold/Silver, Mutual Funds, Broker Connection |
| `04_CALCULATOR_NORMALIZATION.md` | All 32+ calculator page inputs |
| `05_BACKEND_DB_NORMALIZATION.md` | API schemas, database constraints, migration plan |

---

## 6. Key Principles

1. **Validate early, sanitize always** - Client-side for UX, server-side for security
2. **Store canonical forms** - Normalize before storage, format on display
3. **Use proper types** - `DATE` not `VARCHAR` for dates, `DECIMAL` not `FLOAT` for money
4. **Idempotent normalization** - Normalizing an already-normalized value should be a no-op
5. **Fail loudly** - Reject invalid input with clear error messages (WCAG 2.2 SC 3.3.1)
6. **Never trust the client** - All validation must be duplicated server-side (OWASP)

# Authentication Inputs - Normalization Plan

> **Priority:** HIGH  
> **Files Affected:** Registration, Login, Forgot Password, Reset Password, Complete Profile, 2FA

---

## 1. Full Name

### Current State
- Input: `type="text"`, `required` only
- No normalization applied
- Stored as-is

### Industry Standard
- **RFC 8264 (PRECIS)**: Names should allow Unicode letters, spaces, hyphens, apostrophes
- **OWASP**: Trim whitespace, normalize Unicode (NFKC form)
- **RBI KYC**: Name must match official documents (PAN/Aadhaar)

### Normalization Rules

```
INPUT:  "  John  O'Brien-Smith  "
         ↓
STEP 1: Trim leading/trailing whitespace
STEP 2: Collapse multiple spaces to single space
STEP 3: Normalize Unicode to NFKC form
STEP 4: Title case for display ("John O'Brien-Smith")
STEP 5: Store as-is (preserve original casing for legal names)
```

### Validation
- Min length: 2 characters
- Max length: 100 characters
- Allowed characters: Unicode letters, spaces, hyphens, apostrophes, periods
- Regex: `^[\p{L}][\p{L}\s'.-]{1,99}$` (Unicode-aware)
- Reject: Numbers, special characters (`@#$%^&*`), emojis

### Files to Update
- `app/(access)/register/page.jsx:157` - Registration name
- `app/(access)/complete-profile/page.jsx:204` - Complete profile name
- `app/(main)/profile/page.jsx:848-857` - Profile edit name

---

## 2. Username

### Current State
- Input: `type="text"`, alphanumeric + underscore
- Client-side: 3-50 chars, `/^[a-zA-Z0-9_]+$/`
- Stored as-is

### Industry Standard
- **Lowercase only** for case-insensitive matching
- **Immutable after creation** (or with cooldown period)
- **Reserved words** blocked (admin, root, system, etc.)

### Normalization Rules

```
INPUT:  "  JohnDoe_123  "
         ↓
STEP 1: Trim whitespace
STEP 2: Convert to lowercase → "johndoe_123"
STEP 3: Validate against regex: `^[a-z][a-z0-9_]{2,49}$`
STEP 4: Check against reserved words list
STEP 5: Check uniqueness (case-insensitive)
STEP 6: Store as lowercase
```

### Validation
- Min length: 3 characters
- Max length: 50 characters
- Must start with a letter
- Allowed: lowercase letters, digits, underscores
- Regex: `^[a-z][a-z0-9_]{2,49}$`
- Blocked: `admin`, `root`, `system`, `support`, `null`, `undefined`

### Files to Update
- `app/(access)/register/page.jsx:164` - Registration
- `app/(access)/complete-profile/page.jsx:211` - Complete profile

---

## 3. Email Address

### Current State
- Input: `type="email"`, regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Stored as-is (mixed case possible)

### Industry Standard
- **RFC 5321**: Local part is case-sensitive, domain is case-insensitive
- **OWASP**: Normalize to lowercase before storage
- **RFC 5322**: Strict email format validation

### Normalization Rules

```
INPUT:  "  John.Doe@GMAIL.COM  "
         ↓
STEP 1: Trim leading/trailing whitespace
STEP 2: Convert entire email to lowercase → "john.doe@gmail.com"
STEP 3: Validate format against RFC 5322 simplified regex
STEP 4: Verify MX record exists for domain (optional, async)
STEP 5: Store as lowercase
STEP 6: For comparison: always compare lowercase
```

### Validation
- Max length: 254 characters total (RFC 5321)
- Max local part: 63 characters
- Regex: `^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`
- Reject: null bytes, backticks, single/double quotes in local part
- Optional: MX record verification (async, don't block registration)

### Files to Update
- `app/(access)/register/page.jsx:177` - Registration
- `app/(access)/login/page.jsx:304-313` - Login (also accepts email)
- `app/(access)/forgot-password/page.jsx:71-79` - Forgot password
- `app/(access)/complete-profile/page.jsx:224-231` - Complete profile
- `app/(main)/profile/page.jsx:848-857` - Profile edit
- `components/modals/ContactModal.jsx:151-163` - Contact form

---

## 4. Phone Number

### Current State
- Input: `type="tel"`, 10-digit Indian mobile
- Client regex: `/^[\+]?[1-9][\d]{0,15}$/`
- Stored as-is (inconsistent formats)

### Industry Standard
- **E.164 (ITU-T)**: International phone number format `+[country code][number]`
- **RBI KYC**: Indian mobile numbers are 10 digits, start with 6/7/8/9
- **India National Numbering Plan**: All mobile numbers are 10 digits

### Normalization Rules

```
INPUT:  "9876543210" or "+919876543210" or "09876543210" or "91 9876543210"
         ↓
STEP 1: Remove all non-digit characters → "9876543210" or "919876543210" or "09876543210"
STEP 2: If starts with "0", remove leading zero → "9876543210"
STEP 3: If starts with "91" and length > 10, remove "91" → "9876543210"
STEP 4: Validate: exactly 10 digits, starts with [6-9]
STEP 5: Store as 10-digit number: "9876543210"
STEP 6: For display: format as "+91 98765 43210" (Indian convention)
STEP 7: For international: store as E.164 "+919876543210"
```

### Validation
- After normalization: exactly 10 digits
- First digit must be: 6, 7, 8, or 9
- Regex (post-normalization): `^[6-9][0-9]{9}$`
- No spaces, dashes, or special characters in stored value

### Files to Update
- `app/(access)/register/page.jsx:188` - Registration
- `app/(access)/complete-profile/page.jsx:241-246` - Complete profile
- `app/(main)/profile/page.jsx:848-857` - Profile edit

---

## 5. Date of Birth

### Current State
- Input: `type="date"` (HTML5 date picker)
- Client validation: age >= 18
- Stored as-is

### Industry Standard
- **ISO 8601**: All dates stored as `YYYY-MM-DD`
- **OWASP**: Validate date ranges (not in future, reasonable DOB range)
- **RBI KYC**: DOB must match official documents

### Normalization Rules

```
INPUT:  "03/15/1995" or "1995-03-15" or "15-03-1995"
         ↓
STEP 1: Parse input to Date object (handle multiple formats)
STEP 2: Validate: not in future
STEP 3: Validate: not before 1900-01-01
STEP 4: Validate: age >= 18 (for fintech apps)
STEP 5: Convert to ISO 8601: "1995-03-15"
STEP 6: Store as DATE type (not VARCHAR)
STEP 7: For display: "15 Mar 1995" or "03/15/1995" based on locale
```

### Validation
- Must be a valid calendar date
- Must not be in the future
- Must not be before 1900-01-01
- Age must be >= 18 years (for registration)
- Age must be <= 120 years (sanity check)

### Files to Update
- `app/(access)/register/page.jsx:202` - Registration
- `app/(access)/complete-profile/page.jsx:256` - Complete profile
- `app/(main)/profile/page.jsx:848-857` - Profile edit

---

## 6. Password

### Current State
- Input: `type="password"` with toggle
- Client regex: `(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=])`
- Strength meter: weak/fair/good/strong
- Hashed before storage (bcrypt)

### Industry Standard
- **NIST SP 800-63B**: Minimum 8 characters, no maximum below 64
- **OWASP**: Bcrypt with cost factor >= 12, or Argon2id
- **PCI DSS**: Password complexity requirements for financial apps

### Normalization Rules

```
INPUT:  "MyP@ssw0rd123"
         ↓
STEP 1: Trim leading/trailing whitespace
STEP 2: Reject if contains null bytes
STEP 3: Enforce minimum length (8 chars)
STEP 4: Check against common password list (HIBP API optional)
STEP 5: Hash with bcrypt (cost=12) or argon2id
STEP 6: Store ONLY the hash + salt
STEP 7: NEVER log, return, or expose the plaintext password
```

### Validation Rules
- Minimum length: 8 characters
- Maximum length: 128 characters (prevent DoS)
- Must contain: uppercase, lowercase, digit, special character
- Special characters allowed: `!@#$%^&*()_+-=[]{}|;:'",.<>?/`
- Reject: common passwords (password123, qwerty, etc.)
- Reject: passwords containing username or email

### Hashing
- Algorithm: bcrypt (cost=12) or argon2id
- Salt: auto-generated per password
- NEVER use MD5, SHA-1, or SHA-256 alone for passwords
- Re-hash on login if cost factor has been increased

### Files to Update
- `app/(access)/register/page.jsx:215` - Registration
- `app/(access)/reset-password/page.jsx:153-156` - Reset password
- `app/(access)/complete-profile/page.jsx:269` - Complete profile
- `app/(main)/profile/page.jsx:543-547` - Change password

---

## 7. Login Identifier (Username/Email/Phone)

### Current State
- Input: `type="text"`, accepts username, email, or phone
- Auto-detects phone prefix (+91)
- No normalization before lookup

### Industry Standard
- **Normalize input before lookup** to match stored format
- **Case-insensitive** email/username matching
- **Rate limiting** on login attempts

### Normalization Rules

```
INPUT:  "  JohnDoe@Gmail.COM  " or "9876543210" or "+919876543210"
         ↓
STEP 1: Trim whitespace
STEP 2: Detect input type:
  - If contains "@" → Email → lowercase → lookup by email
  - If all digits after removing "+"/"0"/"91" prefix → Phone → 10-digit → lookup by phone
  - Otherwise → Username → lowercase → lookup by username
STEP 3: Normalize detected type (see respective sections above)
STEP 4: Case-insensitive database lookup
STEP 5: Constant-time comparison to prevent timing attacks
```

### Files to Update
- `app/(access)/login/page.jsx:304-313` - Login
- `app/(access)/forgot-password/page.jsx:71-79` - Forgot password

---

## 8. OTP / 2FA Code

### Current State
- 6-digit TOTP code in separate input boxes
- `inputMode="numeric"`, `maxLength=1` per box
- Auto-submits at 6 digits

### Industry Standard
- **RFC 6238 (TOTP)**: 6-digit codes, 30-second window
- **OWASP**: Rate limit verification attempts, lock after failures

### Normalization Rules

```
INPUT:  ["1", "2", "3", "4", "5", "6"]
         ↓
STEP 1: Concatenate digits → "123456"
STEP 2: Strip any non-digit characters
STEP 3: Validate length: exactly 6 digits
STEP 4: Validate format: all numeric
STEP 5: Verify against TOTP secret (constant-time comparison)
STEP 6: Rate limit: max 5 attempts per 15 minutes
STEP 7: Lock account after 3 consecutive failures
```

### Recovery Code
```
INPUT:  "12345678"
         ↓
STEP 1: Strip spaces and hyphens
STEP 2: Validate: exactly 8 digits
STEP 3: Lookup in recovery codes table (hashed)
STEP 4: Mark as used (single-use)
STEP 5: Rate limit attempts
```

### Files to Update
- `app/(access)/login/page.jsx:258-268` - 2FA verification
- `app/(access)/login/page.jsx:243-251` - Recovery code
- `components/TotpSetup.jsx:225-234` - 2FA setup verification
- `app/(main)/profile/page.jsx:583-588` - 2FA reset (current code)
- `app/(main)/profile/page.jsx:665-671` - 2FA reset (new code)

---

## 9. Remember Me Token

### Current State
- Checkbox: `rememberMe` boolean
- No token management visible

### Industry Standard
- **OWASP Session Management**: Secure, HttpOnly, SameSite cookies
- **Token**: Random, 128+ bits, stored hashed in DB
- **Expiry**: 30 days max for "remember me"

### Normalization Rules
```
STEP 1: Generate cryptographically random token (128 bits)
STEP 2: Hash token before storing in database (SHA-256)
STEP 3: Set cookie: Secure, HttpOnly, SameSite=Lax, Max-Age=2592000 (30 days)
STEP 4: Bind to user ID + user agent hash
STEP 5: Invalidate on password change
```

---

## 10. Implementation Checklist

### Frontend
- [ ] Create shared `normalizeEmail()` utility function
- [ ] Create shared `normalizePhone()` utility function (E.164)
- [ ] Create shared `normalizeName()` utility function (trim + Unicode)
- [ ] Create shared `normalizeUsername()` utility function (lowercase)
- [ ] Add input masks for phone numbers (`+91 XXXXX XXXXX`)
- [ ] Use `inputmode` attributes appropriately (`numeric`, `decimal`, `email`, `tel`)
- [ ] Add real-time validation feedback on blur
- [ ] Normalize before sending to API (don't send raw)

### Backend
- [ ] Add Zod/Joi schema validation for all auth endpoints
- [ ] Implement `normalizePhoneForStorage()` - canonical 10-digit
- [ ] Implement `normalizeEmailForStorage()` - lowercase
- [ ] Implement `normalizeUsernameForStorage()` - lowercase
- [ ] Add rate limiting on auth endpoints (login, OTP, password reset)
- [ ] Add audit logging for all auth events
- [ ] Verify password hash on every login attempt

### Database
- [ ] Add CHECK constraints on phone format
- [ ] Add UNIQUE constraints on normalized email/username/phone
- [ ] Add indexes for normalized lookups
- [ ] Ensure password column stores only hashes
- [ ] Add `created_at`, `updated_at` timestamps on all auth tables

---

## 11. Reference Implementations

### Email Normalization (JavaScript)
```javascript
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return null;
  if (trimmed.length === 0) return null;
  // Basic format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) return null;
  return trimmed;
}
```

### Phone Normalization (JavaScript)
```javascript
function normalizePhoneIndia(phone) {
  if (!phone || typeof phone !== 'string') return null;
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  // Remove leading zero
  if (digits.startsWith('0')) digits = digits.substring(1);
  // Remove country code 91
  if (digits.startsWith('91') && digits.length > 10) digits = digits.substring(digits.length - 10);
  // Validate: exactly 10 digits, starts with 6-9
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return digits;
}

function formatPhoneDisplay(phone) {
  if (!phone || phone.length !== 10) return phone;
  return `+91 ${phone.substring(0, 5)} ${phone.substring(5)}`;
}
```

### Username Normalization (JavaScript)
```javascript
function normalizeUsername(username) {
  if (!username || typeof username !== 'string') return null;
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 50) return null;
  if (!/^[a-z][a-z0-9_]{2,49}$/.test(trimmed)) return null;
  const reserved = ['admin', 'root', 'system', 'support', 'null', 'undefined'];
  if (reserved.includes(trimmed)) return null;
  return trimmed;
}
```

### Name Normalization (JavaScript)
```javascript
function normalizeName(name) {
  if (!name || typeof name !== 'string') return null;
  // Trim and normalize Unicode
  const normalized = name.trim().normalize('NFKC');
  // Collapse multiple spaces
  const collapsed = normalized.replace(/\s+/g, ' ');
  // Validate length
  if (collapsed.length < 2 || collapsed.length > 100) return null;
  // Validate characters (Unicode letters, spaces, hyphens, apostrophes, periods)
  if (!/^[\p{L}][\p{L}\s'.-]{1,99}$/u.test(collapsed)) return null;
  return collapsed;
}
```

### Date Normalization (JavaScript)
```javascript
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  // Parse date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  // Validate not in future
  if (date > new Date()) return null;
  // Validate not before 1900
  if (date.getFullYear() < 1900) return null;
  // Validate age >= 18 (for registration DOB)
  const age = Math.floor((new Date() - date) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return null;
  if (age > 120) return null;
  // Return ISO 8601
  return date.toISOString().split('T')[0];
}
```

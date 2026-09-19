# Profile & User Data - Normalization Plan

> **Priority:** HIGH  
> **Files Affected:** Profile Page, Contact Modal, Notifications, Account Deletion

> **Implementation Status (verified 2026-09-19):** NOT YET IMPLEMENTED as shared utilities. All normalization rules below are target specs. The `app/(main)/profile/page.jsx` line references are **approximate / UNVERIFIED**. No shared normalization module exists (`utils/normalization.js` reference in §13 is a TARGET, not current).

---

## 1. Editable Profile Fields

### Current State
- Name, Email, Phone, Location, Bio are editable
- Username is read-only
- No normalization on save
- Location is free text with no validation

### Normalization Flow (All Profile Fields)
```
User Input → Frontend Validation → API Schema Validation → Backend Normalization → DB Storage
     ↑                                        ↑                                          ↑
  UX feedback                         Reject bad input                        Store canonical form
```

---

## 2. Full Name (Profile Edit)

### Current State
- Input: `type="text"`, no validation on save
- Stored as-is from registration

### Normalization Rules
```
INPUT:  "  john  o'brien-smith  "
         ↓
STEP 1: Trim leading/trailing whitespace
STEP 2: Normalize Unicode (NFKC)
STEP 3: Collapse multiple spaces to single space
STEP 4: Title case for display: "John O'Brien-Smith"
STEP 5: Store with original casing (legal name)
```

### Validation
- Min: 2 characters, Max: 100 characters
- Allowed: Unicode letters, spaces, hyphens, apostrophes, periods
- Reject: Numbers, special characters (`@#$%^&*`)

### Files
- `app/(main)/profile/page.jsx:848-857`

---

## 3. Email (Profile Edit)

### Current State
- Input: `type="text"`, email regex on save
- Allows editing email (may require re-verification)

### Normalization Rules
```
INPUT:  "  John.Doe@Gmail.COM  "
         ↓
STEP 1: Trim whitespace
STEP 2: Lowercase: "john.doe@gmail.com"
STEP 3: Validate RFC 5322 format
STEP 4: Check for disposable email domains (optional)
STEP 5: If email changed → send verification to new email
STEP 6: Store as lowercase
STEP 7: Keep old email until new one is verified
```

### Validation
- Max: 254 characters total
- Max local part: 63 characters
- Must match email format regex
- Reject: null bytes, backticks

### Special Rules for Email Change
- Don't update email until new email is verified
- Send verification link to new email
- Old email remains active until verification
- Log email change in audit trail

### Files
- `app/(main)/profile/page.jsx:848-857`

---

## 4. Phone Number (Profile Edit)

### Current State
- Input: `type="text"` with `+91` prefix
- Indian mobile validation: 10 digits, starts with 6-9
- Stored as-is

### Normalization Rules
```
INPUT:  "9876543210" or "+91 98765 43210" or "09876543210"
         ↓
STEP 1: Remove all non-digit characters
STEP 2: Remove leading zero if present
STEP 3: Remove country code "91" if present (leaving 10 digits)
STEP 4: Validate: exactly 10 digits, starts with [6-9]
STEP 5: Store as 10-digit string: "9876543210"
STEP 6: For display: "+91 98765 43210"
STEP 7: For international: "+919876543210" (E.164)
```

### Validation
- After normalization: exactly 10 digits
- First digit: 6, 7, 8, or 9
- Regex: `^[6-9][0-9]{9}$`

### Special Rules for Phone Change
- Send OTP to new phone number before saving
- Verify OTP before updating
- Log phone change in audit trail

### Files
- `app/(main)/profile/page.jsx:848-857`

---

## 5. Location (Profile Edit)

### Current State
- Input: `type="text"`, no validation
- Stored as free text

### Industry Standard
- **ISO 3166-1**: Country codes (IN, US, GB, etc.)
- **ISO 3166-2**: State/region codes
- **ISO 20022**: Structured address format (mandatory from Nov 2026)

### Normalization Rules
```
INPUT:  "  bangalore, karnataka  "
         ↓
STEP 1: Trim whitespace
STEP 2: Title case: "Bangalore, Karnataka"
STEP 3: Validate max length: 200 characters
STEP 4: Store as-is (or map to structured format if geo-database available)
```

### Validation
- Max: 200 characters
- Allowed: Unicode letters, spaces, commas, periods, hyphens
- Reject: Scripts, SQL injection patterns, excessive special characters

### Future Enhancement
- Integrate with address autocomplete API (Google Places, Mapbox)
- Store structured: `{ city: "Bangalore", state: "Karnataka", country: "IN" }`
- Align with ISO 20022 structured address requirements

### Files
- `app/(main)/profile/page.jsx:848-857`

---

## 6. Bio (Profile Edit)

### Current State
- Input: `<textarea>`, no validation
- Stored as-is

### Normalization Rules
```
INPUT:  "  I am a  passionate   investor...  "
         ↓
STEP 1: Trim leading/trailing whitespace
STEP 2: Collapse multiple spaces to single space
STEP 3: Sanitize: strip HTML tags (prevent XSS)
STEP 4: Enforce max length: 500 characters
STEP 5: Store as plain text (never HTML)
STEP 6: For display: escape HTML entities
```

### Validation
- Max: 500 characters
- Allowed: Unicode letters, numbers, spaces, punctuation
- Reject: HTML tags, script injection, excessive line breaks
- Max line breaks: 10 (prevent wall-of-text)

### Files
- `app/(main)/profile/page.jsx:835-839`

---

## 7. Change Password

### Current State
- Three fields: currentPassword, newPassword, confirmPassword
- Client-side strength validation
- Bcrypt hashing

### Normalization Rules
```
CURRENT PASSWORD:
  STEP 1: Trim whitespace (user might accidentally add space)
  STEP 2: Validate against stored hash (constant-time comparison)
  STEP 3: NEVER log or store plaintext

NEW PASSWORD:
  STEP 1: Trim leading/trailing whitespace
  STEP 2: Reject if contains null bytes
  STEP 3: Enforce min length: 8, max length: 128
  STEP 4: Check complexity: uppercase + lowercase + digit + special char
  STEP 5: Check against common password list (HIBP API)
  STEP 6: Reject if matches current password
  STEP 7: Reject if contains username or email
  STEP 8: Hash with bcrypt (cost=12) or argon2id
  STEP 9: Store ONLY hash + salt
  STEP 10: Invalidate all other sessions (force re-login)

CONFIRM PASSWORD:
  STEP 1: Trim whitespace
  STEP 2: Compare with newPassword (exact match)
  STEP 3: Reject if mismatch (show clear error)
```

### Validation
- Current password: required, non-empty
- New password: min 8, max 128 chars
- Complexity: uppercase + lowercase + digit + special char
- Must differ from current password
- Confirm must match new password

### Security Rules
- Hash: bcrypt (cost=12) or argon2id
- NEVER use MD5/SHA-1/SHA-256 alone
- Invalidate all sessions on password change
- Send notification email on password change
- Log password change event in audit trail

### Files
- `app/(main)/profile/page.jsx:543-547`

---

## 8. Notification Preferences

### Current State
- Four toggle buttons: priceAlerts, portfolioUpdates, marketNews, weeklyReports
- Boolean values

### Normalization Rules
```
INPUT:  { priceAlerts: true, portfolioUpdates: false, ... }
         ↓
STEP 1: Validate each value is boolean
STEP 2: Default any missing fields to false
STEP 3: Store as JSON object or individual boolean columns
STEP 4: Return normalized preferences on every response
```

### Validation
- All fields must be boolean (true/false)
- No other data types accepted
- Default: all false if not provided

### Files
- `app/(main)/profile/page.jsx:793-807`

---

## 9. Account Deletion

### Current State
- Password confirmation for non-Google accounts
- No normalization needed (password only)

### Normalization Rules
```
PASSWORD CONFIRMATION:
  STEP 1: Trim whitespace
  STEP 2: Validate against stored hash
  STEP 3: Verify account owns this password (not OAuth-only account)
  STEP 4: Soft-delete: mark account as deleted, not actual DB delete
  STEP 5: Anonymize PII: replace name, email, phone with hashes
  STEP 6: Keep transaction data for regulatory compliance (RBI: 5 years)
  STEP 7: Send confirmation email
  STEP 8: Invalidate all sessions
  STEP 9: Log deletion event in audit trail
```

### Regulatory Requirements
- **RBI**: Financial transaction records must be retained for 5 years
- **PMLA**: KYC records must be retained for 5 years after account closure
- **IT Act**: Audit logs must be retained for 8 years

### Files
- `app/(main)/profile/page.jsx:465-471`

---

## 10. Contact Form Modal

### Current State
- Three fields: name, email, message
- react-hook-form validation
- Min 10 chars for message

### Normalization Rules
```
NAME:
  STEP 1: Trim whitespace
  STEP 2: Title case for display
  STEP 3: Validate: 2-100 chars, allowed characters

EMAIL:
  STEP 1: Trim whitespace
  STEP 2: Lowercase
  STEP 3: Validate RFC 5322 format
  STEP 4: Verify user owns this email (send confirmation link)

MESSAGE:
  STEP 1: Trim leading/trailing whitespace
  STEP 2: Collapse multiple spaces
  STEP 3: Sanitize: strip HTML tags
  STEP 4: Enforce max length: 2000 characters
  STEP 5: Enforce min length: 10 characters
  STEP 6: Log submission for abuse monitoring
```

### Validation
- Name: 2-100 chars, letters/spaces/hyphens/apostrophes only
- Email: valid format, max 254 chars
- Message: 10-2000 chars, no HTML tags

### Files
- `components/modals/ContactModal.jsx:132-187`

---

## 11. Display Formatting

### Dates
- **Storage**: ISO 8601 `YYYY-MM-DD`
- **Display (India)**: `DD/MM/YYYY` or `15 Mar 1995`
- **Display (US)**: `MM/DD/YYYY` or `Mar 15, 1995`

### Phone Numbers
- **Storage**: 10-digit `9876543210`
- **Display**: `+91 98765 43210`

### Email
- **Storage**: lowercase `john.doe@gmail.com`
- **Display**: as-is (preserve original casing if available)

### Currency
- **Storage**: Integer paise `123456` = ₹1,234.56
- **Display**: `₹1,234.56` or `₹1,234.56` (Indian comma grouping)

### Names
- **Storage**: Original casing `John O'Brien-Smith`
- **Display**: Title case `John O'Brien-Smith`

---

## 12. Implementation Checklist

### Frontend
- [ ] Create shared normalization utilities (`utils/normalization.js`)
- [ ] Add `onBlur` normalization for all text inputs
- [ ] Show normalized preview before save (e.g., "Phone will be saved as: +91 98765 43210")
- [ ] Use `inputmode` attributes: `inputmode="email"` for email, `inputmode="tel"` for phone
- [ ] Add character counters for max-length fields
- [ ] Disable save button until validation passes

### Backend
- [ ] Add Zod schemas for all profile endpoints
- [ ] Normalize all fields before DB write
- [ ] Send verification for email/phone changes
- [ ] Log all profile changes in audit trail
- [ ] Rate limit profile update endpoints

### Database
- [ ] Add CHECK constraints on normalized formats
- [ ] Add UNIQUE constraints on email, phone (after normalization)
- [ ] Add audit_log table for profile changes
- [ ] Use proper column types (DATE, BOOLEAN, TEXT)

---

## 13. Reference: Normalization Utility

```javascript
// utils/normalization.js

export const normalize = {
  email(email) {
    if (!email || typeof email !== 'string') return null;
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > 254 || trimmed.length === 0) return null;
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(trimmed)) return null;
    return trimmed;
  },

  phoneIndia(phone) {
    if (!phone || typeof phone !== 'string') return null;
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.substring(1);
    if (digits.startsWith('91') && digits.length > 10) digits = digits.substring(digits.length - 10);
    if (!/^[6-9]\d{9}$/.test(digits)) return null;
    return digits;
  },

  phoneDisplay(phone) {
    if (!phone || phone.length !== 10) return phone;
    return `+91 ${phone.substring(0, 5)} ${phone.substring(5)}`;
  },

  username(username) {
    if (!username || typeof username !== 'string') return null;
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3 || trimmed.length > 50) return null;
    if (!/^[a-z][a-z0-9_]{2,49}$/.test(trimmed)) return null;
    const reserved = ['admin', 'root', 'system', 'support', 'null', 'undefined'];
    if (reserved.includes(trimmed)) return null;
    return trimmed;
  },

  name(name) {
    if (!name || typeof name !== 'string') return null;
    const normalized = name.trim().normalize('NFKC');
    const collapsed = normalized.replace(/\s+/g, ' ');
    if (collapsed.length < 2 || collapsed.length > 100) return null;
    if (!/^[\p{L}][\p{L}\s'.-]{1,99}$/u.test(collapsed)) return null;
    return collapsed;
  },

  date(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0]; // ISO 8601
  },

  bio(bio) {
    if (!bio || typeof bio !== 'string') return '';
    const trimmed = bio.trim();
    const collapsed = trimmed.replace(/\s+/g, ' ');
    const stripped = collapsed.replace(/<[^>]*>/g, ''); // Strip HTML
    return stripped.substring(0, 500);
  },

  location(location) {
    if (!location || typeof location !== 'string') return '';
    const trimmed = location.trim().normalize('NFKC');
    const collapsed = trimmed.replace(/\s+/g, ' ');
    return collapsed.substring(0, 200);
  }
};
```

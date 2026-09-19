# Backend & Database - Normalization Plan

> **Priority:** HIGH  
> **Scope:** API schemas, middleware, database constraints, migrations

> **Implementation Status (verified 2026-09-19):** NOT YET IMPLEMENTED. This spec is entirely target state. No Zod schemas, normalization middleware, DB constraints, or migrations described here exist today. (Backend verification was NOT performed for this update — marked **UNVERIFIED** against backend code.)

---

## 1. API Input Validation Architecture

### Current State
- Minimal server-side validation
- No consistent schema validation
- Trust of client-provided data

### Target State
```
Request → Schema Validation → Normalization → Business Logic → DB Write → Response
              ↑                    ↑                                      ↑
         Reject invalid      Canonical form                      Format for display
```

### Implementation: Zod Schemas

```javascript
// schemas/auth.js
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[\p{L}][\p{L}\s'.-]{1,99}$/u, 'Name contains invalid characters'),
  
  username: z.string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-z][a-z0-9_]{2,49}$/, 'Username must start with a letter and contain only lowercase letters, numbers, and underscores'),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .max(254, 'Email is too long')
    .email('Invalid email format'),
  
  phoneNumber: z.string()
    .trim()
    .transform(val => val.replace(/\D/g, ''))
    .transform(val => val.startsWith('0') ? val.slice(1) : val)
    .transform(val => val.startsWith('91') && val.length > 10 ? val.slice(-10) : val)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')),
  
  dateOfBirth: z.string()
    .pipe(z.coerce.date().refine(date => date < new Date(), 'Date cannot be in the future'))
    .pipe(z.coerce.date().refine(date => {
      const age = Math.floor((new Date() - date) / (365.25 * 24 * 60 * 60 * 1000));
      return age >= 18;
    }, 'Must be at least 18 years old')),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=])/, 
      'Password must contain uppercase, lowercase, number, and special character'),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string()
    .trim()
    .min(1, 'Username or email is required'),
  
  password: z.string()
    .min(1, 'Password is required'),
});
```

```javascript
// schemas/financial.js
export const epfTransactionSchema = z.object({
  transactionDate: z.string()
    .pipe(z.coerce.date().refine(date => date <= new Date(), 'Date cannot be in the future')),
  
  mode: z.enum(['AUTO_SALARY', 'MANUAL_OVERRIDE']),
  
  basicDA: z.string()
    .optional()
    .transform(val => val ? parseAmount(val) : null)
    .pipe(z.number().min(0, 'Amount must be non-negative').max(99999999999, 'Amount too large')),
  
  // ... other fields with similar validation
});

export const goldSilverSchema = z.object({
  metalType: z.enum(['GOLD', 'SILVER']),
  
  purchaseDate: z.string()
    .pipe(z.coerce.date().refine(date => date <= new Date(), 'Date cannot be in the future')),
  
  netWeight: z.number()
    .positive('Weight must be positive')
    .max(10000, 'Weight cannot exceed 10,000 grams'),
  
  ratePerGram: z.number()
    .positive('Rate must be positive')
    .max(999999, 'Rate too high'),
  
  gstPercent: z.number()
    .min(0, 'GST cannot be negative')
    .max(28, 'GST cannot exceed 28%'),
});
```

---

## 2. Middleware: Normalization Pipeline

```javascript
// middleware/normalize.js

export const normalizeInput = {
  // Email normalization
  email(value) {
    if (!value || typeof value !== 'string') return value;
    return value.trim().toLowerCase();
  },

  // Phone normalization (Indian)
  phoneIndia(value) {
    if (!value || typeof value !== 'string') return value;
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.substring(1);
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.substring(digits.length - 10);
    }
    return digits;
  },

  // Username normalization
  username(value) {
    if (!value || typeof value !== 'string') return value;
    return value.trim().toLowerCase();
  },

  // Name normalization
  name(value) {
    if (!value || typeof value !== 'string') return value;
    return value.trim().normalize('NFKC').replace(/\s+/g, ' ');
  },

  // Amount parsing (handles L/Cr/K shortcuts)
  amount(value) {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return NaN;
    
    let cleaned = value.trim().replace(/[₹$€£¥,]/g, '');
    
    const shortcutMatch = cleaned.match(/^([\d.]+)\s*(L|Cr|K|Lakh|Crore|Thousand)?$/i);
    if (shortcutMatch) {
      const num = parseFloat(shortcutMatch[1]);
      const suffix = (shortcutMatch[2] || '').toLowerCase();
      const multipliers = {
        'l': 100000, 'lakh': 100000,
        'cr': 10000000, 'crore': 10000000,
        'k': 1000, 'thousand': 1000
      };
      return num * (multipliers[suffix] || 1);
    }
    
    return parseFloat(cleaned);
  },

  // Date normalization (ISO 8601)
  date(value) {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  },

  // PAN normalization
  pan(value) {
    if (!value || typeof value !== 'string') return value;
    return value.trim().toUpperCase().replace(/\s/g, '');
  },

  // IFSC normalization
  ifsc(value) {
    if (!value || typeof value !== 'string') return value;
    return value.trim().toUpperCase().replace(/\s/g, '');
  },

  // Account number normalization
  accountNumber(value) {
    if (!value || typeof value !== 'string') return value;
    return value.trim().replace(/[\s-]/g, '');
  },

  // Enum normalization
  enum(value, allowedValues) {
    if (!value) return value;
    const normalized = String(value).trim().toUpperCase();
    if (!allowedValues.includes(normalized)) return null;
    return normalized;
  },

  // Free text normalization (remarks, notes)
  text(value, { maxLength = 500, allowHtml = false } = {}) {
    if (!value || typeof value !== 'string') return '';
    let cleaned = value.trim().normalize('NFKC').replace(/\s+/g, ' ');
    if (!allowHtml) {
      cleaned = cleaned.replace(/<[^>]*>/g, ''); // Strip HTML
    }
    return cleaned.substring(0, maxLength);
  }
};
```

---

## 3. Database Schema Design

### 3.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Normalized identity fields
  name VARCHAR(100) NOT NULL,  -- Trimmed, Unicode normalized
  username VARCHAR(50) NOT NULL UNIQUE,  -- Lowercase
  email VARCHAR(254) NOT NULL UNIQUE,  -- Lowercase
  phone VARCHAR(10) NOT NULL UNIQUE,  -- 10-digit Indian format
  date_of_birth DATE NOT NULL,  -- ISO 8601 DATE type
  
  -- Security
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt/argon2 hash
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,  -- Soft delete
  deleted_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_email_format CHECK (email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
  CONSTRAINT chk_phone_format CHECK (phone ~ '^[6-9][0-9]{9}$'),
  CONSTRAINT chk_username_format CHECK (username ~ '^[a-z][a-z0-9_]{2,49}$'),
  CONSTRAINT chk_name_length CHECK (char_length(name) >= 2),
  CONSTRAINT chk_dob_reasonable CHECK (date_of_birth >= '1900-01-01' AND date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);

-- Indexes for normalized lookups
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_phone ON users (phone);
CREATE INDEX idx_users_username_lower ON users (LOWER(username));
```

### 3.2 Financial Transactions Table

```sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Transaction metadata
  transaction_type VARCHAR(50) NOT NULL,  -- EPF, PPF, FD, GOLD, SILVER, MF
  transaction_sub_type VARCHAR(50) NOT NULL,  -- CREDIT, DEBIT, SIP, LUMPSUM
  transaction_date DATE NOT NULL,  -- ISO 8601 DATE
  
  -- Amount (stored as DECIMAL for precision)
  amount DECIMAL(15,2) NOT NULL,  -- Always positive
  currency VARCHAR(3) DEFAULT 'INR',  -- ISO 4217
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, MATURED, REDEEMED, CLOSED
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_amount_max CHECK (amount <= 99999999999.99),
  CONSTRAINT chk_currency_iso CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_transaction_date CHECK (transaction_date <= CURRENT_DATE)
);

CREATE INDEX idx_transactions_user_date ON financial_transactions (user_id, transaction_date);
CREATE INDEX idx_transactions_type ON financial_transactions (transaction_type, transaction_sub_type);
```

### 3.3 Gold/Silver Holdings Table

```sql
CREATE TABLE gold_silver_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Metal info
  metal_type VARCHAR(10) NOT NULL CHECK (metal_type IN ('GOLD', 'SILVER')),
  
  -- Weight (3 decimal precision)
  net_weight DECIMAL(10,3) NOT NULL,
  purity VARCHAR(20),  -- e.g., '24K', '22K', '999'
  
  -- Pricing
  rate_per_gram DECIMAL(12,2) NOT NULL,
  purchase_amount DECIMAL(15,2) NOT NULL,
  current_market_rate DECIMAL(12,2),
  
  -- Charges
  making_charge_percent DECIMAL(5,2) DEFAULT 0,
  stone_other_charges DECIMAL(12,2) DEFAULT 0,
  gst_percent DECIMAL(5,2) DEFAULT 3,
  total_gst DECIMAL(12,2) DEFAULT 0,
  
  -- Dates
  purchase_date DATE NOT NULL,
  maturity_date DATE,
  
  -- Metadata
  purchased_from VARCHAR(100),
  purchase_item VARCHAR(200),
  remarks TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_weight_positive CHECK (net_weight > 0),
  CONSTRAINT chk_weight_max CHECK (net_weight <= 10000),
  CONSTRAINT chk_rate_positive CHECK (rate_per_gram > 0),
  CONSTRAINT chk_gst_range CHECK (gst_percent >= 0 AND gst_percent <= 28),
  CONSTRAINT chk_maturity_after_purchase CHECK (maturity_date IS NULL OR maturity_date > purchase_date)
);
```

### 3.4 Fixed Deposits Table

```sql
CREATE TABLE fixed_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Bank info
  bank_name VARCHAR(200) NOT NULL,
  holder_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(20),  -- Encrypted in production
  
  -- Amounts
  issue_amount DECIMAL(15,2) NOT NULL,
  maturity_amount DECIMAL(15,2),
  interest_rate DECIMAL(5,2) NOT NULL,
  
  -- Dates
  issue_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'ACTIVE',
  
  -- Metadata
  nominee VARCHAR(100),
  remarks TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_issue_amount_positive CHECK (issue_amount > 0),
  CONSTRAINT chk_interest_rate_range CHECK (interest_rate > 0 AND interest_rate <= 30),
  CONSTRAINT chk_maturity_after_issue CHECK (maturity_date > issue_date)
);
```

### 3.5 Audit Log Table

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Action details
  action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity_type VARCHAR(50) NOT NULL,  -- USER, TRANSACTION, etc.
  entity_id UUID,
  
  -- Changes (for updates)
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log (user_id, created_at);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);
```

---

## 4. Migration Strategy

### Phase 1: Add Normalization Layer (Backend)
- [ ] Add Zod schemas for all API endpoints
- [ ] Add normalization middleware
- [ ] Add validation before DB writes
- [ ] Don't change DB schema yet

### Phase 2: Add DB Constraints
- [ ] Add CHECK constraints on existing columns
- [ ] Add UNIQUE constraints on normalized fields
- [ ] Add proper column types (DATE, DECIMAL, BOOLEAN)
- [ ] Add audit_log table

### Phase 3: Data Migration
- [ ] Normalize existing data:
  - Lowercase all emails
  - Normalize all phone numbers to 10-digit
  - Convert all dates to ISO 8601
  - Convert all amounts to DECIMAL
- [ ] Verify data integrity after migration
- [ ] Update all queries to use normalized lookups

### Phase 4: Frontend Updates
- [ ] Add normalization utilities
- [ ] Update all forms to normalize before submission
- [ ] Add proper input modes
- [ ] Add real-time validation feedback

---

## 5. Security Checklist

### Input Sanitization
- [ ] Strip HTML tags from all text inputs
- [ ] Validate all inputs against allowlists
- [ ] Reject null bytes and control characters
- [ ] Use parameterized queries (NEVER string concatenation)
- [ ] Limit input length on all fields

### Sensitive Data
- [ ] Never log passwords (even hashed)
- [ ] Never log API secrets
- [ ] Encrypt PAN, Aadhaar, account numbers at rest
- [ ] Mask sensitive data in API responses
- [ ] Hash Aadhaar for lookup (don't store plaintext)

### Rate Limiting
- [ ] Login: 5 attempts per 15 minutes
- [ ] Password reset: 3 attempts per hour
- [ ] OTP verification: 5 attempts per 15 minutes
- [ ] Profile updates: 10 per hour
- [ ] Financial transactions: 100 per hour

### Audit Trail
- [ ] Log all authentication events
- [ ] Log all profile changes
- [ ] Log all financial mutations
- [ ] Log all data access (read operations on sensitive data)
- [ ] Retain logs for 8 years (IT Act requirement)

---

## 6. Performance Considerations

### Indexes
```sql
-- Normalized lookup indexes
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
CREATE INDEX idx_users_username_lower ON users (LOWER(username));
CREATE INDEX idx_users_phone ON users (phone);

-- Financial query indexes
CREATE INDEX idx_transactions_user_date ON financial_transactions (user_id, transaction_date);
CREATE INDEX idx_transactions_type_status ON financial_transactions (transaction_type, status);

-- Audit indexes
CREATE INDEX idx_audit_user_date ON audit_log (user_id, created_at);
CREATE INDEX idx_audit_action ON audit_log (action, created_at);
```

### Query Optimization
- Use normalized fields for WHERE clauses
- Use EXPLAIN ANALYZE to verify index usage
- Avoid leading wildcards in LIKE queries
- Use materialized views for complex reports

---

## 7. Testing Strategy

### Unit Tests
- [ ] Test each normalization function independently
- [ ] Test edge cases (empty strings, null, max length)
- [ ] Test invalid inputs (SQL injection, XSS patterns)
- [ ] Test normalization idempotency

### Integration Tests
- [ ] Test full API request → validation → normalization → DB flow
- [ ] Test duplicate detection (email, phone, username)
- [ ] Test concurrent updates
- [ ] Test rate limiting

### Security Tests
- [ ] SQL injection attempts on all fields
- [ ] XSS attempts on all text fields
- [ ] Overflow attempts on numeric fields
- [ ] Boundary value testing on all constraints

---

## 8. Reference: Complete Normalization Middleware

```javascript
// middleware/validation.js
import { z } from 'zod';
import { normalizeInput } from './normalize.js';

export function validate(schema) {
  return async (req, res, next) => {
    try {
      // Parse and validate
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      // Normalize and attach to request
      req.normalizedBody = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage in routes
router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, username, email, phoneNumber, dateOfBirth, password } = req.normalizedBody;
  
  // All inputs are now normalized and validated
  // Safe to use in DB operations
  const user = await createUser({
    name,
    username,
    email,
    phone: phoneNumber,
    dateOfBirth,
    passwordHash: await hashPassword(password)
  });
  
  res.status(201).json({ userId: user.id });
});
```

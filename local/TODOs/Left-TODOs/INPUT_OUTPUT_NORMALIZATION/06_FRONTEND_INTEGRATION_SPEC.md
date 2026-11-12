# Frontend Normalization & Client Validation Specification

> **Part of:** `INPUT_OUTPUT_NORMALIZATION` Suite  
> **Complements:** `01`–`05` Backend/DB specs and `FRONTEND_REFACTORING_IMPLEMENTATION.md`  
> **Standards:** ISO 8601, ISO 20022, E.164, RFC 5321/5322, WCAG 2.2 AA (SC 1.3.5, SC 3.3.1)

> **Implementation Status (verified 2026-09-19):** This entire spec is a **TARGET — nothing described below exists yet**. The migration source material is scattered inline in the current code:
> - `src/lib/formatters/`, `src/lib/validation/`, `src/components/ui/forms/CurrencyInput.jsx`, `PhoneInput.jsx`, `PanInput.jsx`, and the upgraded `FormField.jsx` do **not** exist. Current `FormField` lives in `components/calculators/framework/CalculatorComponents.jsx`.
> - Existing inline primitives to migrate, NOT delete: `formatCurrency`/`formatPercent`/`formatDateTime`/`getFinancialYear` in `src/lib/format.js`, `formatters` object in `src/utils/formatters.js` (orphaned in `FRONTEND_REFACTORING_IMPLEMENTATION.md` §1.1), `parseShortcutAmount`/`formatIndianCurrency`/`formatInIndianWords` in the EPF/PPF/Gold-Silver dialogs, `normalizeIdentifier` in `app/(access)/login/page.jsx`, and `formatters` in `src/lib/calculator.service.js`.
> - Zod/`react-hook-form` are NOT currently used in feature forms (package has `react-hook-form`, but feature dialogs use local state).
> - §4 matrix line-refs to dialogs are **approximate / UNVERIFIED**.

---

## 1. Architecture Overview

Client-side normalization serves two purposes:
1. **Frictionless User Experience (UX):** Automatic casing, format masking, shortcut parsing (`1.5L` → `₹1,50,000`), and real-time guidance.
2. **First Line of Defense:** Cleanse and format payloads before they hit the API gateway, ensuring the backend receives canonical data types.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ User Interaction                                                       │
│ (Raw keystrokes: "9876543210", "1.5l", "abcde1234f", "  john@GMAIL.com")│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Input Masking & Visual Presentation (UI State)                 │
│ - Displays: "+91 98765 43210", "₹1,50,000.00", "ABCDE1234F"             │
│ - Accessible inputmode: 'tel', 'decimal', 'numeric', 'email'            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 2: OnBlur / Pre-Submit Canonical Normalization                    │
│ - `normalizePhoneIndia` → "9876543210"                                  │
│ - `parseAmount` → 150000.00                                             │
│ - `normalizeEmail` → "john@gmail.com"                                   │
│ - `normalizePAN` → "ABCDE1234F"                                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Client-Side Zod Schema Validation                              │
│ - Checks bounds, formats, regexes, and required fields                  │
│ - Renders accessible error states if invalid (aria-invalid, role=alert) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Valid
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Transmission to API (JSON payload in canonical form)           │
│ - Amounts as numbers, dates as YYYY-MM-DD, phones as 10 digits/E.164    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Frontend Normalizers (`src/lib/validation/`)

These functions must be centralized in `src/lib/validation/` and reused across all forms and modals.

### 2.1 Identity Normalizers (`identity.js`)

```javascript
// src/lib/validation/identity.js

export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function normalizeUsername(username) {
  if (!username || typeof username !== 'string') return '';
  return username.trim().toLowerCase();
}

export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .normalize('NFKC')
    .replace(/\s+/g, ' ');
}

export function normalizePhoneIndia(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.substring(digits.length - 10);
  }
  return digits;
}

export function formatPhoneDisplay(phone) {
  const digits = normalizePhoneIndia(phone);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
}

export function sanitizeText(text, maxLength = 500) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .normalize('NFKC')
    .replace(/<[^>]*>/g, '') // Strip HTML
    .replace(/\s+/g, ' ')
    .substring(0, maxLength);
}
```

### 2.2 Financial Normalizers (`financial.js`)

```javascript
// src/lib/validation/financial.js

export function normalizePAN(pan) {
  if (!pan || typeof pan !== 'string') return '';
  return pan.trim().toUpperCase().replace(/\s/g, '');
}

export function validatePAN(pan) {
  const normalized = normalizePAN(pan);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalized)) {
    return 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
  }
  const entityType = normalized[3];
  if (!'CPHFATBLJG'.includes(entityType)) {
    return 'Invalid PAN: 4th character must represent a valid entity type';
  }
  return null;
}

export function normalizeIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') return '';
  return ifsc.trim().toUpperCase().replace(/\s/g, '');
}

export function validateIFSC(ifsc) {
  const normalized = normalizeIFSC(ifsc);
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalized)) {
    return 'Invalid IFSC code. Must be 4 letters, 0, and 6 alphanumeric characters';
  }
  return null;
}

export function normalizeAccountNumber(acc) {
  if (!acc || typeof acc !== 'string') return '';
  return acc.trim().replace(/[\s-]/g, '');
}

export function maskAccountNumber(acc) {
  const cleaned = normalizeAccountNumber(acc);
  if (cleaned.length < 4) return '****';
  return '•'.repeat(Math.max(0, cleaned.length - 4)) + cleaned.slice(-4);
}
```

---

## 3. Specialized Smart Input Components (`src/components/ui/forms/`)

### 3.1 Currency & Amount Input (`CurrencyInput.jsx`)
Handles user shortcuts (`1.5L`, `50k`, `2.5Cr`), shows real-time Indian words/formatted preview, and returns numeric rupees to the form state.

```jsx
// src/components/ui/forms/CurrencyInput.jsx
'use client';

import { useState, useEffect } from 'react';
import { parseAmount, formatCurrency, formatInIndianWords } from '@/lib/formatters/currency';
import { FormField } from '@/components/ui/forms/FormField';

export function CurrencyInput({ value, onChange, label, error, min, max, ...props }) {
  const [displayValue, setDisplayValue] = useState(value ? String(value) : '');

  useEffect(() => {
    if (value !== undefined && value !== null) {
      // Keep in sync if externally modified
      if (parseAmount(displayValue) !== value) {
        setDisplayValue(String(value));
      }
    }
  }, [value]);

  const parsed = parseAmount(displayValue);
  const isValidAmount = !isNaN(parsed) && parsed > 0;

  const handleBlur = () => {
    if (isValidAmount) {
      onChange?.(parsed);
      setDisplayValue(formatCurrency(parsed, { showSymbol: false }));
    }
  };

  const handleChange = (e) => {
    setDisplayValue(e.target.value);
    const num = parseAmount(e.target.value);
    if (!isNaN(num)) {
      onChange?.(num);
    }
  };

  return (
    <div className="space-y-1">
      <FormField
        label={label}
        prefix="₹"
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        hint={isValidAmount ? formatInIndianWords(parsed) : undefined}
        placeholder="e.g. 1.5L or 1,50,000"
        {...props}
      />
    </div>
  );
}
```

### 3.2 Indian Phone Number Input (`PhoneInput.jsx`)
Automatically manages `+91` prefix, masks spaces as the user types (`98765 43210`), and emits canonical 10-digit number.

```jsx
// src/components/ui/forms/PhoneInput.jsx
'use client';

import { FormField } from '@/components/ui/forms/FormField';
import { normalizePhoneIndia } from '@/lib/validation/identity';

export function PhoneInput({ value, onChange, label, error, ...props }) {
  const rawDigits = normalizePhoneIndia(value || '');

  const handleChange = (e) => {
    const digits = normalizePhoneIndia(e.target.value);
    if (digits.length <= 10) {
      onChange?.(digits);
    }
  };

  // Format as XXXXX XXXXX for display
  const displayFormatted = rawDigits.length > 5
    ? `${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`
    : rawDigits;

  return (
    <FormField
      label={label || 'Mobile Number'}
      prefix="+91"
      type="tel"
      inputMode="numeric"
      value={displayFormatted}
      onChange={handleChange}
      placeholder="98765 43210"
      maxLength={11} // 10 digits + 1 space
      error={error}
      {...props}
    />
  );
}
```

### 3.3 PAN Card Input (`PanInput.jsx`)
Enforces uppercase, 10-character limit, and instant 4th character structure check.

```jsx
// src/components/ui/forms/PanInput.jsx
'use client';

import { FormField } from '@/components/ui/forms/FormField';
import { normalizePAN } from '@/lib/validation/financial';

export function PanInput({ value, onChange, label, error, ...props }) {
  const handleChange = (e) => {
    const cleaned = normalizePAN(e.target.value);
    if (cleaned.length <= 10) {
      onChange?.(cleaned);
    }
  };

  return (
    <FormField
      label={label || 'PAN Card Number'}
      type="text"
      autoCapitalize="characters"
      value={value || ''}
      onChange={handleChange}
      placeholder="ABCDE1234F"
      maxLength={10}
      error={error}
      {...props}
    />
  );
}
```

---

## 4. Frontend Form Normalization Matrix

| Form / Screen | Field | Input Mode | Normalizer | Pre-Submit Format | Display Format |
|---|---|---|---|---|---|
| **Register / Profile** | `name` | `text` | `normalizeName` | NFKC, collapsed spaces | Title Case |
| **Register / Profile** | `username` | `text` | `normalizeUsername` | Lowercase alphanumeric | `@username` |
| **Register / Login** | `email` | `email` | `normalizeEmail` | Lowercase RFC 5322 | Lowercase |
| **Register / Profile** | `phone` | `tel` | `normalizePhoneIndia` | 10 digits (`9876543210`) | `+91 98765 43210` |
| **Register / Profile** | `dateOfBirth` | `date` | `toISODateString` | `YYYY-MM-DD` | `15 Mar 1995` |
| **EPF / PPF / FD** | `amount` | `decimal` | `parseAmount` | Number (`150000.00`) | `₹1,50,000.00` |
| **Gold / Silver** | `netWeight` | `decimal` | `parseFloat(val).toFixed(3)` | Number (`10.500`) | `10.500 g` |
| **Gold / Silver** | `ratePerGram` | `decimal` | `parseAmount` | Number (`7250.00`) | `₹7,250.00 /g` |
| **Fixed Deposit** | `interestRate` | `decimal` | `parseFloat(val).toFixed(2)` | Number (`7.10`) | `7.10%` |
| **Fixed Deposit** | `accountNumber` | `numeric` | `normalizeAccountNumber` | Raw string (digits) | `••••••••1234` |
| **Fixed Deposit** | `ifsc` | `text` | `normalizeIFSC` | 11 chars uppercase | `SBIN0001234` |
| **Mutual Funds** | `folioNumber` | `text` | Trim + Uppercase | Alphanumeric | `1234567/89` |
| **All Dialogs** | `remarks` | `text` | `sanitizeText` | Strip HTML, max 500 | Clean text |

---

## 5. Integration with React Hook Form & Zod

Every feature form should adopt the Zod schema boundary pattern:

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { normalizePhoneIndia, normalizeEmail } from '@/lib/validation/identity';
import { parseAmount } from '@/lib/formatters/currency';

const epfFormSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date'),
  mode: z.enum(['AUTO_SALARY', 'MANUAL_OVERRIDE']),
  employeeContribution: z.number().positive('Contribution must be greater than 0'),
  employerContribution: z.number().nonnegative(),
  remarks: z.string().max(500).optional(),
});

export function useEpfTransactionForm(onSubmit) {
  const form = useForm({
    resolver: zodResolver(epfFormSchema),
    defaultValues: {
      transactionDate: new Date().toISOString().split('T')[0],
      mode: 'AUTO_SALARY',
      employeeContribution: 0,
      employerContribution: 0,
      remarks: '',
    },
  });

  return form;
}
```

---

## 6. Implementation Checklist for OpenCode

- [ ] Create `src/lib/validation/identity.js` (Email, Phone, Name, Username, Bio).
- [ ] Create `src/lib/validation/financial.js` (PAN, IFSC, Account Number, Folio).
- [ ] Create `src/components/ui/forms/CurrencyInput.jsx` with real-time word conversion.
- [ ] Create `src/components/ui/forms/PhoneInput.jsx` with Indian mobile format masking.
- [ ] Create `src/components/ui/forms/PanInput.jsx` with uppercase formatting.
- [ ] Update `src/components/ui/forms/FormField.jsx` with `inputMode` and WCAG 2.2 error aria bindings.
- [ ] Retarget forms in EPF, PPF, FD, Gold/Silver, and Mutual Funds to use the new inputs.
- [ ] Verify zero NaN/float precision leakage in state or outgoing API requests.

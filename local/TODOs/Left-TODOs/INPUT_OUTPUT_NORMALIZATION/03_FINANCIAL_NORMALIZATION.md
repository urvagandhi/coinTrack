# Financial Inputs - Normalization Plan

> **Priority:** HIGH  
> **Files Affected:** EPF, PPF, Fixed Deposits, Gold/Silver, Mutual Funds, Broker Connection

---

## 1. Monetary Amounts

### Current State
- Amounts stored as strings or numbers
- Some use `type="text"` with shortcut parsing (L, Cr, K)
- No consistent rounding or precision rules
- Some fields use `type="number"` with `step="0.01"`

### Industry Standard
- **PCI DSS**: All monetary values must be validated server-side
- **OWASP**: Never trust client-side calculations for financial data
- **ISO 4217**: Currency codes and decimal precision (INR: 2 decimal places)
- **ISO 20022**: Structured monetary amounts in financial messages

### Normalization Rules

```
INPUT:  "1.5L" or "150000" or "1,50,000" or "₹1,50,000.50"
         ↓
STEP 1: Remove currency symbols (₹, $, etc.)
STEP 2: Remove comma formatting (Indian or international)
STEP 3: Parse shortcuts:
  - "L" or "Lakh" → multiply by 100000
  - "Cr" or "Crore" → multiply by 10000000
  - "K" or "Thousand" → multiply by 1000
STEP 4: Parse to float/decimal
STEP 5: Validate: not NaN, not Infinity
STEP 6: Validate: non-negative (unless explicitly allowed)
STEP 7: Round to 2 decimal places (for INR)
STEP 8: Store as DECIMAL(15,2) in database
STEP 9: For display: format with Indian comma grouping ₹1,50,000.00
```

### Validation
- Must be a valid number
- Must not be NaN or Infinity
- Must be non-negative (for amounts, weights, rates)
- Max value: 999,999,999,999.99 (12 digits + 2 decimals)
- Min value: 0.01 (for transaction amounts) or 0 (for weights)

### Storage
- **NEVER** use FLOAT for money (floating-point precision errors)
- Use DECIMAL(15,2) or store as INTEGER in paise/cents
- For INR: store as DECIMAL(15,2) or BIGINT paise

### Display
- Indian format: ₹1,50,000.00 (lakh-crore grouping)
- International format: ₹150,000.00 (thousand grouping)
- Always show exactly 2 decimal places for currency

### Files
- `components/epf/EpfTransactionDialog.jsx:266-406` - EPF amounts
- `components/ppf/PpfDialog.jsx:274-285` - PPF amounts
- `components/fixeddeposit/FdDialog.jsx:473-569` - FD amounts
- `components/goldsilver/GoldSilverDialog.jsx:233-369` - Gold/Silver amounts
- `app/(main)/mutual-fund/SipMandateModal.jsx:256-263` - SIP amounts
- `app/(main)/mutual-fund/SipContributionModal.jsx` - Contribution amounts
- `app/(main)/mutual-fund/LumpsumTransactionModal.jsx:367-377` - Lumpsum amounts
- `app/(main)/mutual-fund/RedemptionModal.jsx` - Redemption amounts

---

## 2. Dates (Financial Transactions)

### Current State
- All date inputs use `type="date"`
- No normalization before storage
- Some fields are optional (maturity date, end date)

### Industry Standard
- **ISO 8601**: All dates stored as `YYYY-MM-DD`
- **RBI**: Transaction dates must be accurate and auditable
- **SEBI**: Mutual fund transaction dates determine NAV applicability

### Normalization Rules

```
INPUT:  "2026-08-25" (from HTML5 date picker)
         ↓
STEP 1: Parse to Date object
STEP 2: Validate: not in future (for transaction dates)
STEP 3: Validate: not before account opening date
STEP 4: Validate: maturity date > issue date (for FD, PPF)
STEP 5: Convert to ISO 8601: "2026-08-25"
STEP 6: Store as DATE type (not VARCHAR)
STEP 7: For display: "25 Aug 2026" or "25/08/2026"
```

### Date Field Rules by Feature

| Feature | Date Field | Future Allowed? | Validation |
|---------|-----------|----------------|------------|
| EPF | transactionDate | No | Must be after account start |
| PPF | transactionDate | No | Must be after account start |
| FD | issueDate | No | Must be valid date |
| FD | maturityDate | Yes | Must be after issueDate |
| Gold/Silver | purchaseDate | No | Must be valid date |
| Gold/Silver | maturityDate | Yes | Must be after purchaseDate |
| MF SIP | startDate | Yes | Must be valid date |
| MF SIP | endDate | Yes | Must be after startDate |
| MF SIP | investmentDate | No | Must be valid date |
| MF Lumpsum | investmentDate | No | Must be valid date |
| MF Redemption | redemptionDate | No | Must be after first investment |

### Files
- `components/epf/EpfTransactionDialog.jsx:234-240`
- `components/ppf/PpfDialog.jsx:244-249`
- `components/fixeddeposit/FdDialog.jsx:441-457`
- `components/goldsilver/GoldSilverDialog.jsx:192-197,382-387`
- `app/(main)/mutual-fund/SipMandateModal.jsx:245-294`
- `app/(main)/mutual-fund/SipContributionModal.jsx` - investmentDate
- `app/(main)/mutual-fund/LumpsumTransactionModal.jsx:338-345`
- `app/(main)/mutual-fund/RedemptionModal.jsx:318-324`

---

## 3. Percentage Rates

### Current State
- Interest rates, contribution rates, GST rates
- Mixed input types: `type="number"` with `step="0.01"`
- Some have min/max validation

### Industry Standard
- **ISO 8601-2**: Decimal representation of percentages
- **OWASP**: Validate range before processing

### Normalization Rules

```
INPUT:  "12" or "12%" or "0.12"
         ↓
STEP 1: Remove "%" symbol if present
STEP 2: Parse to decimal number
STEP 3: Determine format:
  - If > 1: assume percentage → store as-is (12 means 12%)
  - If <= 1: could be decimal (0.12 = 12%) or actual percentage (0.5%)
STEP 4: Validate range based on context:
  - EPF contribution rate: 8-12%
  - Interest rate: 0-30%
  - GST: 0-28%
  - Premium: 0-100%
STEP 5: Round to 2 decimal places
STEP 6: Store as DECIMAL(5,2)
STEP 7: For display: "12.00%" or "12%"
```

### Validation by Context

| Field | Min | Max | Step | Example |
|-------|-----|-----|------|---------|
| EPF contribution rate | 8 | 12 | 1 | 12% |
| PPF interest rate | 0 | 15 | 0.1 | 7.1% |
| FD interest rate | 0 | 30 | 0.01 | 6.85% |
| GST percent | 0 | 28 | 0.01 | 3% |
| Making charge % | 0 | 100 | 0.01 | 12% |
| Metal premium % | 0 | 100 | 0.01 | 5% |

### Files
- `components/epf/EpfSettingsDialog.jsx:122-130` - EPF rate
- `components/goldsilver/GoldSilverDialog.jsx:340-369` - GST, making charges
- `components/goldsilver/RateSettingsDialog.jsx:210-288` - Premium rates
- `components/fixeddeposit/FdDialog.jsx:501-509` - FD interest rate

---

## 4. Weights (Gold/Silver)

### Current State
- Input: `type="number"`, `step="0.001"`
- Unit: grams (implied)

### Industry Standard
- **Precious metals**: Weight in grams with 3 decimal precision
- **BIS hallmarking**: Net weight in grams

### Normalization Rules

```
INPUT:  "10.5" or "10.500"
         ↓
STEP 1: Parse to decimal
STEP 2: Validate: positive number
STEP 3: Validate range: 0.001 - 10000 grams (reasonable for jewelry)
STEP 4: Round to 3 decimal places
STEP 5: Store as DECIMAL(10,3)
STEP 6: For display: "10.500 g" or "10.5 g"
```

### Validation
- Min: 0.001 grams
- Max: 10000 grams (10 kg, reasonable max)
- Step: 0.001
- Must be positive

### Files
- `components/goldsilver/GoldSilverDialog.jsx:233-241` - netWeight

---

## 5. Account Numbers & Financial Identifiers

### PAN Card Number
```
FORMAT:  AAAAA9999A (10 characters)
REGEX:   ^[A-Z]{5}[0-9]{4}[A-Z]$
EXAMPLE: ABCDE1234F

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Convert to uppercase
  STEP 3: Remove any spaces or hyphens
  STEP 4: Validate length: exactly 10
  STEP 5: Validate format: 5 letters + 4 digits + 1 letter
  STEP 6: Validate 4th character: one of [C,P,H,F,A,T,B,L,J,G]
  STEP 7: Store as uppercase string
```

### IFSC Code
```
FORMAT:  AAAA0AAAAAA (11 characters)
REGEX:   ^[A-Z]{4}0[A-Z0-9]{6}$
EXAMPLE: SBIN0125620

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Convert to uppercase
  STEP 3: Remove any spaces or hyphens
  STEP 4: Validate length: exactly 11
  STEP 5: Validate format: 4 letters + "0" + 6 alphanumeric
  STEP 6: Store as uppercase string
```

### Bank Account Number
```
FORMAT:  Varies by bank (9-18 digits typically)
REGEX:   ^[0-9]{9,18}$ (after normalization)

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Remove spaces, hyphens, dots
  STEP 3: Validate: numeric only
  STEP 4: Validate length: 9-18 digits
  STEP 5: Store as string (preserve leading zeros)
  STEP 6: NEVER log or expose full account number
  STEP 7: For display: show only last 4 digits (XXXX1234)
```

### UPI ID
```
FORMAT:  username@bank (e.g., john@oksbi)
REGEX:   ^[a-zA-Z0-9._-]+@[a-zA-Z]+$

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Convert to lowercase
  STEP 3: Validate format: handle@provider
  STEP 4: Validate handle: alphanumeric, dots, hyphens, underscores
  STEP 5: Validate provider: alphabetic only
  STEP 6: Store as lowercase
```

### Aadhaar Number
```
FORMAT:  12 digits
REGEX:   ^[0-9]{12}$
EXAMPLE: 123456789012

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Remove spaces, hyphens
  STEP 3: Validate: exactly 12 digits
  STEP 4: Validate: Verhoeff checksum (optional, advanced)
  STEP 5: Store as string (preserve leading zeros)
  STEP 6: NEVER store full Aadhaar - hash it for lookup
  STEP 7: For display: show as XXXX XXXX 1234 (last 4 visible)
```

### Folio Number (Mutual Fund)
```
FORMAT:  Alphanumeric, varies by AMC
REGEX:   ^[A-Z0-9]{6,20}$

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Convert to uppercase
  STEP 3: Remove spaces and special characters
  STEP 4: Validate length: 6-20 characters
  STEP 5: Store as uppercase string
```

### FD/RD Account Number
```
FORMAT:  Alphanumeric, varies by bank
REGEX:   ^[A-Z0-9]{6,20}$

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Convert to uppercase
  STEP 3: Remove spaces
  STEP 4: Validate length: 6-20 characters
  STEP 5: Store as uppercase string
```

### PPF Account Number
```
FORMAT:  Alphanumeric, varies by bank
REGEX:   ^[A-Z0-9]{6,20}$

NORMALIZATION:
  STEP 1: Trim whitespace
  STEP 2: Convert to uppercase
  STEP 3: Remove spaces
  STEP 4: Validate length: 6-20 characters
  STEP 5: Store as uppercase string
```

---

## 6. Broker API Credentials

### Current State
- API Key: `type="text"`, required
- API Secret: `type="password"`, required
- No normalization

### Normalization Rules

```
API KEY:
  STEP 1: Trim whitespace
  STEP 2: Validate: non-empty string
  STEP 3: Validate max length: 100 characters
  STEP 4: NEVER log or expose in responses
  STEP 5: Encrypt before storage (AES-256)
  STEP 6: For display: show only last 4 characters (XXXX1234)

API SECRET:
  STEP 1: Trim whitespace
  STEP 2: Validate: non-empty string
  STEP 3: Validate max length: 100 characters
  STEP 4: NEVER log or expose in responses
  STEP 5: Encrypt before storage (AES-256)
  STEP 6: For display: show as "************" (all masked)
```

### Security Rules
- Encrypt API credentials at rest (AES-256-GCM)
- Never return full credentials in API responses
- Log access to credentials (audit trail)
- Rotate encryption keys periodically
- Never store in plaintext

### Files
- `components/brokers/ConnectBrokerDialog.jsx:90-111`

---

## 7. Transaction Types & Enums

### Current State
- Mixed usage: strings, select dropdowns
- No consistent enum values

### Normalization Rules

```
ENUM NORMALIZATION:
  All enum values should be:
  1. UPPERCASE_SNAKE_CASE
  2. Consistent across frontend and backend
  3. Validated against allowed values list
  4. Stored as VARCHAR with CHECK constraint

EPF MODES:
  - AUTO_SALARY
  - MANUAL_OVERRIDE

PPF ENTRY TYPES:
  - CREDIT
  - DEBIT

PPF PARTICULAR TYPES:
  - DEPOSIT
  - INTEREST
  - WITHDRAWAL
  - LOAN

GOLD/SILVER METAL TYPE:
  - GOLD
  - SILVER

MF TRANSACTION TYPES:
  - SIP
  - LUMPSUM
  - REDEMPTION
  - SWITCH
```

---

## 8. Remarks / Notes Fields

### Current State
- Free text inputs across all financial dialogs
- No validation or max length enforcement

### Normalization Rules

```
INPUT:  "  Monthly  contribution   for  August 2026  "
         ↓
STEP 1: Trim leading/trailing whitespace
STEP 2: Collapse multiple spaces to single space
STEP 3: Sanitize: strip HTML tags
STEP 4: Enforce max length: 500 characters
STEP 5: Validate: no special injection characters
STEP 6: Store as TEXT
STEP 7: For display: escape HTML entities
```

### Validation
- Max: 500 characters
- Allowed: Unicode letters, numbers, spaces, basic punctuation
- Reject: HTML tags, script injection, null bytes

### Files
- `components/epf/EpfTransactionDialog.jsx:420-426`
- `components/ppf/PpfDialog.jsx:342-347`
- `components/fixeddeposit/FdDialog.jsx:611-616`
- `components/goldsilver/GoldSilverDialog.jsx:391-396`
- All MF modals (remarks field)

---

## 9. Bank Name / Institution Name

### Current State
- Uses `<BankSearchCombobox>` component
- Searchable dropdown with API autocomplete

### Normalization Rules

```
INPUT:  "State Bank of India" or "SBI"
         ↓
STEP 1: Trim whitespace
STEP 2: Title case: "State Bank of India"
STEP 3: Validate against known bank list
STEP 4: Store canonical name (not abbreviation)
STEP 5: Store bank code (IFSC prefix) if available
```

### Files
- `components/ui/BankSearchCombobox.jsx:92`
- `components/fixeddeposit/FdDialog.jsx:397-400`
- `app/(main)/mutual-fund/NewSchemeModal.jsx:231-234`

---

## 10. Mutual Fund Scheme Name

### Current State
- Uses `<SchemeSearchCombobox>` component
- AMFI API search

### Normalization Rules

```
INPUT:  "HDFC Mid-Cap Opportunities Fund - Growth"
         ↓
STEP 1: Trim whitespace
STEP 2: Store full scheme name as-is (legal name)
STEP 3: Store AMFI code (unique identifier)
SEBI category: auto-extracted from scheme name
STEP 4: Validate against AMFI database
```

### Files
- `components/ui/SchemeSearchCombobox.jsx:126`
- `app/(main)/mutual-fund/NewSchemeModal.jsx:163-175`

---

## 11. Implementation Checklist

### Frontend
- [ ] Create shared `parseAmount()` utility (handles L/Cr/K shortcuts)
- [ ] Create shared `formatCurrency()` utility (Indian grouping)
- [ ] Create shared `normalizePAN()` utility
- [ ] Create shared `normalizeIFSC()` utility
- [ ] Create shared `normalizeAccountNumber()` utility
- [ ] Add `inputmode="decimal"` for all monetary inputs
- [ ] Add `inputmode="numeric"` for integer inputs
- [ ] Show normalized preview before save
- [ ] Disable save until validation passes

### Backend
- [ ] Add Zod schemas for all financial endpoints
- [ ] Validate amounts server-side (reject negative, NaN, Infinity)
- [ ] Store amounts as DECIMAL, not FLOAT
- [ ] Validate dates server-side (not in future, valid ranges)
- [ ] Validate financial identifiers (PAN, IFSC format)
- [ ] Encrypt broker API credentials at rest
- [ ] Log all financial mutations in audit trail

### Database
- [ ] Use DECIMAL(15,2) for monetary amounts
- [ ] Use DECIMAL(10,3) for weights
- [ ] Use DECIMAL(5,2) for percentages
- [ ] Use DATE type for all date columns
- [ ] Add CHECK constraints on enum values
- [ ] Add CHECK constraints on amount ranges
- [ ] Add indexes on normalized financial identifiers

---

## 12. Reference: Amount Parser

```javascript
// utils/financial.js

export function parseAmount(input) {
  if (typeof input === 'number') return input;
  if (!input || typeof input !== 'string') return NaN;
  
  let cleaned = input.trim();
  
  // Remove currency symbols
  cleaned = cleaned.replace(/[₹$€£¥]/g, '');
  
  // Remove comma formatting (Indian: 1,50,000 or International: 150,000)
  cleaned = cleaned.replace(/,/g, '');
  
  // Parse shortcuts
  const shortcutMatch = cleaned.match(/^([\d.]+)\s*(L|Cr|K|Lakh|Crore|Thousand)?$/i);
  if (shortcutMatch) {
    const value = parseFloat(shortcutMatch[1]);
    const suffix = (shortcutMatch[2] || '').toLowerCase();
    const multipliers = {
      'l': 100000, 'lakh': 100000,
      'cr': 10000000, 'crore': 10000000,
      'k': 1000, 'thousand': 1000
    };
    return value * (multipliers[suffix] || 1);
  }
  
  return parseFloat(cleaned);
}

export function formatCurrency(amount, currency = 'INR') {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
  
  // Indian formatting
  if (currency === 'INR') {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return formatted;
  }
  
  // International formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function normalizePAN(pan) {
  if (!pan || typeof pan !== 'string') return null;
  const cleaned = pan.trim().toUpperCase().replace(/\s/g, '');
  if (cleaned.length !== 10) return null;
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned)) return null;
  // Validate 4th character (holder type)
  const holderType = cleaned[3];
  if (!'CPHFATBLJG'.includes(holderType)) return null;
  return cleaned;
}

export function normalizeIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') return null;
  const cleaned = ifsc.trim().toUpperCase().replace(/\s/g, '');
  if (cleaned.length !== 11) return null;
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleaned)) return null;
  return cleaned;
}

export function normalizeAccountNumber(acc) {
  if (!acc || typeof acc !== 'string') return null;
  const cleaned = acc.trim().replace(/[\s-]/g, '');
  if (!/^[0-9]{9,18}$/.test(cleaned)) return null;
  return cleaned; // Preserve as string (may have leading zeros)
}

export function maskAccountNumber(acc) {
  if (!acc || acc.length < 4) return '****';
  return '*'.repeat(acc.length - 4) + acc.slice(-4);
}
```

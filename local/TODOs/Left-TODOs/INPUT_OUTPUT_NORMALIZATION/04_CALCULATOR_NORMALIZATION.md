# Calculator Inputs - Normalization Plan

> **Priority:** MEDIUM  
> **Files Affected:** 32+ calculator pages, shared FormField component

---

## 1. Overview

The calculator section contains 32+ pages with 100+ number inputs. All share a common `<FormField>` component from `components/calculators/framework/CalculatorComponents.jsx`.

### Current State
- All calculator inputs use `type="number"` via `<FormField>`
- `FormField` accepts: `type`, `label`, `prefix`, `suffix`, `min`, `max`, `step`, `placeholder`
- No normalization before calculation
- Results are display-only (no storage)

### Industry Standard
- **OWASP**: All numeric inputs must be validated (range, type, bounds)
- **WCAG 2.2 SC 1.3.5**: Use `inputmode` attributes for proper mobile keyboards
- **ISO 80000-1**: Use SI units for all physical quantities

---

## 2. Input Categories

### 2.1 Monetary Inputs (₹)
**Used in:** EMI, SIP, Lumpsum, Home Loan, Car Loan, Retirement, etc.

```
NORMALIZATION:
  STEP 1: Parse to number
  STEP 2: Validate: not NaN, not negative
  STEP 3: Validate range: 0 < amount <= 999,999,999,999
  STEP 4: Round to 2 decimal places
  STEP 5: Store as number (not string)
  STEP 6: For display: Indian format ₹1,50,000
```

**Validation by Calculator:**

| Calculator | Field | Min | Max | Step |
|-----------|-------|-----|-----|------|
| SIP | Monthly Investment | 500 | 1,50,000 | 100 |
| Lumpsum | Investment Amount | 1,000 | 99,99,99,999 | 1 |
| EMI | Principal | 1,000 | 99,99,99,999 | 1 |
| Home Loan EMI | Principal | 1,00,000 | 99,99,99,999 | 1 |
| Car Loan EMI | Principal | 1,000 | 99,99,99,999 | 1 |
| Retirement | Current Savings | 0 | 99,99,99,999 | 1 |
| SSY | Yearly Investment | 250 | 1,50,000 | 500 |

### 2.2 Interest Rate Inputs (%)
**Used in:** All loan calculators, SIP, FD, PPF, etc.

```
NORMALIZATION:
  STEP 1: Parse to number
  STEP 2: Validate: not NaN
  STEP 3: Validate range: 0 < rate <= 50 (reasonable max)
  STEP 4: Round to 2 decimal places
  STEP 5: For calculation: convert to decimal (12% → 0.12)
```

**Validation by Calculator:**

| Calculator | Field | Min | Max | Step |
|-----------|-------|-----|-----|------|
| SIP | Expected Return | 1 | 50 | 0.1 |
| EMI | Interest Rate | 0.1 | 50 | 0.1 |
| FD | Interest Rate | 0.1 | 30 | 0.01 |
| PPF | Interest Rate | 0.1 | 15 | 0.1 |
| SSY | Interest Rate | 0.1 | 15 | 0.1 |
| Simple Interest | Rate | 0.1 | 100 | 0.1 |
| Compound Interest | Rate | 0.1 | 100 | 0.1 |

### 2.3 Time Period Inputs
**Used in:** SIP, EMI, FD, PPF, SSY, etc.

```
NORMALIZATION:
  STEP 1: Parse to number
  STEP 2: Validate: not NaN, positive integer or decimal
  STEP 3: Validate range: depends on context
  STEP 4: Convert to common unit (years or months)
```

**Validation by Calculator:**

| Calculator | Field | Unit | Min | Max |
|-----------|-------|------|-----|-----|
| SIP | Time Period | Years | 1 | 50 |
| EMI | Tenure | Months | 1 | 360 |
| FD | Tenure | Years | 1 | 30 |
| PPF | Tenure | Years | 1 | 15 |
| SSY | Girl's Age | Years | 0 | 10 |
| Retirement | Years to Retirement | Years | 1 | 50 |

### 2.4 Tax Inputs
**Used in:** Income Tax, Salary Calculator, HRA, TDS, GST, Gratuity

```
NORMALIZATION:
  STEP 1: Parse to number
  STEP 2: Validate: not NaN
  STEP 3: Validate range: 0 <= amount <= 99,99,99,999
  STEP 4: Round to 2 decimal places
```

**Validation by Calculator:**

| Calculator | Field | Min | Max |
|-----------|-------|-----|-----|
| Income Tax | Gross Income | 0 | 99,99,99,999 |
| Income Tax | Deductions | 0 | 99,99,99,999 |
| Salary | Basic Salary | 0 | 99,99,99,999 |
| HRA | Basic Salary | 0 | 99,99,99,999 |
| HRA | HRA Received | 0 | 99,99,99,999 |
| HRA | Rent Paid | 0 | 99,99,99,999 |
| GST | Amount | 0 | 99,99,99,999 |
| Gratuity | Basic Salary | 0 | 99,99,99,999 |
| TDS | Salary Amount | 0 | 99,99,99,999 |

### 2.5 Weight/Quantity Inputs
**Used in:** Stock Average Calculator

```
NORMALIZATION:
  STEP 1: Parse to number
  STEP 2: Validate: not NaN, positive
  STEP 3: Validate range: 0 < quantity <= 99,99,999
  STEP 4: Round to integer (shares are whole units)
```

### 2.6 Age Inputs
**Used in:** SSY, Retirement, Age Calculator

```
NORMALIZATION:
  STEP 1: Parse to integer
  STEP 2: Validate: not NaN, positive
  STEP 3: Validate range: 0 <= age <= 120
  STEP 4: Store as integer
```

---

## 3. Shared FormField Component

### Current Implementation
```jsx
// components/calculators/framework/CalculatorComponents.jsx
function FormField({ type = 'number', label, prefix, suffix, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <div className="input-group">
        {prefix && <span>{prefix}</span>}
        <input type={type} {...props} />
        {suffix && <span>{suffix}</span>}
      </div>
    </div>
  );
}
```

### Required Updates

```jsx
// Updated FormField with normalization
function FormField({ 
  type = 'number', 
  label, 
  prefix, 
  suffix, 
  min, 
  max, 
  step,
  inputMode,  // NEW: 'numeric' or 'decimal'
  normalize,  // NEW: normalization function
  validate,   // NEW: validation function
  ...props 
}) {
  const handleChange = (e) => {
    let value = e.target.value;
    
    // Apply normalization
    if (normalize) {
      value = normalize(value);
    }
    
    // Validate
    if (validate) {
      const error = validate(value);
      if (error) {
        showError(error);
        return;
      }
    }
    
    props.onChange?.(value);
  };
  
  return (
    <div>
      <label>{label}</label>
      <div className="input-group">
        {prefix && <span>{prefix}</span>}
        <input 
          type={type} 
          inputMode={inputMode || (type === 'number' ? 'decimal' : undefined)}
          min={min}
          max={max}
          step={step}
          {...props}
          onChange={handleChange}
        />
        {suffix && <span>{suffix}</span>}
      </div>
    </div>
  );
}
```

---

## 4. Input Mode Attributes

### WCAG 2.2 SC 1.3.5 - Identify Input Purpose

| Input Type | `inputMode` | Mobile Keyboard |
|-----------|-------------|-----------------|
| Currency (₹) | `decimal` | Numeric with decimal |
| Interest Rate (%) | `decimal` | Numeric with decimal |
| Time Period (years) | `numeric` | Numeric only |
| Age | `numeric` | Numeric only |
| Quantity (shares) | `numeric` | Numeric only |
| Weight (grams) | `decimal` | Numeric with decimal |
| Percentage | `decimal` | Numeric with decimal |

### Files to Update
- `components/calculators/framework/CalculatorComponents.jsx` - FormField component
- All 32+ calculator page files

---

## 5. Calculation Precision

### Problem
Floating-point arithmetic produces errors:
```javascript
0.1 + 0.2 = 0.30000000000000004  // WRONG
```

### Solution
Use integer arithmetic for money (paise):
```javascript
// Store as paise
const amount1 = 15000000; // ₹1,50,000.00
const amount2 = 7500000;  // ₹75,000.00
const sum = amount1 + amount2; // 22500000
// Display: ₹2,25,000.00
```

Or use `Intl.NumberFormat` for display:
```javascript
const display = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(amount / 100); // Convert paise to rupees
```

### Rounding Rules
- **EMI**: Round to nearest rupee (Math.round)
- **Interest**: Round to 2 decimal places
- **Tax**: Round to nearest rupee (per IT Act)
- **GST**: Round to 2 decimal places
- **Investment**: Round to nearest rupee

---

## 6. Error Messages

### Standardized Error Format
All calculator errors should follow:
```
[FieldName] must be between [min] and [max] [unit]

Examples:
"Monthly Investment must be between ₹500 and ₹1,50,000"
"Interest Rate must be between 0.1% and 50%"
"Time Period must be between 1 and 50 years"
"Amount cannot be negative"
"Please enter a valid number"
```

### WCAG 2.2 SC 3.3.1 - Error Identification
- Errors must identify the field
- Errors must describe the constraint
- Errors must be visible (not just color change)

---

## 7. Implementation Checklist

### Shared Component
- [ ] Update `FormField` to accept `inputMode`, `normalize`, `validate` props
- [ ] Add real-time validation on blur
- [ ] Show error messages below input
- [ ] Disable calculate button until all inputs valid

### Each Calculator Page
- [ ] Add min/max/step to all FormField instances
- [ ] Add inputMode to all numeric inputs
- [ ] Add normalization functions for monetary inputs
- [ ] Add validation functions for all fields
- [ ] Add error message display

### Calculation Logic
- [ ] Use integer arithmetic for money (paise)
- [ ] Round results appropriately
- [ ] Handle edge cases (zero, max values)
- [ ] Validate inputs before calculation

---

## 8. Reference: Calculator Input Validators

```javascript
// utils/calculatorValidation.js

export const validators = {
  currency(value, { min = 0, max = 99999999999 } = {}) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid amount';
    if (num < min) return `Amount must be at least ₹${min.toLocaleString('en-IN')}`;
    if (num > max) return `Amount cannot exceed ₹${max.toLocaleString('en-IN')}`;
    return null;
  },

  interestRate(value, { min = 0.1, max = 50 } = {}) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid rate';
    if (num < min) return `Rate must be at least ${min}%`;
    if (num > max) return `Rate cannot exceed ${max}%`;
    return null;
  },

  timePeriod(value, { min = 1, max = 50, unit = 'years' } = {}) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid time period';
    if (num < min) return `Time period must be at least ${min} ${unit}`;
    if (num > max) return `Time period cannot exceed ${max} ${unit}`;
    return null;
  },

  age(value, { min = 0, max = 120 } = {}) {
    const num = parseInt(value);
    if (isNaN(num)) return 'Please enter a valid age';
    if (num < min) return `Age must be at least ${min}`;
    if (num > max) return `Age cannot exceed ${max}`;
    return null;
  },

  percentage(value, { min = 0, max = 100 } = {}) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid percentage';
    if (num < min) return `Percentage must be at least ${min}%`;
    if (num > max) return `Percentage cannot exceed ${max}%`;
    return null;
  }
};

export const normalizers = {
  currency(value) {
    // Remove currency symbols and commas
    const cleaned = String(value).replace(/[₹$€£¥,]/g, '');
    return cleaned;
  },

  percentage(value) {
    // Remove % symbol
    const cleaned = String(value).replace(/%/g, '');
    return cleaned;
  },

  integer(value) {
    // Remove decimals
    return parseInt(value) || '';
  }
};
```

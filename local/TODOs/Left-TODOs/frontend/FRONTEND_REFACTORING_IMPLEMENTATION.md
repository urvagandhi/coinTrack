# Master Frontend Refactoring & Architecture Implementation Guide

> **Target:** `coinTrack/frontend` (Next.js 16.2.6 App Router, JavaScript, Tailwind CSS, shadcn/ui, TanStack Query)  
> **Standard:** Enterprise Fintech 2026 (RBI/SEBI/KYC, ISO 8601, ISO 20022, E.164, RFC 5321/5322, OWASP ASVS v4.0, WCAG 2.2 AA)  
> **Execution Model:** Step-by-step for OpenCode / Soldier Agents. Each step is atomic, testable, and non-breaking.

---

## Executive Summary & Architecture Blueprint

This document unifies three critical initiatives:
1. **Frontend Audit Remediation (`frontend-audit.md`):** Component deduplication, dead code purge, 23 modal refactors, and Radix/shadcn alignment.
2. **Fintech Visual & Interaction Standards (`FINTECH-RESEARCH.md`):** Dual-theme obsidian/paper identity, tabular numerals (`tnum`), strict token-based gain/loss contrast, and zero-trust presentation boundaries.
3. **Input/Output Normalization (`INPUT_OUTPUT_NORMALIZATION`):** Strict canonical formatting, Zod boundary validation, E.164 phones, PAN/IFSC rules, and integer paise/decimal handling.

### Current Implementation (as of audit date)

```
src/
├── app/
│   ├── layout.js                      # Root layout (Client - providers, metadata)
│   ├── page.jsx                       # Landing (Client)
│   ├── (access)/                      # Public auth routes (Client layouts + pages)
│   │   ├── layout.js                  # Client - auth redirect
│   │   ├── login/layout.js            # Server - exports title metadata
│   │   ├── register/layout.js         # Server - exports title metadata
│   │   ├── forgot-password/layout.js  # Server - exports title metadata
│   │   └── ...
│   ├── (main)/                        # Protected routes (Client layout with AuthGuard)
│   │   ├── layout.js                  # Client - AuthGuard + MainLayout
│   │   ├── dashboard/
│   │   ├── portfolio/
│   │   ├── mutual-fund/
│   │   ├── fixed-deposit/
│   │   ├── gold-silver/
│   │   ├── epf/
│   │   ├── ppf/
│   │   └── profile/
│   ├── calculators/                   # Public SEO surface (ALL Client pages)
│   │   ├── layout.jsx                 # Client - masthead, breadcrumb, footer
│   │   └── **/page.jsx                # 32+ Client calculator pages
│   ├── api/ifsc/route.js              # Server route handler (proxy)
│   └── api/mf-search/route.js         # Server route handler (proxy)
│
├── components/
│   ├── ui/
│   │   ├── primitives/                # 21 components (Button, Card, Dialog, Badge, etc.)
│   │   ├── feedback/                  # 7 components (Sonner, Skeleton, PageTransition, etc.)
│   │   ├── forms/                     # 5 components (Dropdown, CurrencyStepper, etc.)
│   │   ├── search/                    # 3 components (BankSearchCombobox, SchemeSearchCombobox)
│   │   ├── data-display/              # 2 components (AnnouncementCard, Chart)
│   │   └── auth/                      # 2 components (LoginScreen, SecurityInputs)
│   ├── epf/                           # EpfTransactionDialog, EpfSettingsDialog, EpfInterestRateDialog
│   ├── ppf/                           # PpfDialog, PpfSettingsDialog
│   ├── fixeddeposit/                  # FdDialog, WithdrawDialog
│   ├── goldsilver/                    # GoldSilverDialog, RateSettingsDialog, MarketRateDialog
│   ├── mutual-fund/                   # 8 modals + components
│   ├── brokers/                       # ConnectBrokerDialog (legacy)
│   ├── modals/                        # ContactModal, LegalModals
│   ├── portfolio/                     # HoldingsTab, PositionsTab, OrdersTab, TradesTab, ProfileTab
│   ├── auth-guards/                   # AuthGuard
│   └── layout/                        # MainLayout
│
├── lib/
│   ├── format.js                      # formatCurrency, formatPercent, formatDateTime, getFinancialYear
│   ├── calculator.service.js          # 30+ calculator API methods + 3 formatters (0dp currency!)
│   ├── api.js                         # Axios instance (1401 lines, JWT interceptors)
│   ├── brokerConfig.js                # Broker accent colors
│   ├── formatters.js                  # 257-line ORPHAN (duplicate currency/date/percent)
│   └── utils.js                       # cn() class merger
│
├── hooks/                             # 8 portfolio hooks + useZerodhaDashboard (stub)
├── contexts/                          # AuthContext, ModalContext
├── providers/                         # ThemeProvider, QueryProvider
└── middleware.js                      # ❌ DOES NOT EXIST (planned for Phase 6)
```

### Target Architecture (Post-Refactor) — **UNVERIFIED / NEEDS IMPLEMENTATION**

```
src/
├── app/                               # 📁 PURE ROUTING LAYER (Server Layouts + thin Client pages)
│   ├── (access)/                      # Public auth routes (Server layouts with noindex metadata)
│   ├── (main)/                        # Protected routes (Server layout with noindex robots)
│   ├── calculators/                   # Public SEO Surface (Server layouts + metadata)
│   ├── robots.js                      # Crawler directives (Search engines + AI crawlers)
│   ├── sitemap.js                     # Dynamic sitemap (Calculators + Landing)
│   ├── manifest.js                    # PWA Web App Manifest
│   └── opengraph-image.jsx            # Dynamic OG Image generator
│
├── features/                          # 📦 DOMAIN BUSINESS LOGIC (Feature-Sliced Design) — NOT YET CREATED
│   ├── auth/                          # Authentication (Screens, 2FA, OAuth, Session)
│   ├── portfolio/                     # Wealth aggregation & multi-broker P&L
│   ├── brokers/                       # Zerodha, Upstox, Angel One integrations
│   ├── mutual-funds/                  # SIP, Lumpsum, Redemptions, Valuation, FIFO
│   ├── fixed-deposits/                # FDs, RDs, TDS computations, Bank lookups
│   ├── gold-silver/                   # Physical/Digital bullion, GST, making charges
│   ├── epf/                           # Salary-linked & manual provident fund
│   ├── ppf/                           # Public provident fund interest & credit/debit
│   ├── calculators/                   # 33+ financial calculators engine & UI
│   └── profile/                       # KYC, Security, Notification preferences
│
├── components/
│   ├── ui/                            # 🎨 SHARED UI PRIMITIVES (Dumb, Radix-backed, token-styled)
│   │   ├── primitives/                # Button, Card, Dialog, Badge, Tabs, Select, Table, Input
│   │   ├── feedback/                  # Sonner, Skeleton, Alert
│   │   ├── forms/                     # FormField, CurrencyInput, Stepper, Dropdowns
│   │   └── data-display/              # Charts, StatCards, LiveClock
│   └── seo/                           # JsonLd structured data components — NOT YET CREATED
│
├── services/                          # 🌐 DATA ACCESS LAYER (DAL / API Clients) — NOT YET CREATED
│   ├── api.client.js                  # Axios instance with JWT interceptors & error normalizing
│   ├── auth.service.js
│   ├── portfolio.service.js
│   ├── brokers.service.js
│   ├── mutualFunds.service.js
│   ├── banking.service.js
│   └── ledger.service.js
│
├── lib/
│   ├── formatters/                    # 🔢 CANONICAL FORMATTERS (Single Source of Truth) — NOT YET CREATED
│   │   ├── currency.js                # ₹ en-IN formatting with lakh/crore, parseAmount
│   │   ├── date.js                    # ISO 8601, IST (Asia/Kolkata), Financial Year
│   │   └── percent.js                 # Unified percentage & CAGR/XIRR displays
│   ├── validation/                    # 🛡️ NORMALIZATION & VALIDATION (Zod schemas + utils) — NOT YET CREATED
│   │   ├── identity.js                # Name, Username, Email, Phone (E.164)
│   │   ├── financial.js               # PAN, Aadhaar, IFSC, Account Number, Folio
│   │   └── schemas/                   # Zod schemas for all client mutation boundaries
│   ├── brokerConfig.js                # Broker accent colors & connection metadata
│   └── utils.js                       # cn() class merger
│
└── middleware.js                      # 🛡️ EDGE AUTHENTICATION GUARD (Instant zero-JS redirects) — NOT YET CREATED
```

---

## Phase 1: Clean Foundation, Dead Code Elimination & Tokens

### Objective
Remove technical debt, eliminate orphaned files, fix broken CSS tokens, and prune unnecessary `package.json` dependencies.

### Step 1.1: Prune Orphaned & Dead Files
Delete the following files that have 0 consumers across the codebase (verified by audit):
- `src/components/auth/AuthDivider.jsx` (dead legacy)
- `src/components/brokers/ConnectBrokerDialog.jsx` (legacy dialog; replaced by `app/(main)/brokers/*/page.jsx`)
- `src/components/calculators/CalculatorComponents.jsx` (dead legacy; all calculators use `framework/`)
- `src/components/ui/feedback/PageTransition.jsx` (0 importers) — **EXISTS, VERIFIED 0 importers**
- `src/components/ui/feedback/toast-card.jsx` (0 importers) — **EXISTS, VERIFIED 0 importers**
- `src/components/ui/primitives/command.jsx` (0 importers) — **EXISTS, VERIFIED 0 importers**
- `src/components/ui/primitives/input-group.jsx` (0 importers) — **EXISTS, VERIFIED 0 importers**
- `src/components/ui/primitives/progress.jsx` (0 importers) — **EXISTS, VERIFIED 0 importers**
- `src/components/ui/primitives/scroll-area.jsx` (0 importers) — **EXISTS, VERIFIED 0 importers**
- `src/hooks/useZerodhaDashboard.js` (deprecated stub) — **EXISTS, VERIFIED 0 importers**
- `src/utils/formatters.js` (257-line orphaned module; logic absorbed into `src/lib/formatters/`) — **EXISTS, VERIFIED 0 importers**

> **NOT in this list (verified in use):** `badge.jsx` (8 importers), `tabs.jsx` (4 importers), `tooltip.jsx` (1 importer), `separator.jsx` (1 importer), `table.jsx` (1 importer), `label.jsx` (1 importer), `chart.jsx` (living in `ui/data-display/`, NOT primitives).

### Step 1.2: Prune `package.json` Dependencies
Remove redundant packages:
- Specific Radix packages: `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`.
  *Note:* Components import these directly (not via `radix-ui` umbrella). The `radix-ui` package (v1.4.3) is ALSO installed but unused — remove it instead.
- `cmdk`: Only imported by the dead `command.jsx`.

### Step 1.3: Token Cleanup in `tailwind.config.js` & `globals.css`
1. **`tailwind.config.js`:**
   - Remove unused palette keys: `ct-primary`, `ct-success`, `ct-warning`, `ct-error`.
   - Ensure standard financial tokens are mapped:
     ```js
     colors: {
       gain: {
         DEFAULT: 'hsl(var(--gain))',
         foreground: 'hsl(var(--gain-foreground))',
         muted: 'hsl(var(--gain-muted))',
       },
       loss: {
         DEFAULT: 'hsl(var(--loss))',
         foreground: 'hsl(var(--loss-foreground))',
         muted: 'hsl(var(--loss-muted))',
       },
       hairline: 'hsl(var(--hairline))',
       // broker tokens
       'broker-zerodha': 'hsl(var(--broker-zerodha))',
       'broker-upstox': 'hsl(var(--broker-upstox))',
       'broker-angelone': 'hsl(var(--broker-angelone))',
     }
     ```
2. **`globals.css`:**
   - Define missing utility: `.bg-hairline { background-color: hsl(var(--hairline)); }`.
   - Remove undefined/dead classes: `.ticker-track`, `.ct-ticker`, `.ed-card-flat`, `.ed-pill-accent`.
   - Replace any occurrences of undefined `.ed-muted-text` with `text-muted-foreground`.
   - Fix blue spinner in `AuthGuard.jsx` and `zerodha/callback/page.jsx`:
     Replace `border-blue-200 border-t-blue-600` with `border-hairline border-t-foreground` or `border-emerald-500/20 border-t-emerald-500`.

---

## Phase 2: Canonical Formatters & Normalization Core

### Objective
Create a rock-solid, unified formatting and validation engine in `src/lib/formatters/` and `src/lib/validation/` to eliminate ~40 duplicate implementations.

**Current State:** Three competing formatter modules exist:
- `src/lib/format.js` — canonical but incomplete (currency 2dp only, percent, date, FY)
- `src/lib/calculator.service.js` — duplicates currency (0dp!), percent (string concat)
- `src/utils/formatters.js` — 257-line orphan, most complete but unused
- ~18 local copies across dialogs/pages

### Step 2.1: Implement `src/lib/formatters/currency.js` — **NOT YET CREATED**
Fintech rules: Standard Indian currency notation (`12,34,567.89`), support for paise integer arithmetic, shortcut parsing (`1.5L`, `2Cr`, `50k`), and Indian words conversion.

```javascript
// src/lib/formatters/currency.js

const INDIAN_NUMBER_FORMAT_2DP = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INDIAN_NUMBER_FORMAT_0DP = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format numerical amount to INR currency string.
 * @param {number|string} amount
 * @param {Object} options
 * @param {0|2} [options.dp=2] - Decimal places (0 for whole rupees, 2 for precision)
 * @param {boolean} [options.showSymbol=true] - Whether to include ₹
 * @param {boolean} [options.compact=false] - Format as 1.5L, 2.3Cr
 * @returns {string} Formatted string, e.g. "₹1,50,000.00"
 */
export function formatCurrency(amount, { dp = 2, showSymbol = true, compact = false } = {}) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === null || num === undefined || isNaN(num)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    const sym = showSymbol ? '₹' : '';
    if (abs >= 10000000) return `${sign}${sym}${(abs / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `${sign}${sym}${(abs / 100000).toFixed(2)} L`;
    if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(1)} K`;
  }

  const formatter = dp === 0 ? INDIAN_NUMBER_FORMAT_0DP : INDIAN_NUMBER_FORMAT_2DP;
  let formatted = formatter.format(num);

  if (!showSymbol) {
    formatted = formatted.replace(/^₹\s?/, '');
  }
  return formatted;
}

/**
 * Parses user input containing shortcuts into raw number.
 * Supports: "1.5L", "2Cr", "50K", "1,50,000", "₹1,50,000.50"
 * @param {string|number} input
 * @returns {number}
 */
export function parseAmount(input) {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input || typeof input !== 'string') return 0;

  let cleaned = input.trim().replace(/[₹$€£,\s]/g, '');
  const match = cleaned.match(/^([+-]?[\d.]+)\s*(cr|crore|l|lakh|k|thousand)?$/i);
  if (!match) {
    const fallback = parseFloat(cleaned);
    return isNaN(fallback) ? 0 : fallback;
  }

  const val = parseFloat(match[1]);
  if (isNaN(val)) return 0;

  const unit = (match[2] || '').toLowerCase();
  switch (unit) {
    case 'cr':
    case 'crore':
      return Math.round(val * 10000000 * 100) / 100;
    case 'l':
    case 'lakh':
      return Math.round(val * 100000 * 100) / 100;
    case 'k':
    case 'thousand':
      return Math.round(val * 1000 * 100) / 100;
    default:
      return val;
  }
}

/**
 * Converts integer paise to rupees.
 */
export function paiseToRupees(paise) {
  return (paise || 0) / 100;
}

/**
 * Converts rupees to integer paise.
 */
export function rupeesToPaise(rupees) {
  return Math.round((rupees || 0) * 100);
}

/**
 * Converts number to words in Indian numbering format (Lakhs, Crores).
 */
export function formatInIndianWords(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return 'Zero Rupees';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : ' ');
  }

  let str = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;

  if (crore > 0) str += inWords(crore) + 'Crore ';
  if (lakh > 0) str += inWords(lakh) + 'Lakh ';
  if (thousand > 0) str += inWords(thousand) + 'Thousand ';
  if (hundred > 0) str += inWords(hundred) + 'Hundred ';
  if (rest > 0) str += inWords(rest);

  return str.trim() + ' Rupees';
}
```

### Step 2.2: Implement `src/lib/formatters/date.js` — **NOT YET CREATED**
Fintech rules: Force timezone `Asia/Kolkata` (IST) and locale `en-IN`. Store in ISO 8601 (`YYYY-MM-DD`). Compute Indian Financial Year (`FY 2025-26`).

```javascript
// src/lib/formatters/date.js

const TIMEZONE = 'Asia/Kolkata';

export function formatDate(dateInput, { style = 'medium' } = {}) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const options = {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: style === 'short' ? '2-digit' : style === 'long' ? 'long' : 'short',
    year: 'numeric',
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export function toISODateString(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

export function getFinancialYear(dateInput = new Date()) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const month = date.getMonth(); // 0 = Jan, 3 = Apr
  const year = date.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `FY ${startYear}-${endYearShort}`;
}
```

### Step 2.3: Implement `src/lib/formatters/percent.js` — **NOT YET CREATED**
```javascript
// src/lib/formatters/percent.js

export function formatPercent(value, { dp = 2, showSign = false } = {}) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === null || num === undefined || isNaN(num)) return '0.00%';

  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(dp)}%`;
}
```

### Step 2.4: Implement `src/lib/validation/identity.js` & `financial.js` — **NOT YET CREATED**
Implement standardized normalizers matching `INPUT_OUTPUT_NORMALIZATION`:
- `normalizeName(name)`: NFKC normalization, collapse spaces, min 2 / max 100 Unicode letters.
- `normalizeUsername(username)`: Lowercase, alphanumeric + underscore, reserve words blocked.
- `normalizeEmail(email)`: Lowercase, trim, RFC 5322 strict validation.
- `normalizePhoneIndia(phone)`: Strip non-digits, leading 0, prefix 91, validate 10-digit starting with 6-9, return E.164 `+91XXXXXXXXXX` or 10-digit string.
- `normalizePAN(pan)`: Uppercase, 10 chars, `^[A-Z]{5}[0-9]{4}[A-Z]$`, 4th char in `[CPHFATBLJG]`.
- `normalizeIFSC(ifsc)`: Uppercase, 11 chars, `^[A-Z]{4}0[A-Z0-9]{6}$`.
- `maskAccountNumber(acc)`: Show last 4 digits `XXXX1234`.
- `sanitizeText(text, maxLength)`: Strip HTML tags, collapse whitespace, enforce character limit.

---

## Phase 3: Component Deduplication & Design System Consolidation

### Objective
Replace 23 hand-rolled dialogs, raw CSS classes (`.ed-btn*`, `.ed-card*`), bespoke badge pills, and dual toast systems with the canonical components in `src/components/ui/primitives/`.

**Current State:** 
- `src/components/ui/primitives/dialog.jsx` exists and is well-structured (Radix-based)
- 23 bespoke dialogs still use `fixed inset-0` pattern
- `src/components/ui/primitives/badge.jsx` exists but has 0 importers (uses blue/default variant, not gain/loss tokens)
- `src/components/ui/primitives/button.jsx` exists with CVA variants (but uses rose/emerald/amber not gain/loss tokens)
- `src/components/ui/primitives/card.jsx` exists but has 1 importer
- `src/components/ui/feedback/use-toast.js` (legacy) used by 24 files + `sonner` used by ~9 files + `mutual-fund/page.jsx` imports BOTH
- `src/components/ui/forms/FormField.jsx` — **DOES NOT EXIST** (calculators use local `FormField` in `CalculatorComponents.jsx`)

### Step 3.1: Modal & Dialog Consolidation
Every feature currently hand-rolls `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm` with custom escape listeners and trap focus.
**Action:** Replace all 23 bespoke dialogs with `src/components/ui/primitives/dialog.jsx`:
- `epf/{EpfTransactionDialog, EpfSettingsDialog, EpfInterestRateDialog}`
- `ppf/{PpfDialog, PpfSettingsDialog}`
- `fixeddeposit/{FdDialog, WithdrawDialog}`
- `goldsilver/{GoldSilverDialog, RateSettingsDialog}`
- `notes/NoteDialog`
- `modals/{ContactModal, LegalModals}`
- `mutual-fund/{RedemptionModal, LumpsumTransactionModal, SipContributionModal, SipMandateModal, NewSchemeModal, ValuationSnapshotModal, UpdateValuationModal, OverrideUnitsModal}`

*Standard Dialog Wrapper Pattern:*
```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/primitives/dialog';

export function StandardFeatureDialog({ isOpen, onOpenChange, title, description, children, footer }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-3">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
```

### Step 3.2: Button & Card CSS Normalization
- Fold `.ed-btn*` CSS classes (56 files) into `ui/primitives/button.jsx` variants.
  - Current button variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `warning`, `info`, `link`
  - **Need to add:** `gain` (using `--gain` tokens), `loss` (using `--loss` tokens) variants
- Fold `.ed-card*` CSS classes (60 files) into `ui/primitives/card.jsx` variants.
  - Current card: single component with `size` prop
  - **Need to add:** `interactive`, `glass`, `flat` variants per design spec
- All numbers inside cards must use tabular figures: `font-mono tracking-tight tnum`.

### Step 3.3: Status Badge & Pill Consolidation
Replace bespoke `.ed-pill*` and raw `bg-green-500/10 text-green-400` with `ui/primitives/badge.jsx`:
- **Current badge variants:** `default` (blue), `secondary`, `destructive` (rose), `success` (emerald), `warning` (amber), `info` (slate), `outline`, `ghost`, `link`
- **Need to add/replace:** `gain` (using `--gain` tokens), `loss` (using `--loss` tokens), `broker` (using `--broker-*` tokens), `warning` (using `--chart-4` tokens)
- The CVA structure exists but token mapping needs update.

### Step 3.4: Single Toast Engine (`sonner`)
- **Current:** `src/components/ui/feedback/use-toast.js` (legacy adapter, 24 consumers) + `sonner` (direct imports, ~9 files) + `mutual-fund/page.jsx` imports BOTH
- Purge `src/components/ui/feedback/use-toast.js` 
- Retarget all calls to `import { toast } from 'sonner'`.
- Ensure standard toast styles match obsidian/paper tokens in `layout.js`: `<Toaster richColors position="top-right" theme="system" />`.
  - **Current:** `<Toaster richColors position='bottom-right' />` (position differs from spec)

### Step 3.5: Upgraded Accessible `FormField` — **NOT YET CREATED**
Create `src/components/ui/forms/FormField.jsx` with real-time formatting, `inputmode` attributes, and WCAG 2.2 SC 3.3.1 error announcements.
- **Current:** Calculator pages use local `FormField` in `CalculatorComponents.jsx` (no `inputMode`, no `aria-invalid`, no `aria-describedby`)
- Auth forms use raw `<input>` with `ed-input` CSS class
- Financial dialogs use raw `<input>` with `ed-input` CSS class

---

## Phase 4: Feature-Sliced Architecture Migration (`src/features/`)

### Objective
Isolate business logic, UI, hooks, and modals into domain-specific folders, resolving cross-domain circular dependencies.

> **Current State:** `src/features/` **does NOT exist.** Domain code still lives in `src/components/{epf,ppf,fixeddeposit,goldsilver,portfolio,mutual-fund,notes}` and `src/app/(main)/*` pages. All sub-steps below are **NOT YET DONE**.

### Step 4.1: Feature Groupings
Create the following directories under `src/features/`:
1. `src/features/auth/`
   - Move from `src/components/ui/auth/login/*` → `src/features/auth/components/`
   - Move `security-inputs.jsx`, `two-factor-verify-screen.jsx`, `auth-layout.jsx`, `auth-shared.jsx`
   - Implement `useAuthFlow.js`
2. `src/features/portfolio/`
   - Move `src/components/portfolio/*` (HoldingsTab, PositionsTab, OrdersTab, TradesTab, ProfileTab)
   - Move `PortfolioSummary.jsx`, `HoldingsTable.jsx`
3. `src/features/mutual-funds/`
   - Consolidate mutual fund modals from `app/(main)/mutual-fund/` and portfolio MF tabs:
     `MfTimeline.jsx`, `MfSipList.jsx`, `MfInstrumentList.jsx`, `SchemeSearchCombobox.jsx`
4. `src/features/fixed-deposits/`
   - Move `components/fixeddeposit/*` (FdDialog, WithdrawDialog, TdsSummary) + `BankSearchCombobox.jsx`
5. `src/features/gold-silver/`
   - Move `components/goldsilver/*` (GoldSilverDialog, RateSettingsDialog, MarketRateDialog)
6. `src/features/epf/` & `src/features/ppf/`
   - Move `components/epf/*` and `components/ppf/*`
7. `src/features/calculators/`
   - Consolidate framework components, formula engines, and calculator state hooks.
8. `src/features/profile/`
   - Move Profile tabs, password change, 2FA setup (`TotpSetup.jsx`), and account deletion.

### Step 4.2: Hoist Cross-Domain Components
- Audit finding: `DataAccuracyWarning.jsx` and `BrokerInfoBanner.jsx` are currently buried in `portfolio/tabs/` but imported by mutual fund modals.
- **Action:** Move them to `src/components/ui/feedback/DataAccuracyWarning.jsx` and `src/features/brokers/components/BrokerInfoBanner.jsx`.

---

## Phase 5: Data Access Layer (DAL) & Service Abstraction

### Objective
Eliminate direct client `fetch()` to external domains and establish typed, sanitized service endpoints.

> **Current State:** `src/services/` does NOT exist. All API access is a single monolithic `src/lib/api.js` (~1401 lines, Axios + JWT interceptors) plus per-domain calls. Sub-steps below are **NOT YET DONE**.

### Step 5.1: Create Dedicated Services in `src/services/`
Create:
- `src/services/api.client.js`: Axios instance with JWT interceptor, token refresh, and standardized error normalization.
- `src/services/auth.service.js`
- `src/services/portfolio.service.js`
- `src/services/mutualFunds.service.js`: Proxy all search requests through `/api/mf-search` rather than querying `api.mfapi.in` directly from the browser.
- `src/services/banking.service.js`: Calls `/api/ifsc` with client-side memory caching via TanStack Query.
- `src/services/ledger.service.js`: EPF, PPF, FD, and Bullion mutations.

### Step 5.2: Replace Inline `useQuery` in Pages with Custom Feature Hooks
Audit identified 12+ files inlining `useQuery` directly instead of using domain hooks:
- `dashboard/HoldingsTable.jsx` → use `usePortfolioHoldings()`
- `dashboard/RefreshButton.jsx` → use `useBrokerSummary()`
- Mutual fund tabs → create `useMutualFundHoldings()`, `useMutualFundOrders()`

---

## Phase 6: Next.js 16 App Router Modernization & SEO / Agent-Readiness

### Objective
Convert layout files to Server Components, implement edge route protection, and expose comprehensive SEO and AI-crawler artifacts.

### Step 6.1: Edge Route Protection via `middleware.js` — **NOT YET CREATED**
Create root `middleware.js` to protect `(main)` routes at the network edge before client hydration (currently auth is enforced client-side by `AuthGuard` after hydration):
```javascript
// middleware.js
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/setup-2fa',
  '/reset-2fa',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isPublic = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/calculators') || pathname.startsWith('/api/');

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Step 6.2: Server Layouts for Route Segments
> **Current State:** `(main)/layout.js`, `(access)/layout.js`, and `calculators/layout.jsx` are all **Client Components** today (`'use client'`). They cannot export `metadata` or `robots`; a Server Component conversion (or a parallel server layout) is required. The access routes DO have individual server `layout.js` files (e.g. `login/layout.js`, `register/layout.js`) that export title metadata.
1. **`src/app/(main)/layout.js` (convert to Server Component):**
   ```javascript
   export const metadata = {
     robots: {
       index: false,
       follow: false,
     },
   };

   export default function MainLayout({ children }) {
     return <div className="min-h-screen bg-background text-foreground">{children}</div>;
   }
   ```
2. **`src/app/(access)/layout.js` (convert to Server Component):**
   ```javascript
   export const metadata = {
     robots: {
       index: false,
       follow: false,
     },
   };
   ```
3. **`src/app/calculators/layout.jsx` (convert to Server Component):**
   Export comprehensive title template, description, and OpenGraph tags for calculator pages.

### Step 6.3: SEO & AI Crawler Files — **NOT YET CREATED**
> **Current State:** None of these files exist. `robots.js`, `sitemap.js`, `manifest.js`, `opengraph-image.jsx`, and `public/llms.txt` are all planned work (see `SEO-AGENT-READINESS.md` for the stage-by-stage rollout).
1. **`src/app/robots.js`:**
   Configure crawler directives welcoming AI bots (`GPTBot`, `ClaudeBot`, `PerplexityBot`) on public routes while blocking private financial surfaces.
2. **`src/app/sitemap.js`:**
   Dynamically output URLs for landing and all 33+ calculator paths with weekly change frequency.
3. **`src/app/manifest.js`:**
   Generate PWA manifest with theme color `#0f1117`.
4. **`public/llms.txt`:**
   Expose machine-readable site description according to the `llmstxt.org` specification.

---

## Phase 7: Step-by-Step Execution Plan for OpenCode

To ensure reliable, non-breaking execution, implement the refactoring in the following exact sequence:

```
[Step 1: Baseline Cleanup]
  ├── Delete 11 dead/orphaned files
  ├── Prune unused Radix & cmdk deps from package.json
  └── Define bg-hairline, remove dead ct-* palettes in tailwind.config.js
         ↓
[Step 2: Canonical Lib Core]
  ├── Write src/lib/formatters/{currency,date,percent}.js
  ├── Write src/lib/validation/{identity,financial}.js
  └── Create unit test scratch script to verify en-IN, ISO 8601, and E.164 parity
         ↓
[Step 3: UI Primitives Refactor]
  ├── Update src/components/ui/primitives/badge.jsx (cva tokens)
  ├── Update src/components/ui/forms/FormField.jsx (accessible inputmode + error)
  ├── Migrate use-toast to sonner across all 24 consumers
  └── Refactor 23 bespoke dialogs to src/components/ui/primitives/dialog.jsx
         ↓
[Step 4: Domain Feature Migration]
  ├── Scaffold src/features/{auth,portfolio,brokers,mutual-funds,fixed-deposits,gold-silver,epf,ppf,calculators,profile}
  ├── Move components, hooks, and modals into respective feature modules
  ├── Delete legacy src/components/auth/ directory
  └── Update import aliases across app/ and components/
         ↓
[Step 5: Data Access & Services]
  ├── Implement src/services/ with normalized API wrappers
  ├── Retarget inline fetch calls in SchemeSearchCombobox & BankSearchCombobox
  └── Retarget inline useQuery calls to custom feature hooks
         ↓
[Step 6: SEO, Edge Middleware & Server Layouts]
  ├── Create root middleware.js (zero-JS edge redirects)
  ├── Convert (main), (access), and calculators layouts to Server Components
  ├── Create src/app/{robots.js, sitemap.js, manifest.js, opengraph-image.jsx}
  └── Add public/llms.txt and public/.well-known/security.txt
         ↓
[Step 7: Verification & Build]
  ├── Run `npm run lint` / static checks
  ├── Run `npm run build` (Next.js production build verification)
  └── Validate UI contrast in both Light (paper) and Dark (obsidian) modes
```

---

## Definition of Done (DoD) Checklist
- [ ] Zero dead/orphaned files remaining in `src/`.
- [ ] `package.json` contains no unused direct `@radix-ui/react-*` or `cmdk` dependencies.
- [ ] No raw `fixed inset-0` modal overlays; all 23 dialogs use `ui/primitives/dialog.jsx`.
- [ ] All currency displays use `formatCurrency()` with `en-IN` Lakh/Crore formatting.
- [ ] All dates formatted via `formatDate()` forced to `Asia/Kolkata` (IST).
- [ ] Zero raw hex colors or arbitrary values (`text-[hsl(var(--gain))]`) in feature JSX; all use mapped Tailwind tokens.
- [ ] `src/components/auth/` completely deleted; auth features live in `src/features/auth/`.
- [ ] Client-side `AuthGuard` replaced by edge `middleware.js`.
- [ ] All public calculator pages export proper SEO metadata, sitemap entries, and robots directives.
- [ ] `npm run build` succeeds cleanly with 0 errors.

/**
 * Bank-aware default premature-withdrawal penalty rates.
 *
 * The FD "Bank/Institution" field is populated from the IFSC bank registry
 * (Razorpay banknames.json, ~1,511 banks). Each bank has its own penalty
 * policy, so we resolve a sensible editable default by:
 *
 *   1. A curated override table for well-known issuers (sourced from official
 *      bank T&C / policy pages — see `source` on each entry).
 *   2. A category classifier for the remaining ~1,470 banks (co-operative,
 *      small finance, gramin/rrb, payments bank, post office, corporate/NBFC).
 *   3. A size-based amount-tier fallback (0.50% up to ₹5L, 1.00% above).
 *
 * The result is ALWAYS treated as a starting point — the user can edit the
 * penalty in the Withdraw dialog, which sends `penaltyRateOverride`.
 *
 * Sources consulted (2026):
 *   - SBI  : sbi.bank.in deposit-rates (0.50% ≤ ₹5L, 1.00% > ₹5L, all tenors)
 *   - Kotak: kotak.bank.in FD FAQ w.e.f. 20-May-2022 (≤180d nil, 181-364d 0.50%, ≥365d 1.00%)
 *   - Yes  : yesbank.in Rates & Charges w.e.f. 03-Nov-2023 (≤181d 0.75%, ≥182d 1.00%)
 *   - ICICI: icici.bank.in FD T&C (penalty 0.50% <1yr, 1.00% 1-5yr, <₹5Cr)
 *   - HDFC Bank: hdfc.bank.in FD T&C (1.00% below lower-of-two-rates)
 *   - Axis : axis.bank.in Comprehensive Deposit Policy (1.00% <₹5Cr, first 25% partial penalty-free)
 *   - PNB / Canara / Union / Baroda: 1.00% (official policy pages)
 *   - AU SFB: au.bank.in FD FAQ (1.00%)
 *   - Equitas / Ujjivan: 1.00% before 180 days / 6 months, nil after
 *   - Bajaj / Mahindra / Shriram: 2.00% (3.00% <1yr for some) after lock-in
 *   - India Post / POTD: 2.00% below TD rate after 1yr (6-12mo at SB rate; 5yr TD locked 4yrs)
 */

const OVERRIDES = [
  {
    id: 'sbi',
    pattern: /state bank of india|\bsbi\b/,
    rate: issueAmount => (Number(issueAmount) > 500000 ? 1.0 : 0.5),
    source: 'SBI policy — 0.5% ≤ ₹5L, 1% above',
  },
  {
    id: 'post-office',
    pattern: /post office|india post|general post|postal|\bpotd\b|gpox/,
    rate: 2.0,
    source: 'India Post TD — 2% below TD rate after 1 yr',
  },
  {
    id: 'hdfc-bank',
    pattern: /hdfc bank/,
    rate: 1.0,
    source: 'HDFC Bank — 1% below applicable rate',
  },
  {
    id: 'hdfc-ltd',
    pattern: /hdfc ltd|hdfc limited|housing development finance/,
    rate: 1.5,
    source: 'HDFC Ltd — 1.5% (corporate/legacy)',
  },
  {
    id: 'icici',
    pattern: /icici/,
    rate: (_, tenorDays) => (tenorDays == null || tenorDays >= 365 ? 1.0 : 0.5),
    source: 'ICICI — 0.5% held <1 yr, 1% ≥1 yr',
  },
  {
    id: 'axis',
    pattern: /axis bank/,
    rate: 1.0,
    source: 'Axis Bank — 1% (first 25% partial free)',
  },
  {
    id: 'kotak',
    pattern: /kotak/,
    rate: (_, tenorDays) => {
      if (tenorDays == null) return 1.0;
      if (tenorDays <= 180) return 0.0;
      if (tenorDays <= 364) return 0.5;
      return 1.0;
    },
    source: 'Kotak — 0% ≤180d, 0.5% ≤364d, 1% ≥365d',
  },
  {
    id: 'yes',
    pattern: /yes bank/,
    rate: (_, tenorDays) => {
      if (tenorDays == null) return 1.0;
      return tenorDays <= 181 ? 0.75 : 1.0;
    },
    source: 'Yes Bank — 0.75% ≤181d, 1% ≥182d',
  },
  {
    id: 'pnb',
    pattern: /punjab national/,
    rate: 1.0,
    source: 'PNB — 1% all tenors',
  },
  {
    id: 'baroda',
    pattern: /baroda/,
    rate: 1.0,
    source: 'Bank of Baroda — 1% (callable)',
  },
  {
    id: 'canara',
    pattern: /canara/,
    rate: 1.0,
    source: 'Canara Bank — 1% <₹3 Cr',
  },
  {
    id: 'union',
    pattern: /union bank of india/,
    rate: 1.0,
    source: 'Union Bank — 1% <₹2 Cr (01.04.2020+)',
  },
  {
    id: 'indian-bank',
    pattern: /indian bank|bharatiya mahila/,
    rate: 1.0,
    source: 'PSU default — 1%',
  },
  {
    id: 'indusind',
    pattern: /indusind/,
    rate: 1.0,
    source: 'IndusInd — 1% (auto-sweep free)',
  },
  {
    id: 'rbl',
    pattern: /\brbl\b/,
    rate: 1.0,
    source: 'RBL — 1% (senior waived)',
  },
  {
    id: 'idfc',
    pattern: /idfc/,
    rate: 1.0,
    source: 'IDFC FIRST — 1% (FIRST Citizen free)',
  },
  { id: 'bandhan', pattern: /bandhan/, rate: 1.0, source: 'Bandhan — 1%' },
  {
    id: 'federal',
    pattern: /federal/,
    rate: 1.0,
    source: 'Federal Bank — bank penal rate',
  },
  {
    id: 'city-union',
    pattern: /city union/,
    rate: 1.0,
    source: 'City Union — 1%',
  },
  { id: 'dcb', pattern: /\bdcb\b/, rate: 1.0, source: 'DCB — 1%' },
  { id: 'karur', pattern: /karur vysya/, rate: 1.0, source: 'KVB — 1%' },
  {
    id: 'south-indian',
    pattern: /south indian/,
    rate: 1.0,
    source: 'South Indian Bank — 1%',
  },
  {
    id: 'karnataka-bank',
    pattern: /karnataka bank/,
    rate: 1.0,
    source: 'Karnataka Bank — 1%',
  },
  {
    id: 'dhanlaxmi',
    pattern: /dhanlaxmi/,
    rate: 1.0,
    source: 'Dhanlaxmi — 1%',
  },
  {
    id: 'au',
    pattern: /au small finance|aubl/,
    rate: 1.0,
    source: 'AU SFB — 1%',
  },
  {
    id: 'ujjivan',
    pattern: /ujjivan/,
    rate: (_, tenorDays) => (tenorDays == null || tenorDays < 180 ? 1.0 : 0.0),
    source: 'Ujjivan — 1% within 6 mo, nil after',
  },
  {
    id: 'equitas',
    pattern: /equitas/,
    rate: (_, tenorDays) => (tenorDays == null || tenorDays <= 180 ? 1.0 : 0.0),
    source: 'Equitas — 1% ≤180d, nil after',
  },
  {
    id: 'bajaj',
    pattern: /bajaj/,
    rate: 2.0,
    source: 'Bajaj Finance — 2% (3% if no rate for period)',
  },
  {
    id: 'mahindra',
    pattern: /mahindra/,
    rate: (_, tenorDays) => (tenorDays != null && tenorDays < 365 ? 3.0 : 2.0),
    source: 'Mahindra Finance — 2% (3% <1 yr)',
  },
  {
    id: 'shriram',
    pattern: /shriram/,
    rate: 2.0,
    source: 'Shriram Finance — 2%',
  },
  {
    id: 'lic-hfl',
    pattern: /lic housing|lic hfl/,
    rate: 1.5,
    source: 'LIC Housing — 1.5%',
  },
  {
    id: 'pnb-hfl',
    pattern: /pnb housing|pnb hfl/,
    rate: 2.0,
    source: 'PNB Housing — 2%',
  },
];

const CATEGORY_PATTERNS = [
  {
    id: 'small-finance',
    pattern: /small finance/,
    rate: 1.0,
    source: 'Small Finance Bank default — 1%',
  },
  {
    id: 'rrb',
    pattern: /gramin|grameen|regional rural|rural/,
    rate: 1.0,
    source: 'RRB / Gramin default — 1%',
  },
  {
    id: 'payments',
    pattern: /payments bank/,
    rate: 0.0,
    source: 'Payments bank — no FD, 0%',
  },
  {
    id: 'post',
    pattern: /post|postal/,
    rate: 2.0,
    source: 'India Post TD — 2% below TD rate',
  },
  {
    id: 'coop',
    pattern:
      /co[.\- ]?op(?:\b|erative)|cooperative|sahakari|seva|nagarik|mahila|credit society|zoroastrian|urban|district central|dccb|\bldb\b|\bucb\b|\bnabard\b/,
    rate: 0.5,
    source: 'Co-operative bank default — 0.5% (varies)',
  },
  {
    id: 'corporate-nbfc',
    pattern:
      /\b(?:finance|housing|hfl|limited|ltd|clearing|company|corp)\b|bajaj/,
    rate: 2.0,
    source: 'Corporate / NBFC default — 2%',
  },
  {
    id: 'foreign',
    pattern:
      /hsbc|citibank|citi bank|deutsche|standard chartered|\bbnp\b|barclays|jpmorgan|morgan stanley|mufg|mitsubishi|societe|credit suisse|emirates|qatar|janata|kuwait|oman|\bobb\b/,
    rate: 1.0,
    source: 'Foreign bank default — 1%',
  },
  {
    id: 'bank',
    pattern: /\bbank\b|\bsociety\b/,
    rate: 1.0,
    source: 'Scheduled bank default — 1%',
  },
];

const AMOUNT_TIER_LIMIT = 500000;

function findEntry(place) {
  const lower = (place || '').trim().toLowerCase();
  if (!lower) return null;
  const override = OVERRIDES.find(o => o.pattern.test(lower));
  if (override) return { kind: 'override', entry: override };
  const category = CATEGORY_PATTERNS.find(c => c.pattern.test(lower));
  if (category) return { kind: 'category', entry: category };
  return null;
}

function rateOf(entry, issueAmount, actualTenorDays) {
  if (typeof entry.rate === 'function') {
    return entry.rate(Number(issueAmount), actualTenorDays ?? null);
  }
  return entry.rate;
}

function fallbackRate(issueAmount) {
  return Number(issueAmount) > AMOUNT_TIER_LIMIT ? 1.0 : 0.5;
}

/**
 * Resolve the default penalty rate (% points subtracted from the contracted
 * rate) for a bank-name string.
 *
 * @param {string} place The FD's bank/institution name (as stored).
 * @param {number|string} issueAmount The FD issue amount (₹).
 * @param {number|null} actualTenorDays Days between issue date and the chosen
 *   withdrawal date, used by tenure-tiered policies (Kotak/Yes/ICICI).
 * @returns {number} Penalty in percentage points (0-3).
 */
export function resolveDefaultPenalty(
  place,
  issueAmount = 0,
  actualTenorDays = null
) {
  const found = findEntry(place);
  if (found) return rateOf(found.entry, issueAmount, actualTenorDays);
  return fallbackRate(issueAmount);
}

/**
 * Like {@link resolveDefaultPenalty} but also returns a short human label of
 * the policy the rate came from (for the dialog hint line).
 */
export function describeBankPenalty(
  place,
  issueAmount = 0,
  actualTenorDays = null
) {
  const found = findEntry(place);
  const rate = found
    ? rateOf(found.entry, issueAmount, actualTenorDays)
    : fallbackRate(issueAmount);
  const source = found
    ? found.entry.source
    : `Amount-based default — ${rate}% (${String(issueAmount)} > ₹5L ? 1% : 0.5%)`;
  return { rate, source };
}

/**
 * Normalise a user-entered penalty so it can safely be sent to the backend:
 * empty/invalid -> the resolved default; else clamped to [0, contractedRate].
 */
export function normalisePenaltyOverride(
  value,
  place,
  issueAmount,
  actualTenorDays,
  contractedRate
) {
  const num =
    typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
  if (!Number.isFinite(num) || String(value).trim() === '') {
    return resolveDefaultPenalty(place, issueAmount, actualTenorDays);
  }
  const max = Number(contractedRate) || null;
  if (max != null) return Math.min(Math.max(num, 0), max);
  return Math.max(num, 0);
}

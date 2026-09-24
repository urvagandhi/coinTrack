/**
 * Canonical Currency Formatter - Indian & International FinTech Standards
 * Standard: ISO 4217, RBI / SEBI presentation norms.
 * Supports: en-IN Lakh/Crore formatting, paise conversion, shortcut parsing (1.5L, 2Cr, 50k), Indian words.
 */

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

const INDIAN_NUMBER_FORMAT_PRECISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/**
 * Format numerical amount to INR currency string.
 * @param {number|string} amount
 * @param {Object} [options]
 * @param {0|2|4} [options.dp=2] - Decimal places
 * @param {boolean} [options.showSymbol=true] - Whether to include ₹
 * @param {boolean} [options.showSign=false] - Explicit +/- sign
 * @param {boolean} [options.compact=false] - Format as 1.5L, 2.3Cr
 * @param {boolean} [options.precise=false] - 4 decimal places
 * @param {string} [options.fallback='—']
 * @returns {string} Formatted string, e.g. "₹1,50,000.00"
 */
export function formatCurrency(
  amount,
  {
    dp = 2,
    showSymbol = true,
    showSign = false,
    compact = false,
    precise = false,
    fallback = '—',
  } = {}
) {
  if (amount === null || amount === undefined) return fallback;
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return fallback;

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : showSign && num > 0 ? '+' : '';
    const sym = showSymbol ? '₹' : '';
    if (abs >= 10000000)
      return `${sign}${sym}${(abs / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `${sign}${sym}${(abs / 100000).toFixed(2)} L`;
    if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(1)} K`;
  }

  let formatter;
  if (precise || dp === 4) {
    formatter = INDIAN_NUMBER_FORMAT_PRECISE;
  } else if (dp === 0) {
    formatter = INDIAN_NUMBER_FORMAT_0DP;
  } else {
    formatter = INDIAN_NUMBER_FORMAT_2DP;
  }

  let formatted = formatter.format(Math.abs(num));

  if (!showSymbol) {
    formatted = formatted.replace(/^₹\s?/, '');
  }

  if (showSign) {
    return num >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return num < 0 ? `-${formatted}` : formatted;
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

  const cleaned = input.trim().replace(/[₹$€£,\s]/g, '');
  const match = cleaned.match(
    /^([+-]?[\d.]+)\s*(cr|crore|l|lakh|k|thousand)?$/i
  );
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

  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return `${b[Math.floor(n / 10)]}${digit ? `-${a[digit]}` : ' '}`;
  }

  let str = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;

  if (crore > 0) str += `${inWords(crore)}Crore `;
  if (lakh > 0) str += `${inWords(lakh)}Lakh `;
  if (thousand > 0) str += `${inWords(thousand)}Thousand `;
  if (hundred > 0) str += `${inWords(hundred)}Hundred `;
  if (rest > 0) str += inWords(rest);

  return `${str.trim()} Rupees`;
}

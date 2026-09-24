/**
 * Canonical Percentage Formatter - FinTech Standards
 * Unifies display across P&L, XIRR, CAGR, interest rates, and allocation weights.
 */

/**
 * Format numerical rate/percentage to formatted string.
 * @param {number|string} value - Decimal (0.12) or percentage (12)
 * @param {Object} [options]
 * @param {number} [options.dp=2] - Decimal places
 * @param {boolean} [options.showSign=false] - Show '+' for positive numbers
 * @param {string} [options.fallback='—']
 * @returns {string} e.g. "+12.50%" or "8.00%"
 */
export function formatPercent(
  value,
  { dp = 2, showSign = false, fallback = '—' } = {}
) {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return fallback;

  const sign = showSign && num > 0 ? '+' : num < 0 ? '-' : '';
  const formatted = Math.abs(num).toFixed(dp);
  return `${sign}${formatted}%`;
}

/**
 * Format decimal proportion (e.g. 0.052 → 5.20%)
 */
export function formatRatioToPercent(ratio, options = {}) {
  if (ratio === null || ratio === undefined) return options.fallback || '—';
  const num = typeof ratio === 'string' ? parseFloat(ratio) : Number(ratio);
  if (isNaN(num)) return options.fallback || '—';
  return formatPercent(num * 100, options);
}

/**
 * Legacy bridge to canonical formatters in src/lib/formatters/
 * Keeps full backwards compatibility for existing imports.
 */

export {
  formatCurrency,
  parseAmount,
  paiseToRupees,
  rupeesToPaise,
  formatInIndianWords,
} from './formatters/currency';

export {
  formatDate,
  formatDateTime,
  toISODateString,
  getFinancialYear,
  generateFinancialYearOptions,
} from './formatters/date';

export { formatPercent, formatRatioToPercent } from './formatters/percent';

/**
 * Canonical Date & Time Formatter - Indian FinTech Standards
 * Standard: ISO 8601 storage, Asia/Kolkata (IST) display, Indian Financial Year.
 */

const TIMEZONE = 'Asia/Kolkata';

/**
 * Format date in IST with Indian locale.
 * @param {string|Date|number} dateInput
 * @param {Object} [options]
 * @param {'short'|'medium'|'long'} [options.style='medium']
 * @param {string} [options.fallback='—']
 * @returns {string} e.g. "25 Aug 2026"
 */
export function formatDate(
  dateInput,
  { style = 'medium', fallback = '—' } = {}
) {
  if (!dateInput) return fallback;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;

  const options = {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: style === 'short' ? '2-digit' : style === 'long' ? 'long' : 'short',
    year: 'numeric',
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Format date & time in IST.
 * @param {string|Date|number} dateInput
 * @param {string} [fallback='—']
 * @returns {string} e.g. "25 Aug 2026, 09:30 AM"
 */
export function formatDateTime(dateInput, fallback = '—') {
  if (!dateInput) return fallback;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;

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

/**
 * Normalizes any valid date input to canonical ISO 8601 "YYYY-MM-DD" string.
 * @param {string|Date|number} dateInput
 * @returns {string|null}
 */
export function toISODateString(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Computes the Indian Financial Year string (e.g. "FY 2025-26" or "2025-26")
 * @param {string|Date|number} [dateInput=new Date()]
 * @param {boolean} [prefix=false] - Whether to prefix with "FY "
 * @returns {string}
 */
export function getFinancialYear(dateInput = new Date(), prefix = false) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const month = date.getMonth(); // 0 = Jan, 3 = Apr
  const year = date.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  const fyStr = `${startYear}-${endYearShort}`;
  return prefix ? `FY ${fyStr}` : fyStr;
}

/**
 * Generates sorted financial year dropdown options from transaction/record arrays.
 */
export function generateFinancialYearOptions(
  records = [],
  dateKey = 'transactionDate'
) {
  const fySet = new Set();

  if (Array.isArray(records)) {
    records.forEach(rec => {
      const dateVal =
        rec?.[dateKey] || rec?.date || rec?.transactionDate || rec?.issueDate;
      if (dateVal) {
        const fy = getFinancialYear(dateVal, false);
        if (fy) fySet.add(fy);
      }
    });
  }

  // Ensure current FY is always present
  const currentFy = getFinancialYear(new Date(), false);
  fySet.add(currentFy);

  const sorted = Array.from(fySet).sort((a, b) => {
    const yA = parseInt(a.split('-')[0], 10);
    const yB = parseInt(b.split('-')[0], 10);
    return yB - yA;
  });

  return [
    { value: '', label: 'All Financial Years' },
    ...sorted.map(fy => ({ value: fy, label: `FY ${fy}` })),
  ];
}

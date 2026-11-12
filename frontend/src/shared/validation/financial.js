/**
 * Financial Normalization & Validation - Enterprise FinTech Security
 * Standards: Income Tax Dept (PAN), RBI (IFSC), Bank Account Numbering, Mutual Fund Folio.
 */

/**
 * Normalizes Indian PAN card number (uppercase, trimmed, no spaces).
 */
export function normalizePAN(pan) {
  if (!pan || typeof pan !== 'string') return '';
  return pan.trim().toUpperCase().replace(/[\s-]/g, '').slice(0, 10);
}

/**
 * Validates PAN structure: 5 letters, 4 digits, 1 letter.
 * 4th character must be valid entity type: [C, P, H, F, A, T, B, L, J, G].
 */
export function validatePAN(pan) {
  const normalized = normalizePAN(pan);
  if (!normalized) return 'PAN number is required';
  if (normalized.length !== 10) return 'PAN must be exactly 10 characters';
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalized)) {
    return 'Invalid PAN format (expected: ABCDE1234F)';
  }
  const entityType = normalized[3];
  if (!'CPHFATBLJG'.includes(entityType)) {
    return 'Invalid PAN: 4th character must be an authorized entity code';
  }
  return null;
}

/**
 * Normalizes Indian Bank IFSC Code (uppercase, trimmed, exactly 11 characters).
 */
export function normalizeIFSC(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') return '';
  return ifsc.trim().toUpperCase().replace(/[\s-]/g, '').slice(0, 11);
}

/**
 * Validates IFSC format: 4 letters, 0, 6 alphanumeric (e.g. SBIN0001234).
 */
export function validateIFSC(ifsc) {
  const normalized = normalizeIFSC(ifsc);
  if (!normalized) return 'IFSC code is required';
  if (normalized.length !== 11) return 'IFSC must be exactly 11 characters';
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalized)) {
    return 'Invalid IFSC code (e.g. SBIN0001234 with 5th char as 0)';
  }
  return null;
}

/**
 * Normalizes bank account number (numeric only, strips spaces and hyphens).
 */
export function normalizeAccountNumber(acc) {
  if (!acc || typeof acc !== 'string') return '';
  return acc.trim().replace(/[\s-]/g, '');
}

/**
 * Validates bank account number (9 to 18 digits).
 */
export function validateAccountNumber(acc) {
  const cleaned = normalizeAccountNumber(acc);
  if (!cleaned) return 'Account number is required';
  if (!/^\d{9,18}$/.test(cleaned)) {
    return 'Account number must contain between 9 and 18 digits';
  }
  return null;
}

/**
 * Masks bank account number for secure display (e.g. "••••••••1234").
 */
export function maskAccountNumber(acc) {
  const cleaned = normalizeAccountNumber(acc);
  if (!cleaned || cleaned.length < 4) return '••••';
  return '•'.repeat(Math.max(0, cleaned.length - 4)) + cleaned.slice(-4);
}

/**
 * Normalizes mutual fund folio number (uppercase, alphanumeric + slashes).
 */
export function normalizeFolioNumber(folio) {
  if (!folio || typeof folio !== 'string') return '';
  return folio.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Validates mutual fund folio number.
 */
export function validateFolioNumber(folio) {
  const cleaned = normalizeFolioNumber(folio);
  if (!cleaned) return 'Folio number is required';
  if (!/^[A-Z0-9/-]{4,25}$/.test(cleaned)) {
    return 'Invalid Folio number format';
  }
  return null;
}

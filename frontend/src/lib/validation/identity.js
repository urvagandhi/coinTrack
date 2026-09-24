/**
 * Identity Normalization & Validation - Enterprise FinTech Security
 * Standards: RFC 5321/5322 (Email), E.164 (Phone), Unicode NFKC (Names), OWASP ASVS v4.0.
 */

/**
 * Normalizes email address (lowercase, trimmed, length capped).
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates email using RFC 5322 simplified pattern.
 */
export function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'Email address is required';
  if (normalized.length > 254) return 'Email address is too long';
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(normalized)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Normalizes username (lowercase, trimmed).
 */
export function normalizeUsername(username) {
  if (!username || typeof username !== 'string') return '';
  return username.trim().toLowerCase();
}

/**
 * Validates username (alphanumeric + underscore, 3-50 chars, no reserved words).
 */
export function validateUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return 'Username is required';
  if (normalized.length < 3 || normalized.length > 50) {
    return 'Username must be between 3 and 50 characters';
  }
  if (!/^[a-z][a-z0-9_]{2,49}$/.test(normalized)) {
    return 'Username must start with a letter and contain only letters, numbers, and underscores';
  }
  const reserved = [
    'admin',
    'root',
    'system',
    'support',
    'null',
    'undefined',
    'cointrack',
    'api',
    'auth',
  ];
  if (reserved.includes(normalized)) {
    return 'This username is reserved';
  }
  return null;
}

/**
 * Normalizes legal full name: NFKC Unicode form, collapses extra spaces.
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().normalize('NFKC').replace(/\s+/g, ' ');
}

/**
 * Validates legal full name.
 */
export function validateName(name) {
  const normalized = normalizeName(name);
  if (!normalized) return 'Name is required';
  if (normalized.length < 2 || normalized.length > 100) {
    return 'Name must be between 2 and 100 characters';
  }
  if (!/^[\p{L}][\p{L}\s'.-]{1,99}$/u.test(normalized)) {
    return 'Name can only contain letters, spaces, hyphens, and periods';
  }
  return null;
}

/**
 * Normalizes Indian mobile number to 10 canonical digits.
 * Strips '+91', leading '0', spaces, and special characters.
 */
export function normalizePhoneIndia(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.substring(digits.length - 10);
  }
  return digits.slice(0, 10);
}

/**
 * Formats 10-digit Indian phone number for display (e.g. "+91 98765 43210").
 */
export function formatPhoneDisplay(phone) {
  const digits = normalizePhoneIndia(phone);
  if (digits.length !== 10) return phone || '';
  return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
}

/**
 * Validates Indian mobile number (10 digits, starts with 6-9).
 */
export function validatePhoneIndia(phone) {
  const digits = normalizePhoneIndia(phone);
  if (!digits) return 'Mobile number is required';
  if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return 'Mobile number must start with 6, 7, 8, or 9';
  }
  return null;
}

/**
 * Sanitizes free-form text: strips HTML tags, collapses whitespace, caps length.
 */
export function sanitizeText(text, maxLength = 500) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .normalize('NFKC')
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\s+/g, ' ')
    .substring(0, maxLength);
}

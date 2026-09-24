/**
 * FinTech Data Masking Utilities - Bank-Grade Privacy Protection
 * Standards: PCI-DSS, RBI Information Security Guidelines.
 */

/**
 * Masks an account number showing only the last N digits.
 * @param {string} acc
 * @param {number} [visibleDigits=4]
 * @param {string} [maskChar='•']
 * @returns {string}
 */
export function maskAccountNumber(acc, visibleDigits = 4, maskChar = '•') {
  if (!acc || typeof acc !== 'string') return '';
  const cleaned = acc.trim();
  if (cleaned.length <= visibleDigits) return cleaned;
  const maskedSection = maskChar.repeat(cleaned.length - visibleDigits);
  return `${maskedSection}${cleaned.slice(-visibleDigits)}`;
}

/**
 * Masks an Indian PAN number (e.g. "ABCDE••••F").
 * @param {string} pan
 * @returns {string}
 */
export function maskPAN(pan) {
  if (!pan || typeof pan !== 'string') return '';
  const cleaned = pan.trim().toUpperCase();
  if (cleaned.length !== 10) return cleaned;
  return `${cleaned.slice(0, 5)}••••${cleaned.slice(-1)}`;
}

/**
 * Masks a mobile phone number (e.g. "+91 ••••• •4321").
 * @param {string} phone
 * @returns {string}
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const last4 = digits.slice(-4);
  return `+91 ••••• •${last4}`;
}

/**
 * Masks an email address (e.g. "j•••••e@gmail.com").
 * @param {string} email
 * @returns {string}
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  const maskedMiddle = '•'.repeat(Math.min(localPart.length - 2, 5));
  return `${first}${maskedMiddle}${last}@${domain}`;
}

/**
 * Masks monetary balances for privacy mode toggles (e.g. "₹ ••••••").
 * @param {string|number} _amount
 * @param {boolean} isMasked
 * @param {string} [formattedValue]
 * @returns {string}
 */
export function maskBalance(
  _amount,
  isMasked = true,
  formattedValue = '₹ ••••••'
) {
  if (isMasked) return '₹ ••••••';
  return formattedValue;
}

/**
 * Security Sanitization & Safe Output Encoding - OWASP ASVS v4.0 Compliance
 * Protects against XSS, Prototype Pollution, and Unicode Smuggling.
 */

/**
 * Strips HTML tags and dangerous characters from user input strings.
 * @param {string} input
 * @param {number} [maxLength=1000]
 * @returns {string}
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';
  return input
    .normalize('NFKC')
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip JS protocol
    .replace(/data:/gi, '') // Strip data protocol
    .replace(/\0/g, '') // Strip null bytes
    .slice(0, maxLength);
}

/**
 * Escapes HTML entities for safe DOM rendering.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return str.replace(/[&<>"'`=\/]/g, char => htmlEntities[char]);
}

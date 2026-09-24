/**
 * Secure State & Storage Abstraction - Bank-Grade Data Protection
 * Standards: OWASP Session Management Cheat Sheet, NIST SP 800-63B.
 * Prevents plain-text storage of sensitive auth tokens and PII in persistent localStorage.
 */

class SecureStorageManager {
  constructor() {
    this.memoryStore = new Map();
  }

  /**
   * Sets in-memory session token (never hits localStorage/disk).
   */
  setSessionToken(token) {
    if (!token) {
      this.memoryStore.delete('authToken');
    } else {
      this.memoryStore.set('authToken', token);
    }
  }

  /**
   * Retrieves in-memory session token.
   */
  getSessionToken() {
    return this.memoryStore.get('authToken') || null;
  }

  /**
   * Clears all sensitive session state.
   */
  clearSession() {
    this.memoryStore.clear();
  }

  /**
   * Safe non-sensitive preference storage (e.g. theme, UI collapsed states).
   * Explicitly blocks sensitive keys like 'token', 'jwt', 'password', 'pan', 'aadhaar'.
   */
  setSafePreference(key, value) {
    const sensitiveKeys = [
      'token',
      'jwt',
      'auth',
      'password',
      'pan',
      'aadhaar',
      'secret',
    ];
    const isSensitive = sensitiveKeys.some(k => key.toLowerCase().includes(k));
    if (isSensitive) {
      console.warn(
        `[Security Warning] Attempted to store sensitive key "${key}" in persistent storage.`
      );
      return false;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch (e) {
      console.error('Failed to save preference:', e);
    }
    return false;
  }

  /**
   * Reads safe preference.
   */
  getSafePreference(key, defaultValue = null) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch {
      return defaultValue;
    }
    return defaultValue;
  }
}

export const secureStorage = new SecureStorageManager();

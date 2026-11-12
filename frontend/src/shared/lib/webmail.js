// Shared webmail provider detection + deep-link helpers.
// Used by the forgot-password "email sent" screen and the email-verification
// banner so the "Open Email" action can target the user's actual inbox
// instead of always opening Gmail.

const WEBMAIL_PROVIDERS = [
  {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    web: 'https://mail.google.com/mail/u/0/#inbox',
    iosScheme: 'googlegmail://',
    androidPackage: 'com.google.android.gm',
  },
  {
    name: 'Outlook',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    web: 'https://outlook.live.com/mail/0/',
    iosScheme: 'ms-outlook://',
    androidPackage: 'com.microsoft.office.outlook',
  },
  {
    name: 'Yahoo Mail',
    domains: ['yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com'],
    web: 'https://mail.yahoo.com/',
    iosScheme: 'ymail://',
    androidPackage: 'com.yahoo.mobile.client.android.mail',
  },
  {
    name: 'Proton Mail',
    domains: ['proton.me', 'protonmail.com', 'pm.me'],
    web: 'https://mail.proton.me/',
    iosScheme: 'protonmail://',
    androidPackage: 'ch.protonmail.android',
  },
  {
    name: 'iCloud Mail',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    web: 'https://www.icloud.com/mail',
    iosScheme: null,
    androidPackage: null,
  },
  {
    name: 'Zoho Mail',
    domains: ['zoho.com', 'zohomail.com'],
    web: 'https://mail.zoho.com/',
    iosScheme: null,
    androidPackage: null,
  },
];

/**
 * Detect the webmail provider from an email identifier.
 *
 * @param {string} identifier email (or email/phone/username) the user entered
 * @returns {{name: string, web: string, iosScheme: string|null, androidPackage: string|null}|null}
 */
export function detectWebmailProvider(identifier) {
  const value = (identifier || '').trim().toLowerCase();
  const atIndex = value.lastIndexOf('@');
  if (atIndex === -1) return null;

  const domain = value.slice(atIndex + 1);
  if (!domain) return null;

  return (
    WEBMAIL_PROVIDERS.find(provider => provider.domains.includes(domain)) ||
    null
  );
}

/**
 * Open the detected webmail provider, preferring the native app on mobile
 * with a web fallback. Returns false when the URL cannot be opened (SSR).
 *
 * @param {{web: string, iosScheme: string|null, androidPackage: string|null}|null} provider
 * @returns {boolean}
 */
export function openWebmailProvider(provider) {
  if (typeof window === 'undefined' || !provider?.web) return false;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS && provider.iosScheme) {
    window.location.href = provider.iosScheme;
    // Fallback to the web inbox if the native app is not installed.
    setTimeout(() => window.open(provider.web, '_blank'), 2000);
    return true;
  }

  if (isAndroid && provider.androidPackage) {
    const intent =
      'intent:#Intent;' +
      'action=android.intent.action.MAIN;' +
      'category=android.intent.category.LAUNCHER;' +
      `package=${provider.androidPackage};` +
      `S.browser_fallback_url=${encodeURIComponent(provider.web)};end`;
    window.location.href = intent;
    return true;
  }

  window.open(provider.web, '_blank');
  return true;
}

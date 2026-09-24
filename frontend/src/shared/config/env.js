/**
 * Validated Environment Variables
 */
export const ENV = {
  API_BASE: process.env.NEXT_PUBLIC_API_BASE || '',
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  IS_DEV: process.env.NODE_ENV !== 'production',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://cointrack.in',
};

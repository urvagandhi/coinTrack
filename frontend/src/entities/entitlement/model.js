/**
 * Entitlement Entity Model
 * Mirrors backend EntitlementService tier contracts.
 */
export const TIERS = {
  FREE: 'FREE',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
};

export const createEntitlementModel = (raw = {}) => ({
  tier: raw.tier || TIERS.FREE,
  isPro: raw.tier === TIERS.PRO || raw.tier === TIERS.ENTERPRISE,
  features: Array.isArray(raw.features) ? raw.features : [],
  maxBrokers: raw.maxBrokers ?? (raw.tier === TIERS.PRO ? 10 : 1),
  canExportTaxReports: Boolean(raw.canExportTaxReports ?? (raw.tier === TIERS.PRO)),
  canAccessApi: Boolean(raw.canAccessApi ?? (raw.tier === TIERS.ENTERPRISE)),
});

'use client';

import { useEntitlement } from './useEntitlement';

/**
 * EntitlementGate - Declarative Tier & Feature Guard
 */
export function EntitlementGate({
  feature,
  requiredTier = 'PRO',
  fallback = null,
  children,
}) {
  const { isPro, hasEntitlement } = useEntitlement();

  if (feature && !hasEntitlement(feature)) {
    return fallback;
  }

  if (requiredTier === 'PRO' && !isPro) {
    return fallback;
  }

  return <>{children}</>;
}

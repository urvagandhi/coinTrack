'use client';

import { useAuth } from '@/shared/auth/AuthContext';
import { useCallback, useMemo } from 'react';

/**
 * Enterprise Entitlement & Tier Gating Hook
 * Mirrors backend EntitlementService
 */
export function useEntitlement() {
  const { user } = useAuth();

  const tier = useMemo(() => {
    return user?.tier || (user?.isPro ? 'PRO' : 'FREE');
  }, [user]);

  const hasEntitlement = useCallback(
    featureKey => {
      if (!user) return false;
      if (tier === 'PRO' || tier === 'ENTERPRISE') return true;

      const userEntitlements = user.entitlements || [];
      return userEntitlements.includes(featureKey);
    },
    [user, tier]
  );

  return {
    tier,
    isPro: tier === 'PRO' || tier === 'ENTERPRISE',
    hasEntitlement,
  };
}

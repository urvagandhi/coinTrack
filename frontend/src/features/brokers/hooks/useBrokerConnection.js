// src/hooks/useBrokerConnection.js
import { portfolioAPI } from '@/shared/api/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Invalidate all broker status, portfolio summaries, and holdings queries across the application.
 * Forces immediate concurrent network refetch of all active queries so UI updates in real-time.
 */
export async function invalidateBrokerQueries(queryClient) {
  if (!queryClient) return;
  // 1. Invalidate domain query trees so inactive views fetch freshly upon navigation
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['brokers'] }),
    queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
    queryClient.invalidateQueries({ queryKey: ['holdings'] }),
  ]);

  // 2. Actively refetch critical mounted queries so the current screen updates immediately
  return Promise.all([
    queryClient.refetchQueries({
      queryKey: ['brokers', 'sync-status'],
      type: 'active',
    }),
    queryClient.refetchQueries({
      queryKey: ['portfolio'],
      type: 'active',
    }),
    queryClient.refetchQueries({
      queryKey: ['holdings'],
      type: 'active',
    }),
  ]);
}

/**
 * Fetches broker sync status from the single /api/portfolio/sync/status endpoint.
 * Returns the full response: { brokers: [...], hasIssues: boolean }
 */
export function useBrokerConnection() {
  return useQuery({
    queryKey: ['brokers', 'sync-status'],
    queryFn: portfolioAPI.getSyncStatus,
    refetchInterval: 30 * 1000,
    staleTime: 0,
  });
}

/**
 * Derived helper — summarizes broker status for sidebar/header badges.
 */
export function useBrokerSummary() {
  const { data, isLoading } = useBrokerConnection();

  if (isLoading || !data) {
    return {
      connectedCount: 0,
      hasExpired: false,
      hasExpiringSoon: false,
      isLoading,
    };
  }

  const brokers = data?.brokers ?? [];
  const connectedCount = brokers.filter(b => b.tokenActive).length;
  const hasExpired = brokers.some(b => !b.tokenActive && b.lastStatus !== null);
  const hasExpiringSoon = brokers.some(b => b.isExpiringSoon);

  return { connectedCount, hasExpired, hasExpiringSoon, isLoading };
}

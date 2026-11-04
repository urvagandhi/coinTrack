// src/hooks/useBrokerConnection.js
import { portfolioAPI } from '@/shared/api/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Invalidate all broker status, portfolio summaries, and holdings queries across the application.
 * Forces immediate active network refetch of ['brokers', 'sync-status'] so UI updates in real-time.
 */
export async function invalidateBrokerQueries(queryClient) {
  if (!queryClient) return;
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['brokers'] }),
    queryClient.refetchQueries({
      queryKey: ['brokers', 'sync-status'],
      type: 'active',
    }),
    queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
    queryClient.invalidateQueries({ queryKey: ['holdings'] }),
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

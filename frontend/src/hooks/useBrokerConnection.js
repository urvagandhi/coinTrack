// src/hooks/useBrokerConnection.js
import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetches broker sync status from the single /api/portfolio/sync/status endpoint.
 * Returns the full response: { brokers: [...], hasIssues: boolean }
 */
export function useBrokerConnection() {
    return useQuery({
        queryKey: ['brokers', 'sync-status'],
        queryFn: portfolioAPI.getSyncStatus,
        refetchInterval: 60 * 1000,
        staleTime: 30 * 1000,
    });
}

/**
 * Derived helper — summarizes broker status for sidebar/header badges.
 */
export function useBrokerSummary() {
    const { data, isLoading } = useBrokerConnection();

    if (isLoading || !data) {
        return { connectedCount: 0, hasExpired: false, hasExpiringSoon: false, isLoading };
    }

    const brokers = data?.brokers ?? [];
    const connectedCount = brokers.filter((b) => b.tokenActive).length;
    const hasExpired = brokers.some((b) => !b.tokenActive && b.lastStatus !== null);
    const hasExpiringSoon = brokers.some((b) => b.isExpiringSoon);

    return { connectedCount, hasExpired, hasExpiringSoon, isLoading };
}

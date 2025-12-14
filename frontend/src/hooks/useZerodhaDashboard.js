import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useZerodhaDashboard() {
    // REFACTORED: Consumes canonical Portfolio API and filters for Zerodha

    const { data: summary, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'summary'],
        queryFn: portfolioAPI.getSummary,
    });

    // Derive Zerodha-specific views from the consolidated summary
    const zerodhaHoldings = summary?.holdingsList?.filter(
        h => h.broker === 'ZERODHA' && h.type === 'HOLDING'
    ) || [];

    // Backend currently does not support specialized Profile/Funds/SIPs for specific brokers
    // Returning null/empty to prevents runtime crashes.
    const mfHoldings = [];
    const sips = [];
    const profile = null;

    return {
        holdings: zerodhaHoldings,
        mfHoldings,
        sips,
        profile,
        isLoading,
        error,
        refreshAll: refetch
    };
}

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

    // FETCH REAL DATA (Fix for misleading stubs)
    const { data: mfData } = useQuery({
        queryKey: ['mfHoldings'],
        queryFn: portfolioAPI.getMfHoldings
    });
    const mfHoldings = mfData?.data || [];

    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: portfolioAPI.getProfile
    });

    const sips = []; // Backend support for SIP list pending

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

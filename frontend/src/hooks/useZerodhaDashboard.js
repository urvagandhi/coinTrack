import { brokerAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useZerodhaDashboard() {
    // We can use a combined query or multiple queries.
    // Given the dashboard loads everything, parallel queries are best.

    const holdingsQuery = useQuery({
        queryKey: ['zerodha', 'holdings'],
        queryFn: brokerAPI.getZerodhaHoldings,
    });

    const fundsQuery = useQuery({
        queryKey: ['zerodha', 'funds'],
        queryFn: brokerAPI.getZerodhaFunds,
    });

    const sipsQuery = useQuery({
        queryKey: ['zerodha', 'sips'],
        queryFn: brokerAPI.getZerodhaSIPs,
    });

    const profileQuery = useQuery({
        queryKey: ['zerodha', 'profile'],
        queryFn: brokerAPI.getZerodhaProfile,
    });

    const isLoading = holdingsQuery.isLoading || fundsQuery.isLoading || sipsQuery.isLoading || profileQuery.isLoading;
    const error = holdingsQuery.error || fundsQuery.error || sipsQuery.error || profileQuery.error;

    // Manual Refresh Function
    const refreshAll = async () => {
        await Promise.all([
            holdingsQuery.refetch(),
            fundsQuery.refetch(),
            sipsQuery.refetch(),
            profileQuery.refetch()
        ]);
    };

    return {
        holdings: holdingsQuery.data,
        mfHoldings: fundsQuery.data,
        sips: sipsQuery.data,
        profile: profileQuery.data,
        isLoading,
        error,
        refreshAll
    };
}

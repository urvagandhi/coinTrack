// src/hooks/usePortfolioHoldings.js
import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function usePortfolioHoldings() {
    return useQuery({
        queryKey: ['portfolio', 'holdings'],
        queryFn: portfolioAPI.getHoldings,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

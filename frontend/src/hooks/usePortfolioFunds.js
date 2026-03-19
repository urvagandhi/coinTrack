// src/hooks/usePortfolioFunds.js
import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function usePortfolioFunds() {
    return useQuery({
        queryKey: ['portfolio', 'funds'],
        queryFn: portfolioAPI.getFunds,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

// src/hooks/usePortfolioSummary.js
import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function usePortfolioSummary() {
    return useQuery({
        queryKey: ['portfolio', 'summary'],
        queryFn: portfolioAPI.getSummary,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

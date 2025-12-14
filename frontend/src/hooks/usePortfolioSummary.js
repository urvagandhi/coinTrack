import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function usePortfolioSummary() {
    return useQuery({
        queryKey: ['portfolio', 'summary'],
        queryFn: portfolioAPI.getSummary,
        // Data is fairly static during the day unless refresh happens
        staleTime: 5 * 60 * 1000,
    });
}

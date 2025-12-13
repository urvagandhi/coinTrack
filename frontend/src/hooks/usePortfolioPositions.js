import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function usePortfolioPositions() {
    return useQuery({
        queryKey: ['portfolio', 'positions'],
        queryFn: portfolioAPI.getPositions,
    });
}

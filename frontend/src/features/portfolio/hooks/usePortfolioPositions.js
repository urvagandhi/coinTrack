// src/hooks/usePortfolioPositions.js
import { portfolioAPI } from '@/shared/api/client';
import { useQuery } from '@tanstack/react-query';

export function usePortfolioPositions() {
  return useQuery({
    queryKey: ['portfolio', 'positions'],
    queryFn: portfolioAPI.getPositions,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}


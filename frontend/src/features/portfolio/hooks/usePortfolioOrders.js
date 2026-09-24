// src/hooks/usePortfolioOrders.js
import { portfolioAPI } from '@/shared/api/client';
import { useQuery } from '@tanstack/react-query';

export function usePortfolioOrders() {
  return useQuery({
    queryKey: ['portfolio', 'orders'],
    queryFn: portfolioAPI.getOrders,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
  });
}


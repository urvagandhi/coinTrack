import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const fetchPortfolioSummary = async () => {
    const { data } = await api.get('/api/portfolio/summary');
    return data;
};

export function usePortfolio() {
    return useQuery({
        queryKey: ['portfolio', 'summary'],
        queryFn: fetchPortfolioSummary,
    });
}

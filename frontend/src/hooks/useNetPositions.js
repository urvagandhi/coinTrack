import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const fetchNetPositions = async () => {
    // Ensuring we hit the Unified Holdings endpoint from Job 10/11
    const { data } = await api.get('/api/portfolio/net-positions');
    return data;
};

export function useNetPositions() {
    return useQuery({
        queryKey: ['portfolio', 'net-positions'],
        queryFn: fetchNetPositions,
    });
}

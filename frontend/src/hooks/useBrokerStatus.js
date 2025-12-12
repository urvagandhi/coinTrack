import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';

// Assuming Job 9 implemented status endpoint.
// Since endpoint is /api/brokers/{broker}/status, we might need to fetch for all known brokers.
// For now, let's hardcode checking Zerodha and Upstox as they are the primary ones.

const fetchBrokerStatus = async (broker) => {
    try {
        const { data } = await api.get(`/api/brokers/${broker}/status`);
        return { broker, ...data };
    } catch (e) {
        return { broker, status: 'ERROR', connected: false };
    }
};

export function useBrokerStatus() {
    // Fetching multiple brokers in parallel
    return useQuery({
        queryKey: ['brokers', 'status'],
        queryFn: async () => {
            const brokers = ['ZERODHA', 'UPSTOX']; // Add more if needed
            const results = await Promise.all(brokers.map(b => fetchBrokerStatus(b)));
            return results;
        },
        refetchInterval: 60000, // Check every minute
    });
}

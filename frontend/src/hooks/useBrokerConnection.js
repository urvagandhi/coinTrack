import { brokerAPI, BROKERS } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useBrokerConnection() {
    return useQuery({
        queryKey: ['brokers', 'status'],
        queryFn: async () => {
            const brokers = [BROKERS.ZERODHA, BROKERS.UPSTOX];
            const results = await Promise.all(
                brokers.map(async (broker) => {
                    try {
                        const data = await brokerAPI.getStatus(broker);
                        return { broker, ...data };
                    } catch (error) {
                        return { broker, status: 'ERROR', connected: false };
                    }
                })
            );
            return results;
        },
        refetchInterval: 60000, // Check every minute
    });
}

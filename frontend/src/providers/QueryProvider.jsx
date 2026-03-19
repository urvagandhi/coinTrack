'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data considered fresh for 1 minute — prevents redundant broker API calls
                        staleTime: 60 * 1000,

                        // Keep unused data in cache for 10 minutes before GC
                        gcTime: 10 * 60 * 1000,

                        // Don't refetch on window focus — broker rate limit protection
                        refetchOnWindowFocus: false,

                        // Refetch if network reconnects (user was offline)
                        refetchOnReconnect: true,

                        // Only refetch on mount if data is stale (older than staleTime)
                        // 'stale' = refetch if >60s old; skip if <60s old
                        refetchOnMount: 'stale',

                        // Smart retry: never retry 4xx, retry 5xx up to 2 times
                        retry: (failureCount, error) => {
                            const status = error?.status || error?.response?.status;
                            if (status === 401 || status === 403) return false;
                            if (status >= 400 && status < 500) return false;
                            return failureCount < 2;
                        },
                        retryDelay: (attemptIndex) =>
                            Math.min(1000 * 2 ** attemptIndex, 10000),
                    },
                    mutations: {
                        // Never auto-retry mutations (POST/PUT/DELETE)
                        retry: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

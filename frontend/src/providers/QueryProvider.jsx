'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Aggressive staleTime to minimize broker API calls
                        // 60 seconds means data is considered fresh for 1 minute
                        staleTime: 60 * 1000,

                        // Cache time (garbage collection)
                        // Keep unused data in cache for 10 minutes
                        gcTime: 10 * 60 * 1000,

                        // Disable automatic refetches that cause API spam
                        refetchOnWindowFocus: false,
                        refetchOnReconnect: false,
                        refetchOnMount: false,

                        // Retry failed requests once before throwing error
                        // Exception: 401/403 errors should ideally rely on API interceptor
                        retry: 1,
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

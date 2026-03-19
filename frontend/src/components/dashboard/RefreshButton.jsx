// src/components/dashboard/RefreshButton.jsx
'use client';

import { portfolioAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';

export function RefreshButton() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const mutation = useMutation({
        mutationFn: portfolioAPI.manualRefresh,
        onSuccess: () => {
            setTimeout(async () => {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
                    queryClient.invalidateQueries({ queryKey: ['brokers'] }),
                    queryClient.invalidateQueries({ queryKey: ['holdings'] }),
                ]);
                setIsRefreshing(false);
            }, 2000);
        },
        onError: () => {
            setIsRefreshing(false);
        },
    });

    const handleRefresh = useCallback(() => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        mutation.mutate();
    }, [isRefreshing, mutation]);

    return (
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
                'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-foreground hover:bg-gray-50 dark:hover:bg-gray-800',
                isRefreshing && 'opacity-70'
            )}
        >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
        </button>
    );
}

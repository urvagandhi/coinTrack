'use client';

import { portfolioAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

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
                toast.success('Portfolio synced');
            }, 2000);
        },
        onError: (err) => {
            setIsRefreshing(false);
            toast.error(err?.message || 'Sync failed');
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
            className="ed-btn ed-btn-ghost group"
        >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} strokeWidth={2} />
            <span>{isRefreshing ? 'Syncing' : 'Sync'}</span>
            <span className="hidden sm:inline text-[9px] tracking-[0.18em] text-muted-foreground border-l border-border pl-2 ml-1">
                ⌘R
            </span>
        </button>
    );
}

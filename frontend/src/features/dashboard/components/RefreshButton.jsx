'use client';

import { invalidateBrokerQueries } from '@/features/brokers/hooks/useBrokerConnection';
import { portfolioAPI } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function RefreshButton() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { mutate } = useMutation({
    mutationFn: portfolioAPI.manualRefresh,
    onSuccess: async () => {
      try {
        await invalidateBrokerQueries(queryClient);
        toast.success('Portfolio synced');
      } catch (err) {
        console.error('Failed to refetch after sync', err);
      } finally {
        setIsRefreshing(false);
      }
    },
    onError: err => {
      setIsRefreshing(false);
      toast.error(err?.message || 'Sync failed');
    },
  });

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    mutate();
  }, [isRefreshing, mutate]);

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className='ed-btn ed-btn-ghost group'
    >
      <RefreshCw
        className={cn('h-3 w-3', isRefreshing && 'animate-spin')}
        strokeWidth={2}
      />
      <span>{isRefreshing ? 'Syncing' : 'Sync'}</span>
      <span className='hidden sm:inline text-[9px] tracking-[0.18em] text-muted-foreground border-l border-border pl-2 ml-1'>
        ⌘R
      </span>
    </button>
  );
}

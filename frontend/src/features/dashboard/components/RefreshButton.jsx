'use client';

import { useSyncFeeds } from '@/features/brokers/hooks/useSyncFeeds';
import { cn } from '@/shared/lib/utils';
import { RefreshCw } from 'lucide-react';

export function RefreshButton() {
  const { sync: handleRefresh, isSyncing } = useSyncFeeds({
    enableShortcut: true,
  });

  return (
    <button
      type='button'
      onClick={handleRefresh}
      disabled={isSyncing}
      title='Sync all holdings and market feeds (⌘R)'
      className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
    >
      <RefreshCw
        className={cn('size-3.5', isSyncing && 'animate-spin')}
        strokeWidth={2}
      />
      <span>{isSyncing ? 'Syncing…' : 'Sync'}</span>
      <span className='hidden sm:inline text-[9px] font-mono tracking-wider opacity-60 border-l border-white/20 dark:border-neutral-700/60 pl-2 ml-1'>
        ⌘R
      </span>
    </button>
  );
}

export default RefreshButton;

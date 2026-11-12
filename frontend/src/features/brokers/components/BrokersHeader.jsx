'use client';

import { RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function BrokersHeader({ connectedCount, isRefreshing, onRefresh }) {
  return (
    <section className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
          Broker Connections
        </h1>
        <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal max-w-2xl'>
          Authorise your brokerage accounts to syndicate holdings, positions,
          and funds. CoinTrack reads only — it cannot trade on your behalf.
        </p>
      </div>

      <div className='flex items-center gap-2 self-start sm:self-auto'>
        {connectedCount > 0 && (
          <button
            type='button'
            onClick={onRefresh}
            disabled={isRefreshing}
            className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50'
          >
            <RefreshCw
              className={cn('size-3.5', isRefreshing && 'animate-spin')}
            />
            <span>{isRefreshing ? 'Syncing…' : 'Sync All Feeds'}</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default BrokersHeader;

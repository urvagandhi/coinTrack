'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { BROKER_FILTER_TABS } from '../constants';

export function BrokersFilterToolbar({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
}) {
  return (
    <section className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
      {/* Filter Tabs */}
      <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none'>
        {BROKER_FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
              )}
            >
              <span>{tab.label}</span>
              {typeof count === 'number' && (
                <span className='text-[11px] opacity-70'>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className='relative w-full sm:w-64 shrink-0'>
        <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none' />
        <input
          type='text'
          placeholder='Search brokers...'
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className='w-full h-9 pl-10 pr-8 rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all'
        />
        {search && (
          <button
            type='button'
            onClick={() => onSearchChange('')}
            className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer'
            aria-label='Clear search'
          >
            <X className='size-3.5' />
          </button>
        )}
      </div>
    </section>
  );
}

export default BrokersFilterToolbar;

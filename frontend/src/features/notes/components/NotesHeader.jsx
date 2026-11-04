'use client';

import { LayoutGrid, List, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function NotesHeader({
  viewMode = 'grid',
  onViewModeChange,
  onNewNote,
}) {
  return (
    <section className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
          Notes
        </h1>
        <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5'>
          Your personal investment log — ideas, why you bought, and lessons
          learned.
        </p>
      </div>

      <div className='flex items-center gap-2 self-start sm:self-auto'>
        {/* View mode toggle */}
        <div className='flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 p-0.5'>
          <button
            type='button'
            onClick={() => onViewModeChange?.('grid')}
            className={cn(
              'size-7 rounded-md flex items-center justify-center transition-colors cursor-pointer',
              viewMode === 'grid'
                ? 'bg-white dark:bg-neutral-800 text-foreground shadow-2xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            )}
            title='Grid view'
            aria-label='Grid view'
          >
            <LayoutGrid className='size-3.5' />
          </button>
          <button
            type='button'
            onClick={() => onViewModeChange?.('list')}
            className={cn(
              'size-7 rounded-md flex items-center justify-center transition-colors cursor-pointer',
              viewMode === 'list'
                ? 'bg-white dark:bg-neutral-800 text-foreground shadow-2xs font-semibold'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            )}
            title='List view'
            aria-label='List view'
          >
            <List className='size-3.5' />
          </button>
        </div>

        {/* New note button */}
        <button
          type='button'
          onClick={onNewNote}
          className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs sm:text-sm font-medium transition-colors cursor-pointer'
        >
          <Plus className='size-3.5' strokeWidth={2.5} />
          <span>New note</span>
        </button>
      </div>
    </section>
  );
}

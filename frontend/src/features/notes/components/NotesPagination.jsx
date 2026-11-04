'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function NotesPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className='flex items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800'>
      <p className='text-xs text-neutral-400 font-mono'>
        Showing {page * pageSize + 1}–
        {Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
      </p>

      <div className='flex items-center gap-1'>
        <button
          type='button'
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className='size-7 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer'
          aria-label='Previous page'
        >
          <ChevronLeft className='size-3.5' />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          const p = page < 3 ? i : page - 2 + i;
          if (p >= totalPages) return null;
          return (
            <button
              key={p}
              type='button'
              onClick={() => onPageChange(p)}
              className={cn(
                'size-7 rounded-md font-mono text-xs transition-colors flex items-center justify-center cursor-pointer',
                p === page
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                  : 'border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              )}
            >
              {p + 1}
            </button>
          );
        })}

        <button
          type='button'
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className='size-7 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer'
          aria-label='Next page'
        >
          <ChevronRight className='size-3.5' />
        </button>
      </div>
    </div>
  );
}

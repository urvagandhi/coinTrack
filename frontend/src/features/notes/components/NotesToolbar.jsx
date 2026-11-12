'use client';

import { RotateCcw, Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function NotesToolbar({
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categoryCounts,
  existingCustomTypes = [],
  onDeleteCustomType,
  availableTags = [],
  activeTag,
  onTagChange,
  hasActiveFilters,
  onResetFilters,
}) {
  const allCategories = [
    { id: 'idea', label: 'Ideas', isCustom: false },
    { id: 'conviction', label: 'Why I bought', isCustom: false },
    { id: 'thought', label: 'Market thoughts', isCustom: false },
    { id: 'lesson', label: 'Lessons', isCustom: false },
    ...existingCustomTypes.map(c => ({
      id: c.id,
      label: c.label,
      isCustom: true,
    })),
  ];

  return (
    <section className='space-y-3'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        {/* Category Tabs */}
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none'>
          <button
            type='button'
            onClick={() => onCategoryChange?.('all')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
              activeCategory === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
            )}
          >
            <span>All</span>
            <span className='text-[11px] opacity-70'>{categoryCounts.all}</span>
          </button>

          {allCategories.map(cat => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className='relative shrink-0 inline-flex group/cattab'
              >
                <button
                  type='button'
                  onClick={() => onCategoryChange?.(cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
                    cat.isCustom && 'pr-4',
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 dark:bg-neutral-800/60'
                  )}
                >
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span className='text-[11px] opacity-70'>{count}</span>
                  )}
                </button>

                {cat.isCustom && (
                  <button
                    type='button'
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteCustomType?.(cat.id, cat.label);
                    }}
                    className='absolute -top-1.5 -right-1.5 size-4 rounded-full bg-neutral-200 hover:bg-rose-500 hover:text-white dark:bg-neutral-700 dark:hover:bg-rose-500 dark:hover:text-white text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer z-10'
                    title={`Delete "${cat.label}" category`}
                    aria-label={`Delete ${cat.label} category`}
                  >
                    <X className='size-2.5 stroke-[2.5]' />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Search box */}
        <div className='relative w-full sm:w-64 shrink-0'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none' />
          <input
            type='text'
            placeholder='Search notes...'
            value={search}
            onChange={e => onSearchChange?.(e.target.value)}
            className='w-full h-9 pl-10 pr-8 rounded-lg border border-neutral-200/90 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all'
          />
          {search && (
            <button
              type='button'
              onClick={() => onSearchChange?.('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer'
              aria-label='Clear search'
            >
              <X className='size-3.5' />
            </button>
          )}
        </div>
      </div>

      {/* Tags filter strip */}
      {availableTags.length > 0 && (
        <div className='flex items-center gap-1.5 flex-wrap pt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
          <span className='text-xs text-neutral-400 mr-0.5'>Tags:</span>
          {availableTags.map(tag => {
            const isSelected = activeTag === tag;
            return (
              <button
                key={tag}
                type='button'
                onClick={() => onTagChange?.(isSelected ? 'all' : tag)}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white font-medium'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                #{tag}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type='button'
              onClick={onResetFilters}
              className='inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1'
            >
              <RotateCcw className='size-3' />
              <span>Reset</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

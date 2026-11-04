'use client';

import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { SUGGESTED_TAGS } from '../constants';

export default function NoteTagsInput({
  tags = [],
  tagInput = '',
  onTagInputChange,
  onTagKeyDown,
  onAddTag,
  onRemoveTag,
  suggestedTags = SUGGESTED_TAGS,
}) {
  return (
    <div>
      <label className='block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
        Tags
      </label>

      <div className='flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 min-h-10 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 focus-within:ring-1 focus-within:ring-neutral-900 dark:focus-within:ring-neutral-100 transition-all'>
        {tags.map(tag => (
          <span
            key={tag}
            className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          >
            <span>#{tag}</span>
            <button
              type='button'
              onClick={() => onRemoveTag?.(tag)}
              className='hover:text-rose-600 transition-colors cursor-pointer'
              aria-label={`Remove tag ${tag}`}
            >
              <X className='size-3' />
            </button>
          </span>
        ))}

        <input
          type='text'
          placeholder={
            tags.length === 0 ? 'Add tags (e.g. stocks)...' : 'Add another...'
          }
          value={tagInput}
          onChange={e => onTagInputChange?.(e.target.value)}
          onKeyDown={onTagKeyDown}
          onBlur={() => {
            if (tagInput.trim()) onAddTag?.(tagInput);
          }}
          className='text-xs bg-transparent px-2 py-1 text-foreground placeholder:text-neutral-400 focus:outline-none flex-1 min-w-[120px]'
        />
      </div>

      {/* Quick Suggestions */}
      <div className='flex items-center gap-1.5 flex-wrap mt-2'>
        <span className='text-xs text-neutral-400'>Quick tags:</span>
        {suggestedTags.map(s => {
          const already = tags.includes(s);
          return (
            <button
              key={s}
              type='button'
              onClick={() => (already ? onRemoveTag?.(s) : onAddTag?.(s))}
              className={cn(
                'text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer',
                already
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              #{s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

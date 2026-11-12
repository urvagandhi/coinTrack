'use client';

import { Plus, Tag, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function NoteTypeSelector({
  presets = [],
  selectedType,
  onSelectType,
  customTypes = [],
  onDeleteCustomType,
  isAddingCustomType,
  setIsAddingCustomType,
  newCustomTypeInput,
  setNewCustomTypeInput,
  onAddCustomType,
  customTypeInputRef,
}) {
  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <label className='block text-xs font-medium text-neutral-700 dark:text-neutral-300'>
          Type of note
        </label>
        {!isAddingCustomType && (
          <button
            type='button'
            onClick={() => {
              setIsAddingCustomType(true);
              setTimeout(() => customTypeInputRef.current?.focus(), 50);
            }}
            className='inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer'
          >
            <Plus className='size-3' />
            <span>Custom label</span>
          </button>
        )}
      </div>

      {/* Presets and Custom Types list */}
      <div className='flex items-center gap-2 flex-wrap pt-1'>
        {presets.map(preset => {
          const isSelected = selectedType === preset.id;
          return (
            <button
              key={preset.id}
              type='button'
              onClick={() => onSelectType(preset.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer',
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-2xs'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
              )}
            >
              <span>{preset.label}</span>
            </button>
          );
        })}

        {/* User Custom Types with small cross on right top corner */}
        {customTypes.map(c => {
          const isSelected = selectedType === c.id;
          return (
            <div key={c.id} className='relative inline-flex group/type'>
              <button
                type='button'
                onClick={() => onSelectType(c.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer pr-4',
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-2xs'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <Tag className='size-3 shrink-0 opacity-70' />
                <span>{c.label}</span>
              </button>

              {/* Small cross on right top corner */}
              <button
                type='button'
                onClick={e => {
                  e.stopPropagation();
                  onDeleteCustomType(c.id);
                }}
                className='absolute -top-1.5 -right-1.5 size-4 rounded-full bg-neutral-200 hover:bg-rose-500 hover:text-white dark:bg-neutral-700 dark:hover:bg-rose-500 dark:hover:text-white text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors shadow-2xs cursor-pointer z-10'
                title={`Delete "${c.label}"`}
                aria-label={`Delete ${c.label}`}
              >
                <X className='size-2.5 stroke-[2.5]' />
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline Custom Type Creator */}
      {isAddingCustomType && (
        <div className='mt-2.5 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-900/60 flex items-center gap-2 animate-in fade-in-50 duration-150'>
          <input
            ref={customTypeInputRef}
            type='text'
            placeholder='e.g. Crypto, Dividends, Watchlist, Real Estate...'
            value={newCustomTypeInput}
            onChange={e => setNewCustomTypeInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddCustomType();
              } else if (e.key === 'Escape') {
                setIsAddingCustomType(false);
                setNewCustomTypeInput('');
              }
            }}
            className='flex-1 h-8 px-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-foreground placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100'
          />
          <button
            type='button'
            onClick={onAddCustomType}
            disabled={!newCustomTypeInput.trim()}
            className='px-3 h-8 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-40 cursor-pointer transition-colors'
          >
            Add
          </button>
          <button
            type='button'
            onClick={() => {
              setIsAddingCustomType(false);
              setNewCustomTypeInput('');
            }}
            className='px-2 h-8 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer'
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { Search, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/primitives/popover';
import { cn } from '@/shared/lib/utils';

export function SearchCombobox({
  inputRef,
  value,
  onChange,
  onSelect,
  results,
  loading,
  open,
  onOpenChange,
  placeholder = 'Search...',
  renderItem,
  getKey,
  className,
  inputClassName,
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <input
            ref={inputRef}
            type='text'
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => {
              if (results.length > 0) onOpenChange(true);
            }}
            placeholder={placeholder}
            className={cn(
              'ed-input w-full font-sans outline-none shadow-sm text-[15px] py-2.5 pl-4 pr-10 rounded-xl bg-muted/40 backdrop-blur-xl focus:bg-background border-border/40 focus:ring-[3px] focus:ring-ring/50 transition-all duration-300',
              inputClassName
            )}
          />
          <div className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200'>
            {loading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Search className='w-4 h-4' />
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-[--radix-popover-trigger-width] p-1.5 z-[100]'
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <div className='max-h-60 overflow-y-auto'>
          {results.length > 0 ? (
            results.map(item => (
              <button
                key={getKey(item)}
                type='button'
                className='w-full flex flex-col justify-center px-3 py-2 text-sm hover:bg-foreground/15 hover:text-foreground focus:bg-foreground/15 focus:text-foreground rounded-xl mb-1 last:mb-0 transition-colors duration-150 outline-none text-left cursor-pointer'
                onClick={() => {
                  onSelect(item);
                }}
              >
                {renderItem(item)}
              </button>
            ))
          ) : (
            <div className='py-4 text-center text-sm text-muted-foreground'>
              No results found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


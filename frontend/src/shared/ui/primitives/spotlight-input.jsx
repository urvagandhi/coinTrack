'use client';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/primitives/badge';
import {
  Building2,
  Coins,
  CornerDownLeft,
  Landmark,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { Command as CommandIcon } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';

// ───────────────────────────────────────────────────────────────
//  SPOTLIGHT INPUT — Raycast / Linear frosted glass search bar
//  with quick-jump command suggestions, keyboard shortcuts & clear.
// ───────────────────────────────────────────────────────────────

export const DEFAULT_QUICK_JUMP_ITEMS = [
  {
    id: 'fd-4200',
    label: 'HDFC Fixed Deposit #4200',
    category: 'Fixed Deposit',
    Icon: Building2,
  },
  {
    id: 'ppf-2026',
    label: 'Public Provident Fund (PPF)',
    category: 'Tax Saving',
    Icon: Landmark,
  },
  {
    id: 'gold-24k',
    label: '24K Sovereign Gold Stack',
    category: 'Gold & Asset',
    Icon: Coins,
  },
];

export function SpotlightInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Search bank, FD, holding, or action...',
  icon,
  accelerator = 'K',
  activeFilterLabel = 'Active Filter:',
  showActiveFilter = true,
  quickJumpHeading = 'Quick Jump',
  quickJumpItems = DEFAULT_QUICK_JUMP_ITEMS,
  enableDropdown = true,
  className,
  ...props
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items based on current value
  const filteredItems = quickJumpItems.filter(
    item =>
      item.label.toLowerCase().includes((value || '').toLowerCase()) ||
      item.category.toLowerCase().includes((value || '').toLowerCase())
  );

  useEffect(() => {
    const onKeyDown = e => {
      const targetKey = accelerator.toUpperCase();
      if ((e.metaKey || e.ctrlKey) && e.key.toUpperCase() === targetKey) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [accelerator]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = e => {
    if (!isOpen || filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        prev => (prev - 1 + filteredItems.length) % filteredItems.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        handleSelectItem(selected);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = item => {
    onChange?.({ target: { value: item.label } });
    onSelect?.(item);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative z-30 focus-within:z-40 w-full min-w-0 space-y-2',
        className
      )}
    >
      <div className='group/spotlight relative flex items-center w-full min-w-0 rounded-2xl bg-background/50 hover:bg-background/80 focus-within:bg-background/95 backdrop-blur-2xl border border-border/50 hover:border-border/80 focus-within:border-foreground/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] focus-within:ring-2 focus-within:ring-foreground/10 transition-all duration-200'>
        <div className='pl-3.5 sm:pl-4 pr-2 text-muted-foreground group-focus-within/spotlight:text-foreground transition-colors shrink-0'>
          {icon || <Sparkles className='size-4 text-amber-500' />}
        </div>
        <input
          ref={inputRef}
          type='text'
          value={value}
          onChange={e => {
            onChange?.(e);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className='flex-1 min-w-0 bg-transparent py-3 pr-2 text-xs sm:text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none'
          {...props}
        />
        <div className='flex items-center gap-1.5 pr-2.5 sm:pr-3 shrink-0'>
          {value && (
            <button
              type='button'
              onClick={() => {
                onChange?.({ target: { value: '' } });
                setIsOpen(false);
              }}
              className='size-6 rounded-full bg-muted/60 hover:bg-foreground/15 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center'
              aria-label='Clear search'
            >
              <X className='size-3' />
            </button>
          )}
          {accelerator && (
            <kbd className='hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-xs'>
              <CommandIcon className='size-2.5' /> {accelerator}
            </kbd>
          )}
        </div>
      </div>

      {/* Interactive Quick Jump Dropdown */}
      {enableDropdown && isOpen && (
        <div className='absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border/80 bg-popover/90 backdrop-blur-xl text-popover-foreground shadow-2xl p-2 animate-in fade-in-0 zoom-in-95 ring-1 ring-foreground/5 overflow-hidden'>
          {quickJumpHeading && (
            <div className='px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between border-b border-border/30 mb-1 pb-1.5'>
              <span>{quickJumpHeading}</span>
              <span className='text-[9px] font-normal text-muted-foreground/50 hidden sm:inline'>
                Navigate ↑↓ · Enter to select
              </span>
            </div>
          )}
          {filteredItems.length === 0 ? (
            <div className='px-3 py-4 text-xs text-center text-muted-foreground font-mono'>
              No matching assets or actions found.
            </div>
          ) : (
            <div className='space-y-1 max-h-[220px] overflow-y-auto pr-0.5'>
              {filteredItems.map((item, idx) => {
                const ItemIcon = item.Icon || Sparkles;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id || item.label}
                    type='button'
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all duration-150 cursor-pointer outline-none gap-2',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold dark:bg-primary/20'
                        : 'hover:bg-muted/60 text-foreground'
                    )}
                  >
                    <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                      <ItemIcon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <span className='truncate'>{item.label}</span>
                    </div>
                    {item.category && (
                      <span
                        className={cn(
                          'text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 transition-colors',
                          isSelected
                            ? 'bg-primary/20 text-primary font-medium'
                            : 'bg-muted/60 text-muted-foreground border border-border/40'
                        )}
                      >
                        {item.category}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showActiveFilter && value && !isOpen && (
        <div className='flex flex-wrap items-center gap-2 pt-0.5 min-w-0'>
          <span className='text-[11px] text-muted-foreground shrink-0'>
            {activeFilterLabel}
          </span>
          <Badge
            variant='neutral'
            className='text-[11px] font-mono py-0.5 px-2 max-w-[200px] sm:max-w-xs truncate inline-block'
          >
            "{value}"
          </Badge>
        </div>
      )}
    </div>
  );
}

/* ---------- URL / Slug input ---------- */

export const SlugInput = forwardRef(function SlugInput(
  {
    value,
    onChange,
    placeholder,
    prefix = 'cointrack.app/',
    accelerator = 'Return',
    description,
    className,
    ...props
  },
  ref
) {
  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange?.(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9/-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/\/{2,}/g, '/')
      );
    }
  };

  return (
    <div className={cn('w-full min-w-0 space-y-2', className)}>
      <div className='group/slug relative flex items-center w-full min-w-0 rounded-2xl bg-background/50 hover:bg-background/80 focus-within:bg-background/95 backdrop-blur-2xl border border-border/50 hover:border-border/80 focus-within:border-foreground/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] focus-within:ring-2 focus-within:ring-foreground/10 transition-all duration-200 overflow-hidden'>
        <div className='shrink-0 pl-3 sm:pl-4 pr-2 py-3 text-[11px] sm:text-xs font-mono font-medium text-muted-foreground/70 bg-muted/30 border-r border-border/30 select-none flex items-center gap-1.5 max-w-[130px] sm:max-w-none truncate'>
          <Share2 className='size-3.5 text-muted-foreground shrink-0' />
          <span className='truncate'>{prefix}</span>
        </div>
        <input
          ref={ref}
          type='text'
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className='flex-1 min-w-0 bg-transparent px-2.5 sm:px-3 py-3 text-xs sm:text-[13px] font-mono text-foreground placeholder:text-muted-foreground/50 outline-none'
          {...props}
        />
        <div className='pr-2.5 sm:pr-3 shrink-0'>
          <kbd className='hidden sm:inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground'>
            <CornerDownLeft className='size-2.5' /> {accelerator}
          </kbd>
        </div>
      </div>
      {description && (
        <p className='text-[11px] text-muted-foreground leading-normal'>
          {description}
        </p>
      )}
    </div>
  );
});


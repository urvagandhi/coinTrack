'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, X } from 'lucide-react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';

// ───────────────────────────────────────────────────────────────
//  CURRENCY STEPPER — Fintech quick-action amount hero with
//  currency switch, quick-add increments, and Indian word
//  denominations (Stripe / Apple Pay style).
// ───────────────────────────────────────────────────────────────

const DEFAULT_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: '₹ INR' },
  { code: 'USD', symbol: '$', label: '$ USD' },
  { code: 'EUR', symbol: '€', label: '€ EUR' },
];

const DEFAULT_QUICK_ADD = [
  { label: '+₹1,000', add: 1000 },
  { label: '+₹5,000', add: 5000 },
  { label: '+₹25,000', add: 25000 },
  { label: '+₹1,00,000', add: 100000 },
];

export function formatIndianAmount(numStr = '') {
  const val = parseFloat(numStr);
  if (isNaN(val) || val <= 0) return 'Zero';
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Crore`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} Lakh`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)} Thousand`;
  return val.toLocaleString('en-IN');
}

export function CurrencyStepper({
  amount = '75000',
  onAmountChange,
  activeCurrency = 'INR',
  onCurrencyChange,
  currencies = DEFAULT_CURRENCIES,
  quickAdd = DEFAULT_QUICK_ADD,
  wordLabel,
  className,
}) {
  return (
    <div className={cn('w-full min-w-0 space-y-4', className)}>
      <div className='space-y-2 min-w-0'>
        <div className='flex flex-wrap items-center justify-between gap-2 min-w-0'>
          <span className='eyebrow-strong shrink-0'>
            Transaction Amount Hero
          </span>
          <span className='text-[11px] sm:text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md truncate max-w-[220px] sm:max-w-none'>
            {wordLabel || formatIndianAmount(amount)} {activeCurrency}
          </span>
        </div>

        <div className='relative flex items-center w-full min-w-0 rounded-xl bg-card/70 hover:bg-card/90 focus-within:bg-background backdrop-blur-xl border border-border/60 hover:border-border focus-within:border-foreground/40 p-1.5 sm:p-2 px-2.5 sm:px-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-200'>
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
              <button
                type='button'
                className='flex items-center gap-1 sm:gap-1.5 rounded-xl bg-muted/50 hover:bg-muted/80 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-foreground transition-colors cursor-pointer outline-none active:scale-95 shrink-0'
              >
                {currencies.find(c => c.code === activeCurrency)?.label ?? ''}
                <ChevronRight className='size-3 rotate-90 opacity-60 shrink-0' />
              </button>
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Content
              align='start'
              className='z-50 min-w-[120px] rounded-xl border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95'
            >
              {currencies.map(c => (
                <DropdownMenuPrimitive.Item
                  key={c.code}
                  onSelect={() => onCurrencyChange?.(c.code)}
                  className='cursor-pointer rounded-lg px-2.5 py-2 font-mono font-medium text-[13px] outline-none select-none hover:bg-muted focus:bg-muted'
                >
                  {c.label}
                </DropdownMenuPrimitive.Item>
              ))}
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Root>

          <input
            type='number'
            step='any'
            value={amount}
            onChange={e => onAmountChange?.(e.target.value)}
            placeholder='0.00'
            className='flex-1 min-w-0 bg-transparent px-2 sm:px-3 text-base sm:text-lg font-semibold font-mono tracking-tight text-foreground placeholder:text-muted-foreground/40 outline-none tabular-nums'
          />

          {amount && (
            <button
              type='button'
              onClick={() => onAmountChange?.('')}
              className='size-6 sm:size-7 rounded-full bg-muted/60 hover:bg-foreground/15 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95 shrink-0'
              aria-label='Clear amount'
            >
              <X className='size-3.5' />
            </button>
          )}
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 min-w-0'>
        <span className='text-xs text-muted-foreground font-medium mr-1 shrink-0'>
          Quick Add:
        </span>
        {quickAdd.map(chip => (
          <button
            key={chip.label}
            type='button'
            onClick={() => {
              const current = parseFloat(amount) || 0;
              const nextVal = Math.round((current + chip.add) * 100) / 100;
              onAmountChange?.(String(nextVal));
            }}
            className='px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-mono font-medium bg-muted/40 hover:bg-muted border border-border/40 text-foreground transition-all duration-150 active:scale-95 cursor-pointer shrink-0'
          >
            {chip.label}
          </button>
        ))}
        <button
          type='button'
          onClick={() => onAmountChange?.('0')}
          className='px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0'
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* ---------- Composition convenience ---------- */

export function CurrencyStepperDemo() {
  const [amount, setAmount] = useState('75000');
  const [currency, setCurrency] = useState('INR');
  return (
    <CurrencyStepper
      amount={amount}
      onAmountChange={setAmount}
      activeCurrency={currency}
      onCurrencyChange={setCurrency}
    />
  );
}

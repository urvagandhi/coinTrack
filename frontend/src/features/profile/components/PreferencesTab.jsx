'use client';

import { useState } from 'react';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { useToast } from '@/shared/ui/feedback/use-toast';
import { cn } from '@/shared/lib/utils';
import { THEME_OPTIONS, CURRENCY_OPTIONS } from '../constants';

export function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [maskBalances, setMaskBalances] = useState(false);

  return (
    <div className='space-y-7 pb-4'>
      <div className='pb-5 border-b border-black/[0.06] dark:border-white/[0.06]'>
        <h2 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
          Preferences
        </h2>
        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
          Customize your display theme, base currency, and interface behavior.
        </p>
      </div>

      {/* Theme / Appearance */}
      <div className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 space-y-4'>
        <div>
          <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
            Interface Appearance
          </h3>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Select your preferred color theme or match your system setting.
          </p>
        </div>

        <div className='grid grid-cols-3 gap-3 max-w-md'>
          {THEME_OPTIONS.map(item => {
            const ItemIcon = item.icon;
            const isCurrent = theme === item.id;
            return (
              <button
                key={item.id}
                type='button'
                onClick={() => setTheme(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                  isCurrent
                    ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                )}
              >
                <ItemIcon className='size-4' />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Currency Format */}
      <div className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 space-y-4'>
        <div>
          <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
            Base Currency
          </h3>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Choose the primary reporting currency for valuation calculations.
          </p>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {CURRENCY_OPTIONS.map(curr => {
            const isSelected = selectedCurrency === curr.code;
            return (
              <button
                key={curr.code}
                type='button'
                onClick={() => {
                  setSelectedCurrency(curr.code);
                  toast({
                    title: 'Currency Updated',
                    description: `Default currency set to ${curr.code} (${curr.symbol}).`,
                  });
                }}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left',
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                )}
              >
                <span className='size-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-mono font-bold'>
                  {curr.symbol}
                </span>
                <div>
                  <div className='font-bold'>{curr.code}</div>
                  <div className='text-[10px] text-neutral-400 font-normal truncate'>
                    {curr.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy Mode Toggle */}
      <div className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/30 flex items-center justify-between gap-4'>
        <div>
          <h3 className='text-sm sm:text-base font-bold text-foreground tracking-tight'>
            Mask Balances for Privacy
          </h3>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-lg leading-relaxed'>
            Hide sensitive portfolio values (e.g. ₹••••••) across dashboard
            cards when working in public spaces or presenting.
          </p>
        </div>

        <button
          type='button'
          onClick={() => setMaskBalances(!maskBalances)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer',
            maskBalances ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-neutral-800'
          )}
          aria-pressed={maskBalances}
        >
          <span
            className={cn(
              'inline-block size-4 rounded-full bg-white transition-transform shadow-xs',
              maskBalances ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    </div>
  );
}

export default PreferencesTab;

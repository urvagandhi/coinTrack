'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';

export function TotalNetWorthCard({
  totalValue,
  investedValue,
  unrealizedPL,
  unrealizedPLPercent,
  isPLPositive,
  isLoading,
}) {
  return (
    <div className='lg:col-span-7 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-5'>
      {/* Top Header Row */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
          <span className='text-xs font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight'>
            Total Net Worth
          </span>
          <span className='text-neutral-300 dark:text-neutral-700'>·</span>
          <span className='text-[11px] text-neutral-500 dark:text-neutral-400 font-mono'>
            Consolidated across 6 ledgers
          </span>
        </div>

        {/* All-Time Return Pill */}
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs font-mono font-medium inline-flex items-center gap-1 border shrink-0',
            isPLPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          )}
        >
          {isPLPositive ? (
            <ArrowUpRight className='size-3.5' />
          ) : (
            <ArrowDownRight className='size-3.5' />
          )}
          <span>
            {unrealizedPLPercent >= 0 ? '+' : ''}
            {formatPercent(unrealizedPLPercent)} all-time
          </span>
        </span>
      </div>

      {/* Hero Figure */}
      <div className='space-y-1'>
        <div className='text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono tnum leading-none'>
          {isLoading ? '…' : formatCurrency(totalValue)}
        </div>
        <p className='text-xs text-neutral-500 dark:text-neutral-400'>
          Real-time aggregate valuation across connected brokers and statutory
          folios.
        </p>
      </div>

      {/* Bottom Metrics Bar */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80'>
        {/* Sub-Stat 1: Invested Capital */}
        <div className='space-y-0.5'>
          <span className='text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium'>
            Invested Capital
          </span>
          <span className='text-sm sm:text-base font-semibold font-mono tnum text-neutral-900 dark:text-neutral-100'>
            {isLoading ? '…' : formatCurrency(investedValue)}
          </span>
          <span className='text-[10px] text-neutral-400 dark:text-neutral-500 block font-mono'>
            Across 6 asset classes
          </span>
        </div>

        {/* Sub-Stat 2: Unrealized Gain */}
        <div className='space-y-0.5'>
          <span className='text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium'>
            Unrealized Gain
          </span>
          <span
            className={cn(
              'text-sm sm:text-base font-semibold font-mono tnum',
              isPLPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isLoading
              ? '…'
              : `${isPLPositive ? '+' : ''}${formatCurrency(unrealizedPL)}`}
          </span>
          <span className='text-[10px] text-neutral-400 dark:text-neutral-500 block font-mono'>
            Overall P&amp;L spread
          </span>
        </div>

        {/* Sub-Stat 3: Benchmark Delta */}
        <div className='space-y-0.5 col-span-2 sm:col-span-1'>
          <span className='text-[11px] text-neutral-500 dark:text-neutral-400 block font-medium'>
            Alpha vs NIFTY
          </span>
          <span className='text-sm sm:text-base font-semibold font-mono tnum text-neutral-900 dark:text-neutral-100'>
            12.4% vs NIFTY 50
          </span>
          <span className='text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono'>
            Outperforming index
          </span>
        </div>
      </div>
    </div>
  );
}

export default TotalNetWorthCard;

'use client';

import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';

export function MomentumAndCashCard({
  dayGain,
  dayGainPercent,
  isDayPositive,
  equityPercent,
  cashPercent,
  feedLabel,
  isLoading,
}) {
  return (
    <div className='lg:col-span-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-5'>
      {/* Top Header Row */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          <span
            className={cn(
              'size-2 rounded-full',
              isDayPositive ? 'bg-emerald-500' : 'bg-rose-500'
            )}
          />
          <span className='text-xs font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight'>
            Today&apos;s Return
          </span>
        </div>

        {/* Session Delta Pill */}
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs font-mono font-medium inline-flex items-center gap-1 border shrink-0',
            isDayPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          )}
        >
          {isDayPositive ? (
            <ArrowUpRight className='size-3.5' />
          ) : (
            <ArrowDownRight className='size-3.5' />
          )}
          <span>
            {isDayPositive ? '+' : ''}
            {Math.abs(dayGainPercent) < 0.01
              ? '< 0.01%'
              : formatPercent(dayGainPercent)}{' '}
            since open
          </span>
        </span>
      </div>

      {/* Intraday Gain Figure */}
      <div className='space-y-1'>
        <div
          className={cn(
            'text-3xl sm:text-4xl md:text-[38px] font-bold tracking-tight font-mono tnum leading-none',
            isDayPositive
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-rose-600 dark:text-rose-400'
          )}
        >
          {isLoading
            ? '…'
            : `${isDayPositive ? '+' : ''}${formatCurrency(dayGain)}`}
        </div>
        <p className='text-xs text-neutral-500 dark:text-neutral-400'>
          Net portfolio delta since Indian equity market open (09:15 IST).
        </p>
      </div>

      {/* Capital Deployment & Broker Telemetry Box */}
      <div className='p-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 space-y-2'>
        <div className='flex items-center justify-between text-xs font-mono'>
          <span className='text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 font-sans font-medium'>
            <Wallet className='size-3.5 text-neutral-500' />
            <span>Cash vs Equity</span>
          </span>
          <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
            {equityPercent}% Equity · {cashPercent}% Cash
          </span>
        </div>

        {/* Segmented deployment bar */}
        <div className='w-full h-1.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 overflow-hidden flex gap-0.5'>
          <div
            style={{ width: `${equityPercent}%` }}
            className='h-full bg-emerald-500 rounded-l-full'
          />
          <div
            style={{ width: `${cashPercent}%` }}
            className='h-full bg-blue-500 rounded-r-full'
          />
        </div>

        <div className='flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono'>
          <span className='flex items-center gap-1.5'>
            <span className={`size-1.5 rounded-full ${feedLabel.dotClass}`} />
            <span>{feedLabel.text}</span>
          </span>
          <span className='text-neutral-400 dark:text-neutral-500'>
            Capital active
          </span>
        </div>
      </div>
    </div>
  );
}

export default MomentumAndCashCard;

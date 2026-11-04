'use client';

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Inbox } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { formatCurrency, formatPercent } from '@/shared/formatters';

/**
 * Broker display names & visual status tokens
 */
export const BROKER_CONFIG = {
  ZERODHA: {
    name: 'Zerodha',
    dotClass: 'bg-blue-600',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  UPSTOX: {
    name: 'Upstox',
    dotClass: 'bg-purple-600',
    textClass: 'text-purple-600 dark:text-purple-400',
  },
  ANGEL_ONE: {
    name: 'Angel One',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-600 dark:text-orange-400',
  },
  ANGELONE: {
    name: 'Angel One',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-600 dark:text-orange-400',
  },
  DIRECT: {
    name: 'Direct NAV',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
};

/**
 * Parses raw symbols like "NSE:SBIN" or "BSE:COALINDIA" into { exchange, ticker }
 */
export function parseSymbol(rawSymbol) {
  if (!rawSymbol) return { exchange: '', ticker: '—' };
  const str = String(rawSymbol).trim();
  const parts = str.split(':');
  if (parts.length === 2) {
    return {
      exchange: parts[0].trim().toUpperCase(),
      ticker: parts[1].trim().toUpperCase(),
    };
  }
  return { exchange: '', ticker: str.toUpperCase() };
}

/**
 * Clean Symbol & Exchange Badge
 */
export function SymbolBadge({ symbol, subtitle, index }) {
  const { exchange, ticker } = useMemo(() => parseSymbol(symbol), [symbol]);

  return (
    <div className='flex items-center gap-2.5'>
      {typeof index === 'number' && (
        <span className='font-mono text-[11px] text-neutral-400 dark:text-neutral-500 w-5 shrink-0 select-none'>
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      <div className='flex flex-col min-w-0'>
        <div className='flex items-center gap-1.5'>
          <span className='font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight truncate'>
            {ticker}
          </span>
          {exchange && (
            <span className='text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0'>
              {exchange}
            </span>
          )}
        </div>
        {subtitle && (
          <span className='text-[11px] text-neutral-400 dark:text-neutral-500 truncate'>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Sentence-case Broker badge with status dot
 */
export function BrokerBadge({ broker }) {
  if (!broker) return <span className='text-neutral-400'>—</span>;
  const key = String(broker).toUpperCase().replace(/[\s-]/g, '_');
  const cfg = BROKER_CONFIG[key] || {
    name: broker.charAt(0).toUpperCase() + broker.slice(1).toLowerCase(),
    dotClass: 'bg-neutral-400 dark:bg-neutral-500',
    textClass: 'text-neutral-600 dark:text-neutral-400',
  };

  return (
    <div className='inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium'>
      <span className={cn('size-1.5 rounded-full shrink-0', cfg.dotClass)} />
      <span>{cfg.name}</span>
    </div>
  );
}

/**
 * Accurate P&L cell that self-heals percentage if 0 or missing from broker feed
 */
export function PnLCell({ pnl, pnlPercent, invested, quantity, averagePrice }) {
  const numPnl = Number(pnl) || 0;
  const inv =
    Number(invested) || (Number(quantity) || 0) * (Number(averagePrice) || 0);

  // Self-heal percentage: if broker feed sends 0.00% or null, compute from invested capital
  let pct = Number(pnlPercent);
  if ((!pct || pct === 0) && inv > 0 && numPnl !== 0) {
    pct = (numPnl / inv) * 100;
  }
  if (isNaN(pct)) pct = 0;

  const isPositive = numPnl >= 0;
  const isZero = Math.abs(numPnl) < 0.01;

  return (
    <div className='text-right font-mono tnum'>
      <span
        className={cn(
          'block font-semibold text-xs sm:text-[13px]',
          isZero
            ? 'text-neutral-600 dark:text-neutral-400'
            : isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
        )}
      >
        {isPositive && !isZero ? '+' : ''}
        {formatCurrency(numPnl)}
      </span>
      <span
        className={cn(
          'block text-[11px] font-medium',
          isZero
            ? 'text-neutral-400 dark:text-neutral-500'
            : isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
        )}
      >
        {isPositive && !isZero ? '+' : ''}
        {formatPercent(pct)}
      </span>
    </div>
  );
}

/**
 * Day Change Cell with trend arrow
 */
export function DayChangeCell({ dayGain, dayGainPercent }) {
  const gain = Number(dayGain) || 0;
  const pct = Number(dayGainPercent) || 0;
  const isPositive = gain >= 0;
  const isZero = Math.abs(gain) < 0.01 && Math.abs(pct) < 0.01;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 font-mono tnum text-[11px] font-medium justify-end w-full',
        isZero
          ? 'text-neutral-400 dark:text-neutral-500'
          : isPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
      )}
    >
      {!isZero &&
        (isPositive ? (
          <ArrowUpRight className='size-3 shrink-0' />
        ) : (
          <ArrowDownRight className='size-3 shrink-0' />
        ))}
      <span>{formatPercent(pct, { showSign: !isZero })}</span>
    </div>
  );
}

/**
 * Unslopped DataTable wrapper component
 */
export function DataTable({
  title,
  count,
  action,
  isLoading,
  isEmpty,
  emptyMessage = 'No records found.',
  emptySubtext,
  footer,
  children,
  className,
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs hover:shadow-xs transition-all overflow-hidden',
        className
      )}
    >
      {/* Table Header Strip */}
      {(title || count !== undefined || action) && (
        <header className='px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2.5'>
            {title && (
              <h3 className='text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight'>
                {title}
              </h3>
            )}
            {count !== undefined && (
              <span className='text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'>
                {count} on record
              </span>
            )}
          </div>
          {action && <div>{action}</div>}
        </header>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className='p-6 space-y-3.5 animate-pulse'>
          <div className='h-4 bg-neutral-100 dark:bg-neutral-800/60 rounded w-1/3 mb-4' />
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className='h-10 bg-neutral-50 dark:bg-neutral-900/40 rounded'
            />
          ))}
        </div>
      ) : isEmpty ? (
        /* Empty State */
        <div className='p-12 text-center'>
          <Inbox className='size-8 text-neutral-400 dark:text-neutral-500 mx-auto mb-3 stroke-[1.25]' />
          <h4 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
            {emptyMessage}
          </h4>
          {emptySubtext && (
            <p className='text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto'>
              {emptySubtext}
            </p>
          )}
        </div>
      ) : (
        /* Table Container with clean horizontal overflow */
        <div className='overflow-x-auto [scrollbar-gutter:stable] [scrollbar-width:thin]'>
          {children}
        </div>
      )}

      {/* Optional Footer Link / Strip */}
      {footer && (
        <div className='px-5 sm:px-6 py-3.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/20'>
          {footer}
        </div>
      )}
    </section>
  );
}

export default DataTable;

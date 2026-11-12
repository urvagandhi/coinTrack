'use client';

import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { Cpu, ShieldCheck } from 'lucide-react';
import { BROKER_CONFIGS, formatBoid, normalizeBrokerKey } from '../constants';

export function PortfolioHeroCard({
  summary,
  funds,
  selectedBroker = 'ALL',
  holdings = [],
  brokerStatus = [],
  user = null,
  isLoading = false,
}) {
  const normKey = normalizeBrokerKey(selectedBroker);
  const isAll = normKey === 'ALL';
  const activeConfig = BROKER_CONFIGS[normKey];

  // Filtered holdings when a single broker is selected
  const scopedHoldings = isAll
    ? holdings
    : holdings.filter(
        h => normalizeBrokerKey(h.broker || h.brokerType) === normKey
      );

  // Compute valuation for this broker scope
  const totalValue = isAll
    ? (summary?.totalCurrentValue ??
      scopedHoldings.reduce((acc, h) => acc + (Number(h.currentValue) || 0), 0))
    : scopedHoldings.reduce((acc, h) => acc + (Number(h.currentValue) || 0), 0);

  const investedValue = isAll
    ? (summary?.totalInvestedValue ??
      scopedHoldings.reduce(
        (acc, h) => acc + (Number(h.investedValue) || 0),
        0
      ))
    : scopedHoldings.reduce(
        (acc, h) => acc + (Number(h.investedValue) || 0),
        0
      );

  const unrealizedPL = totalValue - investedValue;
  const unrealizedPercent =
    investedValue > 0 ? (unrealizedPL / investedValue) * 100 : 0;
  const isPositiveGain = unrealizedPL >= 0;

  // Today's Return computation
  const todayReturn = isAll
    ? (summary?.todayReturn ??
      scopedHoldings.reduce((acc, h) => acc + (Number(h.dayGain) || 0), 0))
    : scopedHoldings.reduce((acc, h) => acc + (Number(h.dayGain) || 0), 0);

  const prevValue = totalValue - todayReturn;
  const todayReturnPercent =
    prevValue > 0 ? (todayReturn / prevValue) * 100 : 0;
  const isPositiveToday = todayReturn >= 0;

  // Available Cash / Margin
  const availableCash =
    funds?.equity?.net ?? funds?.availableCash ?? funds?.net ?? 0;

  // Dynamic Demat Account / Client details without static fallback
  const brokerMeta = brokerStatus.find(
    b => normalizeBrokerKey(b.broker) === normKey
  );
  const rawBoid =
    scopedHoldings[0]?.dematAccount ||
    scopedHoldings[0]?.raw?.demat_account ||
    scopedHoldings[0]?.raw?.dp_id ||
    brokerMeta?.dpId ||
    brokerMeta?.dematAccount ||
    null;
  const formattedBoid = formatBoid(rawBoid);
  const clientCode =
    brokerMeta?.clientCode ||
    brokerMeta?.brokerUserId ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'DEMAT';

  const cardTitle = isAll
    ? 'Total equity valuation'
    : `${activeConfig?.name || selectedBroker} equity valuation`;

  return (
    <div className='grid grid-cols-12 gap-3.5'>
      {/* ── LEFT HERO: VALUATION BENTO + PHYSICAL IC DEMAT CARD ── */}
      <div className='col-span-12 lg:col-span-8 rounded-2xl sm:rounded-3xl bg-[#0f1013] border border-neutral-800 text-white p-5 sm:p-7 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[220px]'>
        {/* Subtle background ambient mesh */}
        <div className='absolute -right-20 -top-20 size-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none' />

        {/* Top: Valuation figures & Demat Card preview */}
        <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10'>
          <div className='space-y-2'>
            <span className='text-xs font-medium text-neutral-400 font-mono tracking-wide'>
              {cardTitle}
            </span>

            <div className='text-3xl sm:text-4xl lg:text-[42px] font-mono tracking-tight font-bold text-white'>
              {isLoading ? (
                <div className='h-10 w-48 bg-neutral-800 rounded animate-pulse my-1' />
              ) : (
                formatCurrency(totalValue)
              )}
            </div>

            <div className='flex items-center gap-2 text-xs sm:text-sm font-mono flex-wrap'>
              <span
                className={cn(
                  'font-semibold',
                  isPositiveGain ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {formatPercent(unrealizedPercent, { showSign: true })} vs cost
                basis
              </span>
              <span className='text-neutral-500'>·</span>
              <span
                className={cn(
                  isPositiveGain ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {formatCurrency(unrealizedPL, { showSign: true })} unrealized
              </span>
            </div>
          </div>

          {/* Physical IC Demat Card */}
          <div className='w-full sm:w-56 rounded-xl border border-neutral-700/80 bg-gradient-to-br from-neutral-800/90 via-neutral-900/95 to-black p-3.5 shadow-lg relative shrink-0 flex flex-col justify-between h-32 text-neutral-300'>
            {/* Holographic corner reflection */}
            <div className='flex items-center justify-between text-[10px] font-mono'>
              <span className='text-neutral-400 font-semibold tracking-wider'>
                {isAll ? 'CDSL / NSDL' : 'CDSL'}
              </span>
              <span className='px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] uppercase font-bold text-neutral-300 border border-neutral-700'>
                {isAll ? 'ALL' : activeConfig?.initials || normKey.slice(0, 4)}
              </span>
            </div>

            {/* Smart IC Chip */}
            <div className='flex items-center gap-2 my-1'>
              <div className='size-6 rounded bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-1 flex items-center justify-center shadow-xs'>
                <Cpu className='size-3.5 text-neutral-900' />
              </div>
              <span className='text-[10px] font-mono text-neutral-400 truncate max-w-[130px]'>
                {isAll
                  ? 'Aggregated Custody'
                  : activeConfig?.displayName || 'Demat Account'}
              </span>
            </div>

            {/* Account Identifiers */}
            <div className='pt-1 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono'>
              <span className='truncate text-neutral-400 font-mono'>
                {formattedBoid ? (
                  <span>DP: {formattedBoid}</span>
                ) : (
                  <span>ID: {clientCode}</span>
                )}
              </span>
              <span className='inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold shrink-0'>
                <span className='size-1.5 rounded-full bg-emerald-400 animate-pulse' />
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Depository & Cost Basis */}
        <div className='pt-4 mt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-neutral-400 relative z-10'>
          <div className='flex items-center gap-2'>
            <ShieldCheck className='size-3.5 text-emerald-400' />
            <span>Depository: {isAll ? 'CDSL / NSDL' : 'CDSL'}</span>
            <span className='text-neutral-600'>·</span>
            <span>Cost: {formatCurrency(investedValue)}</span>
          </div>
          <span className='text-[11px] text-neutral-500'>
            {scopedHoldings.length} equity positions settled
          </span>
        </div>
      </div>

      {/* ── RIGHT COLUMN: TODAY'S RETURN + AVAILABLE SETTLED MARGIN ── */}
      <div className='col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5'>
        {/* Today's Return */}
        <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 shadow-2xs flex flex-col justify-between'>
          <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 font-mono'>
            Today&apos;s Return
          </span>
          <div className='my-2'>
            <div
              className={cn(
                'text-2xl sm:text-3xl font-mono font-bold tracking-tight',
                isPositiveToday
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {isLoading ? (
                <div className='h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
              ) : (
                `${isPositiveToday ? '+' : ''}${formatCurrency(todayReturn)}`
              )}
            </div>
            <p className='text-xs font-mono text-neutral-500 mt-1 flex items-center gap-1.5'>
              <span
                className={cn(
                  'font-semibold',
                  isPositiveToday
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {formatPercent(todayReturnPercent, { showSign: true })}
              </span>
              <span>1-day change</span>
            </p>
          </div>
          <div className='text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800'>
            Live mark-to-market EOD
          </div>
        </div>

        {/* Available Settled Margin */}
        <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 shadow-2xs flex flex-col justify-between'>
          <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 font-mono'>
            Available Settled Margin
          </span>
          <div className='my-2'>
            <div className='text-2xl sm:text-3xl font-mono font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
              {isLoading ? (
                <div className='h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse' />
              ) : (
                formatCurrency(availableCash)
              )}
            </div>
            <p className='text-xs font-mono text-neutral-500 mt-1'>
              Settled CDSL pool
            </p>
          </div>
          <div className='text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800'>
            T+1 collateral &amp; cash equivalent
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioHeroCard;

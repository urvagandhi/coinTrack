'use client';

import { ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/shared/formatters';

export function AssetDistributionCard({
  distribution,
  modelTag,
  driftLabel,
  driftClass,
  driftNarrative,
}) {
  return (
    <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4'>
      <div className='flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80'>
        <div>
          <h4 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight'>
            Asset distribution
          </h4>
          <p className='text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5'>
            Consolidated across 6 ledgers
          </p>
        </div>
        <span className='text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'>
          {modelTag}
        </span>
      </div>

      {/* Proportional Segmented Bar */}
      <div className='w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 flex overflow-hidden gap-0.5 p-0.5'>
        {distribution.map(asset => (
          <div
            key={asset.key}
            style={{ width: `${asset.share}%` }}
            className={`h-full ${asset.barColor}`}
            title={`${asset.label}: ${asset.share}%`}
          />
        ))}
      </div>

      {/* Asset Class Rows */}
      <div className='space-y-3 pt-1'>
        {distribution.map(asset => (
          <div
            key={asset.key}
            className='flex items-center justify-between text-xs'
          >
            <div className='flex items-center gap-2'>
              <span
                className={`size-2 rounded-full shrink-0 ${asset.dotColor}`}
              />
              <span className='font-medium text-neutral-800 dark:text-neutral-200'>
                {asset.label}
              </span>
            </div>

            <div className='flex items-center gap-3 font-mono tnum'>
              <span className='text-neutral-500 dark:text-neutral-400'>
                {asset.share}%
              </span>
              <span className='font-semibold text-neutral-900 dark:text-neutral-100 min-w-[70px] text-right'>
                {formatCurrency(asset.value)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dynamic Rebalancing Nudge */}
      <div className='pt-3.5 border-t border-neutral-100 dark:border-neutral-800/80'>
        <div className='p-3 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60'>
          <div className='flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1'>
            <span className='flex items-center gap-1.5'>
              <ShieldCheck className='size-3.5 text-emerald-600 dark:text-emerald-400' />
              <span>Rebalancing Model</span>
            </span>
            <span className={`text-[10px] font-mono font-medium ${driftClass}`}>
              {driftLabel}
            </span>
          </div>
          <p className='text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed'>
            {driftNarrative}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AssetDistributionCard;

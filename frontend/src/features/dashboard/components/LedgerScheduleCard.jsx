'use client';

import { Calendar, Coins, Landmark } from 'lucide-react';

export function LedgerScheduleCard({
  sipDetails,
  section80c,
  goldRateDisplay,
}) {
  return (
    <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4'>
      <div className='flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80'>
        <h4 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight'>
          Ledger schedule
        </h4>
        <span className='text-[11px] text-neutral-400 dark:text-neutral-500 font-mono'>
          Upcoming
        </span>
      </div>

      <div className='space-y-3'>
        {/* Dynamic Next Auto-SIP */}
        <div className='flex items-start justify-between gap-3 text-xs'>
          <div className='flex items-start gap-2.5'>
            <div className='size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60'>
              <Calendar className='size-3.5' />
            </div>
            <div>
              <span className='font-semibold text-neutral-900 dark:text-neutral-100 block'>
                Monthly Auto-SIP
              </span>
              <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                {sipDetails.label}
              </span>
            </div>
          </div>
          <span className='font-mono font-bold text-neutral-900 dark:text-neutral-100 text-right'>
            {sipDetails.amount}
          </span>
        </div>

        {/* Section 80C PPF Cap with dynamic Financial Year */}
        <div className='flex items-start justify-between gap-3 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800/60'>
          <div className='flex items-start gap-2.5'>
            <div className='size-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-neutral-700/60'>
              <Landmark className='size-3.5' />
            </div>
            <div>
              <span className='font-semibold text-neutral-900 dark:text-neutral-100 block'>
                Section 80C Limit
              </span>
              <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                PPF + EPF Cap ₹1.5L ({section80c.fyLabel})
              </span>
            </div>
          </div>
          <span className='font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-right'>
            {section80c.usedPercentLabel}
          </span>
        </div>

        {/* Live Gold Bullion Rate */}
        <div className='flex items-start justify-between gap-3 text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800/60'>
          <div className='flex items-start gap-2.5'>
            <div className='size-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/60'>
              <Coins className='size-3.5' />
            </div>
            <div>
              <span className='font-semibold text-neutral-900 dark:text-neutral-100 block'>
                Gold Spot 24K
              </span>
              <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
                Live MCX Bullion Feed
              </span>
            </div>
          </div>
          <span className='font-mono font-bold text-neutral-900 dark:text-neutral-100 text-right'>
            {goldRateDisplay}
            <span className='text-[10px] text-neutral-400 font-normal'>
              /10g
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default LedgerScheduleCard;

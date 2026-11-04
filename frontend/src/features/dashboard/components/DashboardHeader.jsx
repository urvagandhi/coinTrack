'use client';

import { Download, RefreshCw } from 'lucide-react';
import { DASHBOARD_TIME_RANGES } from '../constants';

export function DashboardHeader({
  user,
  feedStatus,
  currentPeriod,
  timeRange,
  onTimeRangeChange,
  onQuickSync,
  isSyncing,
}) {
  const firstName = user?.name?.split(' ')[0] || user?.username || 'Investor';

  return (
    <section className='flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2'>
      <div>
        <div className='flex items-center gap-2 mb-1'>
          <span
            className={`size-2 rounded-full shrink-0 ${feedStatus?.dotClass || 'bg-neutral-400'}`}
          />
          <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
            {feedStatus?.label || 'Feeds Idle'}
          </span>
          <span className='text-neutral-300 dark:text-neutral-700'>·</span>
          <span className='text-xs text-neutral-500 dark:text-neutral-400 font-mono'>
            {currentPeriod}
          </span>
        </div>

        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
          Consolidated wealth
        </h1>
        <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5'>
          Real-time portfolio intelligence and ledgers for {firstName}.
        </p>
      </div>

      {/* Top Controls Toolbar */}
      <div className='flex items-center gap-2.5 self-start md:self-auto flex-wrap'>
        {/* Time range selector */}
        <div className='inline-flex items-center p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60'>
          {DASHBOARD_TIME_RANGES.map(range => (
            <button
              key={range}
              type='button'
              onClick={() => onTimeRangeChange(range)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-white dark:bg-[#16171a] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Export / Print */}
        <button
          type='button'
          onClick={() => window.print()}
          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#16171a] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer'
        >
          <Download className='size-3.5 text-neutral-400' />
          <span>Export</span>
        </button>

        {/* Quick Sync */}
        <button
          type='button'
          onClick={onQuickSync}
          disabled={isSyncing}
          className='inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-2xs cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
        >
          <RefreshCw
            className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`}
          />
          <span>{isSyncing ? 'Syncing...' : 'Sync feeds'}</span>
        </button>
      </div>
    </section>
  );
}

export default DashboardHeader;

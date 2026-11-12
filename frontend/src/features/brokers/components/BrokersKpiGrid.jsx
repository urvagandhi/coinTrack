'use client';

import { Activity, Lock, RefreshCw, ShieldCheck } from 'lucide-react';

export function BrokersKpiGrid({
  connectedCount,
  totalBrokers,
  hasExpired,
  isLoading,
}) {
  return (
    <section className='grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40'>
      {/* 1. Active Feeds */}
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
          <Activity className='size-3.5 text-blue-500' />
          <span>Active Feeds</span>
        </div>
        <div className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans'>
          {isLoading ? '…' : `${connectedCount} of ${totalBrokers}`}
        </div>
        <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
          Brokers connected
        </span>
      </div>

      {/* 2. Session Health */}
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
          <RefreshCw className='size-3.5 text-emerald-500' />
          <span>Session Health</span>
        </div>
        <div className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans'>
          {hasExpired ? (
            <span className='text-rose-600 dark:text-rose-400 text-base sm:text-lg'>
              Needs Reconnect
            </span>
          ) : connectedCount > 0 ? (
            <span className='text-emerald-600 dark:text-emerald-400 text-base sm:text-lg'>
              All Synchronized
            </span>
          ) : (
            <span className='text-neutral-400 text-base sm:text-lg'>Idle</span>
          )}
        </div>
        <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
          OAuth &amp; Direct tokens
        </span>
      </div>

      {/* 3. Security Mode */}
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
          <ShieldCheck className='size-3.5 text-emerald-500' />
          <span>Security Mode</span>
        </div>
        <div className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans text-base sm:text-lg'>
          Read-Only Sync
        </div>
        <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
          Zero trade execution
        </span>
      </div>

      {/* 4. Storage Standard */}
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium'>
          <Lock className='size-3.5 text-purple-500' />
          <span>Storage Standard</span>
        </div>
        <div className='text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans text-base sm:text-lg'>
          AES-256-GCM
        </div>
        <span className='text-[11px] text-neutral-500 dark:text-neutral-400'>
          Envelope encrypted
        </span>
      </div>
    </section>
  );
}

export default BrokersKpiGrid;

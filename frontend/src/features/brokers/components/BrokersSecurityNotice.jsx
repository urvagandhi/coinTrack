'use client';

import { ShieldCheck } from 'lucide-react';

export function BrokersSecurityNotice() {
  return (
    <section className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4'>
      <div className='size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
        <ShieldCheck className='size-5' />
      </div>
      <div className='space-y-1 text-xs'>
        <h4 className='text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
          Institutional Read-Only Standard &amp; Privacy Isolation
        </h4>
        <p className='text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-3xl'>
          Your broker credentials and OAuth session tokens are encrypted at rest
          using AES-256-GCM. CoinTrack requests solely read-only access to
          equity holdings, positions, and cash balances. Trading and funds
          withdrawal capabilities are excluded at the architectural level.
        </p>
      </div>
    </section>
  );
}

export default BrokersSecurityNotice;

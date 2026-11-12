'use client';

import { RefreshButton } from '@/features/dashboard';
import { cn } from '@/shared/lib/utils';
import { BROKER_CONFIGS, normalizeBrokerKey } from '../constants';

export function PortfolioHeader({ selectedBroker = 'ALL', brokerStatus = [] }) {
  const normKey = normalizeBrokerKey(selectedBroker);
  const activeConfig = BROKER_CONFIGS[normKey];

  const currentBroker = brokerStatus.find(
    b => normalizeBrokerKey(b.broker) === normKey
  );
  const connectedBrokers = brokerStatus.filter(b => b.tokenActive);
  const totalBrokers = brokerStatus.length || 3;

  const isBrokerExpired = Boolean(
    normKey !== 'ALL' &&
    (currentBroker?.needsReconnect ||
      (!currentBroker?.tokenActive &&
        currentBroker?.lastStatus !== null &&
        currentBroker?.lastStatus !== 'NEVER_SYNCED'))
  );

  let statusLabel = `${connectedBrokers.length} of ${totalBrokers} broker feeds active`;
  let dotClass = 'bg-emerald-500 animate-pulse';

  if (activeConfig) {
    if (isBrokerExpired) {
      statusLabel = `${activeConfig.name} session expired`;
      dotClass = 'bg-amber-500';
    } else if (currentBroker?.tokenActive) {
      statusLabel = `${activeConfig.name} feed live`;
      dotClass = 'bg-emerald-500 animate-pulse';
    } else {
      statusLabel = `${activeConfig.name} feed idle`;
      dotClass = 'bg-neutral-400 dark:bg-neutral-600';
    }
  }

  return (
    <section className='flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800'>
      <div>
        <div className='flex items-center gap-2 mb-1.5'>
          <span className={cn('size-2 rounded-full shrink-0', dotClass)} />
          <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
            {statusLabel}
          </span>
          <span className='text-neutral-300 dark:text-neutral-700'>·</span>
          <span className='text-xs text-neutral-500 dark:text-neutral-400 font-mono'>
            Q4 2026
          </span>
        </div>

        <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100'>
          Portfolio &amp; Ledgers
        </h1>
        <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5'>
          Real-time multi-demat equity positions, settlement logs, and automated
          FIFO tax intelligence.
        </p>
      </div>

      <div className='flex items-center gap-2 self-start sm:self-auto'>
        <RefreshButton />
      </div>
    </section>
  );
}

export default PortfolioHeader;

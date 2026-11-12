'use client';

import { brokerAPI } from '@/shared/api/client';
import { cn } from '@/shared/lib/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  BROKER_CONFIGS,
  BROKER_FILTER_PILLS,
  normalizeBrokerKey,
} from '../constants';

export function BrokerFilterPills({
  selectedBroker = 'ALL',
  onSelectBroker,
  holdings = [],
  brokerStatus = [],
}) {
  const router = useRouter();
  const clickHistoryRef = useRef({});
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const normSelected = normalizeBrokerKey(selectedBroker);

  // Compute live holding counts per broker
  const brokerCounts = {
    ALL: holdings.length,
    ZERODHA: holdings.filter(
      h => normalizeBrokerKey(h.broker || h.brokerType) === 'ZERODHA'
    ).length,
    UPSTOX: holdings.filter(
      h => normalizeBrokerKey(h.broker || h.brokerType) === 'UPSTOX'
    ).length,
    ANGEL_ONE: holdings.filter(
      h => normalizeBrokerKey(h.broker || h.brokerType) === 'ANGEL_ONE'
    ).length,
  };

  // Determine connection state per broker from brokerStatus telemetry
  const getBrokerState = brokerKey => {
    if (brokerKey === 'ALL') return 'CONNECTED';
    const bStatus = brokerStatus.find(
      b => normalizeBrokerKey(b.broker) === brokerKey
    );
    if (!bStatus) {
      // Check if there are holdings on file
      return brokerCounts[brokerKey] > 0 ? 'CONNECTED' : 'NOT_LINKED';
    }
    if (
      bStatus.needsReconnect ||
      (!bStatus.tokenActive && bStatus.lastStatus !== 'NEVER_SYNCED')
    ) {
      return 'RECONNECT_REQUIRED';
    }
    if (bStatus.tokenActive) return 'CONNECTED';
    return 'NOT_LINKED';
  };

  const handlePillClick = pill => {
    if (pill.id === 'ALL') {
      onSelectBroker('ALL');
      return;
    }

    const state = getBrokerState(pill.id);
    const config = BROKER_CONFIGS[pill.id];

    // If broker is NOT LINKED:
    // 1st click: show toast notification
    // 2nd click within 6 seconds: navigate to broker connection/setup page
    if (state === 'NOT_LINKED') {
      const now = Date.now();
      const lastClick = clickHistoryRef.current[pill.id] || 0;

      if (now - lastClick < 6000) {
        toast.info(`Opening ${config?.name || pill.label} connection setup…`);
        router.push(
          config?.setupPath || `/brokers/${config?.slug || 'zerodha'}`
        );
      } else {
        clickHistoryRef.current[pill.id] = now;
        toast.warning(
          `${config?.name || pill.label} is not linked yet. Click again to set up broker API credentials.`,
          {
            action: {
              label: 'Set up now',
              onClick: () =>
                router.push(
                  config?.setupPath || `/brokers/${config?.slug || 'zerodha'}`
                ),
            },
          }
        );
      }
      return;
    }

    // If broker is connected or requires reconnect, select that broker
    onSelectBroker(pill.id);
  };

  const handleReauthenticate = async brokerKey => {
    const config = BROKER_CONFIGS[brokerKey];
    if (!config?.slug || isReauthenticating) return;
    setIsReauthenticating(true);
    try {
      const res = await brokerAPI.getConnectUrl(config.slug);
      const url = res?.loginUrl || res?.data?.loginUrl;
      if (url) {
        window.location.href = url;
      } else {
        router.push(config.setupPath);
      }
    } catch {
      router.push(config.setupPath);
    } finally {
      setIsReauthenticating(false);
    }
  };

  const activeBrokerState = getBrokerState(normSelected);
  const activeConfig = BROKER_CONFIGS[normSelected];

  return (
    <div className='space-y-3.5'>
      {/* ── BROKER FILTER PILLS BAR ── */}
      <section className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-1.5 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-[#16171a]/80 backdrop-blur-xs shadow-2xs overflow-x-auto max-w-full'>
          {BROKER_FILTER_PILLS.map(pill => {
            const isSelected = normSelected === pill.id;
            const state = getBrokerState(pill.id);
            const count = brokerCounts[pill.id] ?? 0;

            const badgeText =
              state === 'NOT_LINKED'
                ? 'UNLINKED'
                : state === 'RECONNECT_REQUIRED'
                  ? 'RE-AUTH'
                  : null;

            return (
              <button
                key={pill.id}
                type='button'
                onClick={() => handlePillClick(pill)}
                className={cn(
                  'relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                  isSelected
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                )}
              >
                <span
                  className={cn('size-2 rounded-full shrink-0', pill.color)}
                />
                <span>{pill.label}</span>

                {badgeText ? (
                  <span
                    className={cn(
                      'text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold',
                      state === 'NOT_LINKED' &&
                        'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
                      state === 'RECONNECT_REQUIRED' &&
                        'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {badgeText}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[11px] font-mono',
                      isSelected ? 'opacity-90' : 'opacity-60'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className='text-xs font-mono text-neutral-500 dark:text-neutral-400 hidden sm:block'>
          Broker Scope:{' '}
          <span className='font-semibold text-neutral-900 dark:text-neutral-100'>
            {normSelected === 'ALL'
              ? 'All demats'
              : activeConfig?.name || normSelected}
          </span>
        </div>
      </section>

      {/* ── RE-AUTHENTICATION BANNER (IF BROKER NEEDS RECONNECT) ── */}
      {normSelected !== 'ALL' &&
        activeBrokerState === 'RECONNECT_REQUIRED' &&
        activeConfig && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className='rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs'
          >
            <div className='flex items-start sm:items-center gap-3'>
              <div className='size-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0'>
                <AlertTriangle className='size-4' />
              </div>
              <div>
                <span className='font-semibold text-neutral-900 dark:text-neutral-100 block sm:inline'>
                  {activeConfig.name} session expired (Daily 03:30 AM IST OAuth
                  invalidation)
                </span>
                <span className='text-neutral-600 dark:text-neutral-400 block sm:inline sm:ml-1'>
                  Showing last synced snapshot from CDSL. Re-authenticate to
                  refresh live market ticks.
                </span>
              </div>
            </div>

            <div className='flex items-center gap-2 self-end sm:self-auto shrink-0'>
              <button
                type='button'
                disabled={isReauthenticating}
                onClick={() => handleReauthenticate(normSelected)}
                className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-60'
              >
                <RefreshCw
                  className={cn('size-3', isReauthenticating && 'animate-spin')}
                />
                <span>
                  {isReauthenticating
                    ? 'Re-authorizing...'
                    : 'Re-authenticate now'}
                </span>
              </button>
              <Link
                href={activeConfig.setupPath}
                className='px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
              >
                Manage
              </Link>
            </div>
          </motion.div>
        )}
    </div>
  );
}

export default BrokerFilterPills;

'use client';

import { useBrokerConnection } from '@/features/brokers/hooks/useBrokerConnection';
import { brokerAPI } from '@/shared/api/client';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const BROKER_NAMES = {
  ZERODHA: 'Zerodha Kite',
  ANGEL_ONE: 'Angel One',
  UPSTOX: 'Upstox Pro',
};

const BROKER_ROUTES = {
  ZERODHA: '/brokers/zerodha',
  ANGEL_ONE: '/brokers/angelone',
  UPSTOX: '/brokers/upstox',
};

function relativeTime(iso) {
  if (!iso) return null;
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function BrokerStatusBanner() {
  const { data: syncData } = useBrokerConnection();
  const [dismissed, setDismissed] = useState([]);

  const brokers = syncData?.brokers ?? [];
  if (!brokers.length) return null;

  const alerts = brokers.filter(
    b =>
      !dismissed.includes(b.broker) &&
      !b.tokenActive &&
      b.lastStatus !== null &&
      b.lastStatus !== 'NEVER_SYNCED'
  );

  const handleReconnect = async brokerName => {
    try {
      const response = await brokerAPI.getConnectUrl(brokerName);
      if (response?.loginUrl) window.location.href = response.loginUrl;
    } catch (error) {
      console.error('Failed to get connect URL', error);
    }
  };

  if (alerts.length === 0) {
    const active = brokers.filter(b => b.tokenActive);
    if (active.length === 0) return null;

    return (
      <div className='rounded-xl bg-white dark:bg-[#16171a] border border-neutral-200/80 dark:border-neutral-800 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 shadow-2xs text-xs'>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full bg-emerald-500 animate-pulse' />
          <span className='font-semibold text-neutral-800 dark:text-neutral-200'>
            Live Feeds
          </span>
        </div>
        <span className='h-3 w-px bg-neutral-200 dark:bg-neutral-800' />
        <div className='flex flex-wrap items-center gap-4'>
          {active.map(b => {
            const last = relativeTime(b.lastSuccessAt);
            const route = BROKER_ROUTES[b.broker] || '/brokers';
            return (
              <Link
                key={b.broker}
                href={route}
                className='inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors'
              >
                <span className='font-medium'>
                  {BROKER_NAMES[b.broker] || b.broker}
                </span>
                {last && (
                  <span className='text-neutral-400 dark:text-neutral-500 font-mono tnum text-[11px]'>
                    · {last}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {alerts.map(alert => {
        const route = BROKER_ROUTES[alert.broker] || '/brokers';
        return (
          <div
            key={alert.broker}
            className='rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 px-4 py-3 flex items-center justify-between gap-4 shadow-2xs'
          >
            <div className='flex items-center gap-3'>
              <AlertCircle
                className='size-4 text-rose-600 dark:text-rose-400 flex-shrink-0'
                strokeWidth={2}
              />
              <div className='text-xs leading-normal'>
                <span className='font-semibold text-rose-900 dark:text-rose-200'>
                  {BROKER_NAMES[alert.broker] || alert.broker} session expired.
                </span>{' '}
                <span className='text-rose-700 dark:text-rose-300'>
                  Reconnect to resume real-time portfolio syndication.
                </span>
              </div>
            </div>

            <div className='flex items-center gap-2 flex-shrink-0'>
              <button
                type='button'
                onClick={() => handleReconnect(alert.broker)}
                className='inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors cursor-pointer'
              >
                <span>Reconnect</span>
                <ArrowRight className='size-3' />
              </button>
              <button
                type='button'
                onClick={() => setDismissed(prev => [...prev, alert.broker])}
                className='size-7 flex items-center justify-center text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 transition-colors cursor-pointer rounded-md'
                aria-label='Dismiss notification'
              >
                <X className='size-3.5' />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BrokerStatusBanner;

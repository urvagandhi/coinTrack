'use client';

import { useBrokerConnection } from '../hooks/useBrokerConnection';
import { BROKER_BRAND_THEMES } from '../constants';
import { cn } from '@/shared/lib/utils';
import { ArrowRight, Check, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

function relativeTime(iso) {
  if (!iso) return null;
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function BrokerCard({ broker }) {
  const { data, isLoading } = useBrokerConnection();
  const status = data?.brokers?.find(b => b.broker === broker.key);
  const isConnected = status?.tokenActive ?? false;
  const isExpiringSoon = status?.isExpiringSoon ?? false;
  const isExpired = Boolean(
    status && !status.tokenActive && status.lastStatus !== null
  );
  const lastSyncedAt = status?.lastSuccessAt;

  const brand = BROKER_BRAND_THEMES[broker.key] || {
    accentText: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-white dark:bg-neutral-800',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-700/80',
    logo: broker.logoPath || null,
    monogram: broker.initials || 'BK',
    protocol: 'Standard OAuth',
  };

  const ctaLabel = isExpired ? 'Reconnect' : isConnected ? 'Manage' : 'Connect';

  return (
    <article className='group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-5 sm:p-6 transition-all hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs hover:shadow-xs'>
      <div>
        {/* Top Header: Status dot + protocol badge (matching NoteCard header) */}
        <div className='flex items-center justify-between gap-2 pb-4 border-b border-neutral-100 dark:border-neutral-800/80'>
          <div className='flex items-center gap-2'>
            {isLoading ? (
              <span className='size-2 rounded-full shrink-0 bg-neutral-300 dark:bg-neutral-600 animate-pulse' />
            ) : (
              <span
                className={cn(
                  'size-2 rounded-full shrink-0',
                  isConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : isExpiringSoon
                      ? 'bg-amber-500'
                      : isExpired
                        ? 'bg-rose-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                )}
              />
            )}
            <div className='flex items-center'>
              {isLoading ? (
                <div className='h-3 w-16 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-full' />
              ) : (
                <span className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                  {isConnected
                    ? 'Live Stream'
                    : isExpiringSoon
                      ? 'Expiring Soon'
                      : isExpired
                        ? 'Session Expired'
                        : 'Not Connected'}
                </span>
              )}
            </div>
          </div>

          <span className='text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60'>
            {brand.protocol}
          </span>
        </div>

        {/* Broker Identity Row */}
        <div className='flex items-start gap-3.5 pt-4 mb-4'>
          <div
            className={cn(
              'size-12 rounded-xl flex items-center justify-center shrink-0 border p-2 shadow-2xs overflow-hidden',
              brand.accentBg,
              brand.accentBorder
            )}
          >
            {brand.logo || broker.logoPath ? (
              <img
                src={brand.logo || broker.logoPath}
                alt={`${broker.displayName} logo`}
                className='size-7 object-contain'
                loading='lazy'
              />
            ) : (
              <span className={cn('font-bold text-sm', brand.accentText)}>
                {brand.monogram}
              </span>
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug'>
              {broker.displayName}
            </h3>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal'>
              {broker.tagline}
            </p>
          </div>
        </div>

        {/* Syndicated Streams / Capabilities (matching Notes tag pill aesthetic) */}
        <div className='space-y-2 pt-1'>
          <span className='text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider'>
            Syndicated feeds
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {broker.capabilities.map(cap => (
              <span
                key={cap}
                className='inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-300 font-medium'
              >
                <Check className='size-3 text-emerald-500 shrink-0' />
                <span>{cap}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className='flex items-center justify-between gap-3 pt-5 mt-5 border-t border-neutral-100 dark:border-neutral-800/80 text-xs'>
        {isLoading ? (
          <div className='h-3 w-20 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-full' />
        ) : isConnected && lastSyncedAt ? (
          <span className='flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 font-medium text-[11px] truncate'>
            <Clock className='size-3 text-neutral-400 shrink-0' />
            <span>Synced {relativeTime(lastSyncedAt)}</span>
          </span>
        ) : (
          <span className='flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 text-[11px] font-medium'>
            <Shield className='size-3 shrink-0' />
            <span>AES-256 Vault</span>
          </span>
        )}

        {isLoading ? (
          <div className='h-7 w-20 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg' />
        ) : (
          <Link
            href={broker.setupPath}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 shadow-2xs',
              isConnected
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                : isExpired
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100'
            )}
          >
            <span>{ctaLabel}</span>
            <ArrowRight className='size-3' />
          </Link>
        )}
      </div>
    </article>
  );
}

export default BrokerCard;

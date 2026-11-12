'use client';

import { cn } from '@/shared/lib/utils';
import {
  Lock,
} from 'lucide-react';
import { BROKER_BRAND_THEMES, BROKER_SETTINGS_TABS } from '../constants';

export { BROKER_BRAND_THEMES, BROKER_SETTINGS_TABS };

/**
 * Dedicated, decoupled Sidebar for Broker Integration views.
 * Mirrored after ProfileSidebar.jsx with:
 * - Single responsibility (nav, broker identity, status badge, security note).
 * - Exact token matching, responsive horizontal scroll on mobile, static docked column on desktop.
 */
export function BrokerSidebar({
  broker,
  activeTab,
  onTabChange,
  statusBadge,
  isLoading = false,
}) {
  const brand = BROKER_BRAND_THEMES[broker.key] || {
    accentText: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-white dark:bg-neutral-800',
    accentBorder: 'border-neutral-200/80 dark:border-neutral-700/80',
    logo: broker.logoPath || null,
    monogram: broker.initials || 'BK',
    protocol: 'Standard OAuth',
  };

  return (
    <aside className='w-full md:w-60 lg:w-64 shrink-0 space-y-5 self-start'>
      {/* 1. Broker Identity Card */}
      <div className='p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] space-y-4 shadow-2xs'>
        <div className='flex items-center gap-3.5'>
          <div
            className={cn(
              'size-14 rounded-2xl flex items-center justify-center shrink-0 border p-2.5 shadow-2xs overflow-hidden',
              brand.accentBg,
              brand.accentBorder
            )}
          >
            {brand.logo || broker.logoPath ? (
              <img
                src={brand.logo || broker.logoPath}
                alt={`${broker.displayName} logo`}
                className='size-9 object-contain'
                loading='lazy'
              />
            ) : (
              <span className={cn('font-bold text-base', brand.accentText)}>
                {brand.monogram}
              </span>
            )}
          </div>
          <div className='min-w-0 flex-1'>
            <h2 className='text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug'>
              {broker.displayName}
            </h2>
            <span className='text-[11px] text-neutral-500 dark:text-neutral-400 block truncate'>
              {brand.protocol}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className='pt-1'>
            <div className='h-6 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse' />
          </div>
        ) : (
          statusBadge && <div className='pt-1'>{statusBadge}</div>
        )}
      </div>

      {/* 2. Tab Navigation Links (matching ProfileSidebar style) */}
      <nav className='flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none'>
        {BROKER_SETTINGS_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap text-left shrink-0 md:shrink md:w-full',
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
              )}
            >
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  isActive
                    ? 'text-white dark:text-neutral-900'
                    : 'text-neutral-400 dark:text-neutral-500'
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Security Assurance Badge */}
      <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-start gap-2.5 text-xs text-neutral-500 dark:text-neutral-400'>
        <Lock className='size-3.5 text-neutral-400 mt-0.5 shrink-0' />
        <p className='text-[11px] leading-relaxed'>
          Credentials encrypted with AES-256-GCM. Read-only portfolio feeds.
        </p>
      </div>
    </aside>
  );
}

export default BrokerSidebar;

'use client';

import { useBrokerSummary } from '@/features/brokers';
import { cn } from '@/shared/lib/utils';
import { Home, Link2, SlidersHorizontal, StickyNote, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Floating Left Sidebar represents the PLATFORM TOOLS & UTILITIES of CoinTrack:
 * - Home (Command Center)
 * - Notes (Margin Annotations & Research)
 * - Profile (Identity & 2FA Security)
 * - Brokers (Zerodha Kite, Upstox, AngelOne feeds)
 * - Calculators (32 financial & planning engines)
 *
 * Asset classes (Stocks, Mutual Funds, FDs, PF, Gold/Silver) are navigated in the top Navbar.
 * ZERO DUPLICATION between Sidebar and Navbar.
 */
const TOOL_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Overview & Command Center',
    href: '/dashboard',
    icon: Home,
  },
  {
    id: 'notes',
    label: 'Notes',
    href: '/notes',
    icon: StickyNote,
  },
  {
    id: 'profile',
    label: 'Profile & Security (2FA)',
    href: '/profile',
    icon: User,
  },
  {
    id: 'brokers',
    label: 'Broker Connections',
    href: '/brokers',
    icon: Link2,
  },
  {
    id: 'calculators',
    label: 'Calculators (32 Engines)',
    href: '/calculators',
    icon: SlidersHorizontal,
  },
];

const isItemActive = (href, pathname) => {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const { connectedCount, hasExpired, hasExpiringSoon } = useBrokerSummary();

  const brokerIndicator = (() => {
    if (hasExpired) return 'bg-[hsl(var(--loss))]';
    if (hasExpiringSoon) return 'bg-[hsl(var(--chart-4))]';
    if (connectedCount > 0) return 'bg-[hsl(var(--gain))]';
    return null;
  })();

  return (
    <>
      {/* ── DESKTOP VERTICAL FLOATING PILL DOCK ── */}
      <aside className='hidden md:flex flex-col items-center shrink-0 self-start'>
        <div className='w-12 sm:w-14 rounded-full bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 py-4 px-1.5 flex flex-col items-center gap-3.5 shadow-sm'>
          {TOOL_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isItemActive(item.href, pathname);
            const isBroker = item.id === 'brokers';

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  'relative size-9 sm:size-10 rounded-full flex items-center justify-center transition-all duration-200 group',
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm scale-105'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
                )}
              >
                <Icon className='size-4 sm:size-4.5 transition-transform group-hover:scale-110' />

                {/* Status Dot (for Broker health) */}
                {isBroker && brokerIndicator && (
                  <span
                    className={cn(
                      'absolute top-1 right-1 size-2 rounded-full ring-2 ring-white dark:ring-neutral-800',
                      brokerIndicator
                    )}
                  />
                )}

                {/* Floating Tooltip Pill */}
                <span className='absolute left-full ml-3 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50'>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ── MOBILE BOTTOM FLOATING DOCK ── */}
      <nav
        aria-label='Mobile navigation'
        className='md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border border-neutral-200/90 dark:border-neutral-700/90 rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl'
      >
        {TOOL_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isItemActive(item.href, pathname);
          const isBroker = item.id === 'brokers';

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              aria-label={item.label}
              className={cn(
                'relative size-9 rounded-full flex items-center justify-center transition-all',
                active
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              )}
            >
              <Icon className='size-4' />
              {isBroker && brokerIndicator && (
                <span
                  className={cn(
                    'absolute top-0.5 right-0.5 size-1.5 rounded-full ring-1 ring-white dark:ring-neutral-900',
                    brokerIndicator
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

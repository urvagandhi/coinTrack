'use client';

import { useAuth } from '@/shared/auth/AuthContext';
import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/primitives/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/primitives/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/primitives/popover';
import { ThemeToggle } from '@/shared/ui/primitives/theme-toggle';
import { useTheme } from '@/shared/providers/ThemeProvider';
import {
  Bell,
  Building2,
  Coins,
  Landmark,
  LayoutGrid,
  LogOut,
  Moon,
  PieChart,
  Search,
  StickyNote,
  Sun,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

/**
 * Top Navbar represents the WEALTH & ASSET LEDGERS of CoinTrack.
 * Every tab corresponds to an asset category (Equities, Mutual Funds, FDs, PF, Gold/Silver).
 * Platform tools (Brokers, Calculators, Notes, Profile) live in the floating Sidebar.
 */
const ASSET_NAV_TABS = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    id: 'stocks',
    label: 'Stocks',
    href: '/portfolio',
    icon: TrendingUp,
    badge: 'Live',
  },
  {
    id: 'mutual-funds',
    label: 'Mutual Funds',
    href: '/mutual-fund',
    icon: PieChart,
  },
  {
    id: 'fixed-deposits',
    label: 'Fixed Deposits',
    href: '/fixed-deposit',
    icon: Building2,
  },
  {
    id: 'provident-fund',
    label: 'PF Ledgers',
    href: '/ppf',
    icon: Landmark,
  },
  {
    id: 'gold-silver',
    label: 'Gold & Silver',
    href: '/gold-silver',
    icon: Coins,
  },
];

const SEARCH_DIRECTORIES = [
  { title: 'Overview & Net Worth', href: '/dashboard', category: 'Overview' },
  {
    title: 'Stock Holdings & Equities',
    href: '/portfolio',
    category: 'Stocks',
  },
  {
    title: 'Mutual Funds & SIPs',
    href: '/mutual-fund',
    category: 'Mutual Funds',
  },
  {
    title: 'Fixed Deposits (FDs)',
    href: '/fixed-deposit',
    category: 'Fixed Deposits',
  },
  {
    title: 'Public Provident Fund (PPF)',
    href: '/ppf',
    category: 'Provident Fund',
  },
  {
    title: 'Employees Provident Fund (EPF)',
    href: '/epf',
    category: 'Provident Fund',
  },
  {
    title: 'Gold & Silver Bullion',
    href: '/gold-silver',
    category: 'Gold & Silver',
  },
  {
    title: 'Broker Connections (Zerodha, Upstox)',
    href: '/brokers',
    category: 'Tools',
  },
  {
    title: 'Financial Calculators (32 Engines)',
    href: '/calculators',
    category: 'Tools',
  },
  { title: 'Margin Annotations & Notes', href: '/notes', category: 'Tools' },
  {
    title: 'Profile & Security (TOTP 2FA)',
    href: '/profile',
    category: 'Account',
  },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const displayName = user?.name || user?.username || 'Investor';
  const displayEmail = user?.email || '';
  const initials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    }
    return (user?.username?.substring(0, 2) || 'CT').toUpperCase();
  }, [user]);

  const isEmailVerified = Boolean(user?.emailVerified ?? user?.isEmailVerified);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return SEARCH_DIRECTORIES.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  const isTabActive = tabHref => {
    if (tabHref === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (tabHref === '/ppf') {
      return pathname.startsWith('/ppf') || pathname.startsWith('/epf');
    }
    return pathname === tabHref || pathname.startsWith(`${tabHref}/`);
  };

  return (
    <header className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0'>
      {/* ── LEFT: ASSET LEDGER SEGMENTED PILL BAR ── */}
      <div className='flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar py-0.5'>
        <nav
          aria-label='Asset Class Navigation'
          className='inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-neutral-100/90 dark:bg-neutral-800/80 shrink-0'
        >
          {ASSET_NAV_TABS.map(tab => {
            const Icon = tab.icon;
            const active = isTabActive(tab.href);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0',
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
                )}
              >
                <Icon className='size-3.5 sm:size-4' />
                <span>{tab.label}</span>

                {/* Live Badge indicator */}
                {tab.badge && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none tracking-tight',
                      active
                        ? 'bg-neutral-700 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                        : 'bg-neutral-200/80 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── RIGHT: SEARCH, NOTIFICATIONS, AVATAR ── */}
      <div className='flex items-center gap-2.5 self-end lg:self-auto w-full lg:w-auto justify-between lg:justify-end'>
        {/* Search Input Popover */}
        <div className='relative w-full max-w-[260px] sm:max-w-[280px]'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none' />
          <input
            type='text'
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder='Search assets, holdings...'
            className='w-full pl-9 pr-4 py-2 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800/80 text-foreground placeholder:text-neutral-400 border border-transparent focus:outline-none focus:border-neutral-300 dark:focus:border-neutral-700 transition-all'
          />

          {/* Quick-Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <>
              <div
                className='fixed inset-0 z-40'
                onClick={() => setIsSearchOpen(false)}
              />
              <div className='absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-2 z-50 overflow-hidden'>
                <p className='px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-neutral-400'>
                  Quick Jump
                </p>
                <div className='space-y-1'>
                  {searchResults.map(item => (
                    <button
                      key={item.href}
                      type='button'
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        router.push(item.href);
                      }}
                      className='w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors'
                    >
                      <span className='font-medium'>{item.title}</span>
                      <span className='text-[10px] font-mono text-neutral-400'>
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type='button'
              className='relative size-9 rounded-full border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0'
              aria-label='Notifications'
            >
              <Bell className='size-4' />
              {!isEmailVerified && (
                <span className='absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-neutral-900' />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align='end'
            className='w-80 rounded-2xl border-neutral-200 dark:border-neutral-800 p-4 shadow-2xl'
          >
            <div className='flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800'>
              <h4 className='font-semibold text-sm'>Notifications</h4>
              <span className='text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium'>
                System Active
              </span>
            </div>

            <div className='py-3 space-y-3 text-xs'>
              {!isEmailVerified ? (
                <div className='p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200'>
                  <p className='font-medium'>Email Verification Pending</p>
                  <p className='text-[11px] text-amber-700 dark:text-amber-300 mt-0.5'>
                    Verify {displayEmail} to enable security recovery alerts.
                  </p>
                  <Link
                    href='/profile'
                    className='inline-block text-[11px] font-semibold text-amber-900 dark:text-amber-100 underline mt-1.5'
                  >
                    Go to Profile →
                  </Link>
                </div>
              ) : (
                <div className='p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200'>
                  <p className='font-medium'>Account Verified & Secure</p>
                  <p className='text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5'>
                    TOTP 2-Factor Authentication and email verification are
                    active.
                  </p>
                </div>
              )}

              <div className='p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px]'>
                <p className='font-medium text-neutral-800 dark:text-neutral-200'>
                  Real-time Valuation Sync
                </p>
                <p className='mt-0.5'>
                  Market quotes, NAV valuations and ledger balances are in sync.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle (matching landing page switch) */}
        <ThemeToggle />

        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='size-9 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity cursor-pointer shrink-0 border border-neutral-200 dark:border-neutral-700 outline-none'
              aria-label='Account menu'
            >
              <Avatar className='size-8 rounded-full'>
                {user?.name && (
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=000&textColor=fff`}
                    alt={displayName}
                  />
                )}
                <AvatarFallback className='bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold'>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-64 rounded-2xl border-neutral-200 dark:border-neutral-800 p-2 shadow-2xl'
          >
            <DropdownMenuLabel className='font-normal p-2.5'>
              <div className='flex items-center gap-2.5'>
                <div className='size-9 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-xs font-semibold'>
                  {initials}
                </div>
                <div className='min-w-0 flex-1'>
                  <span className='block text-xs font-semibold text-foreground truncate'>
                    {displayName}
                  </span>
                  {displayEmail && (
                    <span className='block text-[11px] text-muted-foreground truncate font-mono'>
                      {displayEmail}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href='/profile'
                className='flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg'
              >
                <UserCircle className='size-4 text-neutral-500' />
                <span>Account & Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href='/notes'
                className='flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg'
              >
                <StickyNote className='size-4 text-neutral-500' />
                <span>Notes</span>
              </Link>
            </DropdownMenuItem>

            <div
              onClick={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
              className='px-2.5 py-2 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors'
            >
              <span className='text-xs text-neutral-600 dark:text-neutral-300 font-medium'>
                Appearance
              </span>
              <span className='text-[11px] text-neutral-400 font-medium flex items-center gap-1.5'>
                {mounted && resolvedTheme === 'dark' ? (
                  <>
                    <Sun className='size-3 text-amber-400' /> Dark
                  </>
                ) : (
                  <>
                    <Moon className='size-3 text-neutral-500' /> Light
                  </>
                )}
              </span>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className='flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-destructive focus:text-destructive'
            >
              <LogOut className='size-4' />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

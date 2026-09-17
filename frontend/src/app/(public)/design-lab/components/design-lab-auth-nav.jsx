'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FlaskConical,
  ChevronUp,
  ChevronDown,
  LogIn,
  UserPlus,
  KeyRound,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  MailCheck,
  LayoutDashboard,
  Home,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DesignLabAuthNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  const NAV_LINKS = [
    { label: 'Hub', href: '/design-lab', icon: Home },
    { label: 'Login', href: '/design-lab/login', icon: LogIn },
    { label: 'Register', href: '/design-lab/register', icon: UserPlus },
    { label: 'Forgot PW', href: '/design-lab/forgot-password', icon: KeyRound },
    {
      label: 'Reset PW',
      href: '/design-lab/reset-password',
      icon: LockKeyhole,
    },
    { label: 'Setup 2FA', href: '/design-lab/setup-2fa', icon: ShieldAlert },
    { label: 'Verify 2FA', href: '/design-lab/verify-2fa', icon: ShieldCheck },
    {
      label: 'Verify Email',
      href: '/design-lab/verify-email',
      icon: MailCheck,
    },
    {
      label: 'Dashboard',
      href: '/design-lab/dashboard',
      icon: LayoutDashboard,
    },
  ];

  return (
    <aside
      aria-label='Design Lab Test Dock'
      className='fixed bottom-3 right-3 sm:right-6 z-50 flex flex-col items-end pointer-events-auto select-none font-sans'
    >
      {/* Expanded panel */}
      {!collapsed && (
        <div className='mb-2 p-3.5 rounded-2xl bg-card/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-border/80 shadow-2xl w-[320px] sm:w-[380px] space-y-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3'>
          <div className='flex items-center justify-between border-b border-border/50 pb-2'>
            <div className='flex items-center gap-2'>
              <FlaskConical className='size-4 text-emerald-500' />
              <span className='text-xs font-bold uppercase tracking-wider text-foreground'>
                Redesign UI Test Dock
              </span>
            </div>
            <button
              type='button'
              onClick={() => setCollapsed(true)}
              className='p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors'
              title='Collapse dock'
            >
              <ChevronDown className='size-3.5' />
            </button>
          </div>

          {/* Quick Page Jump Links */}
          <div className='grid grid-cols-3 gap-1.5'>
            {NAV_LINKS.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-medium transition-all text-center gap-1 border',
                    isActive
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className='size-3.5 shrink-0' />
                  <span className='truncate w-full leading-tight'>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Flow Quick-Simulators */}
          <div className='pt-2 border-t border-border/50 space-y-1.5'>
            <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block'>
              Quick Flow Presets
            </span>
            <div className='grid grid-cols-2 gap-1.5'>
              <button
                type='button'
                onClick={() =>
                  router.push(
                    '/design-lab/dashboard?provider=google&verified=true'
                  )
                }
                className='flex items-center justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border/40 text-left'
              >
                <CheckCircle2 className='size-3 text-emerald-500 shrink-0' />
                <span className='truncate'>Google In (Verified)</span>
              </button>
              <button
                type='button'
                onClick={() =>
                  router.push(
                    '/design-lab/dashboard?provider=manual&verified=false'
                  )
                }
                className='flex items-center justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border/40 text-left'
              >
                <ShieldAlert className='size-3 text-amber-500 shrink-0' />
                <span className='truncate'>Manual In (Unverified)</span>
              </button>
              <button
                type='button'
                onClick={() => router.push('/design-lab/reset-password')}
                className='flex items-center justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border/40 text-left'
              >
                <LockKeyhole className='size-3 text-purple-500 shrink-0' />
                <span className='truncate'>Reset PW Flow</span>
              </button>
              <button
                type='button'
                onClick={() =>
                  router.push(
                    '/design-lab/verify-email?token=valid&source=email_client'
                  )
                }
                className='flex items-center justify-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground transition-colors border border-border/40 text-left'
              >
                <ExternalLink className='size-3 text-blue-500 shrink-0' />
                <span className='truncate'>Simulate Email Link Click</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Pill Button */}
      <button
        type='button'
        onClick={() => setCollapsed(!collapsed)}
        className='flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-900/90 text-white dark:bg-white/95 dark:text-zinc-900 shadow-xl backdrop-blur-md border border-border/30 hover:scale-[1.03] active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer'
      >
        <FlaskConical className='size-3.5 text-emerald-400 dark:text-emerald-600 animate-pulse' />
        <span>UI Test Dock</span>
        {collapsed ? (
          <ChevronUp className='size-3.5 opacity-70' />
        ) : (
          <ChevronDown className='size-3.5 opacity-70' />
        )}
      </button>
    </aside>
  );
}

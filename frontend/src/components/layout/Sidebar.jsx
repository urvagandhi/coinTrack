'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBrokerSummary } from '@/hooks/useBrokerConnection';
import { cn } from '@/lib/utils';
import {
    Calculator,
    LayoutDashboard,
    Link2,
    LogOut,
    StickyNote,
    TrendingUp,
    User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

const PRIMARY_NAV = [
    { idx: '001', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { idx: '002', label: 'Portfolio',  href: '/portfolio', icon: TrendingUp },
    { idx: '003', label: 'Brokers',    href: '/brokers',   icon: Link2 },
    { idx: '004', label: 'Calculators',href: '/calculators',icon: Calculator },
    { idx: '005', label: 'Notes',      href: '/notes',     icon: StickyNote },
];

const BOTTOM_NAV = [
    { idx: '006', label: 'Profile', href: '/profile', icon: User },
];

const isActive = (href, pathname) =>
    pathname === href || pathname.startsWith(href + '/');

function NavRow({ item, active, badge, onClick, isDanger = false }) {
    const Icon = item.icon;

    const body = (
        <div
            className={cn(
                'group relative flex items-center gap-3 h-11 pl-4 pr-3 transition-colors border-l-2',
                active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground border-[hsl(var(--accent))]'
                    : isDanger
                        ? 'border-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-[hsl(var(--loss))] hover:border-[hsl(var(--loss))]/60'
                        : 'border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground hover:border-sidebar-border'
            )}
        >
            <span className={cn(
                'index-num tnum w-7 text-left',
                active ? 'text-[hsl(var(--accent))]' : 'text-sidebar-foreground/35',
            )}>
                {item.idx}
            </span>
            <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={active ? 2.5 : 1.75} />
            <span className={cn(
                'flex-1 text-[13px]',
                active ? 'font-medium tracking-tight' : 'font-normal',
            )}>
                {item.label}
            </span>
            {badge && (
                <span className={cn(
                    'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                    badge.className,
                )}>
                    <span className={cn('h-1 w-1 rounded-full', badge.dotColor)} />
                    {badge.text}
                </span>
            )}
        </div>
    );

    if (item.href === '#') {
        return (
            <button type="button" onClick={onClick} className="w-full text-left">
                {body}
            </button>
        );
    }

    return (
        <Link href={item.href} onClick={onClick}>{body}</Link>
    );
}

export default function Sidebar({ onNavigate }) {
    const { logout } = useAuth();
    const pathname = usePathname();
    const { connectedCount, hasExpired, hasExpiringSoon } = useBrokerSummary();

    const brokerBadge = (() => {
        if (hasExpired) {
            return { text: 'Reset', className: 'bg-[hsl(var(--loss))]/15 text-[hsl(var(--loss))]', dotColor: 'bg-[hsl(var(--loss))]' };
        }
        if (hasExpiringSoon) {
            return { text: 'Warn', className: 'bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))]', dotColor: 'bg-[hsl(var(--chart-4))]' };
        }
        if (connectedCount > 0) {
            return { text: `${connectedCount} live`, className: 'bg-[hsl(var(--gain))]/15 text-[hsl(var(--gain))]', dotColor: 'bg-[hsl(var(--gain))]' };
        }
        return null;
    })();

    const handleLogout = useCallback(async (e) => {
        e.preventDefault();
        await logout();
    }, [logout]);

    const year = new Date().getFullYear();

    return (
        <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
            {/* Masthead */}
            <Link
                href="/dashboard"
                onClick={onNavigate}
                className="relative flex items-center gap-2.5 px-5 pt-6 pb-5 border-b border-sidebar-border group"
            >
                <span className="relative h-8 w-8 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <Image
                        src="/coinTrack.png"
                        alt="coinTrack"
                        fill
                        priority
                        className="object-contain"
                    />
                </span>
                <span className="flex items-baseline gap-0.5">
                    <span className="font-serif text-[28px] leading-none tracking-tight text-sidebar-foreground">
                        coin
                    </span>
                    <span className="display-serif italic text-[28px] leading-none text-[hsl(var(--accent))]">
                        Track
                    </span>
                </span>
                <span className="ml-auto text-[9px] tracking-[0.2em] uppercase text-sidebar-foreground/40 self-end pb-0.5">
                    VOL.04
                </span>
            </Link>

            {/* Meta strip */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-sidebar-border">
                <span className="text-[9px] tracking-[0.22em] uppercase text-sidebar-foreground/40">
                    The Daily Ledger
                </span>
                <span className="text-[9px] tracking-[0.16em] uppercase text-sidebar-foreground/30 font-mono">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
            </div>

            {/* Section heading */}
            <div className="px-5 pt-5 pb-3 flex items-baseline gap-2">
                <span className="text-[9px] tracking-[0.24em] uppercase text-sidebar-foreground/45 font-semibold">
                    Index
                </span>
                <span className="flex-1 h-px bg-sidebar-border" />
            </div>

            <nav className="flex-1 overflow-y-auto pb-4">
                <ul>
                    {PRIMARY_NAV.map((item) => (
                        <li key={item.href}>
                            <NavRow
                                item={item}
                                active={isActive(item.href, pathname)}
                                badge={item.href === '/brokers' ? brokerBadge : null}
                                onClick={onNavigate}
                            />
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom */}
            <div className="border-t border-sidebar-border">
                {BOTTOM_NAV.map((item) => (
                    <NavRow
                        key={item.href}
                        item={item}
                        active={isActive(item.href, pathname)}
                        onClick={onNavigate}
                    />
                ))}
                <NavRow
                    item={{ idx: '∅', label: 'Sign out', href: '#', icon: LogOut }}
                    active={false}
                    isDanger
                    onClick={handleLogout}
                />
            </div>

            {/* Colophon */}
            <div className="px-5 py-3 border-t border-sidebar-border flex items-center justify-between">
                <span className="text-[9px] tracking-[0.18em] uppercase text-sidebar-foreground/35 font-mono">
                    Est. {year}
                </span>
                <span className="text-[9px] tracking-[0.18em] uppercase text-sidebar-foreground/35">
                    Bombay · IST
                </span>
            </div>
        </div>
    );
}

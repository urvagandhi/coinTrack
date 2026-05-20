'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { LogOut, Menu, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const ROUTE = {
    '/dashboard': { num: '001', title: 'Dashboard', kicker: 'The Ledger' },
    '/portfolio': { num: '002', title: 'Portfolio', kicker: 'Holdings & Activity' },
    '/brokers':   { num: '003', title: 'Brokers',   kicker: 'Connected Vendors' },
    '/brokers/zerodha':  { num: '003.1', title: 'Zerodha',  kicker: 'Vendor Setup' },
    '/brokers/upstox':   { num: '003.2', title: 'Upstox',   kicker: 'Vendor Setup' },
    '/brokers/angelone': { num: '003.3', title: 'Angel One', kicker: 'Vendor Setup' },
    '/calculators': { num: '004', title: 'Calculators', kicker: 'Numerical Reference' },
    '/notes':    { num: '005', title: 'Notes',     kicker: 'Margin Annotations' },
    '/profile':  { num: '006', title: 'Profile',   kicker: 'Account & Identity' },
};

function deriveRoute(pathname) {
    if (ROUTE[pathname]) return ROUTE[pathname];
    const seg = pathname.split('/').filter(Boolean).pop() ?? '';
    return {
        num: '—',
        title: seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Dashboard',
        kicker: 'Section',
    };
}

function useNow() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const route = deriveRoute(pathname);
    const now = useNow();

    const displayName = user?.name || user?.username || 'Account';
    const displayEmail = user?.email || '';
    const initials = (displayName || 'U')
        .split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2)
        .join('').toUpperCase();

    const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
        <header className={cn(
            'sticky top-0 z-20 bg-background/92 backdrop-blur-sm',
            'border-b border-hairline'
        )}>
            <div className="flex items-stretch min-h-16">
                <button
                    onClick={onMenuClick}
                    aria-label="Open navigation"
                    className="md:hidden flex items-center justify-center px-4 border-r border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Section identifier */}
                <div className="flex items-center gap-4 px-4 md:px-8 py-3 flex-1 min-w-0">
                    <span className="display-num text-[13px] text-[hsl(var(--accent))] hidden sm:inline">
                        §{route.num}
                    </span>
                    <div className="min-w-0">
                        <p className="eyebrow leading-none mb-1.5">{route.kicker}</p>
                        <h1 className="font-serif text-[22px] md:text-[26px] leading-none tracking-tight text-foreground truncate">
                            {route.title}
                        </h1>
                    </div>
                </div>

                {/* Date masthead */}
                <div className="hidden lg:flex items-center px-6 border-l border-border">
                    <div className="text-right">
                        <p className="eyebrow leading-none mb-1.5">Edition</p>
                        <p className="font-serif italic text-[13px] text-foreground">{dateString}</p>
                    </div>
                </div>

                {/* Live clock */}
                <div className="hidden md:flex items-center px-6 border-l border-border">
                    <div className="flex items-center gap-2">
                        <span className="live-dot" />
                        <span className="display-num text-[15px] text-foreground tabular-nums">
                            {timeString}
                        </span>
                        <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">IST</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 px-3 md:px-4 border-l border-border">
                    <ThemeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 pl-2 pr-1 py-1.5 hover:bg-muted transition-colors rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                aria-label="Account menu"
                            >
                                <span className="hidden md:flex flex-col items-end">
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground leading-none">
                                        Holder
                                    </span>
                                    <span className="text-[12px] font-medium text-foreground leading-none mt-1 max-w-[120px] truncate">
                                        {displayName}
                                    </span>
                                </span>
                                <Avatar className="h-8 w-8 rounded-sm border border-hairline">
                                    {user?.name && (
                                        <AvatarImage
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=000&textColor=fff`}
                                            alt={displayName}
                                        />
                                    )}
                                    <AvatarFallback className="rounded-sm bg-foreground text-background text-xs font-semibold tracking-wider">
                                        {initials || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60 rounded-sm border-hairline">
                            <DropdownMenuLabel className="font-normal py-3">
                                <span className="eyebrow block mb-1.5">Subscriber</span>
                                <span className="block text-sm font-medium text-foreground truncate">{displayName}</span>
                                {displayEmail && (
                                    <span className="block text-[11px] text-muted-foreground truncate mt-0.5 font-mono">
                                        {displayEmail}
                                    </span>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="cursor-pointer text-[13px]">
                                    <UserCircle className="mr-2 h-3.5 w-3.5" /> Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={logout}
                                className="cursor-pointer text-destructive focus:text-destructive text-[13px]"
                            >
                                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

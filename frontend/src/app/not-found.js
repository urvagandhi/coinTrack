// src/app/not-found.js
'use client';

import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, KeyRound, Search } from 'lucide-react';

function useNow() {
    const [now, setNow] = useState(() => new Date());
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        setNow(new Date());
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return { now, mounted };
}

const ARCHIVED_AUTH = [
    { label: 'Dashboard', href: '/dashboard', kicker: '§001' },
    { label: 'Portfolio', href: '/portfolio', kicker: '§002' },
    { label: 'Brokers', href: '/brokers', kicker: '§003' },
    { label: 'Calculators', href: '/calculators', kicker: '§004' },
    { label: 'Notes', href: '/notes', kicker: '§005' },
    { label: 'Profile', href: '/profile', kicker: '§006' },
];

const ARCHIVED_GUEST = [
    { label: 'Sign In', href: '/login', kicker: '§I' },
    { label: 'Open an Account', href: '/register', kicker: '§II' },
    { label: 'Reset Password', href: '/forgot-password', kicker: '§III' },
];

export default function NotFound() {
    const { now, mounted } = useNow();
    const pathname = usePathname();
    const { isAuthenticated, isInitializing } = useAuth();
    const authReady = mounted && !isInitializing;
    const showAuthed = authReady && isAuthenticated;
    const showGuest = authReady && !isAuthenticated;

    const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const year = now.getFullYear();
    const refNo = `404-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
            {/* Subtle paper grain backdrop */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
            />

            {/* Masthead */}
            <header className="border-b border-hairline relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <span className="relative h-8 w-8 block transition-transform duration-300 group-hover:scale-110">
                            <Image src="/coinTrack.png" alt="coinTrack" fill priority className="object-contain" />
                        </span>
                        <span className="font-serif italic text-[24px] leading-none tracking-tight">coinTrack</span>
                        <span className="hidden sm:inline display-num text-[10px] text-muted-foreground ml-1">VOL.04 · ERRATA</span>
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        <span className="live-dot" />
                        <span className="display-num tabular-nums text-foreground" suppressHydrationWarning>{timeString}</span>
                        <span>IST</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex items-center px-4 sm:px-8 py-10 sm:py-16 relative z-10">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                        {/* LEFT: dramatic 404 + headline */}
                        <section className="lg:col-span-7 relative">
                            {/* Eyebrow row */}
                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="index-num tnum text-[11px]">[ XX ]</span>
                                <span className="eyebrow">Missing Folio · Errata</span>
                            </div>

                            {/* Huge 404 with overlapping stamp */}
                            <div className="relative">
                                <p
                                    className="font-serif text-[clamp(140px,24vw,280px)] leading-[0.82] tracking-tighter text-foreground select-none"
                                    aria-hidden="true"
                                >
                                    4<span className="italic text-[hsl(var(--accent))]">0</span>4
                                </p>

                                {/* Diagonal "MISSING" stamp */}
                                <div
                                    className="absolute top-[14%] right-[2%] sm:right-[6%] -rotate-[14deg] border-[3px] border-[hsl(var(--loss))] px-3 sm:px-5 py-1 sm:py-1.5 bg-background/80"
                                    aria-hidden="true"
                                >
                                    <p className="font-mono text-[hsl(var(--loss))] text-[12px] sm:text-[16px] font-bold tracking-[0.25em]">
                                        MISSING
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 rule-strong-h" />

                            <h1 className="mt-6 font-serif text-[40px] sm:text-[56px] leading-[1] tracking-tight text-foreground">
                                The page you sought<br />
                                <span className="italic text-muted-foreground">has gone to press without you.</span>
                            </h1>

                            <p className="mt-5 font-serif italic text-[17px] sm:text-[18px] text-muted-foreground leading-snug max-w-xl">
                                It may have been retired, relocated to a quieter section of the
                                archive, or — most likely — never set in type at all.
                            </p>

                            {/* Requested path log */}
                            <div className="mt-7 border-l-2 border-[hsl(var(--loss))] bg-[hsl(var(--loss)/0.04)] px-4 py-3 max-w-xl">
                                <p className="eyebrow text-[hsl(var(--loss))] mb-1">Requested path</p>
                                <p className="font-mono text-[13px] text-foreground break-all">
                                    {pathname || '/'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex flex-wrap gap-3 min-h-[44px]">
                                {showAuthed && (
                                    <Link href="/dashboard">
                                        <button className="ed-btn ed-btn-primary h-11 px-5">
                                            <Compass size={14} />
                                            Return to Dashboard
                                        </button>
                                    </Link>
                                )}
                                {showGuest && (
                                    <Link href="/login">
                                        <button className="ed-btn ed-btn-primary h-11 px-5">
                                            <KeyRound size={14} />
                                            Sign In
                                        </button>
                                    </Link>
                                )}
                                <button
                                    onClick={() => window.history.back()}
                                    className="ed-btn ed-btn-ghost h-11 px-5"
                                >
                                    <ArrowLeft size={14} />
                                    Go Back
                                </button>
                                {showGuest && (
                                    <Link href="/register">
                                        <button className="ed-btn ed-btn-accent h-11 px-5">
                                            Create Account
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </section>

                        {/* RIGHT: archive index */}
                        <aside className="lg:col-span-5 lg:border-l border-hairline lg:pl-10">
                            <div className="flex items-baseline gap-3 mb-5">
                                <Search size={14} className="text-muted-foreground" />
                                <p className="eyebrow">In this volume</p>
                            </div>

                            <p className="font-serif text-[22px] leading-snug text-foreground mb-1">
                                Perhaps you meant one of these sections?
                            </p>
                            <p className="text-[12px] text-muted-foreground font-mono mb-6" suppressHydrationWarning>
                                {authReady ? `${(showAuthed ? ARCHIVED_AUTH : ARCHIVED_GUEST).length} entries — sorted by folio` : 'Loading index…'}
                            </p>

                            <ul className="divide-y divide-hairline border-y border-hairline min-h-[180px]" suppressHydrationWarning>
                                {authReady && (showAuthed ? ARCHIVED_AUTH : ARCHIVED_GUEST).map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="group flex items-baseline justify-between gap-3 py-3.5 hover:bg-muted/40 px-1 -mx-1 transition-colors"
                                        >
                                            <div className="flex items-baseline gap-3 min-w-0">
                                                <span className="display-num text-[10px] text-muted-foreground group-hover:text-[hsl(var(--accent))] transition-colors">
                                                    {item.kicker}
                                                </span>
                                                <span className="font-serif text-[18px] text-foreground truncate">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <ArrowRight
                                                size={14}
                                                className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0"
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            {/* Editor's note */}
                            <div className="mt-8 relative">
                                <span
                                    className="absolute -left-1 -top-3 font-serif italic text-[60px] leading-none text-foreground/15 select-none"
                                    aria-hidden="true"
                                >
                                    &ldquo;
                                </span>
                                <p className="pl-6 font-serif italic text-[15px] text-muted-foreground leading-snug">
                                    Even the finest editions misplace a page from time to time.
                                    The remedy is patience — and a careful return to the index.
                                </p>
                                <p className="mt-2 pl-6 eyebrow">— The Editor</p>
                            </div>
                        </aside>
                    </div>

                    {/* Bottom dateline */}
                    <div className="mt-12 pt-5 border-t border-hairline grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                        <div>
                            <p className="eyebrow mb-1">Filed</p>
                            <p className="font-serif italic text-foreground" suppressHydrationWarning>{dateString}</p>
                        </div>
                        <div className="sm:text-center">
                            <p className="eyebrow mb-1">Reference</p>
                            <p className="font-mono text-foreground" suppressHydrationWarning>{refNo}</p>
                        </div>
                        <div className="sm:text-right">
                            <p className="eyebrow mb-1">Status</p>
                            <p className="font-mono text-[hsl(var(--loss))]">404 · NOT FOUND</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-hairline relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="eyebrow" suppressHydrationWarning>&copy; {year} CoinTrack — Printed in Browser</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                        If you believe this is in error, please <a href="mailto:support@cointrack.app" className="text-foreground underline">contact the editor</a>.
                    </p>
                </div>
            </footer>
        </div>
    );
}

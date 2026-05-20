// src/components/auth/AuthPageShell.jsx
'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function useNow() {
    const [now, setNow] = useState(null);
    useEffect(() => {
        setNow(new Date());
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return now;
}

export function AuthPageShell({
    title,
    subtitle,
    index = '00',
    kicker = 'Access',
    maxWidth = 'sm',
    showFooterLinks = true,
    asideQuote,
    children,
}) {
    const now = useNow();
    const widthClass = maxWidth === 'md' ? 'max-w-md' : maxWidth === 'lg' ? 'max-w-lg' : 'max-w-sm';

    const dateString = now ? now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }) : '';
    const timeString = now ? now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--';

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Masthead */}
            <header className="border-b border-hairline">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-baseline gap-3 group">
                        <span className="font-serif italic text-[24px] leading-none tracking-tight">coinTrack</span>
                        <span className="hidden sm:inline display-num text-[10px] text-muted-foreground">VOL.04</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        <span className="live-dot" />
                        <span className="display-num tabular-nums text-foreground">{timeString}</span>
                        <span>IST</span>
                        <span className="text-muted-foreground/60">/</span>
                        <span className="font-serif italic normal-case tracking-normal text-[12px] text-foreground">
                            {dateString}
                        </span>
                    </div>

                    <p className="hidden sm:block eyebrow">The Daily Ledger</p>
                </div>
            </header>

            {/* Body */}
            <main className="flex-1 flex">
                <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,520px)_1fr]">
                    {/* Left aside — quotation column */}
                    <aside className="hidden lg:flex flex-col justify-between border-r border-hairline p-10 bg-muted/30">
                        <div>
                            <p className="eyebrow mb-2">Folio</p>
                            <p className="display-num text-[44px] leading-none text-foreground">§{index}</p>
                            <p className="mt-2 font-serif italic text-[18px] text-muted-foreground">{kicker}</p>
                        </div>

                        <blockquote className="mt-12 border-l-2 border-foreground/80 pl-5">
                            <p className="font-serif italic text-[22px] leading-snug text-foreground">
                                {asideQuote || '"In the ledger of our days, every entry is an act of care."'}
                            </p>
                            <footer className="mt-3 eyebrow">— The Editor</footer>
                        </blockquote>

                        <div>
                            <div className="rule-strong-h mb-3" />
                            <p className="eyebrow">Filed under</p>
                            <p className="font-serif italic text-[14px] text-foreground mt-1">Identity & Access</p>
                        </div>
                    </aside>

                    {/* Form column */}
                    <section className="px-5 sm:px-10 py-10 sm:py-14 border-r border-hairline">
                        <div className={cn('w-full mx-auto', widthClass)}>
                            {/* Section identifier */}
                            <div className="flex items-baseline gap-3 mb-1.5">
                                <span className="index-num tnum text-[11px]">[ {index} ]</span>
                                <span className="eyebrow">{kicker}</span>
                            </div>
                            <h1 className="font-serif text-[36px] sm:text-[44px] leading-[1.05] tracking-tight text-foreground">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-3 font-serif italic text-[16px] text-muted-foreground leading-snug">
                                    {subtitle}
                                </p>
                            )}

                            <div className="mt-8 rule-strong-h" />

                            <div className="pt-8">
                                {children}
                            </div>
                        </div>
                    </section>

                    {/* Right margin */}
                    <aside className="hidden lg:flex flex-col p-10">
                        <div>
                            <p className="eyebrow mb-2">Edition</p>
                            <p className="font-serif italic text-[14px] text-foreground leading-snug">{dateString}</p>
                            <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                                <span className="live-dot" />
                                <span className="display-num tabular-nums text-foreground">{timeString}</span>
                                <span>IST</span>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <div className="rule-strong-h mb-3" />
                            <p className="eyebrow">Imprint</p>
                            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                                A personal ledger for the modern investor.
                                Set in <span className="font-serif italic">Instrument Serif</span> &amp; Geist.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-hairline">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="eyebrow">&copy; {new Date().getFullYear()} CoinTrack — Printed in Browser</p>
                    {showFooterLinks && (
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <Link href="/privacy" className="hover:text-foreground transition-colors uppercase tracking-[0.2em]">
                                Privacy
                            </Link>
                            <span className="text-muted-foreground/40">·</span>
                            <Link href="/terms" className="hover:text-foreground transition-colors uppercase tracking-[0.2em]">
                                Terms
                            </Link>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}

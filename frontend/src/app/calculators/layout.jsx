// src/app/calculators/layout.jsx — Public calculator layout, no auth required
'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function CalculatorsLayout({ children }) {
    const { openModal } = useModal();
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const { now, mounted } = useNow();

    const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const year = now.getFullYear();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Masthead — mirrors home page */}
            <header className="border-b border-hairline sticky top-0 z-30 bg-background/92 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <span className="relative h-9 w-9 block transition-transform duration-300 group-hover:scale-110">
                            <Image src="/coinTrack.png" alt="coinTrack" fill priority className="object-contain" />
                        </span>
                        <span className="flex items-baseline gap-0.5">
                            <span className="font-serif text-[28px] leading-none tracking-tight">coin</span>
                            <span className="display-serif italic text-[28px] leading-none text-[hsl(var(--accent))]">Track</span>
                        </span>
                        <span className="hidden sm:inline display-num text-[10px] text-muted-foreground ml-2 self-end pb-1">VOL.04</span>
                    </Link>

                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {[
                            { label: 'Home', href: '/' },
                            { label: 'Features', href: '/#features' },
                            { label: 'Pricing', href: '/#pricing' },
                            { label: 'Brokers', href: '/#brokers' },
                            { label: 'Calculators', href: '/calculators' },
                        ].map((item) => {
                            const active = item.href === '/calculators' && pathname?.startsWith('/calculators');
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={
                                        'px-3 py-1.5 text-[12px] uppercase tracking-[0.18em] transition-colors ' +
                                        (active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')
                                    }
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {loading ? (
                            <div className="w-24 h-9 bg-muted animate-pulse" />
                        ) : user ? (
                            <Link href="/dashboard">
                                <button className="ed-btn ed-btn-primary h-9 px-4">
                                    Dashboard
                                    <ArrowRight size={13} />
                                </button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:block">
                                    <button className="ed-btn ed-btn-ghost h-9 px-4">Sign In</button>
                                </Link>
                                <Link href="/register">
                                    <button className="ed-btn ed-btn-primary h-9 px-4">Sign Up</button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Dateline strip — mirrors home page */}
                <div className="border-t border-hairline bg-muted/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-1.5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        <span>The Daily Ledger · The Reference Desk</span>
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="live-dot" />
                            <span className="display-num tabular-nums text-foreground" suppressHydrationWarning>{timeString}</span>
                            <span>IST</span>
                            <span className="text-muted-foreground/40">/</span>
                            <span className="font-serif italic normal-case tracking-normal text-[12px] text-foreground" suppressHydrationWarning>
                                {mounted ? dateString : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Breadcrumb */}
            {pathname !== '/calculators' && (
                <div className="border-b border-hairline bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8">
                        <Link
                            href="/calculators"
                            className="inline-flex items-center gap-1.5 py-2.5 eyebrow hover:text-foreground transition-colors"
                        >
                            <ChevronLeft size={13} />
                            Return to the Index
                        </Link>
                    </div>
                </div>
            )}

            {/* Main */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
                {children}
            </main>

            {/* Footer — mirrors home page rhythm */}
            <footer className="border-t border-hairline mt-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
                    <div className="grid gap-10 sm:grid-cols-4">
                        <div className="sm:col-span-1">
                            <Link href="/" className="flex items-center gap-2 mb-3">
                                <span className="relative h-7 w-7 block">
                                    <Image src="/coinTrack.png" alt="coinTrack" fill className="object-contain" />
                                </span>
                                <span className="flex items-baseline gap-0.5">
                                    <span className="font-serif text-[22px] leading-none">coin</span>
                                    <span className="display-serif italic text-[22px] leading-none text-[hsl(var(--accent))]">Track</span>
                                </span>
                            </Link>
                            <p className="font-serif italic text-[13px] text-muted-foreground leading-snug max-w-[220px]">
                                A personal finance quarterly, set in clear type.
                            </p>
                        </div>

                        <div>
                            <p className="eyebrow mb-3">The Reference</p>
                            <ul className="space-y-2 text-[13px] text-muted-foreground">
                                <li>
                                    <Link href="/calculators/investment/sip" className="font-serif hover:text-foreground transition-colors">
                                        SIP Calculator
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/calculators/loans/emi" className="font-serif hover:text-foreground transition-colors">
                                        EMI Calculator
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/calculators/tax/income-tax" className="font-serif hover:text-foreground transition-colors">
                                        Income Tax
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/calculators" className="font-serif hover:text-foreground transition-colors">
                                        See all 32 →
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <p className="eyebrow mb-3">The Publication</p>
                            <ul className="space-y-2 text-[13px] text-muted-foreground">
                                <li>
                                    <Link href="/" className="font-serif hover:text-foreground transition-colors">Home</Link>
                                </li>
                                <li>
                                    <button onClick={() => openModal('contact')} className="font-serif hover:text-foreground transition-colors text-left">
                                        Contact
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <p className="eyebrow mb-3">Legal</p>
                            <ul className="space-y-2 text-[13px] text-muted-foreground">
                                <li>
                                    <button onClick={() => openModal('privacy')} className="font-serif hover:text-foreground transition-colors text-left">
                                        Privacy
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => openModal('terms')} className="font-serif hover:text-foreground transition-colors text-left">
                                        Terms
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => openModal('cookies')} className="font-serif hover:text-foreground transition-colors text-left">
                                        Cookies
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="eyebrow" suppressHydrationWarning>
                            &copy; {mounted ? year : ''} CoinTrack — Printed in Browser
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                            <span className="live-dot" />
                            All figures for reference only · Not investment advice
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

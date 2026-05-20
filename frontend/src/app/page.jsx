// src/app/page.jsx
'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import {
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Check,
    Layers,
    Lock,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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

const FEATURES = [
    {
        idx: 'I',
        icon: TrendingUp,
        kicker: 'Coverage',
        title: 'Real-time tracking',
        body: 'Live market data across every connected broker, refreshed on the tick — without polling rituals or stale snapshots.',
    },
    {
        idx: 'II',
        icon: ShieldCheck,
        kicker: 'Trust',
        title: 'Mandatory 2FA',
        body: 'TOTP-only authentication, encrypted credentials, and short-lived session tokens. Security is not an afterthought.',
    },
    {
        idx: 'III',
        icon: BarChart3,
        kicker: 'Insight',
        title: 'Editorial analytics',
        body: 'Holdings, P&L, MF timelines, and broker funds rendered with the clarity of a printed quarterly — no chart-junk, no noise.',
    },
];

const PRICING = [
    {
        title: 'Starter',
        index: 'I',
        price: 'Free',
        unit: 'forever',
        features: ['Real-time tracking', 'Basic analytics', 'Up to 3 portfolios', 'Email support'],
        recommended: false,
        cta: 'Open Account',
    },
    {
        title: 'Pro',
        index: 'II',
        price: '$12',
        unit: 'per month',
        features: ['Unlimited portfolios', 'Advanced AI insights', 'Priority support', 'Tax reports', 'API access'],
        recommended: true,
        cta: 'Subscribe',
    },
    {
        title: 'Enterprise',
        index: 'III',
        price: 'Custom',
        unit: 'on request',
        features: ['Dedicated account manager', 'Custom integrations', 'White-label reports', 'SLA support'],
        recommended: false,
        cta: 'Contact Sales',
    },
];

const BROKERS = ['Zerodha', 'Upstox', 'Angel One'];

export default function HomePage() {
    const { user, loading } = useAuth();
    const { openModal } = useModal();
    const { now, mounted } = useNow();

    const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const year = now.getFullYear();

    const primaryHref = user ? '/dashboard' : '/register';
    const primaryLabel = user ? 'Open Dashboard' : 'Open Account — Free';

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Masthead */}
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
                            { label: 'Features', href: '#features' },
                            { label: 'Pricing', href: '#pricing' },
                            { label: 'Brokers', href: '#brokers' },
                            { label: 'Calculators', href: '/calculators' },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="px-3 py-1.5 text-[12px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
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

                {/* Dateline strip */}
                <div className="border-t border-hairline bg-muted/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-1.5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        <span>The Daily Ledger · A Personal Finance Quarterly</span>
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

            <main className="flex-grow">

                {/* HERO — newspaper cover */}
                <section className="border-b border-hairline">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-20">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                            <div className="lg:col-span-7">
                                <div className="flex items-baseline gap-3 mb-6">
                                    <span className="index-num tnum text-[11px]">[ 001 ]</span>
                                    <span className="eyebrow">Cover Story · Edition {year}</span>
                                </div>

                                <h1 className="font-serif text-[clamp(48px,8vw,96px)] leading-[0.95] tracking-tight text-foreground">
                                    Your portfolio,
                                    <br />
                                    <span className="italic text-muted-foreground">set in clear</span>
                                    <span className="italic"> type.</span>
                                </h1>

                                <p className="mt-7 font-serif italic text-[18px] sm:text-[20px] leading-snug text-muted-foreground max-w-2xl">
                                    coinTrack is the personal finance quarterly written for the modern Indian investor —
                                    live broker integration, encrypted by design, and rendered with the patience of a printed page.
                                </p>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link href={primaryHref}>
                                        <button className="ed-btn ed-btn-primary h-12 px-6 text-[13px]">
                                            {primaryLabel}
                                            <ArrowRight size={14} />
                                        </button>
                                    </Link>
                                    <a href="#features">
                                        <button className="ed-btn ed-btn-ghost h-12 px-6 text-[13px]">
                                            Read the Edition
                                        </button>
                                    </a>
                                </div>

                                {/* Trust strip */}
                                <div className="mt-10 pt-6 border-t border-hairline grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl">
                                    <div>
                                        <p className="eyebrow mb-1">Subscribers</p>
                                        <p className="display-num text-[24px] text-foreground">10,000<span className="text-muted-foreground">+</span></p>
                                    </div>
                                    <div>
                                        <p className="eyebrow mb-1">Vendors</p>
                                        <p className="display-num text-[24px] text-foreground">{BROKERS.length}</p>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <p className="eyebrow mb-1">Security</p>
                                        <p className="font-serif italic text-[18px] text-foreground">Mandatory 2FA</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right column — mock dashboard card */}
                            <aside className="lg:col-span-5 hidden lg:block">
                                <div className="border border-hairline bg-card p-5 sticky top-32">
                                    <div className="flex items-baseline justify-between mb-4">
                                        <span className="eyebrow">Today&apos;s Print · §002</span>
                                        <span className="display-num text-[10px] text-muted-foreground">FOLIO A1</span>
                                    </div>
                                    <p className="font-serif italic text-[14px] text-muted-foreground mb-1">Total Net Worth</p>
                                    <p className="font-serif text-[56px] leading-none tracking-tight text-foreground tabular-nums">
                                        ₹14,82,300
                                    </p>
                                    <div className="mt-2 flex items-baseline gap-3">
                                        <span className="font-mono text-[13px] text-[hsl(var(--gain))]">+₹38,420</span>
                                        <span className="ed-pill ed-pill-gain text-[10px]">+2.66%</span>
                                        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">today</span>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-hairline">
                                        <p className="eyebrow mb-3">Holdings · top 3</p>
                                        <ul className="space-y-2.5">
                                            {[
                                                { sym: 'RELIANCE', q: 50, val: '₹1,42,500', pct: '+1.2%', gain: true },
                                                { sym: 'INFY', q: 120, val: '₹2,28,000', pct: '+3.8%', gain: true },
                                                { sym: 'HDFCBANK', q: 80, val: '₹1,28,000', pct: '−0.4%', gain: false },
                                            ].map((row) => (
                                                <li key={row.sym} className="flex items-center justify-between text-[12px] font-mono">
                                                    <span className="text-foreground">{row.sym}</span>
                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-muted-foreground tabular-nums">{row.val}</span>
                                                        <span className={`tabular-nums ${row.gain ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'}`}>
                                                            {row.pct}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-hairline flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                        <span className="live-dot" />
                                        <span>Live · NSE · BSE</span>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </section>

                {/* BROKERS */}
                <section id="brokers" className="border-b border-hairline bg-muted/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
                        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4 mb-6">
                            <div className="flex items-baseline gap-3">
                                <span className="index-num tnum text-[11px]">[ 002 ]</span>
                                <p className="eyebrow">Connected Vendors · Hexagonal Architecture</p>
                            </div>
                            <p className="font-serif italic text-[14px] text-muted-foreground">
                                Three brokers. One canonical interface.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 border border-hairline divide-y sm:divide-y-0 sm:divide-x divide-hairline bg-card">
                            {BROKERS.map((b, i) => (
                                <div key={b} className="px-6 py-6 flex items-baseline justify-between">
                                    <div>
                                        <p className="display-num text-[10px] text-muted-foreground mb-1">003.{i + 1}</p>
                                        <p className="font-serif text-[24px] text-foreground">{b}</p>
                                    </div>
                                    <span className="ed-pill ed-pill-gain text-[10px]">
                                        <span className="live-dot" />
                                        Live
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FEATURES */}
                <section id="features" className="border-b border-hairline">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 lg:py-24">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-10">
                            <div className="lg:col-span-5">
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="index-num tnum text-[11px]">[ 003 ]</span>
                                    <p className="eyebrow">Why coinTrack</p>
                                </div>
                                <h2 className="font-serif text-[40px] sm:text-[52px] leading-[1.02] tracking-tight">
                                    Built like a quarterly,
                                    <br />
                                    <span className="italic text-muted-foreground">live like a ticker.</span>
                                </h2>
                            </div>
                            <p className="lg:col-span-7 font-serif italic text-[17px] text-muted-foreground leading-snug lg:pt-12">
                                Every screen is composed with the same editorial discipline you would expect from
                                a Sunday financial paper — only it ticks in real time, signs you in with TOTP,
                                and never misplaces a holding.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-hairline">
                            {FEATURES.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <article
                                        key={f.idx}
                                        className="group border-b md:border-b-0 md:border-r last:border-r-0 border-hairline p-7 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-5">
                                            <span className="index-num tnum text-[11px]">[ {f.idx} ]</span>
                                            <Icon size={18} className="text-[hsl(var(--accent))]" strokeWidth={1.5} />
                                        </div>
                                        <p className="eyebrow mb-2">{f.kicker}</p>
                                        <h3 className="font-serif text-[26px] leading-tight text-foreground mb-3">
                                            {f.title}
                                        </h3>
                                        <p className="text-[14px] text-muted-foreground leading-relaxed">
                                            {f.body}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* PRICING */}
                <section id="pricing" className="border-b border-hairline bg-muted/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 lg:py-24">
                        <div className="text-center mb-10">
                            <div className="flex items-baseline gap-3 justify-center mb-4">
                                <span className="index-num tnum text-[11px]">[ 004 ]</span>
                                <p className="eyebrow">Subscription Tiers</p>
                            </div>
                            <h2 className="font-serif text-[40px] sm:text-[52px] leading-[1.02] tracking-tight">
                                Simple subscription,
                                <span className="italic text-muted-foreground"> classic terms.</span>
                            </h2>
                            <p className="mt-3 font-serif italic text-[15px] text-muted-foreground">
                                Start free. Upgrade if and only if it becomes worth it.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-hairline bg-card">
                            {PRICING.map((tier, i) => (
                                <article
                                    key={tier.title}
                                    className={`relative p-7 border-b lg:border-b-0 lg:border-r last:border-r-0 border-hairline flex flex-col ${
                                        tier.recommended ? 'bg-foreground text-background' : ''
                                    }`}
                                >
                                    {tier.recommended && (
                                        <div className="absolute top-0 right-0 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-3 py-1 text-[9px] uppercase tracking-[0.22em] font-semibold">
                                            Recommended
                                        </div>
                                    )}

                                    <div className="flex items-baseline justify-between mb-6">
                                        <span className={`index-num tnum text-[11px] ${tier.recommended ? 'opacity-70' : ''}`}>
                                            [ {tier.index} ]
                                        </span>
                                        <Layers size={16} className={tier.recommended ? 'opacity-50' : 'text-muted-foreground'} strokeWidth={1.5} />
                                    </div>

                                    <p className={`eyebrow mb-2 ${tier.recommended ? 'opacity-70' : ''}`}>{tier.title}</p>
                                    <p className="font-serif text-[56px] leading-none tracking-tight tabular-nums">
                                        {tier.price}
                                    </p>
                                    <p className={`mt-1 text-[12px] font-mono ${tier.recommended ? 'opacity-60' : 'text-muted-foreground'}`}>
                                        {tier.unit}
                                    </p>

                                    <ul className={`mt-6 space-y-3 flex-grow border-t pt-5 ${tier.recommended ? 'border-background/20' : 'border-hairline'}`}>
                                        {tier.features.map((feat) => (
                                            <li key={feat} className="flex items-start gap-2.5 text-[13px]">
                                                <Check
                                                    size={13}
                                                    className={`mt-1 flex-shrink-0 ${tier.recommended ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--gain))]'}`}
                                                />
                                                <span className={tier.recommended ? 'opacity-90' : ''}>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href={tier.title === 'Enterprise' ? '#' : (user ? '/dashboard' : '/register')} className="mt-7">
                                        <button
                                            onClick={tier.title === 'Enterprise' ? () => openModal('contact') : undefined}
                                            className={`ed-btn w-full h-11 ${
                                                tier.recommended
                                                    ? 'bg-background text-foreground border-background hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] hover:border-[hsl(var(--accent))]'
                                                    : 'ed-btn-ghost'
                                            }`}
                                        >
                                            {tier.cta}
                                            <ArrowRight size={13} />
                                        </button>
                                    </Link>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA / About */}
                <section id="about" className="border-b border-hairline">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 lg:py-24">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            <div className="lg:col-span-7">
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="index-num tnum text-[11px]">[ 005 ]</span>
                                    <p className="eyebrow">Editor&apos;s Note</p>
                                </div>
                                <h2 className="font-serif text-[44px] sm:text-[60px] leading-[1] tracking-tight">
                                    Ready to set
                                    <br />
                                    <span className="italic text-muted-foreground">your ledger in type?</span>
                                </h2>
                                <p className="mt-5 font-serif italic text-[17px] text-muted-foreground max-w-xl leading-snug">
                                    Join the readers who&apos;ve traded glossy dashboards for clarity.
                                    Two minutes to sign up — and the rest reads itself.
                                </p>
                                <div className="mt-7 flex flex-wrap gap-3">
                                    <Link href={primaryHref}>
                                        <button className="ed-btn ed-btn-primary h-12 px-6">
                                            {user ? 'Open Dashboard' : 'Create Free Account'}
                                            <ArrowUpRight size={14} />
                                        </button>
                                    </Link>
                                    {!user && (
                                        <Link href="/login">
                                            <button className="ed-btn ed-btn-ghost h-12 px-6">
                                                Sign In Instead
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Right: editorial pull-quote */}
                            <aside className="lg:col-span-5 lg:border-l border-hairline lg:pl-10">
                                <div className="relative">
                                    <span
                                        className="absolute -left-2 -top-4 font-serif italic text-[80px] leading-none text-foreground/15 select-none"
                                        aria-hidden="true"
                                    >
                                        &ldquo;
                                    </span>
                                    <p className="pl-7 font-serif italic text-[22px] leading-snug text-foreground">
                                        In the ledger of our days,
                                        every entry is an act of care.
                                    </p>
                                    <div className="mt-4 pl-7 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                                            <Sparkles size={14} className="text-background" />
                                        </div>
                                        <div>
                                            <p className="eyebrow">The Editor</p>
                                            <p className="font-serif italic text-[13px] text-muted-foreground">coinTrack · Volume 04</p>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-hairline bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-8">
                        <div className="col-span-2 md:col-span-5 space-y-3">
                            <Link href="/" className="flex items-center gap-2.5 group">
                                <span className="relative h-9 w-9 block">
                                    <Image src="/coinTrack.png" alt="coinTrack" fill className="object-contain" />
                                </span>
                                <span className="flex items-baseline gap-0.5">
                                    <span className="font-serif text-[26px] leading-none tracking-tight">coin</span>
                                    <span className="display-serif italic text-[26px] leading-none text-[hsl(var(--accent))]">Track</span>
                                </span>
                            </Link>
                            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-sm">
                                A personal finance quarterly — set in <span className="font-serif italic">Instrument Serif</span> &amp; Geist.
                                Printed in browser since {year - 1}.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground pt-2">
                                <Lock size={11} />
                                <span>End-to-end encrypted · TOTP only</span>
                            </div>
                        </div>

                        <div className="md:col-span-2 md:col-start-7">
                            <p className="eyebrow mb-4">Product</p>
                            <ul className="space-y-2.5 text-[13px]">
                                <li><Link href="/calculators" className="text-muted-foreground hover:text-foreground transition-colors">Calculators</Link></li>
                                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                                <li><a href="#brokers" className="text-muted-foreground hover:text-foreground transition-colors">Brokers</a></li>
                            </ul>
                        </div>

                        <div className="md:col-span-2">
                            <p className="eyebrow mb-4">Company</p>
                            <ul className="space-y-2.5 text-[13px]">
                                <li><a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                                <li><button onClick={() => openModal('contact')} className="text-muted-foreground hover:text-foreground transition-colors text-left">Contact</button></li>
                            </ul>
                        </div>

                        <div className="md:col-span-2">
                            <p className="eyebrow mb-4">Legal</p>
                            <ul className="space-y-2.5 text-[13px]">
                                <li><button onClick={() => openModal('privacy')} className="text-muted-foreground hover:text-foreground transition-colors text-left">Privacy</button></li>
                                <li><button onClick={() => openModal('terms')} className="text-muted-foreground hover:text-foreground transition-colors text-left">Terms</button></li>
                                <li><button onClick={() => openModal('cookies')} className="text-muted-foreground hover:text-foreground transition-colors text-left">Cookies</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 pt-5 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-2">
                        <p className="eyebrow" suppressHydrationWarning>&copy; {year} coinTrack Inc. · All rights reserved</p>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                            <span className="live-dot" />
                            <span>All systems operational</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

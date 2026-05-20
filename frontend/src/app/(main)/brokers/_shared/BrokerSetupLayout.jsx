'use client';

import { cn } from '@/lib/utils';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const BROKER_ACCENT_VAR = {
    ZERODHA:   '--broker-zerodha',
    ANGEL_ONE: '--broker-angel',
    UPSTOX:    '--broker-upstox',
};

function SetupStep({ number, step, total }) {
    return (
        <li className="flex gap-5 pb-6 last:pb-0 border-b border-border last:border-b-0">
            <div className="flex flex-col items-center pt-1 flex-shrink-0">
                <div className="display-num text-[20px] text-[hsl(var(--accent))] leading-none">
                    {String(number).padStart(2, '0')}
                </div>
                <span className="index-num tnum mt-1 text-muted-foreground/60">/ {String(total).padStart(2, '0')}</span>
            </div>
            <div className="flex-1 space-y-2 pt-1">
                <p className="text-[14px] font-medium text-foreground tracking-tight">{step.title}</p>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground font-serif">{step.body}</p>
                {step.code && (
                    <code className="block break-all border border-border bg-muted/60 px-3 py-2 font-mono text-[11px] text-foreground select-all rounded-sm">
                        {step.code}
                    </code>
                )}
                {step.link && (
                    <a
                        href={step.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ed-link text-[11px] inline-flex items-center gap-1.5 mt-1"
                    >
                        {step.link.label}
                        <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>
        </li>
    );
}

export function BrokerSetupLayout({ broker, children, statusBadge }) {
    const accentVar = BROKER_ACCENT_VAR[broker.key] || '--accent';
    const accentColor = `hsl(var(${accentVar}))`;

    return (
        <div className="max-w-6xl space-y-8">
            <Link
                href="/brokers"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-3 w-3" />
                Back to Directory
            </Link>

            {/* Masthead */}
            <header className="relative pb-6 border-b border-hairline">
                <div className="flex items-center gap-3 mb-4">
                    <span className="index-num">FOLIO·§03</span>
                    <span className="h-px w-8 bg-hairline" />
                    <span className="eyebrow">Vendor Setup Affidavit</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="h-16 w-16 flex items-center justify-center rounded-sm text-[18px] font-mono font-bold tracking-wider flex-shrink-0"
                            style={{
                                color: accentColor,
                                background: `hsl(var(${accentVar}) / 0.08)`,
                                border: `1px solid hsl(var(${accentVar}) / 0.4)`,
                            }}
                        >
                            {broker.initials}
                        </div>
                        <div>
                            <p className="eyebrow mb-2">Connect</p>
                            <h1 className="display-serif text-[40px] md:text-[52px] text-foreground leading-none">
                                {broker.displayName}
                            </h1>
                            <p className="text-[13px] text-muted-foreground mt-2 font-serif italic">{broker.tagline}</p>
                        </div>
                    </div>
                    {statusBadge && <div className="md:ml-auto">{statusBadge}</div>}
                </div>
            </header>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_440px]">
                {/* LEFT — instructions like a document */}
                <div className="space-y-6">
                    <div className="flex items-baseline gap-3">
                        <span className="index-num tnum">[ I ]</span>
                        <h2 className="font-serif text-[22px] text-foreground leading-none">Instructions</h2>
                        <span className="eyebrow ml-2">{broker.setupSteps.length} steps</span>
                    </div>

                    <ol className="space-y-6">
                        {broker.setupSteps.map((step, i) => (
                            <SetupStep key={i} number={i + 1} step={step} total={broker.setupSteps.length} />
                        ))}
                    </ol>

                    <div className="ed-card relative px-5 py-4 flex items-start gap-3">
                        <span className="corner-mark corner-tl" />
                        <span className="corner-mark corner-br" />
                        <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--accent))]" strokeWidth={2} />
                        <p className="text-[11.5px] leading-relaxed text-muted-foreground font-serif italic">
                            Your credentials are encrypted with AES-256-GCM. CoinTrack reads portfolio data only — placement, modification, or cancellation of orders is impossible by design.
                        </p>
                    </div>
                </div>

                {/* RIGHT — form panel, sticky */}
                <div className="lg:sticky lg:top-24 h-fit">
                    <div className="flex items-baseline gap-3 mb-4">
                        <span className="index-num tnum">[ II ]</span>
                        <h2 className="font-serif text-[22px] text-foreground leading-none">Credentials</h2>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

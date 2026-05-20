'use client';

import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, X } from 'lucide-react';
import { useState } from 'react';

function Skeleton({ className = '' }) {
    return <div className={cn('animate-pulse bg-muted/60 rounded-sm', className)} />;
}

function SubMetric({ label, value, valueClass, prefix }) {
    return (
        <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-baseline gap-1.5">
                {prefix && <span className="index-num tnum">{prefix}</span>}
                <span className="eyebrow">{label}</span>
            </div>
            <p className={cn('hero-amount text-[18px] md:text-[20px]', valueClass || 'text-foreground')}>
                {value}
            </p>
        </div>
    );
}

export function PortfolioSummary() {
    const { data, isLoading } = usePortfolioSummary();
    const [dismissedStale, setDismissedStale] = useState(false);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-44 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const dayPositive = (data.totalDayGain || 0) >= 0;
    const plPositive = (data.totalUnrealizedPL || 0) >= 0;

    return (
        <div className="space-y-3">
            {/* Stale prices warning */}
            {data.hasStalePrices && !dismissedStale && (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border border-[hsl(var(--chart-4))]/30 bg-[hsl(var(--chart-4))]/10 rounded-sm">
                    <div className="flex items-center gap-2 text-[12px] text-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--chart-4))]" />
                        <span>Some prices may be delayed — live market data unavailable.</span>
                    </div>
                    <button onClick={() => setDismissedStale(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* HERO — newspaper masthead style */}
            <article className="ed-card relative px-6 md:px-10 py-8 md:py-10 overflow-hidden">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />

                {/* eyebrow row */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="index-num tnum">№ 001</span>
                        <span className="h-px w-8 bg-hairline" />
                        <span className="eyebrow-strong">Net Worth — All Accounts</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="live-dot" />
                        <span className="eyebrow">
                            {data.lastAnySync ? `Updated ${formatDateTime(data.lastAnySync)}` : 'Live'}
                        </span>
                    </div>
                </div>

                {/* Hero value */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="flex items-end gap-4 md:gap-6">
                        <p className="hero-amount text-[64px] md:text-[88px] text-foreground leading-none">
                            {formatCurrency(data.totalCurrentValue)}
                        </p>
                        <div className="flex flex-col items-start gap-1 pb-3">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1 text-sm font-semibold tnum font-mono',
                                    plPositive ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]',
                                )}
                            >
                                {plPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {formatPercent(data.totalUnrealizedPLPercent)}
                            </span>
                            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                                All-Time Return
                            </span>
                        </div>
                    </div>

                    {/* Description / kicker */}
                    <div className="md:max-w-[260px] md:text-right border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                        <p className="display-serif italic text-[18px] md:text-[20px] text-foreground leading-tight mb-2">
                            “A ledger reveals what intention conceals.”
                        </p>
                        <p className="eyebrow">From The Daily Ledger</p>
                    </div>
                </div>

                {/* Sub-metrics row */}
                <div className="mt-8 pt-6 border-t border-hairline grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="sm:pr-6">
                        <SubMetric
                            label="Invested"
                            prefix="01"
                            value={formatCurrency(data.totalInvestedValue)}
                            valueClass="text-foreground"
                        />
                    </div>
                    <div className="sm:px-6 pt-4 sm:pt-0">
                        <SubMetric
                            label="Today"
                            prefix="02"
                            value={`${dayPositive ? '+' : ''}${formatCurrency(data.totalDayGain)}`}
                            valueClass={dayPositive ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'}
                        />
                        <p className={cn('mt-1 text-[11px] font-mono tnum', dayPositive ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                            {data.totalDayGain !== 0 && Math.abs(data.totalDayGainPercent) < 0.01
                                ? '< 0.01%'
                                : formatPercent(data.totalDayGainPercent)}
                        </p>
                    </div>
                    <div className="sm:pl-6 pt-4 sm:pt-0">
                        <SubMetric
                            label="Unrealized"
                            prefix="03"
                            value={`${plPositive ? '+' : ''}${formatCurrency(data.totalUnrealizedPL)}`}
                            valueClass={plPositive ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'}
                        />
                        <p className={cn('mt-1 text-[11px] font-mono tnum', plPositive ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                            {formatPercent(data.totalUnrealizedPLPercent)}
                        </p>
                    </div>
                </div>
            </article>
        </div>
    );
}

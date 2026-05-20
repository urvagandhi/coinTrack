'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, ArrowRight, Briefcase } from 'lucide-react';
import Link from 'next/link';

function Skeleton({ className = '' }) {
    return <div className={cn('animate-pulse bg-muted/60 rounded-sm', className)} />;
}

const BROKER_VAR = {
    ZERODHA:   'hsl(var(--broker-zerodha))',
    ANGEL_ONE: 'hsl(var(--broker-angel))',
    UPSTOX:    'hsl(var(--broker-upstox))',
};

const BROKER_NAME = {
    ZERODHA:   'Zerodha',
    ANGEL_ONE: 'Angel',
    UPSTOX:    'Upstox',
};

export function HoldingsTable() {
    const { data: holdingsData, isLoading } = useQuery({
        queryKey: ['holdings'],
        queryFn: portfolioAPI.getHoldings,
        refetchInterval: 60000,
    });

    const holdings = Array.isArray(holdingsData) ? holdingsData : (holdingsData?.data || []);
    const displayHoldings = holdings.slice(0, 10);

    if (isLoading) {
        return (
            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <div className="px-6 py-5 border-b border-hairline flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="p-6 space-y-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
            </section>
        );
    }

    if (!holdings || holdings.length === 0) {
        return (
            <section className="ed-card relative px-8 py-14">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-tr" />
                <span className="corner-mark corner-bl" />
                <span className="corner-mark corner-br" />
                <div className="text-center max-w-sm mx-auto">
                    <Briefcase className="h-6 w-6 text-muted-foreground mx-auto mb-4" strokeWidth={1.25} />
                    <p className="font-serif italic text-[22px] text-foreground mb-1">No holdings on record.</p>
                    <p className="text-[12px] text-muted-foreground">Connect a broker to begin syncing positions.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="ed-card relative">
            <span className="corner-mark corner-tl" />
            <span className="corner-mark corner-tr" />
            <span className="corner-mark corner-bl" />
            <span className="corner-mark corner-br" />

            <header className="px-6 py-5 border-b border-hairline flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                    <span className="index-num tnum">[ §02 ]</span>
                    <h3 className="font-serif text-[20px] text-foreground leading-none">Holdings</h3>
                    <span className="eyebrow ml-2 tnum">{holdings.length} on record</span>
                </div>
                {holdings.length > 10 && (
                    <Link href="/portfolio" className="ed-link text-[12px] flex items-center gap-1.5">
                        View ledger
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                )}
            </header>

            <div className="overflow-x-auto">
                <table className="ed-table">
                    <thead>
                        <tr>
                            <th className="text-left">Stock</th>
                            <th className="text-left">Broker</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Avg</th>
                            <th className="text-right">LTP</th>
                            <th className="text-right">Value</th>
                            <th className="text-right">P&amp;L</th>
                            <th className="text-right pr-6">Day</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayHoldings.map((pos, i) => {
                            const pnl = pos.unrealizedPL ?? pos.unrealizedPnL ?? 0;
                            const pnlPct = pos.unrealizedPLPercent ?? 0;
                            const dayGain = pos.dayGain ?? 0;
                            const dayPct = pos.dayGainPercent ?? 0;
                            const pnlUp = pnl >= 0;
                            const dayUp = dayGain >= 0;

                            return (
                                <tr key={`${pos.symbol}-${pos.broker}`}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span className="index-num tnum w-6">{String(i + 1).padStart(2, '0')}</span>
                                            <span className="font-semibold tracking-tight text-foreground">{pos.symbol}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
                                            <span className="h-1 w-1 rounded-full" style={{ background: BROKER_VAR[pos.broker] || 'currentColor' }} />
                                            {BROKER_NAME[pos.broker] || pos.broker}
                                        </span>
                                    </td>
                                    <td className="text-right font-mono tnum text-foreground">{pos.quantity}</td>
                                    <td className="text-right font-mono tnum text-muted-foreground">{formatCurrency(pos.averageBuyPrice)}</td>
                                    <td className="text-right font-mono tnum text-foreground">
                                        {pos.currentPrice && pos.currentPrice > 0 ? formatCurrency(pos.currentPrice) : '—'}
                                    </td>
                                    <td className="text-right font-mono tnum font-semibold text-foreground">{formatCurrency(pos.currentValue)}</td>
                                    <td className="text-right">
                                        <span className={cn('block font-mono tnum text-[13px] font-semibold', pnlUp ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                                            {pnlUp ? '+' : ''}{formatCurrency(pnl)}
                                        </span>
                                        <span className={cn('block font-mono tnum text-[10px]', pnlUp ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                                            {formatPercent(pnlPct)}
                                        </span>
                                    </td>
                                    <td className="text-right pr-6">
                                        <span className={cn('inline-flex items-center gap-0.5 font-mono tnum text-[11px] font-medium', dayUp ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                                            {dayUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                            {formatPercent(dayPct)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {holdings.length > 10 && (
                <div className="px-6 py-4 border-t border-hairline text-center">
                    <Link href="/portfolio" className="ed-link text-[12px] inline-flex items-center gap-1.5">
                        View all {holdings.length} holdings
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}
        </section>
    );
}

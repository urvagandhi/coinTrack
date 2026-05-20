'use client';

import { usePortfolioPositions } from '@/hooks/usePortfolioPositions';
import { formatCurrency } from '@/lib/format';
import { getShortCompanyName } from '@/lib/stockNameMapping';
import { cn } from '@/lib/utils';
import { BarChart2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const BROKER_DISPLAY = { ZERODHA: 'Zerodha', ANGEL_ONE: 'Angel One', UPSTOX: 'Upstox' };
const BROKER_VAR = {
    ZERODHA:   'hsl(var(--broker-zerodha))',
    ANGEL_ONE: 'hsl(var(--broker-angel))',
    UPSTOX:    'hsl(var(--broker-upstox))',
};

export function PositionsTab() {
    const { data: rawData, isLoading, error, refetch } = usePortfolioPositions();
    const [view, setView] = useState('EQUITY');

    const positions = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);
    const equity = useMemo(() => positions.filter(p => !p.isDerivative && !p.instrumentType?.includes('FUT') && !p.instrumentType?.includes('OPT')), [positions]);
    const deriv  = useMemo(() => positions.filter(p =>  p.isDerivative ||  p.instrumentType?.includes('FUT') ||  p.instrumentType?.includes('OPT')), [positions]);
    const active = view === 'EQUITY' ? equity : deriv;

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={8} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div className="space-y-5">
            {/* Segmented sub-bar */}
            <div className="flex items-center gap-1 border-b border-border pb-3">
                <span className="eyebrow mr-3">View</span>
                {['EQUITY', 'DERIVATIVES'].map(v => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={cn(
                            'relative h-7 px-3 text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors',
                            view === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {view === v && (
                            <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-[hsl(var(--accent))]" />
                        )}
                        {v === 'EQUITY' ? `Equity · ${equity.length}` : `Derivatives · ${deriv.length}`}
                    </button>
                ))}
            </div>

            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                {active.length === 0 ? (
                    <div className="py-14 text-center">
                        <BarChart2 className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                        <p className="font-serif italic text-[20px] text-foreground">No {view.toLowerCase()} positions.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="ed-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Symbol</th>
                                    <th className="text-left">Broker</th>
                                    {view === 'DERIVATIVES' && <>
                                        <th className="text-left">Type</th>
                                        <th className="text-right">Strike</th>
                                        <th className="text-left">Expiry</th>
                                    </>}
                                    <th className="text-right">Qty</th>
                                    <th className="text-right">Avg</th>
                                    <th className="text-right">LTP</th>
                                    <th className="text-right">P&amp;L</th>
                                    <th className="text-right pr-6">Day</th>
                                </tr>
                            </thead>
                            <tbody>
                                {active.map((p, i) => {
                                    const broker = p.broker || p.brokerType;
                                    const pnl = p.unrealizedPL ?? p.unrealizedPnL ?? p.pnl ?? 0;
                                    const dayPnl = p.dayGain ?? p.dayChange ?? p.m2m ?? 0;
                                    const pnlPos = pnl >= 0;
                                    const dayPos = dayPnl >= 0;
                                    const stockName = getShortCompanyName(p.tradingsymbol || p.symbol);
                                    const isExpiringSoon = p.expiry && (new Date(p.expiry) - new Date()) < 2 * 86400000;
                                    const isExpiringWeek = p.expiry && (new Date(p.expiry) - new Date()) < 7 * 86400000;
                                    const positionType = p.positionType || (p.quantity > 0 ? 'LONG' : 'SHORT');
                                    const isLong = positionType === 'LONG' || p.quantity > 0;

                                    return (
                                        <tr key={`${p.symbol || p.tradingsymbol}-${broker}-${i}`}>
                                            <td>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="index-num tnum w-6">{String(i + 1).padStart(2, '0')}</span>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground tracking-tight">{stockName || p.tradingsymbol || p.symbol}</span>
                                                        <span className={cn(
                                                            'text-[9px] font-semibold uppercase tracking-[0.16em] mt-0.5',
                                                            isLong ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'
                                                        )}>
                                                            · {positionType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] font-medium text-muted-foreground">
                                                    <span className="h-1 w-1 rounded-full" style={{ background: BROKER_VAR[broker] || 'currentColor' }} />
                                                    {BROKER_DISPLAY[broker] || broker}
                                                </span>
                                            </td>
                                            {view === 'DERIVATIVES' && <>
                                                <td>
                                                    <span className={cn(
                                                        'text-[10px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-sm border',
                                                        p.instrumentType?.includes('FUT') ? 'bg-[hsl(var(--neutral))]/10 text-[hsl(var(--neutral))] border-[hsl(var(--neutral))]/30'
                                                            : p.optionType === 'CE' ? 'bg-[hsl(var(--gain))]/10 text-[hsl(var(--gain))] border-[hsl(var(--gain))]/30'
                                                                : 'bg-[hsl(var(--loss))]/10 text-[hsl(var(--loss))] border-[hsl(var(--loss))]/30'
                                                    )}>
                                                        {p.instrumentType?.includes('FUT') ? 'FUT' : p.optionType || 'OPT'}
                                                    </span>
                                                </td>
                                                <td className="text-right font-mono tnum">{p.strikePrice || '—'}</td>
                                                <td className="text-[12px]">
                                                    {p.expiry ? (
                                                        <span className={cn('font-mono tnum',
                                                            isExpiringSoon ? 'text-[hsl(var(--loss))] font-medium'
                                                                : isExpiringWeek ? 'text-[hsl(var(--chart-4))]'
                                                                    : 'text-muted-foreground')}>
                                                            {new Date(p.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                            </>}
                                            <td className="text-right font-mono tnum">{Math.abs(p.quantity ?? p.netQuantity ?? 0)}</td>
                                            <td className="text-right font-mono tnum text-muted-foreground">{formatCurrency(p.averagePrice ?? p.buyAverage)}</td>
                                            <td className="text-right font-mono tnum text-foreground">{formatCurrency(p.lastPrice ?? p.currentPrice)}</td>
                                            <td className="text-right">
                                                <span className={cn('font-mono tnum text-[13px] font-medium', pnlPos ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                                                    {formatCurrency(pnl, { showSign: true })}
                                                </span>
                                            </td>
                                            <td className="text-right pr-6">
                                                <span className={cn('font-mono tnum text-[12px] font-medium', dayPos ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                                                    {formatCurrency(dayPnl, { showSign: true })}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

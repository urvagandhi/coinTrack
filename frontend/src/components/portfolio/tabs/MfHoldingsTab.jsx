'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { PiggyBank } from 'lucide-react';
import { useMemo } from 'react';
import { BrokerInfoBanner } from './BrokerInfoBanner';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfHoldingsTab() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'mf-holdings'],
        queryFn: portfolioAPI.getMfHoldings,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const holdings = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div>
            <BrokerInfoBanner message="Mutual fund holdings — synced from Zerodha Coin." />
            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                {holdings.length === 0 ? (
                    <div className="py-14 text-center">
                        <PiggyBank className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                        <p className="font-serif italic text-[20px] text-foreground">No mutual fund holdings.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="ed-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Fund</th>
                                    <th className="text-right">Units</th>
                                    <th className="text-right">Avg NAV</th>
                                    <th className="text-right">NAV</th>
                                    <th className="text-right">Invested</th>
                                    <th className="text-right">Current</th>
                                    <th className="text-right pr-6">P&amp;L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h, i) => {
                                    const pnl = (h.pnl ?? ((h.lastPrice ?? 0) - (h.averagePrice ?? 0)) * (h.quantity ?? 0));
                                    const invested = (h.averagePrice ?? 0) * (h.quantity ?? 0);
                                    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                                    const pnlPos = pnl >= 0;

                                    return (
                                        <tr key={h.tradingsymbol || h.folio || i}>
                                            <td>
                                                <div className="flex items-baseline gap-3 max-w-md">
                                                    <span className="index-num tnum w-6">{String(i + 1).padStart(2, '0')}</span>
                                                    <div>
                                                        <p className="text-[13px] font-medium text-foreground line-clamp-2 tracking-tight">{h.fund || h.tradingsymbol}</p>
                                                        {h.folio && (
                                                            <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">FOLIO · {h.folio}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-right font-mono tnum">{h.quantity?.toFixed(3) ?? '—'}</td>
                                            <td className="text-right font-mono tnum text-muted-foreground">{formatCurrency(h.averagePrice, { precise: true })}</td>
                                            <td className="text-right font-mono tnum text-foreground">{formatCurrency(h.lastPrice, { precise: true })}</td>
                                            <td className="text-right font-mono tnum text-muted-foreground">{formatCurrency(invested)}</td>
                                            <td className="text-right font-mono tnum font-semibold text-foreground">{formatCurrency((h.lastPrice ?? 0) * (h.quantity ?? 0))}</td>
                                            <td className="text-right pr-6">
                                                <div className="flex flex-col items-end">
                                                    <span className={cn('font-mono tnum text-[13px] font-medium', pnlPos ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                                                        {formatCurrency(pnl, { showSign: true })}
                                                    </span>
                                                    <span className={cn('font-mono tnum text-[10px]', pnlPos ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]')}>
                                                        {formatPercent(pnlPct, { showSign: true })}
                                                    </span>
                                                </div>
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

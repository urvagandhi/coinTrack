'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight } from 'lucide-react';
import { useMemo } from 'react';
import { BrokerInfoBanner } from './BrokerInfoBanner';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function TradesTab() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'trades'],
        queryFn: portfolioAPI.getTrades,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const trades = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={6} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div>
            <BrokerInfoBanner message="Trade execution log — settled fills from all broker accounts." />
            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                {trades.length === 0 ? (
                    <div className="py-14 text-center">
                        <ArrowLeftRight className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                        <p className="font-serif italic text-[20px] text-foreground">No trades on record.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="ed-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Timestamp</th>
                                    <th className="text-left">Symbol</th>
                                    <th className="text-left">Type</th>
                                    <th className="text-right">Qty</th>
                                    <th className="text-right">Price</th>
                                    <th className="text-right pr-6">Order ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((t, i) => {
                                    const isBuy = (t.transactionType || t.transaction_type || '').toUpperCase() === 'BUY';
                                    const dateStr = t.fillTimestamp || t.fill_timestamp || t.orderTimestamp || t.tradeDate;
                                    return (
                                        <tr key={t.tradeId || t.trade_id || i}>
                                            <td className="font-mono tnum text-[12px] text-muted-foreground">
                                                {dateStr ? new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                                            </td>
                                            <td className="font-medium text-foreground tracking-tight">{t.tradingsymbol || t.symbol}</td>
                                            <td>
                                                <span className={cn(
                                                    'inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.1em]',
                                                    isBuy ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'
                                                )}>
                                                    <span className="font-mono">{isBuy ? '↗' : '↘'}</span>
                                                    {isBuy ? 'BUY' : 'SELL'}
                                                </span>
                                            </td>
                                            <td className="text-right font-mono tnum">{t.quantity ?? t.filledQuantity}</td>
                                            <td className="text-right font-mono tnum">{formatCurrency(t.averagePrice ?? t.price)}</td>
                                            <td className="text-right pr-6 font-mono text-[10px] text-muted-foreground/70">{t.orderId || t.order_id}</td>
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

'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { useMemo } from 'react';
import { BrokerInfoBanner } from './BrokerInfoBanner';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const STATUS_STYLE = {
    COMPLETE:  'text-[hsl(var(--gain))] border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/8',
    REJECTED:  'text-[hsl(var(--loss))] border-[hsl(var(--loss))]/30 bg-[hsl(var(--loss))]/8',
    CANCELLED: 'text-muted-foreground border-border bg-muted',
};

export function MfOrdersTab() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'mf-orders'],
        queryFn: portfolioAPI.getMfOrders,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const orders = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div>
            <BrokerInfoBanner message="Mutual fund order log — from Zerodha Coin." />
            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                {orders.length === 0 ? (
                    <div className="py-14 text-center">
                        <ClipboardList className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                        <p className="font-serif italic text-[20px] text-foreground">No MF orders on record.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="ed-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Date</th>
                                    <th className="text-left">Fund</th>
                                    <th className="text-left">Type</th>
                                    <th className="text-right">Amount</th>
                                    <th className="text-right">Units</th>
                                    <th className="text-right">NAV</th>
                                    <th className="text-center pr-6">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, i) => {
                                    const status = (o.status || '').toUpperCase();
                                    const isBuy = (o.transactionType || o.transaction_type || '').toUpperCase() === 'BUY';
                                    const dateStr = o.orderTimestamp || o.order_timestamp || o.placedAt;

                                    return (
                                        <tr key={o.orderId || o.order_id || i}>
                                            <td className="font-mono tnum text-[12px] text-muted-foreground">
                                                {dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="font-medium text-foreground tracking-tight max-w-xs truncate">{o.fund || o.tradingsymbol}</td>
                                            <td>
                                                <span className={cn('text-[11px] font-bold tracking-[0.1em]',
                                                    isBuy ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'
                                                )}>
                                                    {o.transactionType || o.transaction_type || '—'}
                                                </span>
                                            </td>
                                            <td className="text-right font-mono tnum">{formatCurrency(o.amount)}</td>
                                            <td className="text-right font-mono tnum text-muted-foreground">{o.quantity?.toFixed(3) ?? '—'}</td>
                                            <td className="text-right font-mono tnum text-muted-foreground">{o.price ? formatCurrency(o.price, { precise: true }) : '—'}</td>
                                            <td className="text-center pr-6">
                                                <span className={cn('inline-block text-[9px] tracking-[0.1em] uppercase font-semibold px-1.5 py-0.5 rounded-sm border',
                                                    STATUS_STYLE[status] || 'text-muted-foreground border-border bg-muted'
                                                )}>
                                                    {status || 'UNKNOWN'}
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

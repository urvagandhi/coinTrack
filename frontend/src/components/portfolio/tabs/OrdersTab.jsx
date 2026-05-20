'use client';

import { usePortfolioOrders } from '@/hooks/usePortfolioOrders';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';
import { useMemo } from 'react';
import { BrokerInfoBanner } from './BrokerInfoBanner';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const STATUS_STYLE = {
    COMPLETE:        'text-[hsl(var(--gain))] border-[hsl(var(--gain))]/30 bg-[hsl(var(--gain))]/8',
    REJECTED:        'text-[hsl(var(--loss))] border-[hsl(var(--loss))]/30 bg-[hsl(var(--loss))]/8',
    CANCELLED:       'text-muted-foreground border-border bg-muted',
    OPEN:            'text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30 bg-[hsl(var(--chart-4))]/10',
    TRIGGER_PENDING: 'text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30 bg-[hsl(var(--chart-4))]/10',
};

export function OrdersTab() {
    const { data: rawData, isLoading, error, refetch } = usePortfolioOrders();
    const orders = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div>
            <BrokerInfoBanner message="Order journal — chronological record from all connected brokers." />

            <section className="ed-card relative">
                <span className="corner-mark corner-tl" />
                <span className="corner-mark corner-br" />
                {orders.length === 0 ? (
                    <div className="py-14 text-center">
                        <ClipboardList className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
                        <p className="font-serif italic text-[20px] text-foreground">No orders on record.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="ed-table">
                            <thead>
                                <tr>
                                    <th className="text-left">Timestamp</th>
                                    <th className="text-left">Symbol</th>
                                    <th className="text-left">Type</th>
                                    <th className="text-left">Product</th>
                                    <th className="text-right">Qty</th>
                                    <th className="text-right">Price</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-right pr-6">Order ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, i) => {
                                    const isBuy = (o.transactionType || o.transaction_type || '').toUpperCase() === 'BUY';
                                    const status = (o.status || o.orderStatus || '').toUpperCase();
                                    const dateStr = o.orderTimestamp || o.order_timestamp || o.placedAt;

                                    return (
                                        <tr key={o.orderId || o.order_id || i}>
                                            <td className="font-mono tnum text-[12px] text-muted-foreground">
                                                {dateStr ? new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
                                            </td>
                                            <td className="font-medium text-foreground tracking-tight">{o.tradingsymbol || o.symbol}</td>
                                            <td>
                                                <span className={cn(
                                                    'inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.1em]',
                                                    isBuy ? 'text-[hsl(var(--gain))]' : 'text-[hsl(var(--loss))]'
                                                )}>
                                                    <span className="font-mono">{isBuy ? '↗' : '↘'}</span>
                                                    {isBuy ? 'BUY' : 'SELL'}
                                                </span>
                                            </td>
                                            <td className="text-[12px] text-muted-foreground">{o.product || o.orderType || '—'}</td>
                                            <td className="text-right font-mono tnum">{o.quantity ?? o.filledQuantity ?? '—'}</td>
                                            <td className="text-right font-mono tnum">{formatCurrency(o.price ?? o.averagePrice)}</td>
                                            <td className="text-center">
                                                <span className={cn(
                                                    'inline-block text-[9px] tracking-[0.1em] uppercase font-semibold px-1.5 py-0.5 rounded-sm border',
                                                    STATUS_STYLE[status] || 'text-muted-foreground border-border bg-muted'
                                                )}>
                                                    {status || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="text-right pr-6 font-mono text-[10px] text-muted-foreground/70">{o.orderId || o.order_id}</td>
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

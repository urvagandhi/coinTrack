// src/components/portfolio/tabs/OrdersTab.jsx
'use client';

import { usePortfolioOrders } from '@/hooks/usePortfolioOrders';
import { formatCurrency } from '@/lib/format';
import { containerVariants, tableRowVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { useMemo } from 'react';
import { BrokerInfoBanner } from './BrokerInfoBanner';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const TH = 'px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wide';

const STATUS_BADGE = {
    COMPLETE: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-accent text-muted-foreground',
    OPEN: 'bg-amber-50 text-amber-700',
    TRIGGER_PENDING: 'bg-amber-50 text-amber-700',
};

export function OrdersTab() {
    const { data: rawData, isLoading, error, refetch } = usePortfolioOrders();
    const container = useMotionVariants(containerVariants);

    const orders = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div className="space-y-0">
            <BrokerInfoBanner message="Order history from your connected broker accounts" />

            <motion.div variants={container} initial="hidden" animate="visible" className="bg-card border border-border rounded-xl overflow-hidden">
                {orders.length === 0 ? (
                    <div className="py-12 text-center">
                        <ClipboardList size={32} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className={cn(TH, 'text-left')}>Date/Time</th>
                                    <th className={cn(TH, 'text-left')}>Symbol</th>
                                    <th className={cn(TH, 'text-left')}>Type</th>
                                    <th className={cn(TH, 'text-left')}>Product</th>
                                    <th className={cn(TH, 'text-right')}>Qty</th>
                                    <th className={cn(TH, 'text-right')}>Price</th>
                                    <th className={cn(TH, 'text-center')}>Status</th>
                                    <th className={cn(TH, 'text-right')}>Order ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, i) => {
                                    const rowV = useMotionVariants(tableRowVariants);
                                    const isBuy = (o.transactionType || o.transaction_type || '').toUpperCase() === 'BUY';
                                    const status = (o.status || o.orderStatus || '').toUpperCase();
                                    const dateStr = o.orderTimestamp || o.order_timestamp || o.placedAt;

                                    return (
                                        <motion.tr key={o.orderId || o.order_id || i} custom={i} variants={rowV} initial="hidden" animate="visible"
                                            className="border-b border-border last:border-b-0 hover:bg-accent transition-colors">
                                            <td className="px-4 py-3.5 text-sm text-muted-foreground">
                                                {dateStr ? new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '\u2014'}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm font-medium text-foreground">{o.tradingsymbol || o.symbol}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={cn('text-sm font-medium', isBuy ? 'text-green-600' : 'text-red-600')}>
                                                    {isBuy ? 'BUY' : 'SELL'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-muted-foreground">{o.product || o.orderType || '\u2014'}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground">{o.quantity ?? o.filledQuantity ?? '\u2014'}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground">{formatCurrency(o.price ?? o.averagePrice)}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_BADGE[status] || 'bg-accent text-muted-foreground')}>
                                                    {status || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">{o.orderId || o.order_id}</td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

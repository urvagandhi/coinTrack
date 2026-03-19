// src/components/portfolio/tabs/MfOrdersTab.jsx
'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { containerVariants, tableRowVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
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
};

export function MfOrdersTab() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'mf-orders'],
        queryFn: portfolioAPI.getMfOrders,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const container = useMotionVariants(containerVariants);
    const orders = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div className="space-y-0">
            <BrokerInfoBanner message="Mutual fund order history from Zerodha (Coin)" />
            <motion.div variants={container} initial="hidden" animate="visible" className="bg-card border border-border rounded-xl overflow-hidden">
                {orders.length === 0 ? (
                    <div className="py-12 text-center">
                        <ClipboardList size={32} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No MF orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className={cn(TH, 'text-left')}>Date</th>
                                    <th className={cn(TH, 'text-left')}>Fund</th>
                                    <th className={cn(TH, 'text-left')}>Type</th>
                                    <th className={cn(TH, 'text-right')}>Amount</th>
                                    <th className={cn(TH, 'text-right')}>Units</th>
                                    <th className={cn(TH, 'text-right')}>NAV</th>
                                    <th className={cn(TH, 'text-center')}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o, i) => {
                                    const rowV = useMotionVariants(tableRowVariants);
                                    const status = (o.status || '').toUpperCase();
                                    const isBuy = (o.transactionType || o.transaction_type || '').toUpperCase() === 'BUY';
                                    const dateStr = o.orderTimestamp || o.order_timestamp || o.placedAt;

                                    return (
                                        <motion.tr key={o.orderId || o.order_id || i} custom={i} variants={rowV} initial="hidden" animate="visible"
                                            className="border-b border-border last:border-b-0 hover:bg-accent transition-colors">
                                            <td className="px-4 py-3.5 text-sm text-muted-foreground">
                                                {dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014'}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm font-medium text-foreground max-w-xs truncate">{o.fund || o.tradingsymbol}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={cn('text-sm font-medium', isBuy ? 'text-green-600' : 'text-red-600')}>
                                                    {o.transactionType || o.transaction_type || '\u2014'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground">{formatCurrency(o.amount)}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">{o.quantity?.toFixed(3) ?? '\u2014'}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">{o.price ? formatCurrency(o.price, { precise: true }) : '\u2014'}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_BADGE[status] || 'bg-accent text-muted-foreground')}>
                                                    {status || 'UNKNOWN'}
                                                </span>
                                            </td>
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

// src/components/portfolio/tabs/TradesTab.jsx
'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { containerVariants, tableRowVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import { useMemo } from 'react';
import { BrokerInfoBanner } from './BrokerInfoBanner';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const TH = 'px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wide';

export function TradesTab() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'trades'],
        queryFn: portfolioAPI.getTrades,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const container = useMotionVariants(containerVariants);
    const trades = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={6} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div className="space-y-0">
            <BrokerInfoBanner message="Trade execution history from your connected broker accounts" />
            <motion.div variants={container} initial="hidden" animate="visible" className="bg-card border border-border rounded-xl overflow-hidden">
                {trades.length === 0 ? (
                    <div className="py-12 text-center">
                        <ArrowLeftRight size={32} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No trades found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className={cn(TH, 'text-left')}>Date/Time</th>
                                    <th className={cn(TH, 'text-left')}>Symbol</th>
                                    <th className={cn(TH, 'text-left')}>Type</th>
                                    <th className={cn(TH, 'text-right')}>Qty</th>
                                    <th className={cn(TH, 'text-right')}>Price</th>
                                    <th className={cn(TH, 'text-right')}>Order ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((t, i) => {
                                    const rowV = useMotionVariants(tableRowVariants);
                                    const isBuy = (t.transactionType || t.transaction_type || '').toUpperCase() === 'BUY';
                                    const dateStr = t.fillTimestamp || t.fill_timestamp || t.orderTimestamp || t.tradeDate;
                                    return (
                                        <motion.tr key={t.tradeId || t.trade_id || i} custom={i} variants={rowV} initial="hidden" animate="visible"
                                            className="border-b border-border last:border-b-0 hover:bg-accent transition-colors">
                                            <td className="px-4 py-3.5 text-sm text-muted-foreground">
                                                {dateStr ? new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '\u2014'}
                                            </td>
                                            <td className="px-4 py-3.5 text-sm font-medium text-foreground">{t.tradingsymbol || t.symbol}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={cn('text-sm font-medium', isBuy ? 'text-green-600' : 'text-red-600')}>
                                                    {isBuy ? 'BUY' : 'SELL'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground">{t.quantity ?? t.filledQuantity}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground">{formatCurrency(t.averagePrice ?? t.price)}</td>
                                            <td className="px-4 py-3.5 text-right text-xs font-mono text-muted-foreground">{t.orderId || t.order_id}</td>
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

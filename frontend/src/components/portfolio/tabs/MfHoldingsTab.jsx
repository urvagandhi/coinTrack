// src/components/portfolio/tabs/MfHoldingsTab.jsx
'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { containerVariants, tableRowVariants, useMotionVariants } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PiggyBank } from 'lucide-react';
import { useMemo } from 'react';
import { BrokerInfoBanner } from './BrokerInfoBanner';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const TH = 'px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wide';

export function MfHoldingsTab() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['portfolio', 'mf-holdings'],
        queryFn: portfolioAPI.getMfHoldings,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const container = useMotionVariants(containerVariants);
    const holdings = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div className="space-y-0">
            <BrokerInfoBanner message="Mutual fund data from Zerodha (Coin)" />
            <motion.div variants={container} initial="hidden" animate="visible" className="bg-card border border-border rounded-xl overflow-hidden">
                {holdings.length === 0 ? (
                    <div className="py-12 text-center">
                        <PiggyBank size={32} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No mutual fund holdings</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className={cn(TH, 'text-left')}>Fund</th>
                                    <th className={cn(TH, 'text-right')}>Units</th>
                                    <th className={cn(TH, 'text-right')}>Avg NAV</th>
                                    <th className={cn(TH, 'text-right')}>Current NAV</th>
                                    <th className={cn(TH, 'text-right')}>Invested</th>
                                    <th className={cn(TH, 'text-right')}>Current</th>
                                    <th className={cn(TH, 'text-right')}>P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h, i) => {
                                    const rowV = useMotionVariants(tableRowVariants);
                                    const pnl = (h.pnl ?? ((h.lastPrice ?? 0) - (h.averagePrice ?? 0)) * (h.quantity ?? 0));
                                    const invested = (h.averagePrice ?? 0) * (h.quantity ?? 0);
                                    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                                    const pnlPos = pnl >= 0;

                                    return (
                                        <motion.tr key={h.tradingsymbol || h.folio || i} custom={i} variants={rowV} initial="hidden" animate="visible"
                                            className="border-b border-border last:border-b-0 hover:bg-accent transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="max-w-xs">
                                                    <span className="text-sm font-medium text-foreground line-clamp-2">{h.fund || h.tradingsymbol}</span>
                                                    {h.folio && <span className="text-[10px] text-muted-foreground mt-0.5 block">Folio: {h.folio}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground">{h.quantity?.toFixed(3) ?? '\u2014'}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">{formatCurrency(h.averagePrice, { precise: true })}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground font-medium">{formatCurrency(h.lastPrice, { precise: true })}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">{formatCurrency(invested)}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground font-semibold">{formatCurrency((h.lastPrice ?? 0) * (h.quantity ?? 0))}</td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={cn('text-sm font-medium', pnlPos ? 'text-green-600' : 'text-red-600')}>
                                                        {formatCurrency(pnl, { showSign: true })}
                                                    </span>
                                                    <span className={cn('text-xs', pnlPos ? 'text-green-600' : 'text-red-600')}>
                                                        {formatPercent(pnlPct, { showSign: true })}
                                                    </span>
                                                </div>
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

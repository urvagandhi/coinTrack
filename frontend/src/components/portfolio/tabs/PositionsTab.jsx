// src/components/portfolio/tabs/PositionsTab.jsx
'use client';

import { usePortfolioPositions } from '@/hooks/usePortfolioPositions';
import { formatCurrency, formatPercent } from '@/lib/format';
import { containerVariants, tableRowVariants, useMotionVariants } from '@/lib/motion';
import { getShortCompanyName } from '@/lib/stockNameMapping';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

const BROKER_DISPLAY = { ZERODHA: 'Zerodha', ANGEL_ONE: 'Angel One', UPSTOX: 'Upstox' };
const BROKER_BADGE = {
    ZERODHA: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ANGEL_ONE: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    UPSTOX: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};
const TH = 'px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wide';

export function PositionsTab() {
    const { data: rawData, isLoading, error, refetch } = usePortfolioPositions();
    const container = useMotionVariants(containerVariants);
    const [view, setView] = useState('EQUITY');

    const positions = useMemo(() => Array.isArray(rawData) ? rawData : (rawData?.data || []), [rawData]);
    const equityPositions = useMemo(() => positions.filter(p => !p.isDerivative && !p.instrumentType?.includes('FUT') && !p.instrumentType?.includes('OPT')), [positions]);
    const derivPositions = useMemo(() => positions.filter(p => p.isDerivative || p.instrumentType?.includes('FUT') || p.instrumentType?.includes('OPT')), [positions]);
    const activePositions = view === 'EQUITY' ? equityPositions : derivPositions;

    if (isLoading) return <TabLoadingSkeleton rows={6} columns={8} />;
    if (error) return <TabError error={error} onRetry={refetch} />;

    return (
        <div className="space-y-4">
            {/* Sub-tab bar */}
            <div className="flex gap-1 p-1 bg-accent rounded-lg w-fit">
                {['EQUITY', 'DERIVATIVES'].map(v => (
                    <button key={v} onClick={() => setView(v)} className={cn(
                        'px-3 h-7 text-xs font-medium rounded-md transition-colors',
                        view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}>
                        {v === 'EQUITY' ? `Equity (${equityPositions.length})` : `Derivatives (${derivPositions.length})`}
                    </button>
                ))}
            </div>

            <motion.div variants={container} initial="hidden" animate="visible" className="bg-card border border-border rounded-xl overflow-hidden">
                {activePositions.length === 0 ? (
                    <div className="py-12 text-center">
                        <BarChart2 size={32} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No {view.toLowerCase()} positions</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className={cn(TH, 'text-left')}>Symbol</th>
                                    <th className={cn(TH, 'text-left')}>Broker</th>
                                    {view === 'DERIVATIVES' && <>
                                        <th className={cn(TH, 'text-left')}>Type</th>
                                        <th className={cn(TH, 'text-right')}>Strike</th>
                                        <th className={cn(TH, 'text-left')}>Expiry</th>
                                    </>}
                                    <th className={cn(TH, 'text-right')}>Qty</th>
                                    <th className={cn(TH, 'text-right')}>Avg Price</th>
                                    <th className={cn(TH, 'text-right')}>LTP</th>
                                    <th className={cn(TH, 'text-right')}>P&L</th>
                                    <th className={cn(TH, 'text-right')}>Day</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activePositions.map((p, i) => {
                                    const broker = p.broker || p.brokerType;
                                    const pnl = p.unrealizedPL ?? p.unrealizedPnL ?? p.pnl ?? 0;
                                    const dayPnl = p.dayGain ?? p.dayChange ?? p.m2m ?? 0;
                                    const pnlPos = pnl >= 0;
                                    const dayPos = dayPnl >= 0;
                                    const stockName = getShortCompanyName(p.tradingsymbol || p.symbol);
                                    const isExpiringSoon = p.expiry && (new Date(p.expiry) - new Date()) < 2 * 86400000;
                                    const isExpiringWeek = p.expiry && (new Date(p.expiry) - new Date()) < 7 * 86400000;
                                    const rowV = useMotionVariants(tableRowVariants);

                                    return (
                                        <motion.tr key={`${p.symbol || p.tradingsymbol}-${broker}-${i}`} custom={i} variants={rowV} initial="hidden" animate="visible"
                                            className="border-b border-border last:border-b-0 hover:bg-accent transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-foreground">{stockName || p.tradingsymbol || p.symbol}</span>
                                                    {p.positionType && (
                                                        <span className={cn('text-[10px] font-semibold mt-0.5 w-fit px-1 rounded',
                                                            p.positionType === 'LONG' || p.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                        )}>
                                                            {p.positionType || (p.quantity > 0 ? 'LONG' : 'SHORT')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', BROKER_BADGE[broker] || 'bg-accent text-muted-foreground')}>
                                                    {BROKER_DISPLAY[broker] || broker}
                                                </span>
                                            </td>
                                            {view === 'DERIVATIVES' && <>
                                                <td className="px-4 py-3.5">
                                                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase',
                                                        p.instrumentType?.includes('FUT') ? 'bg-blue-50 text-blue-600'
                                                            : p.optionType === 'CE' ? 'bg-green-50 text-green-700'
                                                                : 'bg-red-50 text-red-700'
                                                    )}>
                                                        {p.instrumentType?.includes('FUT') ? 'FUT' : p.optionType || 'OPT'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-sm text-foreground">{p.strikePrice || '\u2014'}</td>
                                                <td className="px-4 py-3.5 text-sm">
                                                    {p.expiry ? (
                                                        <span className={cn(isExpiringSoon ? 'text-red-700 font-medium' : isExpiringWeek ? 'text-amber-700' : 'text-muted-foreground')}>
                                                            {new Date(p.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                        </span>
                                                    ) : '\u2014'}
                                                </td>
                                            </>}
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground">{Math.abs(p.quantity ?? p.netQuantity ?? 0)}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-muted-foreground">{formatCurrency(p.averagePrice ?? p.buyAverage)}</td>
                                            <td className="px-4 py-3.5 text-right text-sm text-foreground font-medium">{formatCurrency(p.lastPrice ?? p.currentPrice)}</td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className={cn('text-sm font-medium', pnlPos ? 'text-green-600' : 'text-red-600')}>
                                                    {formatCurrency(pnl, { showSign: true })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className={cn('text-xs font-medium', dayPos ? 'text-green-600' : 'text-red-600')}>
                                                    {formatCurrency(dayPnl, { showSign: true })}
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

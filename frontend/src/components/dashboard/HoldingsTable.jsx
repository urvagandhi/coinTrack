// src/components/dashboard/HoldingsTable.jsx
'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Briefcase } from 'lucide-react';
import Link from 'next/link';

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

export function HoldingsTable() {
    const { data: holdingsData, isLoading } = useQuery({
        queryKey: ['holdings'],
        queryFn: portfolioAPI.getHoldings,
        refetchInterval: 60000,
    });

    const holdings = Array.isArray(holdingsData) ? holdingsData : (holdingsData?.data || []);
    const displayHoldings = holdings.slice(0, 10);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
                </div>
            </div>
        );
    }

    if (!holdings || holdings.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-10 text-center">
                <Briefcase size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No holdings found. Connect a broker to start syncing.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-foreground">Holdings</h3>
                {holdings.length > 10 && (
                    <Link href="/portfolio" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        View all ({holdings.length})
                    </Link>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                            <th className="text-left px-6 py-3">Stock</th>
                            <th className="text-left px-4 py-3">Broker</th>
                            <th className="text-right px-4 py-3">Qty</th>
                            <th className="text-right px-4 py-3">Avg Price</th>
                            <th className="text-right px-4 py-3">Current</th>
                            <th className="text-right px-4 py-3">Value</th>
                            <th className="text-right px-4 py-3">P&L</th>
                            <th className="text-right px-6 py-3">Day</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {displayHoldings.map((pos) => {
                            const pnl = pos.unrealizedPL ?? pos.unrealizedPnL ?? 0;
                            const pnlPct = pos.unrealizedPLPercent ?? 0;
                            const dayGain = pos.dayGain ?? 0;
                            const dayPct = pos.dayGainPercent ?? 0;
                            const pnlUp = pnl >= 0;
                            const dayUp = dayGain >= 0;

                            return (
                                <tr key={`${pos.symbol}-${pos.broker}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-3.5">
                                        <span className="font-semibold text-foreground">{pos.symbol}</span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                            {pos.broker}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-medium text-foreground">{pos.quantity}</td>
                                    <td className="px-4 py-3.5 text-right text-muted-foreground">{formatCurrency(pos.averageBuyPrice)}</td>
                                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                                        {pos.currentPrice && pos.currentPrice > 0 ? formatCurrency(pos.currentPrice) : '\u2014'}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-foreground">{formatCurrency(pos.currentValue)}</td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className={`font-semibold ${pnlUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {pnlUp ? '+' : ''}{formatCurrency(pnl)}
                                        </span>
                                        <div className={`text-[10px] ${pnlUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {formatPercent(pnlPct)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${dayUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {dayUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            {formatPercent(dayPct)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {holdings.length > 10 && (
                <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-center">
                    <Link href="/portfolio" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        View all {holdings.length} holdings &rarr;
                    </Link>
                </div>
            )}
        </div>
    );
}

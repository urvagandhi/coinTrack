'use client';

import { portfolioAPI } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HoldingsTable() {
    const { data: holdingsData, isLoading } = useQuery({
        queryKey: ['holdings'],
        queryFn: portfolioAPI.getHoldings,
        refetchInterval: 60000
    });

    const holdings = Array.isArray(holdingsData) ? holdingsData : (holdingsData?.data || []);
    const displayHoldings = holdings.slice(0, 5); // Limit to top 5

    if (isLoading) {
        return <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />)}
        </div>;
    }

    if (!holdings || holdings.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
                No holdings found.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-xl">Instrument</th>
                            <th className="px-6 py-4 text-right">Qty</th>
                            <th className="px-6 py-4 text-right">Avg. Price</th>
                            <th className="px-6 py-4 text-right">LTP</th>
                            <th className="px-6 py-4 text-right">Cur. Value</th>
                            <th className="px-6 py-4 text-right">P/L</th>
                            <th className="px-6 py-4 text-right rounded-tr-xl">Day Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {displayHoldings.map((pos) => {
                            const isAhPositive = (pos.unrealizedPL || 0) >= 0;
                            const isDayPositive = (pos.dayGain || 0) >= 0;
                            const pnlColor = isAhPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                            const dayColor = isDayPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

                            return (
                                <motion.tr
                                    key={`${pos.symbol}-${pos.broker}`} // unique key
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="group hover:bg-muted/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                {pos.symbol}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                                                {pos.broker}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-foreground font-medium">{pos.quantity}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-muted-foreground">{formatCurrency(pos.averageBuyPrice)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-foreground font-medium">{formatCurrency(pos.currentPrice)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-foreground font-semibold">{formatCurrency(pos.currentValue)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-semibold ${pnlColor}`}>
                                            {formatCurrency(pos.unrealizedPL)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xs font-semibold ${dayColor}`}>
                                                {formatPercent(pos.dayGainPercent)}
                                            </span>
                                            <span className={`text-[10px] mt-0.5 ${dayColor} opacity-90`}>
                                                {formatCurrency(pos.dayGain)}
                                            </span>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {holdings.length > 5 && (
                <div className="bg-muted/30 p-3 text-center border-t border-border">
                    <Link href="/portfolio" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                        View All Holdings →
                    </Link>
                </div>
            )}
        </div>
    );
}

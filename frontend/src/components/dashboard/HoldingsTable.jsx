'use client';

import { usePortfolioPositions } from '@/hooks/usePortfolioPositions';
import { formatCurrency, formatPercent } from '@/lib/format';
import { motion } from 'framer-motion';

export default function HoldingsTable() {
    const { data: positions, isLoading } = usePortfolioPositions();

    if (isLoading) {
        return <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />)}
        </div>;
    }

    if (!positions || positions.length === 0) {
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
                        {positions.map((pos) => {
                            const isAhPositive = (pos.unrealizedPL || 0) >= 0;
                            const isDayPositive = (pos.dayGain || 0) >= 0;
                            const pnlColor = isAhPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                            const dayColor = isDayPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

                            return (
                                <motion.tr
                                    key={pos.symbol}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="group hover:bg-muted/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {pos.symbol}
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {/* Broker Tags */}
                                                    {Object.keys(pos.brokerQuantityMap || {}).map(b => (
                                                        <span key={b} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-[4px] text-[9px] font-medium uppercase tracking-wide border border-border/50">
                                                            {b}
                                                        </span>
                                                    ))}
                                                    {pos.isDerivative && (
                                                        <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-[4px] text-[9px] font-medium border border-purple-200 dark:border-purple-800/30">
                                                            FNO
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-foreground font-medium">{pos.totalQuantity}</span>
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
                                            <span className={`text-xs font-semibold ${dayColor} px-1.5 py-0.5 rounded-full bg-opacity-10 ${isDayPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                                {formatPercent(pos.dayGainPercent)}
                                            </span>
                                            <span className={`text-[10px] mt-1 ${dayColor}`}>
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
        </div>
    );
}

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
        <div className="overflow-x-auto bg-gray-900/50 border border-gray-800 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-4">Symbol</th>
                        <th className="px-6 py-4 text-right">Qty</th>
                        <th className="px-6 py-4 text-right">Avg. Price</th>
                        <th className="px-6 py-4 text-right">LTP</th>
                        <th className="px-6 py-4 text-right">Cur. Value</th>
                        <th className="px-6 py-4 text-right">P/L</th>
                        <th className="px-6 py-4 text-right">Day Change</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {positions.map((pos) => {
                        const isAhPositive = (pos.unrealizedPL || 0) >= 0;
                        const isDayPositive = (pos.dayGain || 0) >= 0;

                        return (
                            <motion.tr
                                key={pos.symbol}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-gray-800/30 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{pos.symbol}</div>
                                    <div className="text-xs text-gray-500 flex gap-1 mt-0.5">
                                        {/* Broker Tags */}
                                        {Object.keys(pos.brokerQuantityMap || {}).map(b => (
                                            <span key={b} className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px]">{b}</span>
                                        ))}
                                        {pos.isDerivative && <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded text-[10px]">FNO</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-300">
                                    {pos.totalQuantity}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-300">
                                    {formatCurrency(pos.averageBuyPrice)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-200">
                                    {formatCurrency(pos.currentPrice)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-200">
                                    {formatCurrency(pos.currentValue)}
                                </td>
                                <td className={`px-6 py-4 text-right font-medium ${isAhPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(pos.unrealizedPL)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className={`font-medium ${isDayPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatPercent(pos.dayGainPercent)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatCurrency(pos.dayGain)}
                                    </div>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

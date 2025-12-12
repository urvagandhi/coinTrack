'use client';

import { usePortfolio } from '@/hooks/usePortfolio';
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/format';
import { motion } from 'framer-motion';
import { Clock, TrendingDown, TrendingUp } from 'lucide-react';

export default function PortfolioSummary() {
    const { data, isLoading } = usePortfolio();

    if (isLoading) {
        return <div className="animate-pulse h-32 bg-gray-800/50 rounded-xl mb-6"></div>;
    }

    if (!data) return null;

    const isPositive = (data.totalDayGain || 0) >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
            {/* Total Value */}
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium">Current Value</h3>
                <div className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(data.totalCurrentValue)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Updated: {formatDateTime(data.lastAnySync)} // Fallback if lastAnySync missing?
                </div>
            </div>

            {/* Invested Value */}
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium">Invested Value</h3>
                <div className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(data.totalInvestedValue)}
                </div>
            </div>

            {/* Day Gain */}
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium">Day's Gain</h3>
                <div className={`text-2xl font-bold mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(data.totalDayGain)}
                </div>
                <div className={`text-sm font-medium mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                    {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {formatPercent(data.totalDayGainPercent)}
                </div>
            </div>

            {/* Unrealized P/L */}
            <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm font-medium">Unrealized P/L</h3>
                <div className={`text-2xl font-bold mt-1 ${(data.totalUnrealizedPL || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(data.totalUnrealizedPL || 0) >= 0 ? '+' : ''}{formatCurrency(data.totalUnrealizedPL)}
                </div>
            </div>
        </motion.div>
    );
}

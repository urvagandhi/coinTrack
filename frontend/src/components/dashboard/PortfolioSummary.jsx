// src/components/dashboard/PortfolioSummary.jsx
'use client';

import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/format';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Clock,
    PieChart,
    TrendingUp,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';

function Skeleton({ className = '' }) {
    return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function StatCard({ icon: Icon, iconColor, label, value, sub, subColor }) {
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
                <div className={`p-2 rounded-lg ${iconColor}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                {sub && (
                    <p className={`text-xs font-medium mt-1 ${subColor || 'text-muted-foreground'}`}>{sub}</p>
                )}
            </div>
        </div>
    );
}

export function PortfolioSummary() {
    const { data, isLoading } = usePortfolioSummary();
    const [dismissedStale, setDismissedStale] = useState(false);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const dayPositive = (data.totalDayGain || 0) >= 0;
    const plPositive = (data.totalUnrealizedPL || 0) >= 0;

    return (
        <div className="space-y-4">
            {/* Stale prices warning */}
            {data.hasStalePrices && !dismissedStale && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={14} />
                        Some prices may be delayed — live market data unavailable.
                    </div>
                    <button onClick={() => setDismissedStale(true)} className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-800/30 rounded transition-colors">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Total Balance — hero card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Balance</p>
                        <p className="text-4xl font-bold text-foreground mt-2 tracking-tight">
                            {formatCurrency(data.totalCurrentValue)}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            {plPositive ? (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                                    <ArrowUpRight size={14} />
                                    {formatPercent(data.totalUnrealizedPLPercent)} all time
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-red-400">
                                    <ArrowDownRight size={14} />
                                    {formatPercent(data.totalUnrealizedPLPercent)} all time
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {data.lastAnySync ? formatDateTime(data.lastAnySync) : 'Updated just now'}
                    </div>
                </div>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={Wallet}
                    iconColor="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    label="Amount Invested"
                    value={formatCurrency(data.totalInvestedValue)}
                    sub={`Across all brokers`}
                />
                <StatCard
                    icon={TrendingUp}
                    iconColor={dayPositive
                        ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'}
                    label="Today's Gain"
                    value={`${dayPositive ? '+' : ''}${formatCurrency(data.totalDayGain)}`}
                    sub={data.totalDayGain !== 0 && Math.abs(data.totalDayGainPercent) < 0.01
                        ? '< 0.01%'
                        : formatPercent(data.totalDayGainPercent)}
                    subColor={dayPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                />
                <StatCard
                    icon={PieChart}
                    iconColor={plPositive
                        ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'}
                    label="Unrealized P&L"
                    value={`${plPositive ? '+' : ''}${formatCurrency(data.totalUnrealizedPL)}`}
                    sub={formatPercent(data.totalUnrealizedPLPercent)}
                    subColor={plPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                />
            </div>
        </div>
    );
}

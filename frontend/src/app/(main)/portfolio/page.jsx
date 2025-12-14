'use client';

import { portfolioAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Icons
import ArrowDownRight from 'lucide-react/dist/esm/icons/arrow-down-right';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import PieChart from 'lucide-react/dist/esm/icons/pie-chart';

// Dynamic Import to fix Recharts SSR issue
const PortfolioAnalysisCharts = dynamic(() => import('@/components/dashboard/PortfolioAnalysisCharts'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
});

function StatCard({ title, value, subValue, isPositive, icon: Icon }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${isPositive ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {subValue && (
                <div className={`flex items-center text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                    <span className="font-medium">{subValue}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1">vs yesterday</span>
                </div>
            )}
        </div>
    );
}

export default function PortfolioPage() {
    const [activeTab, setActiveTab] = useState('holdings');

    // 1. Fetch Summary
    const { data: summary, isLoading: isLoadingSummary } = useQuery({
        queryKey: ['portfolioSummary'],
        queryFn: portfolioAPI.getSummary,
        refetchInterval: 60000 // Refresh every minute
    });

    // 2. Fetch Holdings
    const { data: holdings = [], isLoading: isLoadingHoldings } = useQuery({
        queryKey: ['holdings'],
        queryFn: portfolioAPI.getHoldings,
        refetchInterval: 60000
    });

    // 3. Fetch Positions
    const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
        queryKey: ['positions'],
        queryFn: portfolioAPI.getPositions,
        refetchInterval: 30000 // Faster refresh for positions
    });

    // Helper to format currency
    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '₹0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(val);
    };

    // Helper to format percentage
    const formatPercent = (val) => {
        if (val === undefined || val === null) return '0.00%';
        const isPos = val >= 0;
        return `${isPos ? '+' : ''}${val?.toFixed(2)}%`;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your investments and track performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Current Value"
                    value={isLoadingSummary ? "Loading..." : formatCurrency(summary?.totalCurrentValue)}
                    subValue={isLoadingSummary ? "" : formatPercent(summary?.totalDayGainPercent)}
                    isPositive={summary?.totalDayGain >= 0}
                    icon={PieChart}
                />
                <StatCard
                    title="Total Invested"
                    value={isLoadingSummary ? "Loading..." : formatCurrency(summary?.totalInvestedValue)}
                    subValue={null}
                    isPositive={true}
                    icon={Briefcase}
                />
                <StatCard
                    title="Total P&L"
                    value={isLoadingSummary ? "Loading..." : formatCurrency(summary?.totalUnrealizedPL)}
                    subValue={isLoadingSummary ? "" : formatCurrency(summary?.totalDayGain)}
                    isPositive={summary?.totalUnrealizedPL >= 0}
                    icon={ArrowUpRight}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Tables */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-700">
                            {['holdings', 'positions', 'orders', 'mutual_funds'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {tab.replace('_', ' ').charAt(0).toUpperCase() + tab.replace('_', ' ').slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* HOLDINGS TAB */}
                            {activeTab === 'holdings' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <th className="pb-4">Instrument</th>
                                                <th className="pb-4 text-right">Qty</th>
                                                <th className="pb-4 text-right">Avg. Price</th>
                                                <th className="pb-4 text-right">Current</th>
                                                <th className="pb-4 text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-4">
                                            {isLoadingHoldings ? (
                                                <tr><td colSpan="5" className="text-center py-4">Loading holdings...</td></tr>
                                            ) : holdings.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No holdings found.</td></tr>
                                            ) : (
                                                holdings.map((item, idx) => {
                                                    const pnl = (item.currentPrice - item.averagePrice) * item.quantity;
                                                    const isPos = pnl >= 0;
                                                    return (
                                                        <tr key={idx} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                                            <td className="py-4">
                                                                <div className="font-medium text-gray-900 dark:text-white">{item.symbol || item.instrument}</div>
                                                                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-0.5 rounded mt-1">
                                                                    {item.type || 'EQ'}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                                            <td className="py-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.averagePrice)}</td>
                                                            <td className="py-4 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.currentPrice)}</td>
                                                            <td className={`py-4 text-right font-medium ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {formatCurrency(pnl)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* POSITIONS TAB */}
                            {activeTab === 'positions' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <th className="pb-4">Instrument</th>
                                                <th className="pb-4 text-right">Qty</th>
                                                <th className="pb-4 text-right">Buy Avg</th>
                                                <th className="pb-4 text-right">Sell Avg</th>
                                                <th className="pb-4 text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-4">
                                            {isLoadingPositions ? (
                                                <tr><td colSpan="5" className="text-center py-4">Loading positions...</td></tr>
                                            ) : positions.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No active positions.</td></tr>
                                            ) : (
                                                positions.map((item, idx) => {
                                                    const isPos = item.pnl >= 0;
                                                    return (
                                                        <tr key={idx} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                                            <td className="py-4">
                                                                <div className="font-medium text-gray-900 dark:text-white">{item.tradingSymbol}</div>
                                                                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 inline-block px-2 py-0.5 rounded mt-1">
                                                                    {item.productType}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                                            <td className="py-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(item.averagePrice)}</td>
                                                            <td className="py-4 text-right font-medium text-gray-900 dark:text-white">--</td> {/* Sell avg might not be in basic DTO yet */}
                                                            <td className={`py-4 text-right font-medium ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {formatCurrency(item.pnl)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ORDERS TAB (Stub) */}
                            {activeTab === 'orders' && (
                                <div className="text-center py-12">
                                    <div className="inline-block p-4 rounded-full bg-gray-50 dark:bg-gray-700/50 mb-4">
                                        <Briefcase className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Orders Found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">Order history integration coming soon.</p>
                                </div>
                            )}

                            {/* MUTUAL FUNDS TAB (Stub) */}
                            {activeTab === 'mutual_funds' && (
                                <div className="text-center py-12">
                                    <div className="inline-block p-4 rounded-full bg-gray-50 dark:bg-gray-700/50 mb-4">
                                        <PieChart className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mutual Funds</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">Mutual fund tracking integration coming soon.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Right Column: Charts */}
                <div className="space-y-6">
                    <PortfolioAnalysisCharts />

                    {/* Quick Transfer / Action Card (Placeholder) */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-bold mb-2">Add Funds</h3>
                        <p className="text-blue-100 text-sm mb-4">Transfer funds instantly to your connected broker accounts.</p>
                        <button className="w-full py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                            Add Funds
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        refetchInterval: 60000
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
        refetchInterval: 30000
    });

    // 4. Fetch Orders
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['orders'],
        queryFn: portfolioAPI.getOrders,
        refetchInterval: 15000
    });

    // 5. Fetch Mutual Funds
    const { data: mfHoldings = [], isLoading: isLoadingMf } = useQuery({
        queryKey: ['mfHoldings'],
        queryFn: portfolioAPI.getMfHoldings,
        refetchInterval: 300000
    });

    // 6. Fetch Funds/Margins
    const { data: fundsData, isLoading: isLoadingFunds } = useQuery({
        queryKey: ['funds'],
        queryFn: portfolioAPI.getFunds,
        refetchInterval: 60000
    });

    // Helper to format currency
    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '₹0.00';
        // Handle string inputs from DTOs if necessary
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(num);
    };

    // Helper to format percentage
    const formatPercent = (val) => {
        if (val === undefined || val === null) return '0.00%';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        const isPos = num >= 0;
        return `${isPos ? '+' : ''}${num?.toFixed(2)}%`;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your investments and track performance.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Current Value */}
                <StatCard
                    title="Current Value"
                    value={isLoadingSummary ? "Loading..." : formatCurrency(summary?.totalCurrentValue)}
                    subValue={isLoadingSummary ? "" : formatPercent(summary?.totalDayGainPercent)}
                    isPositive={summary?.totalDayGain >= 0}
                    icon={PieChart}
                />
                {/* Invested */}
                <StatCard
                    title="Total Invested"
                    value={isLoadingSummary ? "Loading..." : formatCurrency(summary?.totalInvestedValue)}
                    subValue={null}
                    isPositive={true}
                    icon={Briefcase}
                />
                {/* P&L */}
                <StatCard
                    title="Total P&L"
                    value={isLoadingSummary ? "Loading..." : formatCurrency(summary?.totalUnrealizedPL)}
                    subValue={isLoadingSummary ? "" : formatCurrency(summary?.totalDayGain)}
                    isPositive={summary?.totalUnrealizedPL >= 0}
                    icon={ArrowUpRight}
                />
                {/* Available Funds */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Available Cash</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {isLoadingFunds ? "Loading..." : formatCurrency(fundsData?.equity?.available || 0)}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            <Briefcase className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Equity Margin:</span>
                        <span className="text-gray-900 dark:text-white ml-2">
                            {isLoadingFunds ? "..." : formatCurrency(fundsData?.equity?.net || 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Tables */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
                            {['holdings', 'positions', 'orders', 'mutual_funds'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab
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
                                                <th className="pb-4 text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-4">
                                            {isLoadingPositions ? (
                                                <tr><td colSpan="4" className="text-center py-4">Loading positions...</td></tr>
                                            ) : positions.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-4 text-gray-500">No active positions.</td></tr>
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

                            {/* ORDERS TAB */}
                            {activeTab === 'orders' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <th className="pb-4">Time</th>
                                                <th className="pb-4">Instrument</th>
                                                <th className="pb-4 text-center">Type</th>
                                                <th className="pb-4 text-right">Qty</th>
                                                <th className="pb-4 text-right">Price</th>
                                                <th className="pb-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-4">
                                            {isLoadingOrders ? (
                                                <tr><td colSpan="6" className="text-center py-4">Loading orders...</td></tr>
                                            ) : orders.length === 0 ? (
                                                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No orders found for today.</td></tr>
                                            ) : (
                                                orders.map((order, idx) => (
                                                    <tr key={idx} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                                        <td className="py-4 text-xs text-gray-500">{order.orderTimestamp?.split(' ')[1] || order.orderTimestamp}</td>
                                                        <td className="py-4 font-medium text-gray-900 dark:text-white">
                                                            {order.tradingsymbol}
                                                            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${order.transactionType === 'BUY' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                                {order.transactionType}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-center text-xs text-gray-500">{order.product} / {order.orderType}</td>
                                                        <td className="py-4 text-right text-gray-600 dark:text-gray-300">
                                                            {order.filledQuantity}/{order.quantity}
                                                        </td>
                                                        <td className="py-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(order.averagePrice || order.price)}</td>
                                                        <td className="py-4 text-right">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'COMPLETE' ? 'bg-green-100 text-green-700' :
                                                                    order.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                        'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* MUTUAL FUNDS TAB */}
                            {activeTab === 'mutual_funds' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <th className="pb-4">Fund</th>
                                                <th className="pb-4 text-right">Units</th>
                                                <th className="pb-4 text-right">Avg. NAV</th>
                                                <th className="pb-4 text-right">Last Price</th>
                                                <th className="pb-4 text-right">P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="space-y-4">
                                            {isLoadingMf ? (
                                                <tr><td colSpan="5" className="text-center py-4">Loading mutual funds...</td></tr>
                                            ) : mfHoldings.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No mutual fund holdings found.</td></tr>
                                            ) : (
                                                mfHoldings.map((mf, idx) => {
                                                    const pnl = parseFloat(mf.pnl);
                                                    const isPos = pnl >= 0;
                                                    return (
                                                        <tr key={idx} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                                            <td className="py-4">
                                                                <div className="font-medium text-gray-900 dark:text-white max-w-xs truncate" title={mf.fund}>
                                                                    {mf.fund}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">{mf.folio}</div>
                                                            </td>
                                                            <td className="py-4 text-right text-gray-600 dark:text-gray-300">{mf.quantity}</td>
                                                            <td className="py-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(mf.averagePrice)}</td>
                                                            <td className="py-4 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(mf.lastPrice)}</td>
                                                            <td className={`py-4 text-right font-medium ${isPos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {formatCurrency(mf.pnl)}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
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

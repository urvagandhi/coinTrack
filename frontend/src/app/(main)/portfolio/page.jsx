'use client';

import {
    ArrowDownRight,
    ArrowUpRight,
    Briefcase,
    ChevronDown,
    Download,
    Filter,
    LineChart,
    Wallet
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

// Mock Data
const PORTFOLIO_DATA = [
    { name: 'Jan', value: 120000 },
    { name: 'Feb', value: 132000 },
    { name: 'Mar', value: 128000 },
    { name: 'Apr', value: 145000 },
    { name: 'May', value: 142000 },
    { name: 'Jun', value: 158000 },
    { name: 'Jul', value: 168250 },
];

const ALLOCATION_DATA = [
    { name: 'Stocks', value: 65, color: '#F97316' }, // Orange 500
    { name: 'Mutual Funds', value: 20, color: '#3B82F6' }, // Blue 500
    { name: 'Gold', value: 10, color: '#EAB308' }, // Yellow 500
    { name: 'Liquid', value: 5, color: '#8B5CF6' }, // Purple 500
];

const HOLDINGS = [
    { id: 1, name: 'Reliance Industries', symbol: 'RELIANCE', type: 'Stock', invested: 45000, current: 52000, pnl: 15.5 },
    { id: 2, name: 'HDFC Bank', symbol: 'HDFCBANK', type: 'Stock', invested: 30000, current: 28500, pnl: -5.0 },
    { id: 3, name: 'Nippon India Small Cap', symbol: 'NIPPON', type: 'Mutual Fund', invested: 25000, current: 35000, pnl: 40.0 },
    { id: 4, name: 'Sovereign Gold Bond', symbol: 'SGB', type: 'Gold', invested: 20000, current: 24500, pnl: 22.5 },
    { id: 5, name: 'Tata Motors', symbol: 'TATAMOTORS', type: 'Stock', invested: 15000, current: 18250, pnl: 21.6 },
];

const StatCard = ({ title, value, subValue, isPositive, icon: Icon }) => (
    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
        <div className="flex justify-between items-start z-10">
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>

        <div className="z-10 flex items-center gap-2">
            <span className={`text-sm font-bold flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                {subValue}
            </span>
            <span className="text-xs text-gray-400">vs last month</span>
        </div>

        {/* Decorational Background Icon */}
        <Icon className="absolute -bottom-4 -right-4 w-24 h-24 text-gray-100 dark:text-gray-800/50 opacity-100 group-hover:scale-110 transition-transform duration-500" />
    </div>
);

export default function PortfolioPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Analysis</h1>
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full border border-orange-200 dark:border-orange-800">
                        PRO
                    </span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Report
                </button>
            </div>

            {/* 1. Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Net Worth"
                    value="₹1,68,250"
                    subValue="12.4%"
                    isPositive={true}
                    icon={Wallet}
                />
                <StatCard
                    title="Total Gain/Loss"
                    value="+₹23,250"
                    subValue="8.2%"
                    isPositive={true}
                    icon={LineChart}
                />
                <StatCard
                    title="Day's Change"
                    value="-₹840"
                    subValue="0.5%"
                    isPositive={false}
                    icon={Briefcase}
                />
            </div>

            {/* 2. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth Chart (Area) */}
                <div className="lg:col-span-2 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Portfolio Growth</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={PORTFOLIO_DATA}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#F97316', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Allocation Chart (Donut) */}
                <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Asset Allocation</h3>
                    <div className="flex-1 min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ALLOCATION_DATA}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ALLOCATION_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">4</span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Assets</span>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="space-y-3 mt-4">
                        {ALLOCATION_DATA.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Holdings Table (Advanced) */}
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Holdings</h3>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                            <Filter className="w-3.5 h-3.5" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300">
                            Sort by ROI <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Instrument</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Invested</th>
                                <th className="px-6 py-4 text-right">Current</th>
                                <th className="px-6 py-4 text-right">P&L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {HOLDINGS.map(holding => (
                                <tr key={holding.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{holding.name}</div>
                                        <div className="text-xs text-gray-400">{holding.symbol}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium
                                            ${holding.type === 'Stock' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                holding.type === 'Gold' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}
                                        `}>
                                            {holding.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                                        ₹{holding.invested.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                        ₹{holding.current.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-bold ${holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {holding.pnl >= 0 ? '+' : ''}{holding.pnl}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

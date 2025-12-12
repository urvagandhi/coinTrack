'use client';

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

// Mock Data (Moved here or passed as props if needed dynamic later)
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

export default function PortfolioAnalysisCharts() {
    return (
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
    );
}

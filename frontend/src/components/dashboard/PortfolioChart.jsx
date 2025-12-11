'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const timeRanges = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '1Y', value: '1y' },
    { label: 'All', value: 'all' },
];

const samplePortfolioData = [
    { date: '2024-01-01', value: 100000 },
    { date: '2024-01-02', value: 102000 },
    { date: '2024-01-03', value: 98000 },
    { date: '2024-01-04', value: 105000 },
    { date: '2024-01-05', value: 108000 },
    { date: '2024-01-06', value: 112000 },
    { date: '2024-01-07', value: 115000 },
];

const sampleAllocation = [
    { name: 'Stocks', value: 60, color: '#3B82F6' },
    { name: 'Mutual Funds', value: 25, color: '#10B981' },
    { name: 'Bonds', value: 10, color: '#F59E0B' },
    { name: 'Cash', value: 5, color: '#6B7280' },
];

export default function PortfolioChart({ data = samplePortfolioData, allocation = sampleAllocation }) {
    const [activeTimeRange, setActiveTimeRange] = useState('1m');
    const [chartType, setChartType] = useState('line'); // 'line' or 'pie'

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-cointrack-dark-card border border-cointrack-light/20 dark:border-cointrack-dark/20 rounded-lg p-3 shadow-lg">
                    <p className="text-sm text-cointrack-dark/60 dark:text-cointrack-light/60">{label}</p>
                    <p className="text-lg font-semibold text-cointrack-dark dark:text-cointrack-light">
                        ₹{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    const PieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-cointrack-dark-card border border-cointrack-light/20 dark:border-cointrack-dark/20 rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-semibold text-cointrack-dark dark:text-cointrack-light">
                        {data.name}
                    </p>
                    <p className="text-lg font-bold" style={{ color: data.color }}>
                        {data.value}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-cointrack-dark-card rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-6"
        >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-cointrack-dark dark:text-cointrack-light mb-1">
                        Portfolio Performance
                    </h3>
                    <p className="text-sm text-cointrack-dark/60 dark:text-cointrack-light/60">
                        Track your investment growth over time
                    </p>
                </div>

                <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                    {/* Chart type toggle */}
                    <div className="flex bg-cointrack-light/20 dark:bg-cointrack-dark/20 rounded-lg p-1">
                        <button
                            onClick={() => setChartType('line')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartType === 'line'
                                    ? 'bg-white dark:bg-cointrack-dark-card text-cointrack-primary shadow-sm'
                                    : 'text-cointrack-dark/60 dark:text-cointrack-light/60 hover:text-cointrack-dark dark:hover:text-cointrack-light'
                                }`}
                        >
                            Performance
                        </button>
                        <button
                            onClick={() => setChartType('pie')}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartType === 'pie'
                                    ? 'bg-white dark:bg-cointrack-dark-card text-cointrack-primary shadow-sm'
                                    : 'text-cointrack-dark/60 dark:text-cointrack-light/60 hover:text-cointrack-dark dark:hover:text-cointrack-light'
                                }`}
                        >
                            Allocation
                        </button>
                    </div>

                    {/* Time range selector (only for line chart) */}
                    {chartType === 'line' && (
                        <div className="flex bg-cointrack-light/20 dark:bg-cointrack-dark/20 rounded-lg p-1">
                            {timeRanges.map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => setActiveTimeRange(range.value)}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTimeRange === range.value
                                            ? 'bg-white dark:bg-cointrack-dark-card text-cointrack-primary shadow-sm'
                                            : 'text-cointrack-dark/60 dark:text-cointrack-light/60 hover:text-cointrack-dark dark:hover:text-cointrack-light'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="h-80">
                {chartType === 'line' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="url(#colorGradient)"
                                strokeWidth={3}
                                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#3B82F6' }}
                            />
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#10B981" />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-full max-w-md">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={allocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {allocation.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="ml-8">
                            <h4 className="text-sm font-semibold text-cointrack-dark dark:text-cointrack-light mb-3">
                                Asset Allocation
                            </h4>
                            <div className="space-y-2">
                                {allocation.map((item) => (
                                    <div key={item.name} className="flex items-center">
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: item.color }}
                                        ></div>
                                        <span className="text-sm text-cointrack-dark/70 dark:text-cointrack-light/70 mr-2">
                                            {item.name}
                                        </span>
                                        <span className="text-sm font-medium text-cointrack-dark dark:text-cointrack-light">
                                            {item.value}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
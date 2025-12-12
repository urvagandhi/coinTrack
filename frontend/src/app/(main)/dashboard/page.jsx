'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, TrendingUp, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';

// Dummy Components to prevent import errors during restructuring
const StatsCard = ({ title, value, change, icon, color = "purple" }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-500`}>
            {icon}
        </div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-4 text-${color}-600 dark:text-${color}-400`}>
                {icon}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${change >= 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {change >= 0 ? '+' : ''}{change}%
                </span>
            </div>
        </div>
    </motion.div>
);

const DummyChart = () => (
    <div className="w-full h-64 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-4 opacity-30">
            {[40, 60, 45, 70, 50, 80, 65, 85, 75, 90, 60, 95].map((h, i) => (
                <div key={i} className="w-1/12 mx-0.5 bg-purple-600 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
        </div>
        <p className="text-gray-400 dark:text-gray-500 font-medium z-10">Portfolio Performance Chart (Coming Soon)</p>
    </div>
);

export default function Dashboard() {
    const { user } = useAuth();
    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {greeting}, <span className="text-purple-600">{user?.name?.split(' ')[0] || 'Trader'}</span>!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your portfolio today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                        Add Transaction
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20">
                        View Reports
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Balance"
                    value="₹1,24,500"
                    change={12.5}
                    icon={<Wallet className="w-6 h-6" />}
                    color="purple"
                />
                <StatsCard
                    title="Total Invested"
                    value="₹85,000"
                    change={2.4}
                    icon={<BarChart3 className="w-6 h-6" />}
                    color="blue"
                />
                <StatsCard
                    title="Current Value"
                    value="₹1,24,500"
                    change={46.4}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="green"
                />
                <StatsCard
                    title="Day's P&L"
                    value="+₹1,200"
                    change={1.2}
                    icon={<Zap className="w-6 h-6" />}
                    color="orange"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio Analytics</h2>
                            <select className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-600 outline-none">
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>This Year</option>
                            </select>
                        </div>
                        <DummyChart />
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                            <Link href="/transactions" className="text-purple-600 text-sm font-medium hover:text-purple-700 flex items-center gap-1">
                                View All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {i % 2 === 0 ? <TrendingUp className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">TATA MOTORS</h4>
                                            <p className="text-xs text-gray-500">Today, 10:45 AM</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${i % 2 === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {i % 2 === 0 ? '+₹4,500' : '-₹2,100'}
                                        </p>
                                        <p className="text-xs text-gray-500">Success</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Widget (Market Overview) */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl">
                        <h2 className="text-xl font-bold mb-2">Upgrade to Pro</h2>
                        <p className="text-purple-100 text-sm mb-4">Get advanced analytics, AI insights, and unlimited transaction history.</p>
                        <button className="w-full py-2.5 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors text-sm">
                            Try Pro for Free
                        </button>
                    </div>

                    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-2xl shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Market Overview</h2>
                        <div className="space-y-3">
                            {['NIFTY 50', 'SENSEX', 'BANK NIFTY'].map((idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{idx}</span>
                                    <span className="font-semibold text-green-600">+0.85%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

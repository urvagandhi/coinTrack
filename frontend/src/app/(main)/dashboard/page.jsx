'use client';

import PageTransition from '@/components/ui/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    ArrowUpRight,
    Code,
    ExternalLink,
    FileText,
    Info
} from 'lucide-react';

const MinimalStatsCard = ({ label, value, subValue, info, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 flex-1 shadow-sm hover:shadow-lg transition-all duration-300 group"
    >
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm">{label}</h3>
            {info && <Info className="w-4 h-4 text-gray-300 hover:text-gray-500 cursor-help" />}
        </div>
        <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-left">{value}</h2>
        </div>
        {subValue && (
            <p className="text-sm text-gray-400 mt-1">{subValue}</p>
        )}
    </motion.div>
);

const AllocationBar = ({ label, value, color = "orange", count, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="flex items-center gap-4 py-3"
    >
        <span className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex-1 h-4 bg-gray-100/50 dark:bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ delay: delay + 0.2, duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'}`}
            />
        </div>
        <span className="w-16 text-right text-sm text-gray-500">{count}</span>
    </motion.div>
);

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. Header Section (My Workspace) */}
                <div className="flex items-center gap-2 mb-6">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Workspace</h1>
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>

                {/* 2. Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MinimalStatsCard
                        label="Total Balance"
                        value="₹1.24L"
                        info={true}
                        delay={0.1}
                    />
                    <MinimalStatsCard
                        label="Invested Amount"
                        value="₹85K"
                        info={true}
                        delay={0.2}
                    />
                    <MinimalStatsCard
                        label="Day's Gain"
                        value="+₹1.2K"
                        info={true}
                        delay={0.3}
                    />
                </div>

                {/* 3. Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Content) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Tabs / Recent Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm min-h-[300px]"
                        >
                            <div className="flex items-center gap-6 border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                                <button className="text-gray-900 dark:text-white font-semibold border-b-2 border-orange-500 pb-4 -mb-4 px-1">
                                    Recent
                                </button>
                                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors pb-4 -mb-4 px-1">
                                    Custom Watchlists
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg group cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                                            <Code className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">NIFTY 50 Options Strategy</span>
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-500">Viewed Sep 22</span>
                                </div>
                                <div className="flex items-center justify-between p-3 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg group cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">Long Term Portfolio</span>
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-500">Viewed Jul 8</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Asset Allocation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Asset Allocation</h2>
                                <ArrowUpRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="space-y-2">
                                <AllocationBar label="Large Cap" value={45} count="45%" delay={0.6} />
                                <AllocationBar label="Mid Cap" value={30} count="30%" delay={0.7} />
                                <AllocationBar label="Small Cap" value={15} count="15%" delay={0.8} />
                                <AllocationBar label="T-Bills / Gold" value={10} count="10%" delay={0.9} />
                            </div>
                        </motion.div>

                    </div>

                    {/* Right Column (Widgets) */}
                    <div className="space-y-6">

                        {/* Broker Integration Status Widget */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Brokers Connected</h2>
                                <ArrowUpRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mb-6">Last Synced: 2 mins ago</p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-blue-50/50 flex items-center justify-center text-blue-600 font-bold text-xs">Z</div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Zerodha</span>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Connected"></div>
                                </div>
                                <div className="flex items-center gap-3 opacity-50">
                                    <div className="w-8 h-8 rounded bg-orange-50/50 flex items-center justify-center text-orange-600 font-bold text-xs">U</div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Upstox</span>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-gray-300" title="Not Connected"></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Extension / Promotion Card (Orange bg) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="bg-orange-50/80 dark:bg-orange-900/10 backdrop-blur-xl border border-orange-100 dark:border-orange-900/20 rounded-2xl p-6 relative overflow-hidden group"
                        >
                            <div className="relative z-10 transition-transform group-hover:scale-[1.02] duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Pro Analytics</h3>
                                    <ExternalLink className="w-4 h-4 text-gray-500" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Get advanced insights on your portfolio volatility and tax harvesting opportunities.
                                </p>
                                <button className="w-full py-2 bg-white dark:bg-black text-orange-600 font-semibold text-sm rounded-lg shadow-sm hover:shadow-lg transition-all">
                                    Try Pro
                                </button>
                            </div>
                            {/* Decorational circles */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/50 rounded-full blur-2xl group-hover:bg-orange-300/50 transition-colors" />
                        </motion.div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

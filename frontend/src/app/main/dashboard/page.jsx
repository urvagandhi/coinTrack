'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import Link from 'next/link';

export default function Dashboard() {
    const { user } = useAuth();
    // const { marketData, isConnected } = useLiveMarket();
    const marketData = null; // Placeholder to avoid breaking JSX
    const isConnected = false;
    const [portfolioData, setPortfolioData] = useState(null);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load portfolio data
            const [portfolio, transactions] = await Promise.all([
                api.portfolio.getOverview(),
                api.transactions.getRecent(5)
            ]);

            setPortfolioData(portfolio);
            setRecentTransactions(transactions);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Set sample data for demo
            setPortfolioData({
                totalValue: 3920150,
                todayChange: 278093,
                totalInvested: 3500000,
                totalGains: 420150,
                gainPercentage: 12.004
            });
            setRecentTransactions([
                { id: 1, type: 'buy', symbol: 'RELIANCE', quantity: 10, price: 2450, date: '2024-01-15' },
                { id: 2, type: 'sell', symbol: 'TCS', quantity: 5, price: 3650, date: '2024-01-14' },
                { id: 3, type: 'buy', symbol: 'HDFC', quantity: 20, price: 1650, date: '2024-01-13' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-cointrack-primary to-cointrack-secondary rounded-xl p-6 text-white"
            >
                <h1 className="text-2xl font-bold mb-2">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-white/80">
                    Here's an overview of your investment portfolio today.
                </p>
                <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm text-white/80">
                            Market Data: {isConnected ? 'Live' : 'Delayed'}
                        </span>
                    </div>
                    {marketData?.lastUpdated && (
                        <span className="text-sm text-white/60">
                            Last updated: {new Date(marketData.lastUpdated).toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Portfolio"
                    value={portfolioData?.totalValue || 0}
                    change={portfolioData?.totalGains || 0}
                    changeType="currency"
                    isLoading={isLoading}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    }
                />

                <StatsCard
                    title="Today's P&L"
                    value={portfolioData?.todayChange || 0}
                    change={portfolioData?.todayChangePercent || 0}
                    changeType="percentage"
                    isLoading={isLoading}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                <StatsCard
                    title="Total Invested"
                    value={portfolioData?.totalInvested || 0}
                    isLoading={isLoading}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                />

                <StatsCard
                    title="Total Returns"
                    value={`${portfolioData?.gainPercentage?.toFixed(2) || 0}%`}
                    change={portfolioData?.totalGains || 0}
                    changeType="currency"
                    isLoading={isLoading}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <PortfolioChart />
                </div>

                {/* Market Overview */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white dark:bg-cointrack-dark-card rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-6"
                >
                    <h3 className="text-lg font-semibold text-cointrack-dark dark:text-cointrack-light mb-4">
                        Market Overview
                    </h3>

                    {marketData ? (
                        <div className="space-y-4">
                            {/* NIFTY */}
                            <div className="flex items-center justify-between p-3 bg-cointrack-light/10 dark:bg-cointrack-dark/10 rounded-lg">
                                <div>
                                    <p className="font-medium text-cointrack-dark dark:text-cointrack-light">NIFTY 50</p>
                                    <p className="text-lg font-bold text-cointrack-dark dark:text-cointrack-light">
                                        {marketData.nifty?.value || '21,735.45'}
                                    </p>
                                </div>
                                <div className={`text-right ${(marketData.nifty?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    <p className="font-medium">
                                        {(marketData.nifty?.change || 0) >= 0 ? '+' : ''}{marketData.nifty?.change || '+125.30'}
                                    </p>
                                    <p className="text-sm">
                                        ({(marketData.nifty?.changePercent || 0) >= 0 ? '+' : ''}{marketData.nifty?.changePercent || '0.58'}%)
                                    </p>
                                </div>
                            </div>

                            {/* SENSEX */}
                            <div className="flex items-center justify-between p-3 bg-cointrack-light/10 dark:bg-cointrack-dark/10 rounded-lg">
                                <div>
                                    <p className="font-medium text-cointrack-dark dark:text-cointrack-light">SENSEX</p>
                                    <p className="text-lg font-bold text-cointrack-dark dark:text-cointrack-light">
                                        {marketData.sensex?.value || '72,488.95'}
                                    </p>
                                </div>
                                <div className={`text-right ${(marketData.sensex?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    <p className="font-medium">
                                        {(marketData.sensex?.change || 0) >= 0 ? '+' : ''}{marketData.sensex?.change || '+420.85'}
                                    </p>
                                    <p className="text-sm">
                                        ({(marketData.sensex?.changePercent || 0) >= 0 ? '+' : ''}{marketData.sensex?.changePercent || '0.58'}%)
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-pulse space-y-4">
                            <div className="h-16 bg-cointrack-light/30 dark:bg-cointrack-dark/30 rounded-lg"></div>
                            <div className="h-16 bg-cointrack-light/30 dark:bg-cointrack-dark/30 rounded-lg"></div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white dark:bg-cointrack-dark-card rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-cointrack-dark dark:text-cointrack-light">
                            Recent Activity
                        </h3>
                        <Link
                            href="/transactions"
                            className="text-sm text-cointrack-primary hover:text-cointrack-primary/80 font-medium"
                        >
                            View All
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentTransactions.length > 0 ? (
                            recentTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-3 bg-cointrack-light/10 dark:bg-cointrack-dark/10 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2 h-2 rounded-full ${transaction.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                        <div>
                                            <p className="font-medium text-cointrack-dark dark:text-cointrack-light">
                                                {transaction.type.toUpperCase()} {transaction.symbol}
                                            </p>
                                            <p className="text-sm text-cointrack-dark/60 dark:text-cointrack-light/60">
                                                {transaction.quantity} shares @ ₹{transaction.price}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-cointrack-dark/60 dark:text-cointrack-light/60">
                                            {new Date(transaction.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-cointrack-dark/60 dark:text-cointrack-light/60 py-8">
                                No recent transactions
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white dark:bg-cointrack-dark-card rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 p-6"
                >
                    <h3 className="text-lg font-semibold text-cointrack-dark dark:text-cointrack-light mb-4">
                        Quick Actions
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/brokers"
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-cointrack-primary/10 to-cointrack-primary/5 hover:from-cointrack-primary/20 hover:to-cointrack-primary/10 rounded-lg transition-colors"
                        >
                            <svg className="w-8 h-8 text-cointrack-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm font-medium text-cointrack-dark dark:text-cointrack-light">Connect Broker</span>
                        </Link>

                        <Link
                            href="/analytics"
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-cointrack-secondary/10 to-cointrack-secondary/5 hover:from-cointrack-secondary/20 hover:to-cointrack-secondary/10 rounded-lg transition-colors"
                        >
                            <svg className="w-8 h-8 text-cointrack-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-cointrack-dark dark:text-cointrack-light">View Analytics</span>
                        </Link>

                        <Link
                            href="/calculator"
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 rounded-lg transition-colors"
                        >
                            <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L12.732 4.5c-.77-.833-1.732-.833-2.502 0L1.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-sm font-medium text-cointrack-dark dark:text-cointrack-light">Calculators</span>
                        </Link>

                        <Link
                            href="/profile"
                            className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10 rounded-lg transition-colors"
                        >
                            <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium text-cointrack-dark dark:text-cointrack-light">Profile</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

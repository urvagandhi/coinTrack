'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveMarket } from '@/hooks/useLiveMarket';

export default function Header({ onMenuClick, isMobile }) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, logout } = useAuth();
    const { marketData, isConnected } = useLiveMarket();
    const router = useRouter();

    // Initialize theme
    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'light';
        setIsDarkMode(theme === 'dark');
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <header className="sticky top-0 z-30 border-b border-cointrack-light/20 dark:border-cointrack-dark/20 bg-white/80 dark:bg-cointrack-dark-card/80 backdrop-blur-lg">
            <div className="flex h-16 items-center justify-between px-4 lg:px-8">
                {/* Left section */}
                <div className="flex items-center space-x-3">
                    {/* Mobile menu button */}
                    {isMobile && (
                        <button
                            onClick={onMenuClick}
                            className="rounded-lg p-2 text-cointrack-dark/60 hover:bg-cointrack-light/20 hover:text-cointrack-dark dark:text-cointrack-light/60 dark:hover:bg-cointrack-dark/20 dark:hover:text-cointrack-light lg:hidden"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}

                    {/* Greeting */}
                    <div className="hidden sm:block">
                        <h1 className="text-lg font-semibold text-cointrack-dark dark:text-cointrack-light">
                            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                        </h1>
                        <p className="text-sm text-cointrack-dark/60 dark:text-cointrack-light/60">
                            Welcome back to your dashboard
                        </p>
                    </div>
                </div>

                {/* Center - Market indicators */}
                <div className="hidden items-center space-x-4 md:flex">
                    <div className="flex items-center space-x-1">
                        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-cointrack-dark/60 dark:text-cointrack-light/60">
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>

                    {marketData?.nifty && (
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-cointrack-dark/80 dark:text-cointrack-light/80">NIFTY</span>
                            <span className={`font-medium ${marketData.nifty.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {marketData.nifty.value} ({marketData.nifty.change >= 0 ? '+' : ''}{marketData.nifty.change}%)
                            </span>
                        </div>
                    )}
                </div>

                {/* Right section */}
                <div className="flex items-center space-x-2">
                    {/* Theme toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleTheme}
                        className="rounded-lg p-2 text-cointrack-dark/60 hover:bg-cointrack-light/20 hover:text-cointrack-dark dark:text-cointrack-light/60 dark:hover:bg-cointrack-dark/20 dark:hover:text-cointrack-light"
                    >
                        {isDarkMode ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </motion.button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative rounded-lg p-2 text-cointrack-dark/60 hover:bg-cointrack-light/20 hover:text-cointrack-dark dark:text-cointrack-light/60 dark:hover:bg-cointrack-dark/20 dark:hover:text-cointrack-light"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9a7 7 0 10-14 0v3l-5 5h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                                2
                            </span>
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-80 rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 bg-white dark:bg-cointrack-dark-card shadow-xl"
                                >
                                    <div className="p-4">
                                        <h3 className="font-semibold text-cointrack-dark dark:text-cointrack-light mb-3">
                                            Notifications
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                                    Portfolio value increased by 2.5% today
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                    2 hours ago
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                                                <p className="text-sm text-green-800 dark:text-green-200">
                                                    Zerodha sync completed successfully
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                    1 day ago
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center space-x-2 rounded-lg bg-cointrack-light/20 dark:bg-cointrack-dark/20 p-2 text-cointrack-dark hover:bg-cointrack-light/30 dark:text-cointrack-light dark:hover:bg-cointrack-dark/30"
                        >
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cointrack-primary to-cointrack-secondary flex items-center justify-center text-white font-medium">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="hidden text-sm font-medium sm:block">
                                {user?.name?.split(' ')[0] || 'User'}
                            </span>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-56 rounded-xl border border-cointrack-light/20 dark:border-cointrack-dark/20 bg-white dark:bg-cointrack-dark-card shadow-xl"
                                >
                                    <div className="p-2">
                                        <div className="border-b border-cointrack-light/20 dark:border-cointrack-dark/20 px-3 py-2">
                                            <p className="text-sm font-medium text-cointrack-dark dark:text-cointrack-light">
                                                {user?.name || 'User'}
                                            </p>
                                            <p className="text-xs text-cointrack-dark/60 dark:text-cointrack-light/60">
                                                {user?.email || 'user@example.com'}
                                            </p>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    router.push('/profile');
                                                    setShowUserMenu(false);
                                                }}
                                                className="flex w-full items-center px-3 py-2 text-sm text-cointrack-dark hover:bg-cointrack-light/20 dark:text-cointrack-light dark:hover:bg-cointrack-dark/20 rounded-lg"
                                            >
                                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Profile
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Close dropdowns when clicking outside */}
            {(showUserMenu || showNotifications) && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => {
                        setShowUserMenu(false);
                        setShowNotifications(false);
                    }}
                />
            )}
        </header>
    );
}
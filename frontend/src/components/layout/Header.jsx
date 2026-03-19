'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBrokerSummary } from '@/hooks/useBrokerConnection';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LogOut, Moon, Plus, Shield, Sun, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Route label mapping ─────────────────────────────────────────

const ROUTE_LABELS = {
    dashboard: 'Dashboard',
    portfolio: 'Portfolio',
    brokers: 'Brokers',
    calculators: 'Calculators',
    notes: 'Notes',
    profile: 'Profile',
    settings: 'Settings',
    '2fa-settings': '2FA Settings',
    zerodha: 'Zerodha',
    angelone: 'Angel One',
    upstox: 'Upstox',
    callback: 'Connecting...',
    investment: 'Investment',
    savings: 'Savings',
    loans: 'Loans',
    tax: 'Tax',
    trading: 'Trading',
    planning: 'Planning',
    holdings: 'Holdings',
    positions: 'Positions',
    orders: 'Orders',
    funds: 'Funds',
};

// ── Breadcrumb generator ────────────────────────────────────────

function generateBreadcrumbs(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const label =
            ROUTE_LABELS[segment] ||
            segment
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
        const isLast = index === segments.length - 1;
        return { href, label, isLast };
    });
}

// ── Broker status pill ──────────────────────────────────────────

function BrokerStatusPill() {
    const { connectedCount, hasExpired, hasExpiringSoon, isLoading } = useBrokerSummary();

    if (isLoading) return null;

    if (connectedCount === 0 && !hasExpired) {
        return (
            <Link href="/brokers">
                <button className="hidden sm:flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium transition-transform active:scale-95 shadow-lg shadow-purple-500/10 dark:shadow-purple-500/20">
                    <Plus size={14} />
                    <span>Connect Broker</span>
                </button>
            </Link>
        );
    }

    const variant = hasExpired
        ? { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-600', label: 'Token expired' }
        : hasExpiringSoon
            ? { bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-600', label: 'Expiring soon' }
            : { bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-600', label: `${connectedCount} connected` };

    return (
        <Link href="/brokers">
            <button className={cn(
                'hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
                variant.bg, variant.text
            )}>
                <div className={cn('w-1.5 h-1.5 rounded-full', variant.dot)} />
                {variant.label}
            </button>
        </Link>
    );
}

// ── Profile dropdown ────────────────────────────────────────────

function ProfileDropdown({ user, onLogout }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const displayName = user?.name || user?.username || 'Account';
    const displayEmail = user?.email || '';

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleLogout = useCallback(async () => {
        setIsOpen(false);
        await onLogout();
    }, [onLogout]);

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center gap-3"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{displayEmail}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 p-0.5 cursor-pointer shadow-md">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                        alt="Profile"
                        className="w-full h-full rounded-full bg-white dark:bg-black"
                    />
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 4 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                                   rounded-xl shadow-lg py-1 z-50"
                    >
                        {/* User info header */}
                        <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 mx-1 px-2.5 py-2 rounded-lg text-sm
                                           text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                                           hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <UserCircle size={16} />
                                Profile
                            </Link>
                            <Link
                                href="/settings/2fa-settings"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 mx-1 px-2.5 py-2 rounded-lg text-sm
                                           text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                                           hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <Shield size={16} />
                                2FA Settings
                            </Link>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-800 py-1">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2.5 mx-1 px-2.5 py-2 rounded-lg text-sm w-[calc(100%-8px)]
                                           text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600
                                           transition-colors"
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Header component ────────────────────────────────────────────

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();

    const breadcrumbs = generateBreadcrumbs(pathname);

    return (
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30
            bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-sm transition-colors duration-300
        ">
            {/* Left: Breadcrumb / Title */}
            <div className="flex items-center gap-2">
                <button
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={onMenuClick}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                        Home
                    </Link>
                    {breadcrumbs.map((crumb) => (
                        <div key={crumb.href} className="flex items-center">
                            <ChevronRight className="w-4 h-4 mx-1" />
                            {crumb.isLast ? (
                                <span className="text-gray-900 dark:text-white font-semibold">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link href={crumb.href} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                                    {crumb.label}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <BrokerStatusPill />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Profile */}
                <div className="flex items-center pl-4 border-l border-gray-200 dark:border-gray-800">
                    <ProfileDropdown user={user} onLogout={logout} />
                </div>
            </div>
        </header>
    );
}

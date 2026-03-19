'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useBrokerSummary } from '@/hooks/useBrokerConnection';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Building2,
    Calculator,
    LayoutDashboard,
    LogOut,
    StickyNote,
    TrendingUp,
    UserCircle,
    X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Navigation config ───────────────────────────────────────────

const NAV_ITEMS = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard, matchPaths: ['/dashboard'] },
    { label: 'Portfolio', href: '/portfolio', icon: TrendingUp, matchPaths: ['/portfolio'] },
    { label: 'Broker Integration', href: '/brokers', icon: Building2, matchPaths: ['/brokers'] },
    { label: 'Calculators', href: '/calculators', icon: Calculator, matchPaths: ['/calculators'] },
    { label: 'Notes', href: '/notes', icon: StickyNote, matchPaths: ['/notes'] },
];

const BOTTOM_ITEMS = [
    { label: 'Edit Profile', href: '/profile', icon: UserCircle, matchPaths: ['/profile', '/settings'] },
];

// ── Active route detection (prefix matching) ────────────────────

const isItemActive = (item, pathname) =>
    item.matchPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));

// ── Sidebar nav item ────────────────────────────────────────────

function SidebarNavItem({ item, isActive, isExpanded, badge, isDanger = false, onClick }) {
    const Icon = item.icon;

    const content = (
        <div
            className={`
                group flex items-center ${isExpanded ? 'justify-start px-3 gap-3' : 'justify-center'}
                h-12 mb-2 rounded-xl transition-all duration-300 relative
                ${isActive
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-500 shadow-sm border border-orange-500/20'
                    : isDanger
                        ? 'text-red-500 hover:bg-red-500/10'
                        : 'text-gray-500 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:bg-white/5'
                }
                ${isExpanded ? 'w-full' : 'w-12'}
            `}
        >
            <Icon className={`flex-shrink-0 w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />

            {/* Label for expanded state */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap overflow-hidden"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Badge (expanded) */}
            <AnimatePresence>
                {isExpanded && badge && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}
                    >
                        {badge.text}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Badge dot (collapsed) */}
            {!isExpanded && badge && (
                <div className={`absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full ${badge.dotColor}`} />
            )}

            {/* Tooltip for collapsed state */}
            {!isExpanded && (
                <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none md:block hidden">
                    {item.label}
                </span>
            )}

            {/* Active Indicator Bar (Left) */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            )}
        </div>
    );

    if (item.href === '#') {
        return (
            <button onClick={onClick} className="w-full text-left">
                {content}
            </button>
        );
    }

    return (
        <Link href={item.href} onClick={onClick}>
            {content}
        </Link>
    );
}

// ── Main Sidebar Component ──────────────────────────────────────

export default function Sidebar({ isMobile = false, onClose }) {
    const { logout } = useAuth();
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);
    const { connectedCount, hasExpired, hasExpiringSoon } = useBrokerSummary();

    const isExpanded = isMobile || isHovered;

    // Close mobile drawer on route change
    const prevPathnameRef = useRef(pathname);
    useEffect(() => {
        if (prevPathnameRef.current !== pathname && isMobile && onClose) {
            onClose();
        }
        prevPathnameRef.current = pathname;
    }, [pathname, isMobile, onClose]);

    // Close on Escape key
    useEffect(() => {
        if (!isMobile) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape' && onClose) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isMobile, onClose]);

    const handleLogout = useCallback(async (e) => {
        e.preventDefault();
        await logout();
    }, [logout]);

    const handleItemClick = useCallback(() => {
        if (isMobile && onClose) onClose();
    }, [isMobile, onClose]);

    // Broker badge config
    const brokerBadge = (() => {
        if (hasExpired) {
            return { text: 'Reconnect', className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', dotColor: 'bg-red-600' };
        }
        if (hasExpiringSoon) {
            return { text: 'Expiring', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', dotColor: 'bg-amber-600' };
        }
        if (connectedCount > 0) {
            return { text: `${connectedCount} active`, className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', dotColor: 'bg-green-600' };
        }
        return null;
    })();

    return (
        <motion.aside
            onMouseEnter={isMobile ? undefined : () => setIsHovered(true)}
            onMouseLeave={isMobile ? undefined : () => setIsHovered(false)}
            animate={isMobile ? undefined : { width: isExpanded ? 256 : 80 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`
                h-full py-6 flex flex-col items-center
                bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-r border-white/50 dark:border-white/10
                ${isMobile ? 'w-64' : ''}
            `}
        >
            {/* Mobile Close Button */}
            {isMobile && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            )}

            {/* Logo/Brand Icon */}
            <div className="mb-8 w-full flex justify-center overflow-hidden">
                <Link href="/dashboard" className={`transition-all duration-300 flex items-center gap-3 ${isExpanded ? 'px-4 w-full' : 'justify-center w-10'}`}>
                    <div className="w-10 h-10 relative flex-shrink-0">
                        <Image
                            src="/coinTrack.png"
                            alt="coinTrack logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="font-bold text-xl text-gray-900 dark:text-white whitespace-nowrap"
                            >
                                coinTrack
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 w-full px-4 flex flex-col gap-2 overflow-x-hidden scrollbar-hide overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={isItemActive(item, pathname)}
                        isExpanded={isExpanded}
                        badge={item.href === '/brokers' ? brokerBadge : null}
                        onClick={handleItemClick}
                    />
                ))}
            </nav>

            {/* Bottom Navigation */}
            <div className="w-full px-4 flex flex-col gap-2 overflow-x-hidden mt-4">
                {BOTTOM_ITEMS.map((item) => (
                    <SidebarNavItem
                        key={item.href}
                        item={item}
                        isActive={isItemActive(item, pathname)}
                        isExpanded={isExpanded}
                        onClick={handleItemClick}
                    />
                ))}

                {/* Logout button */}
                <SidebarNavItem
                    item={{ label: 'Log Out', href: '#', icon: LogOut, matchPaths: [] }}
                    isActive={false}
                    isExpanded={isExpanded}
                    isDanger={true}
                    onClick={handleLogout}
                />
            </div>
        </motion.aside>
    );
}

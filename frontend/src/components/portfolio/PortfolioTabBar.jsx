// src/components/portfolio/PortfolioTabBar.jsx
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TAB_GROUPS = [
    {
        label: 'Portfolio',
        tabs: [
            { id: 'holdings', label: 'Holdings' },
            { id: 'positions', label: 'Positions' },
        ],
    },
    {
        label: 'Activity',
        tabs: [
            { id: 'orders', label: 'Orders' },
            { id: 'trades', label: 'Trades' },
        ],
    },
    {
        label: 'Mutual Funds',
        tabs: [
            { id: 'mf-holdings', label: 'MF Holdings' },
            { id: 'mf-orders', label: 'MF Orders' },
            { id: 'mf-sips', label: 'SIPs' },
            { id: 'mf-timeline', label: 'Timeline' },
            { id: 'mf-instruments', label: 'Instruments' },
        ],
    },
    {
        label: 'Account',
        tabs: [
            { id: 'profile', label: 'Profile' },
        ],
    },
];

export function PortfolioTabBar({ activeTab, onTabChange, counts }) {
    return (
        <div className="bg-card border border-border rounded-xl p-3 overflow-x-auto
                        [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-6 min-w-max">
                {TAB_GROUPS.map((group) => (
                    <div key={group.label}>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 px-1">
                            {group.label}
                        </p>
                        <div className="flex gap-1">
                            {group.tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const count = counts?.[tab.id];

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={cn(
                                            'relative px-3 h-8 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                                            isActive
                                                ? 'text-white'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="portfolio-tab-indicator"
                                                className="absolute inset-0 bg-blue-600 rounded-lg"
                                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center">
                                            {tab.label}
                                            {count != null && count > 0 && (
                                                <span className={cn(
                                                    'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-accent text-muted-foreground'
                                                )}>
                                                    {count}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

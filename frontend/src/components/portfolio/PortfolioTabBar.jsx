'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TAB_GROUPS = [
    {
        label: 'Equity',
        tabs: [
            { id: 'holdings',  label: 'Holdings' },
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
            { id: 'mf-holdings',    label: 'MF Holdings' },
            { id: 'mf-orders',      label: 'MF Orders' },
            { id: 'mf-sips',        label: 'SIPs' },
            { id: 'mf-timeline',    label: 'Timeline' },
            { id: 'mf-instruments', label: 'Instruments' },
        ],
    },
    {
        label: 'Account',
        tabs: [
            { id: 'profile', label: 'Brokers' },
        ],
    },
];

export function PortfolioTabBar({ activeTab, onTabChange, counts }) {
    return (
        <nav
            className="ed-card overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            <div className="flex gap-0 min-w-max divide-x divide-border">
                {TAB_GROUPS.map((group) => (
                    <div key={group.label} className="px-4 py-3 first:pl-5 last:pr-5">
                        <p className="eyebrow mb-2">
                            <span className="index-num tnum mr-2">·</span>
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
                                            'relative h-8 px-3 text-[12px] font-medium tracking-tight whitespace-nowrap transition-colors rounded-sm',
                                            isActive
                                                ? 'text-foreground'
                                                : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="portfolio-tab-underline"
                                                className="absolute -bottom-px left-0 right-0 h-[2px] bg-[hsl(var(--accent))]"
                                                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                            />
                                        )}
                                        <span className="relative z-10 inline-flex items-center">
                                            {tab.label}
                                            {count != null && count > 0 && (
                                                <span className={cn(
                                                    'ml-1.5 px-1 font-mono tnum text-[10px] rounded-sm',
                                                    isActive ? 'text-[hsl(var(--accent))]' : 'text-muted-foreground',
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
        </nav>
    );
}

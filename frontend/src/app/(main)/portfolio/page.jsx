// src/app/(main)/portfolio/page.jsx
'use client';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { PortfolioTabBar } from '@/components/portfolio/PortfolioTabBar';
import { HoldingsTab } from '@/components/portfolio/tabs/HoldingsTab';
import { MfHoldingsTab } from '@/components/portfolio/tabs/MfHoldingsTab';
import { MfInstrumentsTab } from '@/components/portfolio/tabs/MfInstrumentsTab';
import { MfOrdersTab } from '@/components/portfolio/tabs/MfOrdersTab';
import { MfSipsTab } from '@/components/portfolio/tabs/MfSipsTab';
import { MfTimelineTab } from '@/components/portfolio/tabs/MfTimelineTab';
import { OrdersTab } from '@/components/portfolio/tabs/OrdersTab';
import { PositionsTab } from '@/components/portfolio/tabs/PositionsTab';
import { ProfileTab } from '@/components/portfolio/tabs/ProfileTab';
import { TabLoadingSkeleton } from '@/components/portfolio/tabs/TabLoadingSkeleton';
import { TradesTab } from '@/components/portfolio/tabs/TradesTab';
import { usePortfolioFunds } from '@/hooks/usePortfolioFunds';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { usePortfolioTab } from '@/hooks/usePortfolioTab';
import { formatCurrency, formatPercent } from '@/lib/format';
import { containerVariants, pageVariants, useMotionVariants } from '@/lib/motion';
import { motion } from 'framer-motion';
import { Banknote, BarChart3, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Suspense } from 'react';

const TAB_COMPONENTS = {
    holdings: HoldingsTab,
    positions: PositionsTab,
    orders: OrdersTab,
    trades: TradesTab,
    profile: ProfileTab,
    'mf-holdings': MfHoldingsTab,
    'mf-orders': MfOrdersTab,
    'mf-sips': MfSipsTab,
    'mf-timeline': MfTimelineTab,
    'mf-instruments': MfInstrumentsTab,
};

function SummaryStats({ summary, funds, isLoading }) {
    const container = useMotionVariants(containerVariants);

    const dayGain = summary?.totalDayGain ?? 0;
    const dayGainPos = dayGain >= 0;
    const unrealized = summary?.totalUnrealizedPL ?? 0;
    const unrealizedPos = unrealized >= 0;

    // Extract available cash from funds data
    const availableCash = funds?.equity?.net ?? funds?.availableCash ?? funds?.net ?? null;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
            <StatsCard
                label="Portfolio Value"
                value={formatCurrency(summary?.totalCurrentValue)}
                accentColor="brand"
                icon={Wallet}
                isLoading={isLoading}
            />
            <StatsCard
                label="Amount Invested"
                value={formatCurrency(summary?.totalInvestedValue)}
                accentColor="muted"
                icon={PiggyBank}
                isLoading={isLoading}
            />
            <StatsCard
                label="Unrealized P&L"
                value={formatCurrency(unrealized, { showSign: true })}
                changePercent={formatPercent(summary?.totalUnrealizedPLPercent, { showSign: true })}
                isPositive={unrealizedPos}
                accentColor={unrealizedPos ? 'success' : 'danger'}
                icon={BarChart3}
                isLoading={isLoading}
            />
            <StatsCard
                label="Available Cash"
                value={formatCurrency(availableCash)}
                accentColor="muted"
                icon={Banknote}
                isLoading={isLoading}
            />
        </motion.div>
    );
}

export default function PortfolioPage() {
    const { activeTab, setTab, navigateTo, getContext } = usePortfolioTab();
    const summaryQuery = usePortfolioSummary();
    const fundsQuery = usePortfolioFunds();
    const pageV = useMotionVariants(pageVariants);

    const ActiveTab = TAB_COMPONENTS[activeTab] || HoldingsTab;
    const context = getContext();

    return (
        <motion.div
            variants={pageV}
            initial="initial"
            animate="animate"
            className="space-y-6"
        >
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-foreground">Portfolio</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">All your investments in one place</p>
                </div>
                <RefreshButton />
            </div>

            {/* Summary stat cards */}
            <SummaryStats
                summary={summaryQuery.data}
                funds={fundsQuery.data}
                isLoading={summaryQuery.isLoading || fundsQuery.isLoading}
            />

            {/* Tab bar */}
            <PortfolioTabBar activeTab={activeTab} onTabChange={setTab} />

            {/* Active tab content */}
            <Suspense fallback={<TabLoadingSkeleton />}>
                <ActiveTab navigateTo={navigateTo} context={context} />
            </Suspense>
        </motion.div>
    );
}

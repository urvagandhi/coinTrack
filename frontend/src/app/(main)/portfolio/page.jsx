'use client';

import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { StatsCard } from '@/components/dashboard/StatsCard';
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
import { Banknote, BarChart3, PiggyBank, Wallet } from 'lucide-react';
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
    const unrealized = summary?.totalUnrealizedPL ?? 0;
    const unrealizedPos = unrealized >= 0;
    const availableCash = funds?.equity?.net ?? funds?.availableCash ?? funds?.net ?? null;

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 stagger-fade">
            <StatsCard
                index={1}
                label="Portfolio Value"
                value={formatCurrency(summary?.totalCurrentValue)}
                icon={Wallet}
                isLoading={isLoading}
            />
            <StatsCard
                index={2}
                label="Invested"
                value={formatCurrency(summary?.totalInvestedValue)}
                icon={PiggyBank}
                isLoading={isLoading}
            />
            <StatsCard
                index={3}
                label="Unrealized"
                value={formatCurrency(unrealized, { showSign: true })}
                changePercent={formatPercent(summary?.totalUnrealizedPLPercent, { showSign: true })}
                isPositive={unrealizedPos}
                accentColor={unrealizedPos ? 'success' : 'danger'}
                icon={BarChart3}
                isLoading={isLoading}
            />
            <StatsCard
                index={4}
                label="Cash"
                value={formatCurrency(availableCash)}
                icon={Banknote}
                isLoading={isLoading}
            />
        </div>
    );
}

export default function PortfolioPage() {
    const { activeTab, setTab, navigateTo, getContext } = usePortfolioTab();
    const summaryQuery = usePortfolioSummary();
    const fundsQuery = usePortfolioFunds();

    const ActiveTab = TAB_COMPONENTS[activeTab] || HoldingsTab;
    const context = getContext();

    return (
        <div className="space-y-8">
            <header className="pb-6 border-b border-hairline flex items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="index-num">FOLIO·§02</span>
                        <span className="h-px w-8 bg-hairline" />
                        <span className="eyebrow">Portfolio Ledger</span>
                    </div>
                    <h1 className="display-serif text-[40px] md:text-[56px] text-foreground">
                        The <span className="italic">Holdings</span> Page
                    </h1>
                    <p className="text-[13px] text-muted-foreground max-w-md font-serif italic">
                        Every position, every order, every trade — under one banner.
                    </p>
                </div>
                <RefreshButton />
            </header>

            <SummaryStats
                summary={summaryQuery.data}
                funds={fundsQuery.data}
                isLoading={summaryQuery.isLoading || fundsQuery.isLoading}
            />

            <PortfolioTabBar activeTab={activeTab} onTabChange={setTab} />

            <Suspense fallback={<TabLoadingSkeleton />}>
                <ActiveTab navigateTo={navigateTo} context={context} />
            </Suspense>
        </div>
    );
}

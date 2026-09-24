'use client';

import { RefreshButton, StatsCard } from '@/features/dashboard';
import { formatCurrency, formatPercent } from '@/shared/formatters';
import { Banknote, BarChart3, PiggyBank, Wallet } from 'lucide-react';
import { Suspense } from 'react';
import { usePortfolioFunds } from '../hooks/usePortfolioFunds';
import { usePortfolioSummary } from '../hooks/usePortfolioSummary';
import { usePortfolioTab } from '../hooks/usePortfolioTab';
import { HoldingsTab } from './HoldingsTab';
import { MfHoldingsTab } from './MfHoldingsTab';
import { MfInstrumentsTab } from './MfInstrumentsTab';
import { MfOrdersTab } from './MfOrdersTab';
import { MfSipsTab } from './MfSipsTab';
import { MfTimelineTab } from './MfTimelineTab';
import { OrdersTab } from './OrdersTab';
import { PortfolioTabBar } from './PortfolioTabBar';
import { PositionsTab } from './PositionsTab';
import { ProfileTab } from './ProfileTab';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';
import { TradesTab } from './TradesTab';

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
  const availableCash =
    funds?.equity?.net ?? funds?.availableCash ?? funds?.net ?? null;

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 stagger-fade'>
      <StatsCard
        index={1}
        label='Portfolio Value'
        value={formatCurrency(summary?.totalCurrentValue)}
        icon={Wallet}
        isLoading={isLoading}
      />
      <StatsCard
        index={2}
        label='Invested'
        value={formatCurrency(summary?.totalInvestedValue)}
        icon={PiggyBank}
        isLoading={isLoading}
      />
      <StatsCard
        index={3}
        label='Unrealized'
        value={formatCurrency(unrealized, { showSign: true })}
        changePercent={formatPercent(summary?.totalUnrealizedPLPercent, {
          showSign: true,
        })}
        isPositive={unrealizedPos}
        accentColor={unrealizedPos ? 'success' : 'danger'}
        icon={BarChart3}
        isLoading={isLoading}
      />
      <StatsCard
        index={4}
        label='Cash'
        value={formatCurrency(availableCash)}
        icon={Banknote}
        isLoading={isLoading}
      />
    </div>
  );
}

export function PortfolioView() {
  const { activeTab, setTab, navigateTo, getContext } = usePortfolioTab();
  const summaryQuery = usePortfolioSummary();
  const fundsQuery = usePortfolioFunds();

  const ActiveTab = TAB_COMPONENTS[activeTab] || HoldingsTab;
  const context = getContext();

  return (
    <div className='space-y-8'>
      <header className='pb-6 border-b border-hairline flex items-end justify-between gap-6'>
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <span className='index-num'>FOLIO·§02</span>
            <span className='h-px w-8 bg-hairline' />
            <span className='eyebrow'>Portfolio Ledger</span>
          </div>
          <h1 className='display-serif text-[40px] md:text-[56px] text-foreground'>
            The <span className='italic'>Holdings</span> Page
          </h1>
          <p className='text-[13px] text-muted-foreground max-w-md font-serif italic'>
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

export default PortfolioView;

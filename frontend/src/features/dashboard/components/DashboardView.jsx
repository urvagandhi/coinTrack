'use client';

import { useMemo, useState } from 'react';
import { usePortfolioSummary } from '@/features/portfolio';
import { useBrokerSummary } from '@/features/brokers';
import { useAuth } from '@/shared/auth/AuthContext';
import { BrokerStatusBanner } from '@/widgets/broker-status-banner';
import { DashboardHeader } from './DashboardHeader';
import { DashboardKpiGrid } from './DashboardKpiGrid';
import { DashboardWealthChart } from './DashboardWealthChart';
import { DashboardAssetSpread } from './DashboardAssetSpread';
import { HoldingsTable } from './HoldingsTable';

export function DashboardView() {
  const { user } = useAuth();
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch,
  } = usePortfolioSummary();
  const { connectedCount, hasExpired, totalBrokers = 3 } = useBrokerSummary();
  const [timeRange, setTimeRange] = useState('6M');
  const [isSyncing, setIsSyncing] = useState(false);

  // Dynamic feed status
  const feedStatus = useMemo(() => {
    if (hasExpired) {
      return {
        label: 'Session Expired',
        dotClass: 'bg-rose-500',
      };
    }
    if (connectedCount > 0) {
      return {
        label:
          connectedCount >= totalBrokers
            ? 'All Feeds Live'
            : `${connectedCount} of ${totalBrokers} Feeds Live`,
        dotClass: 'bg-emerald-500 animate-pulse',
      };
    }
    return {
      label: 'Feeds Idle',
      dotClass: 'bg-neutral-400 dark:bg-neutral-600',
    };
  }, [connectedCount, hasExpired, totalBrokers]);

  // Dynamic current quarter & year
  const currentPeriod = useMemo(() => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `Q${quarter} ${now.getFullYear()}`;
  }, []);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      if (refetch) await refetch();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  return (
    <div className='w-full pb-8 md:pb-12 space-y-6 sm:space-y-7'>
      {/* ── 1. CONSOLIDATED WEALTH HEADER ── */}
      <DashboardHeader
        user={user}
        feedStatus={feedStatus}
        currentPeriod={currentPeriod}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onQuickSync={handleQuickSync}
        isSyncing={isSyncing}
      />

      {/* ── 2. ASYMMETRIC WEALTH BENTO PANE ── */}
      <DashboardKpiGrid
        summary={summary}
        brokerStatus={{ connectedCount, hasExpired, totalBrokers }}
        isLoading={isSummaryLoading}
      />

      {/* ── 3. TWO-COLUMN MAIN CONTENT GRID ── */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-start'>
        {/* Left Column (2/3 width): Wealth Chart + Broker Status + Holdings */}
        <div className='lg:col-span-2 space-y-6 sm:space-y-7'>
          {/* Moment 1: Master Net Worth vs Invested Curve */}
          <DashboardWealthChart summary={summary} timeRange={timeRange} />

          {/* Broker Connection Health Status */}
          <BrokerStatusBanner />

          {/* Active Holdings Table */}
          <HoldingsTable />
        </div>

        {/* Right Column (1/3 width): Moment 2: Asset Allocation Spread & Schedule */}
        <div className='space-y-6 sm:space-y-7'>
          <DashboardAssetSpread summary={summary} />
        </div>
      </div>
    </div>
  );
}

export default DashboardView;

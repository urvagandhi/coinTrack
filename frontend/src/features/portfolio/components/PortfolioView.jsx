'use client';

import { useBrokerConnection } from '@/features/brokers';
import { portfolioAPI } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { normalizeBrokerKey } from '../constants';
import { usePortfolioFunds } from '../hooks/usePortfolioFunds';
import { usePortfolioHoldings } from '../hooks/usePortfolioHoldings';
import { usePortfolioOrders } from '../hooks/usePortfolioOrders';
import { usePortfolioPositions } from '../hooks/usePortfolioPositions';
import { usePortfolioSummary } from '../hooks/usePortfolioSummary';
import { usePortfolioTab } from '../hooks/usePortfolioTab';
import { BrokerFilterPills } from './BrokerFilterPills';
import { BrokersTab } from './BrokersTab';
import { HoldingsTab } from './HoldingsTab';
import { MfHoldingsTab } from './MfHoldingsTab';
import { MfInstrumentsTab } from './MfInstrumentsTab';
import { MfOrdersTab } from './MfOrdersTab';
import { MfSipsTab } from './MfSipsTab';
import { MfTimelineTab } from './MfTimelineTab';
import { OrdersTab } from './OrdersTab';
import { PortfolioHeader } from './PortfolioHeader';
import { PortfolioHeroCard } from './PortfolioHeroCard';
import { PortfolioTabBar } from './PortfolioTabBar';
import { PositionsTab } from './PositionsTab';
import { StockDossierModal } from './StockDossierModal';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';
import { TradesTab } from './TradesTab';

const TAB_COMPONENTS = {
  holdings: HoldingsTab,
  positions: PositionsTab,
  orders: OrdersTab,
  trades: TradesTab,
  brokers: BrokersTab,
  profile: BrokersTab,
  'mf-holdings': MfHoldingsTab,
  'mf-orders': MfOrdersTab,
  'mf-sips': MfSipsTab,
  'mf-timeline': MfTimelineTab,
  'mf-instruments': MfInstrumentsTab,
};

export function PortfolioView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const brokerFromUrl = searchParams.get('broker');
  const initialBroker = brokerFromUrl || 'ALL';

  const [selectedBroker, setSelectedBroker] = useState(initialBroker);
  const [inspectPosition, setInspectPosition] = useState(null);

  // Keep selectedBroker in sync if URL query parameter ?broker= changes
  useEffect(() => {
    if (
      brokerFromUrl &&
      normalizeBrokerKey(brokerFromUrl) !== normalizeBrokerKey(selectedBroker)
    ) {
      setSelectedBroker(brokerFromUrl);
    }
  }, [brokerFromUrl]);

  const { activeTab, setTab, navigateTo, getContext } = usePortfolioTab();
  const { user } = useAuth();

  const summaryQuery = usePortfolioSummary();
  const fundsQuery = usePortfolioFunds();
  const holdingsQuery = usePortfolioHoldings();
  const positionsQuery = usePortfolioPositions();
  const ordersQuery = usePortfolioOrders();
  const { data: syncData } = useBrokerConnection();

  const normKey = normalizeBrokerKey(selectedBroker);
  const isZerodha = normKey === 'ZERODHA';

  // Live queries for trades, MF holdings, MF orders, and MF SIPs
  const tradesQuery = useQuery({
    queryKey: ['portfolio', 'trades'],
    queryFn: portfolioAPI.getTrades,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const mfHoldingsQuery = useQuery({
    queryKey: ['portfolio', 'mf-holdings'],
    queryFn: portfolioAPI.getMfHoldings,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isZerodha,
  });

  const mfOrdersQuery = useQuery({
    queryKey: ['portfolio', 'mf-orders'],
    queryFn: portfolioAPI.getMfOrders,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isZerodha,
  });

  const mfSipsQuery = useQuery({
    queryKey: ['portfolio', 'mf-sips'],
    queryFn: portfolioAPI.getMfSips,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isZerodha,
  });

  const holdings = useMemo(
    () =>
      Array.isArray(holdingsQuery.data)
        ? holdingsQuery.data
        : holdingsQuery.data?.data || [],
    [holdingsQuery.data]
  );
  const brokerStatuses = syncData?.brokers || [];

  const handleSelectBroker = brokerKey => {
    setSelectedBroker(brokerKey);
    const targetNorm = normalizeBrokerKey(brokerKey);

    const params = new URLSearchParams(searchParams.toString());
    if (targetNorm === 'ALL') {
      params.delete('broker');
    } else {
      params.set('broker', brokerKey.toLowerCase());
    }

    // If switching to ALL demats, reset tab to 'holdings'
    if (targetNorm === 'ALL') {
      params.set('tab', 'holdings');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      return;
    }

    // If switching to broker that does not support MF and tab is currently MF, reset to holdings
    if (targetNorm !== 'ZERODHA' && activeTab.startsWith('mf-')) {
      params.set('tab', 'holdings');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Compute live scoped positions and counts
  const scopedHoldings = useMemo(() => {
    if (normKey === 'ALL') return holdings;
    return holdings.filter(
      h => normalizeBrokerKey(h.broker || h.brokerType) === normKey
    );
  }, [holdings, normKey]);

  // 100% Dynamic tab counts strictly derived from live backend responses
  const tabCounts = useMemo(() => {
    const positionsList = Array.isArray(positionsQuery.data)
      ? positionsQuery.data
      : positionsQuery.data?.data || [];
    const ordersList = Array.isArray(ordersQuery.data)
      ? ordersQuery.data
      : ordersQuery.data?.data || [];
    const tradesList = Array.isArray(tradesQuery.data)
      ? tradesQuery.data
      : tradesQuery.data?.data || [];

    const mfHoldingsList = Array.isArray(mfHoldingsQuery.data)
      ? mfHoldingsQuery.data
      : mfHoldingsQuery.data?.data || [];
    const mfOrdersList = Array.isArray(mfOrdersQuery.data)
      ? mfOrdersQuery.data
      : mfOrdersQuery.data?.data || [];
    const mfSipsList = Array.isArray(mfSipsQuery.data?.data)
      ? mfSipsQuery.data.data
      : Array.isArray(mfSipsQuery.data)
        ? mfSipsQuery.data
        : [];

    const scopedPositions =
      normKey === 'ALL'
        ? positionsList
        : positionsList.filter(
            p => normalizeBrokerKey(p.broker || p.brokerType) === normKey
          );

    const scopedOrders =
      normKey === 'ALL'
        ? ordersList
        : ordersList.filter(
            o => normalizeBrokerKey(o.broker || o.brokerType) === normKey
          );

    const scopedTrades =
      normKey === 'ALL'
        ? tradesList
        : tradesList.filter(
            t => normalizeBrokerKey(t.broker || t.brokerType) === normKey
          );

    return {
      holdings: scopedHoldings.length,
      positions: scopedPositions.length,
      orders: scopedOrders.length,
      trades: scopedTrades.length,
      'mf-holdings': isZerodha ? mfHoldingsList.length : 0,
      'mf-orders': isZerodha ? mfOrdersList.length : 0,
      'mf-sips': isZerodha ? mfSipsList.length : 0,
      brokers: 1,
    };
  }, [
    scopedHoldings.length,
    positionsQuery.data,
    ordersQuery.data,
    tradesQuery.data,
    mfHoldingsQuery.data,
    mfOrdersQuery.data,
    mfSipsQuery.data,
    normKey,
    isZerodha,
  ]);

  const ActiveTab = TAB_COMPONENTS[activeTab] || HoldingsTab;
  const context = getContext();

  return (
    <div className='space-y-6 pb-12'>
      {/* ── 1. MODERN EDITORIAL HEADER ── */}
      <PortfolioHeader
        selectedBroker={selectedBroker}
        brokerStatus={brokerStatuses}
      />

      {/* ── 2. VALUATION BENTO & 3D PHYSICAL IC DEMAT CARD ── */}
      <PortfolioHeroCard
        summary={summaryQuery.data}
        funds={fundsQuery.data}
        selectedBroker={selectedBroker}
        holdings={holdings}
        brokerStatus={brokerStatuses}
        user={user}
        isLoading={summaryQuery.isLoading || fundsQuery.isLoading}
      />

      {/* ── 3. BROKER FILTER PILLS STRIP ── */}
      <BrokerFilterPills
        selectedBroker={selectedBroker}
        onSelectBroker={handleSelectBroker}
        holdings={holdings}
        brokerStatus={brokerStatuses}
      />

      {/* ── 4. CATEGORIZED TAB NAVIGATION (HIDDEN IN ALL DEMATS) ── */}
      <PortfolioTabBar
        selectedBroker={selectedBroker}
        activeTab={activeTab}
        onTabChange={setTab}
        counts={tabCounts}
      />

      {/* ── 5. ACTIVE TAB VIEW ── */}
      <Suspense fallback={<TabLoadingSkeleton />}>
        {activeTab === 'holdings' ? (
          <HoldingsTab
            selectedBroker={selectedBroker}
            onInspect={setInspectPosition}
          />
        ) : activeTab === 'positions' ? (
          <PositionsTab
            selectedBroker={selectedBroker}
            onInspect={setInspectPosition}
          />
        ) : activeTab === 'orders' ? (
          <OrdersTab selectedBroker={selectedBroker} />
        ) : activeTab === 'trades' ? (
          <TradesTab selectedBroker={selectedBroker} />
        ) : activeTab === 'brokers' || activeTab === 'profile' ? (
          <BrokersTab selectedBroker={selectedBroker} onTabChange={setTab} />
        ) : (
          <ActiveTab
            navigateTo={navigateTo}
            context={context}
            selectedBroker={selectedBroker}
            onInspect={setInspectPosition}
          />
        )}
      </Suspense>

      {/* ── 6. STOCK DOSSIER MODAL ── */}
      <StockDossierModal
        isOpen={Boolean(inspectPosition)}
        position={inspectPosition}
        onClose={() => setInspectPosition(null)}
      />
    </div>
  );
}

export default PortfolioView;

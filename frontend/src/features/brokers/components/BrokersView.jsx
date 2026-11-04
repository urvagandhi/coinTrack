'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { portfolioAPI } from '@/shared/api/client';
import { BROKER_LIST } from '../constants';
import {
  useBrokerConnection,
  invalidateBrokerQueries,
} from '../hooks/useBrokerConnection';
import { BrokersHeader } from './BrokersHeader';
import { BrokersKpiGrid } from './BrokersKpiGrid';
import { BrokersFilterToolbar } from './BrokersFilterToolbar';
import { BrokerCard } from './BrokerCard';
import { BrokersSecurityNotice } from './BrokersSecurityNotice';

export function BrokersView() {
  const { data: syncData, isLoading } = useBrokerConnection();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'connected' | 'available'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const brokers = syncData?.brokers ?? [];
  const connectedBrokers = brokers.filter(b => b.tokenActive);
  const connectedCount = connectedBrokers.length;
  const totalBrokers = BROKER_LIST.length;
  const hasExpired = brokers.some(b => !b.tokenActive && b.lastStatus !== null);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    try {
      await portfolioAPI.manualRefresh();
      toast.success('Holdings and market feeds synchronized');
      await invalidateBrokerQueries(queryClient);
    } catch (err) {
      toast.error(err?.message || 'Sync failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredBrokers = useMemo(() => {
    return BROKER_LIST.filter(broker => {
      const brokerStatus = brokers.find(b => b.broker === broker.key);
      const isConn = brokerStatus?.tokenActive ?? false;

      if (activeFilter === 'connected' && !isConn) return false;
      if (activeFilter === 'available' && isConn) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = broker.displayName.toLowerCase().includes(query);
        const matchesTag = broker.tagline.toLowerCase().includes(query);
        const matchesCaps = (broker.capabilities || []).some(c =>
          c.toLowerCase().includes(query)
        );
        return matchesName || matchesTag || matchesCaps;
      }

      return true;
    });
  }, [brokers, activeFilter, search]);

  const counts = {
    all: totalBrokers,
    connected: connectedCount,
    available: totalBrokers - connectedCount,
  };

  return (
    <div className='w-full pb-8 md:pb-12 space-y-6 sm:space-y-7'>
      {/* ── 1. HEADER ── */}
      <BrokersHeader
        connectedCount={connectedCount}
        isRefreshing={isRefreshing}
        onRefresh={handleGlobalRefresh}
      />

      {/* ── 2. METRICS KPI ROW ── */}
      <BrokersKpiGrid
        connectedCount={connectedCount}
        totalBrokers={totalBrokers}
        hasExpired={hasExpired}
        isLoading={isLoading}
      />

      {/* ── 3. TOOLBAR (Search + Filter Tabs) ── */}
      <BrokersFilterToolbar
        search={search}
        onSearchChange={setSearch}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* ── 4. BROKER CARDS GRID ── */}
      {filteredBrokers.length > 0 ? (
        <section className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'>
          {filteredBrokers.map(broker => (
            <BrokerCard key={broker.id} broker={broker} />
          ))}
        </section>
      ) : (
        <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] p-12 text-center space-y-3'>
          <div className='size-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400'>
            <Search className='size-5' />
          </div>
          <h3 className='text-base font-semibold text-neutral-900 dark:text-neutral-100'>
            No brokers found
          </h3>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto'>
            No brokerage accounts matched your query &ldquo;{search}&rdquo;. Try
            a different term or clear filters.
          </p>
          <button
            type='button'
            onClick={() => {
              setSearch('');
              setActiveFilter('all');
            }}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer mt-1'
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── 5. SECURITY & PRIVACY NOTICE ── */}
      <BrokersSecurityNotice />
    </div>
  );
}

export default BrokersView;

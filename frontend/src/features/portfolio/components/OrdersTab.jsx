'use client';

import { formatCurrency } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { BrokerBadge } from '@/shared/ui/data-display/data-table';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { normalizeBrokerKey } from '../constants';
import { usePortfolioOrders } from '../hooks/usePortfolioOrders';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

function formatOrderTime(ord) {
  if (ord.time) return ord.time;
  const ts = ord.orderTimestamp || ord.order_timestamp || ord.exchangeTimestamp;
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleTimeString('en-IN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatOrderType(ord) {
  if (ord.type) return ord.type;
  const oType = (ord.orderType || ord.order_type || 'LIMIT').toUpperCase();
  const txType = (
    ord.transactionType ||
    ord.transaction_type ||
    'BUY'
  ).toUpperCase();
  return `${oType} ${txType}`;
}

function formatOrderSymbol(ord) {
  if (ord.symbol) return ord.symbol;
  const sym = ord.tradingsymbol || '—';
  if (ord.exchange && !sym.includes(':')) {
    return `${ord.exchange}:${sym}`;
  }
  return sym;
}

export function OrdersTab({ selectedBroker = 'ALL' }) {
  const { data: rawData, isLoading, error, refetch } = usePortfolioOrders();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('time');
  const [sortDir, setSortDir] = useState('desc');

  const normSelected = normalizeBrokerKey(selectedBroker);
  const isAll = normSelected === 'ALL';

  // 100% Dynamic: Live orders from backend API
  const brokerOrders = useMemo(() => {
    const list = Array.isArray(rawData) ? rawData : rawData?.data || [];
    if (isAll) return list;
    return list.filter(
      o => normalizeBrokerKey(o.broker || o.brokerType) === normSelected
    );
  }, [rawData, isAll, normSelected]);

  // Status Filter
  const statusFiltered = useMemo(() => {
    if (statusFilter === 'ALL') return brokerOrders;
    return brokerOrders.filter(o => {
      const st = (o.status || '').toUpperCase();
      if (statusFilter === 'COMPLETE') return st === 'COMPLETE';
      if (statusFilter === 'OPEN')
        return st === 'OPEN' || st === 'TRIGGER PENDING';
      if (statusFilter === 'CANCELLED')
        return st === 'CANCELLED' || st === 'REJECTED';
      return true;
    });
  }, [brokerOrders, statusFilter]);

  // Search filter
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return statusFiltered;
    const q = search.toLowerCase();
    return statusFiltered.filter(o => {
      const sym = formatOrderSymbol(o).toLowerCase();
      const type = formatOrderType(o).toLowerCase();
      return sym.includes(q) || type.includes(q);
    });
  }, [statusFiltered, search]);

  // Sorting
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'time') {
        aVal = formatOrderTime(a);
        bVal = formatOrderTime(b);
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortKey === 'symbol') {
        aVal = formatOrderSymbol(a);
        bVal = formatOrderSymbol(b);
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredOrders, sortKey, sortDir]);

  const handleSort = key => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isLoading) return <TabLoadingSkeleton rows={6} showKpis={false} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  return (
    <section className='space-y-4'>
      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='flex items-center gap-2 flex-wrap'>
          {['ALL', 'COMPLETE', 'OPEN', 'CANCELLED'].map(st => (
            <button
              key={st}
              type='button'
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer',
                statusFilter === st
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-semibold'
                  : 'bg-white dark:bg-[#16171a] text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              {st}
            </button>
          ))}
        </div>

        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400' />
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search symbol or type...'
            className='w-full pl-9 pr-8 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] text-xs font-mono placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-colors'
          />
          {search && (
            <button
              type='button'
              onClick={() => setSearch('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer'
            >
              <X className='size-3.5' />
            </button>
          )}
        </div>
      </div>

      {/* ── ORDERS TABLE (Exact columns: TIME, SYMBOL, TYPE, QTY, PRICE, STATUS) ── */}
      <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse text-xs font-mono'>
            <thead>
              <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                <th
                  className='py-3 pl-4 pr-3 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300'
                  onClick={() => handleSort('time')}
                >
                  <div className='flex items-center gap-1'>
                    <span>Time</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 px-3 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300'
                  onClick={() => handleSort('symbol')}
                >
                  <div className='flex items-center gap-1'>
                    <span>Symbol</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                {isAll && <th className='py-3 px-3'>Broker</th>}
                <th className='py-3 px-3'>Type</th>
                <th className='py-3 px-3 text-right'>Qty</th>
                <th className='py-3 px-3 text-right'>Price</th>
                <th className='py-3 pr-5 pl-3 text-right'>Status</th>
              </tr>
            </thead>

            <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAll ? 7 : 6}
                    className='py-12 text-center text-neutral-400'
                  >
                    No orders on record.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((ord, idx) => {
                  const time = formatOrderTime(ord);
                  const symbol = formatOrderSymbol(ord);
                  const type = formatOrderType(ord);
                  const qty =
                    ord.quantity ||
                    ord.filledQuantity ||
                    ord.filled_quantity ||
                    0;
                  const price =
                    ord.price || ord.averagePrice || ord.average_price || 0;
                  const status = (ord.status || 'COMPLETE').toUpperCase();

                  const isComplete = status === 'COMPLETE';
                  const isOpen =
                    status === 'OPEN' || status === 'TRIGGER PENDING';
                  const isCancelled =
                    status === 'CANCELLED' || status === 'REJECTED';

                  return (
                    <tr
                      key={ord.id || ord.orderId || ord.order_id || idx}
                      className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50 transition-colors'
                    >
                      <td className='py-3.5 pl-4 pr-3 text-neutral-500 whitespace-nowrap'>
                        {time}
                      </td>
                      <td className='py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100'>
                        {symbol}
                      </td>
                      {isAll && (
                        <td className='py-3.5 px-3'>
                          <BrokerBadge broker={ord.broker || ord.brokerType} />
                        </td>
                      )}
                      <td className='py-3.5 px-3 text-neutral-700 dark:text-neutral-300'>
                        {type}
                      </td>
                      <td className='py-3.5 px-3 text-right tnum'>{qty}</td>
                      <td className='py-3.5 px-3 text-right tnum'>
                        {formatCurrency(price)}
                      </td>
                      <td className='py-3.5 pr-5 pl-3 text-right'>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                            isComplete &&
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            isOpen &&
                              'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                            isCancelled &&
                              'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400'
                          )}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default OrdersTab;

'use client';

import { formatCurrency } from '@/shared/formatters';
import { BrokerBadge } from '@/shared/ui/data-display/data-table';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { portfolioAPI } from '@/shared/api/client';
import { normalizeBrokerKey } from '../constants';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

function formatTradeTime(tr) {
  if (tr.time) return tr.time;
  const ts = tr.tradeTimestamp || tr.trade_timestamp || tr.fillTimestamp;
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

function formatTradeSymbol(tr) {
  if (tr.symbol) return tr.symbol;
  const sym = tr.tradingsymbol || '—';
  if (tr.exchange && !sym.includes(':')) {
    return `${tr.exchange}:${sym}`;
  }
  return sym;
}

export function TradesTab({ selectedBroker = 'ALL' }) {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', 'trades'],
    queryFn: portfolioAPI.getTrades,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
  });

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('time');
  const [sortDir, setSortDir] = useState('desc');

  const normSelected = normalizeBrokerKey(selectedBroker);
  const isAll = normSelected === 'ALL';

  // 100% Dynamic: Live trades from backend API
  const brokerTrades = useMemo(() => {
    const list = Array.isArray(rawData) ? rawData : rawData?.data || [];
    if (isAll) return list;
    return list.filter(
      t => normalizeBrokerKey(t.broker || t.brokerType) === normSelected
    );
  }, [rawData, isAll, normSelected]);

  const filteredTrades = useMemo(() => {
    if (!search.trim()) return brokerTrades;
    const q = search.toLowerCase();
    return brokerTrades.filter(t => {
      const sym = formatTradeSymbol(t).toLowerCase();
      const ref = (t.orderId || t.tradeId || '').toLowerCase();
      return sym.includes(q) || ref.includes(q);
    });
  }, [brokerTrades, search]);

  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'time') {
        aVal = formatTradeTime(a);
        bVal = formatTradeTime(b);
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortKey === 'symbol') {
        aVal = formatTradeSymbol(a);
        bVal = formatTradeSymbol(b);
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredTrades, sortKey, sortDir]);

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
      {/* ── SEARCH BAR ── */}
      <div className='flex items-center justify-between gap-3'>
        <div className='text-xs font-mono text-neutral-500'>
          {brokerTrades.length} executed trade
          {brokerTrades.length === 1 ? '' : 's'} on record
        </div>

        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400' />
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search symbol or ref...'
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

      {/* ── TRADES TABLE (Exact columns: TIME, TRADE REF, SYMBOL, BROKER, QTY, EXEC PRICE, NET VALUE) ── */}
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
                <th className='py-3 px-3'>Trade Ref</th>
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
                <th className='py-3 px-3 text-right'>Qty</th>
                <th className='py-3 px-3 text-right'>Exec Price</th>
                <th className='py-3 pr-5 pl-3 text-right'>Net Value</th>
              </tr>
            </thead>

            <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
              {sortedTrades.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAll ? 7 : 6}
                    className='py-12 text-center text-neutral-400'
                  >
                    No trades on record.
                  </td>
                </tr>
              ) : (
                sortedTrades.map((tr, idx) => {
                  const time = formatTradeTime(tr);
                  const symbol = formatTradeSymbol(tr);
                  const qty =
                    tr.quantity || tr.filledQuantity || tr.filled_quantity || 0;
                  const price =
                    tr.fillPrice || tr.price || tr.averagePrice || 0;
                  const value = tr.value || price * qty;
                  const tradeRef = tr.orderId || tr.tradeId || `TR-${idx + 1}`;

                  return (
                    <tr
                      key={tr.id || tr.tradeId || idx}
                      className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50 transition-colors'
                    >
                      <td className='py-3.5 pl-4 pr-3 text-neutral-500 whitespace-nowrap'>
                        {time}
                      </td>
                      <td className='py-3.5 px-3 text-neutral-600 dark:text-neutral-400 font-semibold'>
                        {tradeRef}
                      </td>
                      <td className='py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100'>
                        {symbol}
                      </td>
                      {isAll && (
                        <td className='py-3.5 px-3'>
                          <BrokerBadge broker={tr.broker || tr.brokerType} />
                        </td>
                      )}
                      <td className='py-3.5 px-3 text-right tnum'>{qty}</td>
                      <td className='py-3.5 px-3 text-right tnum'>
                        {formatCurrency(price)}
                      </td>
                      <td className='py-3.5 pr-5 pl-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                        {formatCurrency(value)}
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

export default TradesTab;

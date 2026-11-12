'use client';

import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { parseSymbol } from '@/shared/ui/data-display/data-table';
import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { BROKER_CONFIGS, normalizeBrokerKey } from '../constants';
import { usePortfolioHoldings } from '../hooks/usePortfolioHoldings';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function HoldingsTab({
  selectedBroker = 'ALL',
  onInspect = () => {},
  initialSearch = '',
}) {
  const { data: rawData, isLoading, error, refetch } = usePortfolioHoldings();
  const [search, setSearch] = useState(initialSearch);
  const [sortKey, setSortKey] = useState('currentValue');
  const [sortDir, setSortDir] = useState('desc');

  const normSelected = normalizeBrokerKey(selectedBroker);
  const isAll = normSelected === 'ALL';
  const activeConfig = BROKER_CONFIGS[normSelected];

  const allHoldings = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.data || []),
    [rawData]
  );

  // Filter by selected broker and active holdings (either settled quantity > 0 OR t1_quantity > 0)
  const brokerHoldings = useMemo(() => {
    const list = isAll
      ? allHoldings
      : allHoldings.filter(
          h => normalizeBrokerKey(h.broker || h.brokerType) === normSelected
        );
    return list.filter(h => {
      const settled = Number(h.quantity ?? 0);
      const t1 = Number(h.raw?.t1_quantity ?? h.t1Quantity ?? 0);
      return settled > 0 || t1 > 0;
    });
  }, [allHoldings, isAll, normSelected]);

  // Search filter
  const filteredHoldings = useMemo(() => {
    if (!search.trim()) return brokerHoldings;
    const q = search.toLowerCase();
    return brokerHoldings.filter(h => {
      const sym = (h.symbol || '').toLowerCase();
      const comp = (
        h.companyName ||
        h.raw?.company_name ||
        h.symbol ||
        ''
      ).toLowerCase();
      const isin = (h.isin || h.raw?.isin || '').toLowerCase();
      return sym.includes(q) || comp.includes(q) || isin.includes(q);
    });
  }, [brokerHoldings, search]);

  // Sorting
  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'symbol') {
        aVal = a.symbol || '';
        bVal = b.symbol || '';
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredHoldings, sortKey, sortDir]);

  const handleSort = key => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isLoading) return <TabLoadingSkeleton rows={8} columns={isAll ? 9 : 8} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  const brokerTitle = isAll
    ? 'All demats holdings'
    : `${activeConfig?.name || selectedBroker} holdings`;

  return (
    <section className='space-y-4'>
      {/* ── TOP ACTION BAR: SECTION TITLE & SEARCH ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1'>
        <div className='flex items-center gap-2'>
          <h2 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
            {brokerTitle}
          </h2>
          <span className='text-xs font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'>
            {brokerHoldings.length} on record
          </span>
        </div>

        {/* Search Input */}
        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none' />
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search holdings…'
            className='w-full pl-9 pr-8 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors font-mono'
          />
          {search && (
            <button
              type='button'
              onClick={() => setSearch('')}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer'
            >
              <X className='size-3' />
            </button>
          )}
        </div>
      </div>

      {/* ── MASTER HOLDINGS TABLE ── */}
      <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 font-mono uppercase tracking-wider bg-neutral-50/50 dark:bg-neutral-900/30'>
                <th className='py-3 pl-4 pr-2 w-10 text-center'>#</th>
                <th
                  className='py-3 px-3 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('symbol')}
                >
                  <div className='flex items-center gap-1'>
                    <span>Stock</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>

                {/* ── USER DIRECTIVE: HIDE BROKER COLUMN WHEN SINGLE BROKER SELECTED! ── */}
                {isAll && <th className='py-3 px-3'>Broker</th>}

                <th
                  className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('quantity')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>Qty</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('averageBuyPrice')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>Avg price</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('currentPrice')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>LTP</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('currentValue')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>Current value</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('unrealizedPL')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>Unrealized P&amp;L</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 pr-4 pl-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('dayGainPercent')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>Day change</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs font-mono'>
              {sortedHoldings.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAll ? 9 : 8}
                    className='py-12 text-center text-neutral-400 font-mono'
                  >
                    No holdings match your search criteria.
                  </td>
                </tr>
              ) : (
                sortedHoldings.map((pos, idx) => {
                  const currentPrice = Number(
                    pos.currentPrice || pos.lastPrice || 0
                  );
                  const averageBuyPrice = Number(
                    pos.averageBuyPrice || pos.averagePrice || 0
                  );
                  const quantity = Number(pos.quantity || 0);
                  const currentValue =
                    Number(pos.currentValue) || currentPrice * quantity;
                  const investedValue =
                    Number(pos.investedValue) || averageBuyPrice * quantity;
                  const unrealizedPL =
                    Number(pos.unrealizedPL) ?? currentValue - investedValue;
                  const unrealizedPercent =
                    investedValue > 0
                      ? (unrealizedPL / investedValue) * 100
                      : 0;
                  const isPositiveGain = unrealizedPL >= 0;

                  const dayGainPercent = Number(pos.dayGainPercent || 0);
                  const isPositiveDay = dayGainPercent >= 0;

                  const normBroker = normalizeBrokerKey(
                    pos.broker || pos.brokerType
                  );
                  const brokerCfg =
                    BROKER_CONFIGS[normBroker] || BROKER_CONFIGS.ZERODHA;

                  const rawSym = pos.symbol || '';
                  const { exchange: parsedEx, ticker } = parseSymbol(rawSym);
                  const displayTicker = ticker || rawSym;
                  const displayExchange = pos.exchange || parsedEx || 'NSE';
                  const companyName = pos.companyName || pos.raw?.company_name;

                  return (
                    <tr
                      key={pos.id || `${pos.symbol}-${idx}`}
                      onClick={() => onInspect(pos)}
                      className='hover:bg-neutral-50/70 dark:hover:bg-neutral-850/60 transition-colors cursor-pointer group'
                    >
                      {/* Row Index */}
                      <td className='py-3.5 pl-4 pr-2 text-center text-neutral-400 text-[11px] font-mono'>
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Stock Symbol + Company */}
                      <td className='py-3.5 px-3 font-sans'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-neutral-900 dark:text-neutral-100 font-mono'>
                            {displayTicker}
                          </span>
                          {displayExchange && (
                            <span className='text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500'>
                              {displayExchange}
                            </span>
                          )}
                          {pos.raw?.t1_quantity > 0 && (
                            <span className='text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'>
                              T+1
                            </span>
                          )}
                        </div>
                        {companyName && companyName !== displayTicker && (
                          <div className='text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[200px] mt-0.5'>
                            {companyName}
                          </div>
                        )}
                      </td>

                      {/* Broker column (rendered only in ALL demats view) */}
                      {isAll && (
                        <td className='py-3.5 px-3 font-sans'>
                          <span className='inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300'>
                            <span
                              className={cn(
                                'size-2 rounded-full shrink-0',
                                brokerCfg.dotColor
                              )}
                            />
                            <span>{brokerCfg.displayName}</span>
                          </span>
                        </td>
                      )}

                      {/* Qty */}
                      <td className='py-3.5 px-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                        {quantity}
                      </td>

                      {/* Avg Price */}
                      <td className='py-3.5 px-3 text-right tnum text-neutral-600 dark:text-neutral-400'>
                        ₹
                        {averageBuyPrice.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* LTP */}
                      <td className='py-3.5 px-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                        ₹
                        {currentPrice.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Current Value */}
                      <td className='py-3.5 px-3 text-right tnum font-bold text-neutral-900 dark:text-neutral-100'>
                        {formatCurrency(currentValue)}
                      </td>

                      {/* Unrealized P&L */}
                      <td className='py-3.5 px-3 text-right tnum'>
                        <span
                          className={cn(
                            'font-bold block',
                            isPositiveGain
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {formatCurrency(unrealizedPL, { showSign: true })}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] block',
                            isPositiveGain
                              ? 'text-emerald-600/80 dark:text-emerald-400/80'
                              : 'text-rose-600/80 dark:text-rose-400/80'
                          )}
                        >
                          {formatPercent(unrealizedPercent, { showSign: true })}
                        </span>
                      </td>

                      {/* Day Change */}
                      <td className='py-3.5 pr-4 pl-3 text-right tnum'>
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-xs font-semibold',
                            isPositiveDay
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {isPositiveDay ? (
                            <ArrowUpRight className='size-3' />
                          ) : (
                            <ArrowDownRight className='size-3' />
                          )}
                          <span>
                            {formatPercent(dayGainPercent, { showSign: true })}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── TABLE FOOTER ── */}
        <div className='p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-neutral-500'>
          <div className='flex items-center gap-1.5'>
            <ShieldCheck className='size-4 text-emerald-500 shrink-0' />
            <span>
              Canonical broker sync via CDSL with FIFO capital gains tracking.
            </span>
          </div>
          <div>
            Showing {sortedHoldings.length} of {brokerHoldings.length} positions
          </div>
        </div>
      </div>
    </section>
  );
}

export default HoldingsTab;

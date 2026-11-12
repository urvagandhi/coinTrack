'use client';

import { formatCurrency } from '@/shared/formatters';
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
import { usePortfolioPositions } from '../hooks/usePortfolioPositions';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function PositionsTab({ selectedBroker = 'ALL', onInspect = () => {} }) {
  const { data: rawData, isLoading, error, refetch } = usePortfolioPositions();
  const [view, setView] = useState('EQUITY');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('pnl');
  const [sortDir, setSortDir] = useState('desc');

  const normSelected = normalizeBrokerKey(selectedBroker);
  const isAll = normSelected === 'ALL';
  const activeConfig = BROKER_CONFIGS[normSelected];

  // 100% Dynamic: Live positions from backend API
  const allPositions = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.data || []),
    [rawData]
  );

  // Scoped to selected broker
  const brokerPositions = useMemo(() => {
    if (isAll) return allPositions;
    return allPositions.filter(
      p => normalizeBrokerKey(p.broker || p.brokerType) === normSelected
    );
  }, [allPositions, isAll, normSelected]);

  // Equity vs Derivatives split
  const equityPositions = useMemo(
    () =>
      brokerPositions.filter(
        p =>
          !p.isDerivative &&
          !p.instrumentType?.includes('FUT') &&
          !p.instrumentType?.includes('OPT')
      ),
    [brokerPositions]
  );

  const derivativePositions = useMemo(
    () =>
      brokerPositions.filter(
        p =>
          p.isDerivative ||
          p.instrumentType?.includes('FUT') ||
          p.instrumentType?.includes('OPT')
      ),
    [brokerPositions]
  );

  const activeCategoryList =
    view === 'EQUITY' ? equityPositions : derivativePositions;

  // Search filter
  const filteredPositions = useMemo(() => {
    if (!search.trim()) return activeCategoryList;
    const q = search.toLowerCase();
    return activeCategoryList.filter(p => {
      const sym = (p.symbol || p.tradingsymbol || '').toLowerCase();
      const comp = (p.companyName || p.raw?.company_name || '').toLowerCase();
      return sym.includes(q) || comp.includes(q);
    });
  }, [activeCategoryList, search]);

  // Sorting
  const sortedPositions = useMemo(() => {
    return [...filteredPositions].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'symbol') {
        aVal = a.symbol || a.tradingsymbol || '';
        bVal = b.symbol || b.tradingsymbol || '';
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredPositions, sortKey, sortDir]);

  const handleSort = key => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // KPI Calculations
  const totalPnl = brokerPositions.reduce(
    (acc, p) => acc + Number(p.unrealizedPL ?? p.unrealizedPnL ?? p.pnl ?? 0),
    0
  );
  const totalDayM2m = brokerPositions.reduce(
    (acc, p) => acc + Number(p.dayGain ?? p.dayChange ?? p.m2m ?? 0),
    0
  );
  const openContractsCount = brokerPositions.filter(
    p => Math.abs(Number(p.quantity ?? p.netQuantity ?? 0)) > 0
  ).length;

  if (isLoading) return <TabLoadingSkeleton rows={6} showKpis={true} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  const sectionTitle = isAll
    ? 'All demats positions'
    : `${activeConfig?.name || selectedBroker} positions`;

  return (
    <div className='space-y-4'>
      {/* ── 1. 4 KPI SUMMARY CARDS ── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Total Net P&amp;L
          </span>
          <span
            className={cn(
              'text-base sm:text-lg font-bold font-mono tnum block',
              totalPnl >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatCurrency(totalPnl, { showSign: true })}
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            Mark-to-market open positions
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Day M2M Gain
          </span>
          <span
            className={cn(
              'text-base sm:text-lg font-bold font-mono tnum block',
              totalDayM2m >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatCurrency(totalDayM2m, { showSign: true })}
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            Live mark-to-market session
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Open Contracts
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block'>
            {openContractsCount} Active
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            {equityPositions.length} Equity · {derivativePositions.length}{' '}
            F&amp;O
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500 font-mono'>
            Settlement Mode
          </span>
          <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400 block font-mono'>
            T+1 Rolling Delivery
          </span>
          <span className='text-[10px] text-neutral-500 font-mono'>
            CDSL Demat Pool
          </span>
        </div>
      </div>

      {/* ── 2. SUB-BAR: VIEW TOGGLE & SEARCH ── */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1'>
        <div className='flex items-center gap-2.5 flex-wrap'>
          <h2 className='text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight'>
            {sectionTitle}
          </h2>
          <div className='inline-flex items-center p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 text-xs'>
            <button
              type='button'
              onClick={() => setView('EQUITY')}
              className={cn(
                'px-3 py-1.5 rounded-md font-mono text-xs font-medium transition-colors cursor-pointer',
                view === 'EQUITY'
                  ? 'bg-white dark:bg-[#16171a] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              Equity ({equityPositions.length})
            </button>
            <button
              type='button'
              onClick={() => setView('DERIVATIVES')}
              className={cn(
                'px-3 py-1.5 rounded-md font-mono text-xs font-medium transition-colors cursor-pointer',
                view === 'DERIVATIVES'
                  ? 'bg-white dark:bg-[#16171a] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              Derivatives ({derivativePositions.length})
            </button>
          </div>

          <span className='text-xs font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hidden sm:inline'>
            {brokerPositions.length} total contracts
          </span>
        </div>

        {/* Search Input */}
        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none' />
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search positions…'
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

      {/* ── 3. MASTER POSITIONS TABLE ── */}
      <section className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
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
                    <span>Contract</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>

                {/* Broker column shown ONLY when All demats is active */}
                {isAll && <th className='py-3 px-3'>Broker</th>}

                {view === 'DERIVATIVES' && (
                  <>
                    <th className='py-3 px-3'>Type</th>
                    <th className='py-3 px-3 text-right'>Strike</th>
                    <th className='py-3 px-3'>Expiry</th>
                  </>
                )}

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
                  onClick={() => handleSort('averagePrice')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>Avg</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('lastPrice')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>LTP</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th
                  className='py-3 px-3 text-right cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors'
                  onClick={() => handleSort('pnl')}
                >
                  <div className='flex items-center justify-end gap-1'>
                    <span>P&amp;L</span>
                    <ArrowUpDown className='size-3' />
                  </div>
                </th>
                <th className='py-3 pr-4 pl-3 text-right'>Day M2M</th>
              </tr>
            </thead>

            <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs font-mono'>
              {sortedPositions.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      isAll
                        ? view === 'DERIVATIVES'
                          ? 10
                          : 7
                        : view === 'DERIVATIVES'
                          ? 9
                          : 6
                    }
                    className='py-12 text-center text-neutral-400 font-mono'
                  >
                    No {view.toLowerCase()} positions on record.
                  </td>
                </tr>
              ) : (
                sortedPositions.map((pos, idx) => {
                  const rawSym = pos.symbol || pos.tradingsymbol || '—';
                  const { exchange, ticker } = parseSymbol(rawSym);
                  const qty = Math.abs(
                    Number(pos.quantity ?? pos.netQuantity ?? 0)
                  );
                  const avgPrice = Number(
                    pos.averagePrice ?? pos.buyAverage ?? 0
                  );
                  const ltp = Number(pos.lastPrice ?? pos.currentPrice ?? 0);
                  const pnl = Number(
                    pos.unrealizedPL ?? pos.unrealizedPnL ?? pos.pnl ?? 0
                  );
                  const dayPnl = Number(
                    pos.dayGain ?? pos.dayChange ?? pos.m2m ?? 0
                  );
                  const isPosPnl = pnl >= 0;
                  const isPosDay = dayPnl >= 0;

                  const normBroker = normalizeBrokerKey(
                    pos.broker || pos.brokerType
                  );
                  const brokerCfg =
                    BROKER_CONFIGS[normBroker] || BROKER_CONFIGS.ZERODHA;

                  const product =
                    pos.product || (pos.overnightQuantity ? 'CNC' : 'NET');
                  const isLong = (pos.quantity ?? pos.netQuantity ?? 0) >= 0;

                  return (
                    <tr
                      key={`${rawSym}-${pos.broker}-${idx}`}
                      onClick={() => onInspect(pos)}
                      className='hover:bg-neutral-50/70 dark:hover:bg-neutral-850/60 transition-colors cursor-pointer group'
                    >
                      {/* # */}
                      <td className='py-3.5 pl-4 pr-2 text-center text-neutral-400 text-[11px] font-mono'>
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Contract / Symbol */}
                      <td className='py-3.5 px-3 font-sans'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-neutral-900 dark:text-neutral-100 font-mono'>
                            {ticker}
                          </span>
                          {exchange && (
                            <span className='text-[10px] font-mono px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500'>
                              {exchange}
                            </span>
                          )}
                          <span
                            className={cn(
                              'text-[9px] font-mono px-1 py-0.2 rounded font-semibold',
                              isLong
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {product}
                          </span>
                        </div>
                        <div className='text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[200px] mt-0.5'>
                          {pos.companyName || pos.raw?.company_name || ticker}
                        </div>
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

                      {/* Derivatives extra columns */}
                      {view === 'DERIVATIVES' && (
                        <>
                          <td className='py-3.5 px-3'>
                            <span className='text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'>
                              {pos.instrumentType?.includes('FUT')
                                ? 'FUT'
                                : pos.optionType || 'OPT'}
                            </span>
                          </td>
                          <td className='py-3.5 px-3 text-right tnum text-neutral-600 dark:text-neutral-400'>
                            {pos.strikePrice ? `₹${pos.strikePrice}` : '—'}
                          </td>
                          <td className='py-3.5 px-3 text-neutral-500'>
                            {pos.expiry
                              ? new Date(pos.expiry).toLocaleDateString(
                                  'en-IN',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                  }
                                )
                              : '—'}
                          </td>
                        </>
                      )}

                      {/* Qty */}
                      <td className='py-3.5 px-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                        {qty}
                      </td>

                      {/* Avg */}
                      <td className='py-3.5 px-3 text-right tnum text-neutral-600 dark:text-neutral-400'>
                        {avgPrice > 0 ? `₹${avgPrice.toFixed(2)}` : '—'}
                      </td>

                      {/* LTP */}
                      <td className='py-3.5 px-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                        {ltp > 0 ? `₹${ltp.toFixed(2)}` : '—'}
                      </td>

                      {/* P&L */}
                      <td className='py-3.5 px-3 text-right tnum'>
                        <span
                          className={cn(
                            'font-bold block',
                            isPosPnl
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {formatCurrency(pnl, { showSign: true })}
                        </span>
                      </td>

                      {/* Day M2M */}
                      <td className='py-3.5 pr-4 pl-3 text-right tnum'>
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 font-semibold text-xs',
                            isPosDay
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {isPosDay ? (
                            <ArrowUpRight className='size-3' />
                          ) : (
                            <ArrowDownRight className='size-3' />
                          )}
                          <span>
                            {formatCurrency(dayPnl, { showSign: true })}
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
              Real-time mark-to-market positions ledger · CDSL clearing
            </span>
          </div>
          <div>
            Showing {sortedPositions.length} of {activeCategoryList.length}{' '}
            positions
          </div>
        </div>
      </section>
    </div>
  );
}

export default PositionsTab;

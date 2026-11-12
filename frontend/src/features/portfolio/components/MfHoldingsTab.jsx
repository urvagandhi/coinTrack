'use client';

import { mutualFundAPI, portfolioAPI } from '@/shared/api/client';
import { formatCurrency, formatPercent } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  PiggyBank,
} from 'lucide-react';
import { useMemo } from 'react';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfHoldingsTab() {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', 'mf-holdings'],
    queryFn: portfolioAPI.getMfHoldings,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Query scheme summaries from mutual fund service as fallback live NAV source
  const { data: rawSchemeSummaries } = useQuery({
    queryKey: ['mutual-fund', 'scheme-summary-fallback'],
    queryFn: () => mutualFundAPI.getSchemeSummaries({ includeRedeemed: true }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const schemeSummaries = useMemo(
    () =>
      Array.isArray(rawSchemeSummaries)
        ? rawSchemeSummaries
        : rawSchemeSummaries?.data || [],
    [rawSchemeSummaries]
  );

  // Helper map from scheme name/folio to fallback NAV/value
  const schemeFallbackMap = useMemo(() => {
    const map = new Map();
    for (const s of schemeSummaries) {
      if (s.schemeName) {
        map.set(s.schemeName.toLowerCase().trim(), s);
      }
      if (s.folioNo) {
        map.set(s.folioNo.toLowerCase().trim(), s);
      }
    }
    return map;
  }, [schemeSummaries]);

  const holdings = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.data || []),
    [rawData]
  );

  // Helper to resolve live NAV using multi-tier fallback hierarchy
  const resolveNav = h => {
    const directNav = Number(
      h.currentPrice ??
        h.lastPrice ??
        h.last_price ??
        h.raw?.last_price ??
        h.nav ??
        0
    );
    if (directNav > 0) return directNav;

    // Check mutual funds service scheme summary fallback
    const fundName = (h.fund || h.tradingsymbol || '').toLowerCase().trim();
    const folioKey = (h.folio || '').toLowerCase().trim();
    const matched =
      schemeFallbackMap.get(fundName) ||
      (folioKey ? schemeFallbackMap.get(folioKey) : null);
    if (
      matched &&
      Number(matched.averageNav ?? matched.currentValue ?? 0) > 0
    ) {
      const units = Number(matched.totalUnit ?? 0);
      const val = Number(matched.currentValue ?? 0);
      if (val > 0 && units > 0) {
        return val / units;
      }
      if (Number(matched.averageNav) > 0) {
        return Number(matched.averageNav);
      }
    }

    // Protective floor: average price
    return Number(h.averagePrice ?? 0);
  };

  const totalCurrent = holdings.reduce((acc, h) => {
    const qty = Number(h.quantity ?? 0);
    const curNav = resolveNav(h);
    const curVal =
      h.currentValue != null && Number(h.currentValue) > 0
        ? Number(h.currentValue)
        : curNav * qty;
    return acc + curVal;
  }, 0);

  const totalInvested = holdings.reduce((acc, h) => {
    const qty = Number(h.quantity ?? 0);
    const avgNav = Number(h.averagePrice ?? 0);
    const inv =
      h.investedValue != null && Number(h.investedValue) > 0
        ? Number(h.investedValue)
        : avgNav * qty;
    return acc + inv;
  }, 0);

  const totalPnl = holdings.reduce((acc, h) => {
    const qty = Number(h.quantity ?? 0);
    const avgNav = Number(h.averagePrice ?? 0);
    const curNav = resolveNav(h);
    const curVal =
      h.currentValue != null && Number(h.currentValue) > 0
        ? Number(h.currentValue)
        : curNav * qty;
    const inv =
      h.investedValue != null && Number(h.investedValue) > 0
        ? Number(h.investedValue)
        : avgNav * qty;
    const pnl =
      h.unrealizedPL != null
        ? Number(h.unrealizedPL)
        : h.pnl != null
          ? Number(h.pnl)
          : curVal - inv;
    return acc + pnl;
  }, 0);

  const totalPnlPercent =
    totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isPositiveGain = totalPnl >= 0;

  if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  return (
    <div className='space-y-4'>
      {/* ── 4 KPI CARDS ── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Total MF Valuation
          </span>
          <span className='text-base sm:text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
            {formatCurrency(totalCurrent)}
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Invested Capital
          </span>
          <span className='text-base sm:text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
            {formatCurrency(totalInvested)}
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Net Gain / Return
          </span>
          <span
            className={cn(
              'text-base sm:text-lg font-bold font-mono tnum block',
              isPositiveGain
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatCurrency(totalPnl, { showSign: true })}
          </span>
          <span
            className={cn(
              'text-[10px] font-mono font-semibold flex items-center gap-0.5',
              isPositiveGain
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isPositiveGain ? (
              <ArrowUpRight className='size-3' />
            ) : (
              <ArrowDownRight className='size-3' />
            )}
            {formatPercent(totalPnlPercent, { showSign: true })}
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Active Folios
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block'>
            {holdings.length} Active Folios
          </span>
        </div>
      </div>

      {/* ── FOLIOS TABLE ── */}
      <section className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
        <div className='p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <FileSpreadsheet className='size-4 text-neutral-400' />
            <span className='font-semibold text-xs text-neutral-900 dark:text-neutral-100'>
              Mutual Fund Folios Ledger (Coin Sync)
            </span>
          </div>
          <span className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
            {holdings.length} records on file
          </span>
        </div>

        {holdings.length === 0 ? (
          <div className='py-14 text-center'>
            <PiggyBank
              className='size-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-3'
              strokeWidth={1.5}
            />
            <p className='text-sm text-neutral-500 font-mono'>
              No mutual fund holdings found.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse text-xs font-mono'>
              <thead>
                <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                  <th className='py-3 pl-4 pr-3'>Scheme / Folio</th>
                  <th className='py-3 px-3 text-right'>Units</th>
                  <th className='py-3 px-3 text-right'>Avg NAV</th>
                  <th className='py-3 px-3 text-right'>Current NAV</th>
                  <th className='py-3 px-3 text-right'>Invested</th>
                  <th className='py-3 px-3 text-right'>Current Value</th>
                  <th className='py-3 pr-4 pl-3 text-right'>
                    Unrealized P&amp;L
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
                {holdings.map((h, i) => {
                  const qty = Number(h.quantity ?? 0);
                  const avgNav = Number(h.averagePrice ?? 0);
                  const curNav = resolveNav(h);
                  const invested =
                    h.investedValue != null && Number(h.investedValue) > 0
                      ? Number(h.investedValue)
                      : avgNav * qty;
                  const current =
                    h.currentValue != null && Number(h.currentValue) > 0
                      ? Number(h.currentValue)
                      : curNav * qty;
                  const pnl =
                    h.unrealizedPL != null
                      ? Number(h.unrealizedPL)
                      : h.pnl != null
                        ? Number(h.pnl)
                        : current - invested;
                  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                  const isPos = pnl >= 0;

                  return (
                    <tr
                      key={h.tradingsymbol || h.folio || i}
                      className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50 transition-colors'
                    >
                      <td className='py-3 pl-4 pr-3 font-sans'>
                        <div className='font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1'>
                          {h.fund || h.tradingsymbol}
                        </div>
                        <div className='text-[10px] text-neutral-400 font-mono mt-0.5'>
                          {h.folio ? `FOLIO · ${h.folio}` : 'CDSL DEMAT'}
                        </div>
                      </td>
                      <td className='py-3 px-3 text-right tnum text-neutral-700 dark:text-neutral-300'>
                        {qty.toFixed(3)}
                      </td>
                      <td className='py-3 px-3 text-right tnum text-neutral-500'>
                        ₹{avgNav.toFixed(2)}
                      </td>
                      <td className='py-3 px-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                        ₹{curNav.toFixed(2)}
                      </td>
                      <td className='py-3 px-3 text-right tnum text-neutral-600 dark:text-neutral-400'>
                        {formatCurrency(invested)}
                      </td>
                      <td className='py-3 px-3 text-right tnum font-bold text-neutral-900 dark:text-neutral-100'>
                        {formatCurrency(current)}
                      </td>
                      <td className='py-3 pr-4 pl-3 text-right tnum'>
                        <span
                          className={cn(
                            'font-bold block',
                            isPos
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {formatCurrency(pnl, { showSign: true })}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] block',
                            isPos
                              ? 'text-emerald-600/80 dark:text-emerald-400/80'
                              : 'text-rose-600/80 dark:text-rose-400/80'
                          )}
                        >
                          {formatPercent(pnlPct, { showSign: true })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default MfHoldingsTab;

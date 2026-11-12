'use client';

import { portfolioAPI } from '@/shared/api/client';
import { formatCurrency } from '@/shared/formatters';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ClipboardList,
  FileSpreadsheet,
  Repeat,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { TabError } from './TabError';
import { TabLoadingSkeleton } from './TabLoadingSkeleton';

export function MfOrdersTab() {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio', 'mf-orders'],
    queryFn: portfolioAPI.getMfOrders,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const orders = useMemo(
    () => (Array.isArray(rawData) ? rawData : rawData?.data || []),
    [rawData]
  );

  const completedOrders = orders.filter(
    o => (o.status || '').toUpperCase() === 'COMPLETE'
  );
  const totalVolume = orders.reduce(
    (acc, o) => acc + (Number(o.amount) || 0),
    0
  );

  if (isLoading) return <TabLoadingSkeleton rows={6} columns={7} />;
  if (error) return <TabError error={error} onRetry={refetch} />;

  return (
    <div className='space-y-4'>
      {/* ── 4 KPI CARDS ── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Total Orders Logged
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block'>
            {orders.length} Executed
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Completed Allotments
          </span>
          <span className='text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block'>
            {completedOrders.length} Allotted
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Gross Cumulative Volume
          </span>
          <span className='text-base sm:text-lg font-bold font-mono tnum text-neutral-900 dark:text-neutral-100 block'>
            {formatCurrency(totalVolume)}
          </span>
        </div>

        <div className='p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs space-y-1'>
          <span className='text-[11px] font-medium text-neutral-400 dark:text-neutral-500'>
            Settlement Mode
          </span>
          <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400 block font-mono'>
            T+2 Demat Allotment
          </span>
        </div>
      </div>

      {/* ── ORDERS TABLE ── */}
      <section className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
        <div className='p-4 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <FileSpreadsheet className='size-4 text-neutral-400' />
            <span className='font-semibold text-xs text-neutral-900 dark:text-neutral-100'>
              Mutual Fund Orders Book (Coin Sync)
            </span>
          </div>
          <span className='text-xs font-mono text-neutral-500 dark:text-neutral-400'>
            {orders.length} records on file
          </span>
        </div>

        {orders.length === 0 ? (
          <div className='py-14 text-center'>
            <ClipboardList
              className='size-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-3'
              strokeWidth={1.5}
            />
            <p className='text-sm text-neutral-500 font-mono'>
              No mutual fund orders on record.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse text-xs font-mono'>
              <thead>
                <tr className='border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase bg-neutral-50/50 dark:bg-neutral-900/30'>
                  <th className='py-3 pl-4 pr-3'>Date &amp; Time</th>
                  <th className='py-3 px-3'>Order Ref</th>
                  <th className='py-3 px-3'>Scheme Name</th>
                  <th className='py-3 px-3'>Order Type</th>
                  <th className='py-3 px-3 text-right'>Amount</th>
                  <th className='py-3 px-3 text-right'>Allotted NAV</th>
                  <th className='py-3 px-3 text-right'>Units</th>
                  <th className='py-3 pr-4 pl-3 text-right'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-neutral-100 dark:divide-neutral-800/80'>
                {orders.map((ord, i) => {
                  const dateStr =
                    ord.orderTimestamp || ord.order_timestamp || ord.placedAt;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';
                  const amount = Number(ord.amount || 0);
                  const nav = Number(ord.lastPrice || ord.nav || 0);
                  const units = Number(ord.quantity || 0);
                  const isSip =
                    (ord.transactionType || '').includes('SIP') ||
                    (ord.tag || '').includes('sip');

                  return (
                    <tr
                      key={ord.orderId || ord.order_id || i}
                      className='hover:bg-neutral-50/60 dark:hover:bg-neutral-850/50 transition-colors'
                    >
                      <td className='py-3 pl-4 pr-3 text-neutral-500 whitespace-nowrap'>
                        {formattedDate}
                      </td>
                      <td className='py-3 px-3 font-semibold text-neutral-600 dark:text-neutral-400'>
                        {ord.orderId || ord.order_id || `ORD-${i + 1}`}
                      </td>
                      <td className='py-3 px-3 font-sans'>
                        <div className='font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1'>
                          {ord.fund || ord.tradingsymbol}
                        </div>
                        <div className='text-[10px] text-neutral-400 font-mono mt-0.5'>
                          {ord.folio
                            ? `Folio: ${ord.folio}`
                            : 'CDSL Demat Allotment'}
                        </div>
                      </td>
                      <td className='py-3 px-3'>
                        <span className='inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-sans'>
                          {isSip ? (
                            <Repeat className='size-3 text-blue-500' />
                          ) : (
                            <TrendingUp className='size-3 text-emerald-500' />
                          )}
                          <span>{isSip ? 'SIP Installment' : 'Lumpsum'}</span>
                        </span>
                      </td>
                      <td className='py-3 px-3 text-right tnum font-semibold text-neutral-900 dark:text-neutral-100'>
                        {formatCurrency(amount)}
                      </td>
                      <td className='py-3 px-3 text-right tnum text-neutral-600 dark:text-neutral-400'>
                        {nav > 0 ? `₹${nav.toFixed(2)}` : '—'}
                      </td>
                      <td className='py-3 px-3 text-right tnum text-neutral-700 dark:text-neutral-300'>
                        {units > 0 ? units.toFixed(3) : '—'}
                      </td>
                      <td className='py-3 pr-4 pl-3 text-right'>
                        <span className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                          <Check className='size-3' />
                          <span>{ord.status || 'COMPLETE'}</span>
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

export default MfOrdersTab;

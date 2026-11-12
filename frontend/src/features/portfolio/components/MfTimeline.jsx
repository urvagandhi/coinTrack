'use client';

import { formatCurrency } from '@/shared/formatters';
import { cn } from '@/shared/lib/utils';
import { useMemo } from 'react';

function formatTimelineDate(rawDate) {
  if (!rawDate) return 'Recent';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimelineTitle(type, title) {
  if (title && !title.includes('_')) return title;
  const t = String(type || title || '').toUpperCase();
  if (t === 'HOLDING_APPEARED') return 'Holding Portfolio Allotment';
  if (t === 'HOLDING_INCREASED') return 'Holding Reinvestment / Units Added';
  if (t === 'HOLDING_REDUCED') return 'Units Redeemed';
  if (t === 'SIP_CREATED') return 'SIP Mandate Registered';
  if (t === 'SIP_EXECUTION_SCHEDULED' || t === 'SIP_TRIGGER')
    return 'Scheduled Monthly SIP Trigger';
  if (t === 'SIP_INSTALLMENT') return 'Monthly SIP Installment Executed';
  if (t === 'ORDER_ALLOTTED' || t === 'LUMPSUM')
    return 'Lumpsum Purchase Executed';
  return t ? t.replace(/_/g, ' ') : 'Mutual Fund Activity';
}

export function MfTimeline({ events = [] }) {
  // 100% Dynamic: Live events from backend API with robust field extraction
  const timelineItems = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events.map((e, idx) => {
      const rawDate =
        e.eventDate ||
        e.eventTimestamp ||
        e.date ||
        e.allotmentDate ||
        e.orderTimestamp ||
        e.raw?.last_price_date ||
        e.raw?.authorised_date;
      const formattedDate = formatTimelineDate(rawDate);

      const title = formatTimelineTitle(e.eventType, e.title || e.orderType);
      const fundName =
        e.fund ||
        e.fundName ||
        e.tradingSymbol ||
        e.raw?.fund ||
        'Direct Growth Fund';

      const units =
        e.units != null
          ? Number(e.units)
          : e.quantity != null
            ? Number(e.quantity)
            : e.allottedUnits != null
              ? Number(e.allottedUnits)
              : e.raw?.quantity != null
                ? Number(e.raw.quantity)
                : null;

      const nav =
        e.nav != null
          ? Number(e.nav)
          : e.allottedNav != null
            ? Number(e.allottedNav)
            : e.currentPrice != null
              ? Number(e.currentPrice)
              : e.averagePrice != null
                ? Number(e.averagePrice)
                : e.raw?.last_price != null
                  ? Number(e.raw.last_price)
                  : null;

      // Ensure amount is never 0 when units and nav or valuation exist
      let calculatedAmount = Number(e.amount) || 0;
      if (calculatedAmount <= 0) {
        if (e.currentValue != null && Number(e.currentValue) > 0) {
          calculatedAmount = Number(e.currentValue);
        } else if (e.investedValue != null && Number(e.investedValue) > 0) {
          calculatedAmount = Number(e.investedValue);
        } else if (units != null && nav != null && units > 0 && nav > 0) {
          calculatedAmount = units * nav;
        } else if (e.raw?.current_value != null) {
          calculatedAmount = Number(e.raw.current_value);
        } else if (e.raw?.invested_value != null) {
          calculatedAmount = Number(e.raw.invested_value);
        }
      }

      const status = (
        e.status ||
        (e.eventType === 'SIP_EXECUTION_SCHEDULED' ? 'SCHEDULED' : 'SETTLED')
      ).toUpperCase();

      const details =
        e.context ||
        e.details ||
        e.description ||
        e.exchangeRef ||
        (units && nav
          ? `Units credited to CDSL Demat portfolio at NAV ₹${nav.toFixed(2)}.`
          : 'Execution settled via exchange clearing.');

      return {
        id: e.eventId || e.id || e.orderId || `tl-live-${idx}`,
        date: formattedDate,
        title,
        fundName,
        amount: calculatedAmount,
        units,
        nav,
        type: e.eventType || e.type || 'EXECUTION',
        status,
        details,
      };
    });
  }, [events]);

  return (
    <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#16171a] shadow-2xs overflow-hidden'>
      {/* ── HEADER ── */}
      <div className='px-6 py-5 border-b border-neutral-100 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-50/40 dark:bg-neutral-900/20'>
        <div>
          <h3 className='text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight font-sans'>
            Mutual Fund Activity &amp; Allotment Timeline
          </h3>
          <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
            Chronological audit of systematic contributions, lumpsum
            investments, and Demat credit logs.
          </p>
        </div>
        <span className='text-[11px] font-mono text-neutral-400 dark:text-neutral-500'>
          {timelineItems.length} events logged
        </span>
      </div>

      {/* ── VERTICAL TIMELINE STRUCTURE ── */}
      {timelineItems.length === 0 ? (
        <div className='py-16 text-center text-neutral-400 font-mono text-xs'>
          No mutual fund timeline activity on record.
        </div>
      ) : (
        <div className='p-6 sm:p-8 pt-8 sm:pt-9'>
          <div className='relative pl-7 space-y-5 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800'>
            {timelineItems.map(item => {
              const isScheduled =
                item.status === 'SCHEDULED' || item.status === 'PENDING';

              return (
                <div key={item.id} className='relative group'>
                  {/* Status dot on vertical spine */}
                  <span
                    className={cn(
                      'absolute -left-[25px] top-4 size-2.5 rounded-full ring-4 ring-white dark:ring-[#16171a]',
                      isScheduled ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                  />

                  <div className='p-4 rounded-xl border border-neutral-200/75 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors shadow-2xs'>
                    {/* Header Row: Event Type, Status Pill, Timestamp */}
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <span className='text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-sans tracking-tight'>
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.5 rounded font-medium leading-none',
                            isScheduled
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                      <span className='text-[11px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0'>
                        {item.date}
                      </span>
                    </div>

                    {/* Middle Row: Scheme Name & Financial Amount */}
                    <div className='mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5'>
                      <span className='text-xs font-medium text-neutral-800 dark:text-neutral-200 font-sans'>
                        {item.fundName}
                      </span>
                      <div className='flex items-baseline gap-1.5 shrink-0'>
                        <span className='font-mono font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 tnum'>
                          {formatCurrency(item.amount)}
                        </span>
                        {item.units != null && (
                          <span className='font-mono text-neutral-400 dark:text-neutral-500 text-[11px]'>
                            ({item.units} units
                            {item.nav != null
                              ? ` · NAV ₹${item.nav.toFixed(2)}`
                              : ''}
                            )
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Row: Details Note */}
                    {item.details && (
                      <p className='mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal font-sans'>
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MfTimeline;
